-- Créer les fonctions RPC nécessaires pour l'occupation et les points

-- Fonction pour démarrer une occupation de manière atomique
CREATE OR REPLACE FUNCTION start_occupation(
  p_station_id UUID,
  p_centre_id UUID,
  p_group_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  current_occupation RECORD;
  result JSON;
BEGIN
  -- Vérifier l'occupation actuelle
  SELECT * INTO current_occupation 
  FROM occupation 
  WHERE station_id = p_station_id;

  -- Si station déjà occupée
  IF current_occupation.status = 'occupee' AND current_occupation.by_centre_id IS NOT NULL THEN
    -- Récupérer le nom du centre occupant
    SELECT JSON_BUILD_OBJECT(
      'success', false,
      'error', 'collision',
      'occupied_by', centre.name,
      'message', 'Station déjà occupée'
    ) INTO result
    FROM centre 
    WHERE id = current_occupation.by_centre_id;
    
    RETURN result;
  END IF;

  -- Si station fermée
  IF current_occupation.status = 'fermee' THEN
    RETURN JSON_BUILD_OBJECT(
      'success', false,
      'error', 'closed',
      'message', 'Station fermée'
    );
  END IF;

  -- Vérifier si un facilitateur est requis
  IF EXISTS (
    SELECT 1 FROM station s 
    JOIN activity a ON s.activity_id = a.id 
    WHERE s.id = p_station_id AND a.requires_facilitator = true
  ) THEN
    -- Vérifier présence facilitateur
    IF NOT EXISTS (
      SELECT 1 FROM presence p 
      JOIN staff st ON p.staff_id = st.id 
      WHERE p.station_id = p_station_id 
      AND p.ended_at IS NULL 
      AND st.role = 'facilitateur'
    ) THEN
      RETURN JSON_BUILD_OBJECT(
        'success', false,
        'error', 'needs_facilitator',
        'message', 'Cette activité nécessite la présence d''un facilitateur'
      );
    END IF;
  END IF;

  -- Occuper la station
  UPDATE occupation 
  SET 
    status = 'occupee',
    by_centre_id = p_centre_id,
    since = NOW(),
    queue_centre_id = NULL,
    updated_at = NOW()
  WHERE station_id = p_station_id;

  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'message', 'Station occupée avec succès'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour terminer une occupation
CREATE OR REPLACE FUNCTION finish_occupation(
  p_station_id UUID
)
RETURNS JSON AS $$
BEGIN
  UPDATE occupation 
  SET 
    status = 'libre',
    by_centre_id = NULL,
    since = NOW(),
    updated_at = NOW()
  WHERE station_id = p_station_id;

  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'message', 'Station libérée'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer les points d'une activité
CREATE OR REPLACE FUNCTION calculate_activity_points(
  activity_type TEXT,
  activity_family TEXT,
  raw_result TEXT,
  thresholds_elem JSONB DEFAULT NULL,
  thresholds_mat JSONB DEFAULT NULL,
  centre_profile TEXT DEFAULT 'elementaire',
  is_co_validated BOOLEAN DEFAULT false,
  hint_used BOOLEAN DEFAULT false,
  attempt_count INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
  base_points INTEGER := 10;
  performance_bonus INTEGER := 0;
  total_points INTEGER;
  result_value NUMERIC;
BEGIN
  -- Convertir le résultat en nombre
  BEGIN
    result_value := CAST(raw_result AS NUMERIC);
  EXCEPTION WHEN OTHERS THEN
    result_value := 0;
  END;

  -- Calcul des points de performance selon les seuils
  IF thresholds_elem IS NOT NULL AND centre_profile = 'elementaire' THEN
    IF result_value >= COALESCE((thresholds_elem->>'or')::NUMERIC, 0) THEN
      performance_bonus := 15;
    ELSIF result_value >= COALESCE((thresholds_elem->>'argent')::NUMERIC, 0) THEN
      performance_bonus := 10;
    ELSIF result_value >= COALESCE((thresholds_elem->>'bronze')::NUMERIC, 0) THEN
      performance_bonus := 5;
    END IF;
  ELSIF thresholds_mat IS NOT NULL AND centre_profile = 'maternelle' THEN
    IF result_value >= COALESCE((thresholds_mat->>'or')::NUMERIC, 0) THEN
      performance_bonus := 10;
    ELSIF result_value >= COALESCE((thresholds_mat->>'argent')::NUMERIC, 0) THEN
      performance_bonus := 7;
    ELSIF result_value >= COALESCE((thresholds_mat->>'bronze')::NUMERIC, 0) THEN
      performance_bonus := 3;
    END IF;
  END IF;

  total_points := base_points + performance_bonus;

  -- Bonus de co-validation
  IF is_co_validated THEN
    total_points := total_points + 5;
  END IF;

  -- Malus pour indices utilisés
  IF hint_used THEN
    total_points := total_points - 3;
  END IF;

  -- S'assurer que les points ne sont jamais négatifs
  total_points := GREATEST(total_points, 1);

  RETURN JSON_BUILD_OBJECT(
    'base', base_points,
    'performance', performance_bonus,
    'total', total_points
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un facilitateur est présent sur une station
CREATE OR REPLACE FUNCTION has_facilitator_on_station(p_station_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM presence p 
    JOIN staff s ON p.staff_id = s.id 
    WHERE p.station_id = p_station_id 
    AND p.ended_at IS NULL 
    AND s.role = 'facilitateur'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;