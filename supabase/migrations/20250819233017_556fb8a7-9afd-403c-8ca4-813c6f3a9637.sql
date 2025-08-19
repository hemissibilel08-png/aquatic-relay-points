-- ===============================================
-- BIANCOTTO V2 - MIGRATION COMPLÈTE
-- Mode pluie, données démo, QA tests
-- ===============================================

-- 1. FONCTIONS MODE PLUIE
-- ===============================================

CREATE OR REPLACE FUNCTION public.activate_rain_mode()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mettre à jour toutes les stations actives pour utiliser leur fallback_zone si disponible
  UPDATE station SET 
    zone_id = (
      SELECT z.fallback_zone_id 
      FROM zone z 
      WHERE z.id = station.zone_id 
      AND z.fallback_zone_id IS NOT NULL
    )
  WHERE is_active = true 
    AND zone_id IN (
      SELECT id FROM zone WHERE fallback_zone_id IS NOT NULL
    );
    
  -- Log du changement
  RAISE NOTICE 'Mode pluie activé - stations basculées vers zones de repli';
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_rain_mode()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Restaurer les zones originales en retrouvant les stations qui pointent vers des fallback_zones
  UPDATE station SET 
    zone_id = (
      SELECT z_parent.id 
      FROM zone z_parent 
      WHERE z_parent.fallback_zone_id = station.zone_id
      LIMIT 1
    )
  WHERE is_active = true 
    AND zone_id IN (
      SELECT fallback_zone_id FROM zone WHERE fallback_zone_id IS NOT NULL
    );
    
  RAISE NOTICE 'Mode pluie désactivé - stations restaurées en zones normales';
END;
$$;

-- 2. FONCTION CRÉATION DONNÉES DÉMO
-- ===============================================

CREATE OR REPLACE FUNCTION public.create_demo_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id uuid;
  zone_ext_id uuid;
  zone_int_id uuid;
  centre_elem_id uuid;
  centre_mat_id uuid;
  group_dauphins_id uuid;
  group_tortues_id uuid;
  group_requins_id uuid;
  activity_lance_id uuid;
  activity_precision_id uuid;
  activity_endurance_id uuid;
  activity_coop_id uuid;
  activity_enigme_id uuid;
  station1_id uuid;
  station2_id uuid;
  station_enigme_id uuid;
  facilitator_id uuid;
  attempt_id uuid;
