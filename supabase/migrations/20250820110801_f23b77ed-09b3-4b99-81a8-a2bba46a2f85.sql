-- Améliorer la fonction start_occupation pour gérer la file d'attente
CREATE OR REPLACE FUNCTION public.start_occupation(p_station_id uuid, p_centre_id uuid, p_group_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_status station_status;
  current_occupant uuid;
  result JSONB;
BEGIN
  -- Vérifier le statut actuel de la station
  SELECT status, by_centre_id INTO current_status, current_occupant
  FROM occupation 
  WHERE station_id = p_station_id;
  
  -- Si déjà occupée par quelqu'un d'autre, renvoyer erreur collision
  IF current_status = 'occupee' AND current_occupant != p_centre_id THEN
    -- Récupérer les infos du centre occupant
    SELECT jsonb_build_object(
      'success', false,
      'error', 'collision',
      'status_code', 409,
      'occupied_by', c.name,
      'alternatives', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'zone_name', z.name
          )
        )
        FROM station s
        JOIN zone z ON z.id = s.zone_id
        JOIN occupation o ON o.station_id = s.id
        WHERE s.is_active = true 
          AND o.status = 'libre'
          AND s.id != p_station_id
        LIMIT 3
      )
    ) INTO result
    FROM occupation occ
    JOIN centre c ON c.id = occ.by_centre_id
    WHERE occ.station_id = p_station_id;
    
    RETURN result;
  END IF;
  
  -- Vérifier si l'activité nécessite un facilitateur
  DECLARE
    needs_facilitator BOOLEAN := false;
    has_facilitator BOOLEAN := false;
  BEGIN
    SELECT COALESCE(a.requires_facilitator, false) INTO needs_facilitator
    FROM station s
    LEFT JOIN activity a ON a.id = s.activity_id
    WHERE s.id = p_station_id;
    
    IF needs_facilitator THEN
      -- Vérifier présence facilitateur actif
      SELECT EXISTS (
        SELECT 1 FROM presence p
        JOIN staff st ON st.id = p.staff_id
        WHERE p.station_id = p_station_id 
          AND p.ended_at IS NULL 
          AND st.role = 'facilitateur'
          AND st.is_active = true
      ) INTO has_facilitator;
      
      IF NOT has_facilitator THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'needs_facilitator',
          'status_code', 403,
          'message', 'Cette activité nécessite la présence d''un facilitateur'
        );
      END IF;
    END IF;
  END;
  
  -- Occuper la station
  UPDATE occupation 
  SET 
    status = 'occupee',
    by_centre_id = p_centre_id,
    since = now(),
    queue_centre_id = NULL  -- Nettoyer la file d'attente
  WHERE station_id = p_station_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'status_code', 200,
    'message', 'Station occupée avec succès'
  );
END;
$$;

-- Améliorer la fonction finish_occupation pour gérer la file d'attente automatiquement
CREATE OR REPLACE FUNCTION public.finish_occupation(p_station_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  queued_centre_id uuid;
  queued_centre_name text;
BEGIN
  -- Récupérer le centre en file d'attente s'il y en a un
  SELECT queue_centre_id INTO queued_centre_id
  FROM occupation 
  WHERE station_id = p_station_id;
  
  -- Si il y a une file d'attente, donner directement la station au centre en attente
  IF queued_centre_id IS NOT NULL THEN
    -- Récupérer le nom du centre pour le message
    SELECT name INTO queued_centre_name
    FROM centre 
    WHERE id = queued_centre_id;
    
    -- Transférer l'occupation directement
    UPDATE occupation 
    SET 
      status = 'occupee',
      by_centre_id = queued_centre_id,
      queue_centre_id = NULL,
      since = now()
    WHERE station_id = p_station_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Station transférée automatiquement à ' || COALESCE(queued_centre_name, 'le groupe en attente'),
      'transferred_to', queued_centre_name,
      'auto_transfer', true
    );
  ELSE
    -- Aucune file d'attente, libérer normalement
    UPDATE occupation 
    SET 
      status = 'libre',
      by_centre_id = NULL,
      since = now()
    WHERE station_id = p_station_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Station libérée avec succès',
      'auto_transfer', false
    );
  END IF;
END;
$$;

-- Créer une fonction pour gérer les réservations (file d'attente)
CREATE OR REPLACE FUNCTION public.reserve_station(p_station_id uuid, p_centre_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_status station_status;
  current_queue_id uuid;
  centre_name text;
BEGIN
  -- Vérifier le statut actuel
  SELECT status, queue_centre_id INTO current_status, current_queue_id
  FROM occupation 
  WHERE station_id = p_station_id;
  
  -- Récupérer le nom du centre
  SELECT name INTO centre_name FROM centre WHERE id = p_centre_id;
  
  -- Vérifier si la station est libre
  IF current_status = 'libre' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'station_available',
      'message', 'Cette station est libre, vous pouvez l''occuper directement'
    );
  END IF;
  
  -- Vérifier si déjà en file d'attente
  IF current_queue_id = p_centre_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_queued',
      'message', 'Vous êtes déjà en file d''attente pour cette station'
    );
  END IF;
  
  -- Vérifier si file d'attente déjà occupée
  IF current_queue_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'queue_occupied',
      'message', 'Un autre groupe est déjà en file d''attente pour cette station'
    );
  END IF;
  
  -- Mettre en file d'attente
  UPDATE occupation 
  SET 
    queue_centre_id = p_centre_id,
    since = now()
  WHERE station_id = p_station_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', centre_name || ' mis en file d''attente avec succès'
  );
END;
$$;

-- Créer une fonction pour annuler une réservation
CREATE OR REPLACE FUNCTION public.cancel_reservation(p_station_id uuid, p_centre_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_queue_id uuid;
BEGIN
  -- Vérifier si ce centre est bien en file d'attente
  SELECT queue_centre_id INTO current_queue_id
  FROM occupation 
  WHERE station_id = p_station_id;
  
  IF current_queue_id != p_centre_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_queued',
      'message', 'Vous n''êtes pas en file d''attente pour cette station'
    );
  END IF;
  
  -- Annuler la réservation
  UPDATE occupation 
  SET queue_centre_id = NULL
  WHERE station_id = p_station_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Réservation annulée avec succès'
  );
END;
$$;