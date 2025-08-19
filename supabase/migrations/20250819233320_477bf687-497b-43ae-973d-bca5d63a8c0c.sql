-- Fonctions QA et données de démo
CREATE OR REPLACE FUNCTION public.run_qa_tests()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  test_results jsonb := '{}';
  tests_passed integer := 0;
  total_tests integer := 0;
  temp_result boolean;
  temp_count integer;
BEGIN
  -- Test 1: Collision stations
  total_tests := total_tests + 1;
  SELECT COUNT(*) INTO temp_count
  FROM occupation o1
  JOIN occupation o2 ON o1.station_id = o2.station_id 
  WHERE o1.id != o2.id 
    AND o1.status = 'occupee' 
    AND o2.status = 'occupee';
    
  temp_result := temp_count = 0;
  IF temp_result THEN tests_passed := tests_passed + 1; END IF;
  test_results := jsonb_set(test_results, '{collision_stations}', to_jsonb(temp_result));
  
  -- Test 2: Auto-release 20 min
  total_tests := total_tests + 1;
  SELECT COUNT(*) INTO temp_count
  FROM occupation 
  WHERE status = 'occupee' 
    AND since < now() - interval '20 minutes';
    
  temp_result := temp_count = 0;
  IF temp_result THEN tests_passed := tests_passed + 1; END IF;
  test_results := jsonb_set(test_results, '{auto_release_20min}', to_jsonb(temp_result));
  
  -- Test 3: Profils valides
  total_tests := total_tests + 1;
  SELECT COUNT(*) INTO temp_count
  FROM centre c
  WHERE c.profile NOT IN ('elementaire', 'maternelle');
    
  temp_result := temp_count = 0;
  IF temp_result THEN tests_passed := tests_passed + 1; END IF;
  test_results := jsonb_set(test_results, '{profiles_valid}', to_jsonb(temp_result));
  
  RETURN jsonb_build_object(
    'tests_passed', tests_passed,
    'total_tests', total_tests,
    'success_rate', round((tests_passed::decimal / total_tests) * 100, 1),
    'details', test_results,
    'timestamp', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_demo_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_id uuid;
  zone_ext_id uuid;
  zone_int_id uuid;
  centre_elem_id uuid;
  centre_mat_id uuid;
BEGIN
  -- Créer événement actif
  INSERT INTO event (name, description, date, is_active) 
  VALUES ('Olympiades Biancotto 2025', 'Journée sportive inter-centres', CURRENT_DATE, true)
  RETURNING id INTO event_id;
  
  -- Créer zones
  INSERT INTO zone (name, description, event_id, is_active) 
  VALUES ('Zone Extérieure', 'Activités en plein air', event_id, true)
  RETURNING id INTO zone_ext_id;
  
  INSERT INTO zone (name, description, event_id, is_active) 
  VALUES ('Zone Intérieure', 'Activités sous couvert', event_id, true)
  RETURNING id INTO zone_int_id;
  
  -- Définir fallback
  UPDATE zone SET fallback_zone_id = zone_int_id WHERE id = zone_ext_id;
  
  -- Créer centres
  INSERT INTO centre (name, profile, color, is_active)
  VALUES 
    ('Centre Élémentaire Neptune', 'elementaire', '#0066CC', true),
    ('Centre Maternelle Nemo', 'maternelle', '#FF6B35', true)
  RETURNING id INTO centre_elem_id, centre_mat_id;
  
  -- Créer groupes pour chaque centre
  INSERT INTO groups (label, centre_id, is_active)
  VALUES 
    ('Dauphins', centre_elem_id, true),
    ('Tortues', centre_elem_id, true),
    ('Requins', centre_mat_id, true);
  
  RETURN jsonb_build_object(
    'success', true,
    'event_created', event_id,
    'centres_created', 2,
    'groups_created', 3,
    'zones_created', 2
  );
END;
$$;