BEGIN
  -- Créer un événement actif
  INSERT INTO event (name, description, date, is_active) 
  VALUES ('Olympiades Biancotto 2025', 'Journée sportive inter-centres', CURRENT_DATE, true)
  RETURNING id INTO event_id;
  
  -- Créer les zones (extérieure + intérieure de repli)
  INSERT INTO zone (name, description, event_id, is_active) 
  VALUES ('Zone Extérieure', 'Activités en plein air', event_id, true)
  RETURNING id INTO zone_ext_id;
  
  INSERT INTO zone (name, description, event_id, fallback_zone_id, is_active) 
  VALUES ('Zone Intérieure', 'Activités sous couvert (repli pluie)', event_id, NULL, true)
  RETURNING id INTO zone_int_id;
  
  -- Définir la zone intérieure comme fallback de l'extérieure
  UPDATE zone SET fallback_zone_id = zone_int_id WHERE id = zone_ext_id;
  
  -- Créer les centres
  INSERT INTO centre (name, profile, color, is_active)
  VALUES 
    ('Centre Élémentaire Neptune', 'elementaire', '#0066CC', true),
    ('Centre Maternelle Nemo', 'maternelle', '#FF6B35', true)
  RETURNING id INTO centre_elem_id, centre_mat_id;
  
  -- Créer les groupes pour chaque centre
  INSERT INTO groups (label, centre_id, is_active)
  VALUES 
    ('Dauphins', centre_elem_id, true),
    ('Tortues', centre_elem_id, true),
    ('Requins', centre_mat_id, true)
  RETURNING id INTO group_dauphins_id, group_tortues_id, group_requins_id;
  
  -- Créer les activités avec seuils
  INSERT INTO activity (name, type, family, default_points, repeatable, requires_facilitator, 
                       thresholds_elem, thresholds_mat, is_active)
  VALUES 
    ('Lancer de Precision', 'activite', 'lance', 10, true, false,
     '{"excellent": 15, "bon": 10, "passable": 5}'::jsonb,
     '{"excellent": 10, "bon": 7, "passable": 3}'::jsonb, true),
    ('Parcours Precision', 'activite', 'precision', 10, true, true,
     '{"excellent": 2, "bon": 5, "passable": 10}'::jsonb,
     '{"excellent": 5, "bon": 10, "passable": 15}'::jsonb, true),
    ('Course Endurance', 'activite', 'endurance', 10, true, false,
     '{"excellent": 60, "bon": 90, "passable": 120}'::jsonb,
     '{"excellent": 45, "bon": 60, "passable": 90}'::jsonb, true),
    ('Jeu Coopération', 'activite', 'coop', 10, true, true,
     '{"excellent": 80, "bon": 60, "passable": 40}'::jsonb,
     '{"excellent": 70, "bon": 50, "passable": 30}'::jsonb, true),
    ('Station Énigme', 'enigme', 'precision', 15, true, false, NULL, NULL, true)
  RETURNING id INTO activity_lance_id, activity_precision_id, activity_endurance_id, activity_coop_id, activity_enigme_id;
  
  -- Créer les stations
  INSERT INTO station (name, description, qr_code, zone_id, activity_id, is_active)
  VALUES 
    ('Lancer de Précision S1', 'Station de lancer avec cibles', 'QR_LANCE_S1', zone_ext_id, activity_lance_id, true),
    ('Parcours Adresse S2', 'Parcours chronométré supervisé', 'QR_PRECISION_S2', zone_ext_id, activity_precision_id, true),
    ('Course Rapide S3', 'Sprint 50m chronométré', zone_ext_id, activity_endurance_id, true),
    ('Coopération S4', 'Jeu d\'équipe supervisé', 'QR_COOP_S4', zone_ext_id, activity_coop_id, true),
    ('Énigme Marine S5', 'Station énigme thème marin', 'QR_ENIGME_S5', zone_int_id, activity_enigme_id, true),
    ('Station Bonus S6', 'Station libre', 'QR_BONUS_S6', zone_int_id, NULL, true),
    ('Station Manuelle S7', 'Activité manuelle', 'QR_MANUEL_S7', zone_int_id, NULL, true),
    ('Station Tech S8', 'Activité technique', 'QR_TECH_S8', zone_int_id, NULL, true)
  RETURNING id INTO station1_id, station2_id, station_enigme_id;
  
  -- Créer les énigmes pour les stations
  INSERT INTO riddle (station_id, question, solution, hint_text, points_base, hint_malus_elem, hint_malus_mat, is_active)
  VALUES 
    (station_enigme_id, 'Quel animal marin peut changer de couleur ?', 'pieuvre', 'Il a 8 tentacules...', 15, -5, -3, true),
    (station1_id, 'Combien de nageoires a un dauphin ?', '3', 'Compte bien les nageoires dorsales et pectorales', 15, -5, -3, true);
  
  -- Créer les occupations initiales
  INSERT INTO occupation (station_id, status, by_centre_id, since)
  SELECT id, 'libre', NULL, now()
  FROM station WHERE is_active = true;
  
  -- Créer un facilitateur de démo
  INSERT INTO staff (name, role, user_id, is_active)
  VALUES ('Facilitateur Demo', 'facilitateur', auth.uid(), true)
  RETURNING id INTO facilitator_id;
  
  -- Simuler quelques tentatives avec différents profils
  INSERT INTO attempt (event_id, centre_id, group_id, activity_id, points, raw_result, 
                      validated_by_staff_id, started_at, ended_at)
  VALUES 
    -- Centre Élémentaire - Lancer
    (event_id, centre_elem_id, group_dauphins_id, activity_lance_id, 17, '12.5', NULL, 
     now() - interval '2 hours', now() - interval '2 hours' + interval '5 minutes'),
    (event_id, centre_elem_id, group_tortues_id, activity_lance_id, 14, '8.2', NULL,
     now() - interval '1.5 hours', now() - interval '1.5 hours' + interval '3 minutes'),
     
    -- Centre Maternelle - Précision (supervisée et co-validée)
    (event_id, centre_mat_id, group_requins_id, activity_precision_id, 20, '3.1', facilitator_id,
     now() - interval '1 hour', now() - interval '1 hour' + interval '7 minutes'),
     
    -- Course endurance
    (event_id, centre_elem_id, group_dauphins_id, activity_endurance_id, 17, '58', NULL,
     now() - interval '45 minutes', now() - interval '45 minutes' + interval '2 minutes'),
    (event_id, centre_mat_id, group_requins_id, activity_endurance_id, 14, '48', NULL,
     now() - interval '30 minutes', now() - interval '30 minutes' + interval '2 minutes')
  RETURNING id INTO attempt_id;
  
  -- Simuler des réponses d'énigmes
  INSERT INTO riddle_answer (event_id, centre_id, group_id, riddle_id, answer_text, correct, points, hint_used)
  VALUES 
    (event_id, centre_elem_id, group_dauphins_id, 
     (SELECT id FROM riddle WHERE station_id = station_enigme_id LIMIT 1), 
     'pieuvre', true, 15, false),
    (event_id, centre_mat_id, group_requins_id, 
     (SELECT id FROM riddle WHERE station_id = station_enigme_id LIMIT 1), 
     'poisson', false, 0, true);
     
  -- Simuler des points ad hoc
  INSERT INTO ad_hoc_points (event_id, centre_id, group_id, station_id, staff_id, points, reason)
  VALUES 
    (event_id, centre_elem_id, group_dauphins_id, station1_id, facilitator_id, 8, 'Excellente coopération'),
    (event_id, centre_mat_id, group_requins_id, station2_id, facilitator_id, 5, 'Aide entre enfants');
  
  RETURN jsonb_build_object(
    'success', true,
    'event_created', event_id,
    'centres_created', 2,
    'groups_created', 3,
    'stations_created', 8,
    'activities_created', 5,
    'attempts_simulated', 5,
    'riddles_created', 2
  );
