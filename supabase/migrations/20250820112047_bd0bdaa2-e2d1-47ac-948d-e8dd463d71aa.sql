-- Empêcher l'occupation multiple de stations par un même centre
CREATE OR REPLACE FUNCTION public.start_occupation(p_station_id uuid, p_centre_id uuid, p_group_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_status station_status;
  current_occupant uuid;
  centre_already_occupying boolean := false;
  result JSONB;
BEGIN
  -- Vérifier si le centre occupe déjà une autre station
  SELECT EXISTS (
    SELECT 1 FROM occupation 
    WHERE by_centre_id = p_centre_id 
      AND status = 'occupee' 
      AND station_id != p_station_id
  ) INTO centre_already_occupying;
  
  IF centre_already_occupying THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_occupying',
      'status_code', 409,
      'message', 'Votre groupe occupe déjà une autre station. Vous devez la libérer d''abord.'
    );
  END IF;
  
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
$function$;