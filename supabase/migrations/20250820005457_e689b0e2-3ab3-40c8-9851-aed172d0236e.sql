-- RPC pour gérer l'occupation atomique des stations
CREATE OR REPLACE FUNCTION public.start_occupation(
  p_station_id UUID,
  p_centre_id UUID,
  p_group_id UUID DEFAULT NULL
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_status station_status;
  result JSONB;
BEGIN
  -- Vérifier le statut actuel de la station
  SELECT status INTO current_status
  FROM occupation 
  WHERE station_id = p_station_id;
  
  -- Si déjà occupée, renvoyer 409
  IF current_status = 'occupee' THEN
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
    needs_facilitator BOOLEAN;
    has_facilitator BOOLEAN;
  BEGIN
    SELECT a.requires_facilitator INTO needs_facilitator
    FROM station s
    JOIN activity a ON a.id = s.activity_id
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
    since = now()
  WHERE station_id = p_station_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'status_code', 200,
    'message', 'Station occupée avec succès'
  );
END;
$$;

-- RPC pour libérer une station
CREATE OR REPLACE FUNCTION public.finish_occupation(
  p_station_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql  
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE occupation 
  SET 
    status = 'libre',
    by_centre_id = NULL,
    since = now()
  WHERE station_id = p_station_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Station libérée avec succès'
  );
END;
$$;

-- Corriger la policy RLS pour empêcher insert attempt supervisée sans facilitateur
DROP POLICY IF EXISTS "attempt_supervised_requires_facilitator" ON public.attempt;

CREATE POLICY "attempt_supervised_requires_facilitator"
ON public.attempt
FOR INSERT
WITH CHECK (
  -- Si l'activité nécessite un facilitateur, vérifier qu'il y en a un présent sur la station
  NOT EXISTS (
    SELECT 1 FROM activity a
    JOIN station s ON s.activity_id = a.id
    WHERE a.id = attempt.activity_id
      AND a.requires_facilitator = true
      AND NOT has_facilitator_on_station(s.id)
  )
);