END;
$$;

-- 3. FONCTION TESTS QA
-- ===============================================

CREATE OR REPLACE FUNCTION public.run_qa_tests()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_results jsonb := '{}';
  tests_passed integer := 0;
  total_tests integer := 0;
  temp_result boolean;
  temp_count integer;
BEGIN
  -- Test 1: Vérification collision stations (pas 2 centres sur même station)
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
  
  -- Test 2: Vérification auto-release 20 min
  total_tests := total_tests + 1;
  SELECT COUNT(*) INTO temp_count
  FROM occupation 
  WHERE status = 'occupee' 
    AND since < now() - interval '20 minutes';
    
  temp_result := temp_count = 0;
  IF temp_result THEN tests_passed := tests_passed + 1; END IF;
  test_results := jsonb_set(test_results, '{auto_release_20min}', to_jsonb(temp_result));
  
  -- Test 3: Vérification profils M/E cohérents
  total_tests := total_tests + 1;
  SELECT COUNT(*) INTO temp_count
  FROM centre c
  WHERE c.profile NOT IN ('elementaire', 'maternelle');
    
  temp_result := temp_count = 0;
  IF temp_result THEN tests_passed := tests_passed + 1; END IF;
  test_results := jsonb_set(test_results, '{profiles_valid}', to_jsonb(temp_result));
  
  -- Test 4: Calcul des records (vérifier que calculate_activity_points fonctionne)
  total_tests := total_tests + 1;
  BEGIN
    SELECT calculate_activity_points('activite', 'lance', '10', '{"excellent": 15}'::jsonb, '{"excellent": 10}'::jsonb) INTO temp_result;
    temp_result := temp_result IS NOT NULL;
    IF temp_result THEN tests_passed := tests_passed + 1; END IF;
  EXCEPTION WHEN OTHERS THEN
    temp_result := false;
  END;
  test_results := jsonb_set(test_results, '{records_calculation}', to_jsonb(temp_result));
  
  -- Test 5: Vérification structure données (tables principales existent)
  total_tests := total_tests + 1;
  SELECT COUNT(*) INTO temp_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('event', 'centre', 'station', 'activity', 'attempt', 'riddle');
    
  temp_result := temp_count = 6;
  IF temp_result THEN tests_passed := tests_passed + 1; END IF;
  test_results := jsonb_set(test_results, '{database_structure}', to_jsonb(temp_result));
  
  -- Test 6: Fonctions RLS actives
  total_tests := total_tests + 1;
  SELECT COUNT(*) INTO temp_count
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND rowsecurity = true;
    
  temp_result := temp_count > 0;
  IF temp_result THEN tests_passed := tests_passed + 1; END IF;
  test_results := jsonb_set(test_results, '{rls_enabled}', to_jsonb(temp_result));
  
  RETURN jsonb_build_object(
    'tests_passed', tests_passed,
    'total_tests', total_tests,
    'success_rate', round((tests_passed::decimal / total_tests) * 100, 1),
    'details', test_results,
    'timestamp', now()
  );
END;
$$;

-- 4. AMÉLIORATION FONCTION RELEASE INACTIVE OCCUPATIONS
-- ===============================================

-- Assurer que la fonction edge peut être appelée périodiquement
CREATE OR REPLACE FUNCTION public.trigger_release_inactive_occupations()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Appeler l'edge function via HTTP
  SELECT net.http_post(
    url := 'https://kqfvleidiwpfsrmgkfpm.supabase.co/functions/v1/release-inactive-occupations',
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) INTO result;
  
  RETURN jsonb_build_object(
    'success', true,
    'edge_function_called', true,
    'timestamp', now()
  );
END;
$$;