-- Corriger l'ambiguïté des variables et créer les données de démonstration

DO $$ 
DECLARE
  v_event_id uuid;
  v_zone_ext_id uuid;
  v_zone_int_id uuid;
  v_centre_elem_id uuid;
  v_centre_mat_id uuid;
  v_activity_precision_id uuid;
  v_activity_lance_id uuid;
  v_activity_endurance_id uuid;
  v_activity_coop_id uuid;
  v_riddle1_id uuid;
  v_riddle2_id uuid;
  v_station1_id uuid;
  v_station2_id uuid;
  v_station3_id uuid;
  v_station4_id uuid;
BEGIN
  -- Récupérer l'événement actif
  SELECT id INTO v_event_id FROM event WHERE is_active = true LIMIT 1;
  
  -- Si pas d'événement, en créer un
  IF v_event_id IS NULL THEN
    INSERT INTO event (name, description, date, is_active) 
    VALUES ('Olympiades Biancotto 2025', 'Journée sportive inter-centres', CURRENT_DATE, true)
    RETURNING id INTO v_event_id;
  END IF;
  
  -- Récupérer ou créer les zones
  SELECT id INTO v_zone_ext_id FROM zone WHERE name = 'Zone Extérieure' AND zone.event_id = v_event_id LIMIT 1;
  SELECT id INTO v_zone_int_id FROM zone WHERE name = 'Zone Intérieure' AND zone.event_id = v_event_id LIMIT 1;
  
  IF v_zone_ext_id IS NULL THEN
    INSERT INTO zone (name, description, event_id, is_active) 
    VALUES ('Zone Extérieure', 'Activités en plein air', v_event_id, true)
    RETURNING id INTO v_zone_ext_id;
  END IF;
  
  IF v_zone_int_id IS NULL THEN
    INSERT INTO zone (name, description, event_id, is_active) 
    VALUES ('Zone Intérieure', 'Activités sous couvert', v_event_id, true)
    RETURNING id INTO v_zone_int_id;
    
    -- Définir fallback
    UPDATE zone SET fallback_zone_id = v_zone_int_id WHERE id = v_zone_ext_id;
  END IF;
  
  -- Récupérer ou créer les centres
  SELECT id INTO v_centre_elem_id FROM centre WHERE name = 'Centre Élémentaire Neptune' LIMIT 1;
  SELECT id INTO v_centre_mat_id FROM centre WHERE name = 'Centre Maternelle Nemo' LIMIT 1;
  
  IF v_centre_elem_id IS NULL THEN
    INSERT INTO centre (name, profile, color, is_active)
    VALUES ('Centre Élémentaire Neptune', 'elementaire', '#0066CC', true)
    RETURNING id INTO v_centre_elem_id;
    
    -- Créer groupes pour élémentaire
    INSERT INTO groups (label, centre_id, is_active)
    VALUES 
      ('Dauphins', v_centre_elem_id, true),
      ('Tortues', v_centre_elem_id, true),
      ('Requins', v_centre_elem_id, true);
  END IF;
  
  IF v_centre_mat_id IS NULL THEN
    INSERT INTO centre (name, profile, color, is_active)
    VALUES ('Centre Maternelle Nemo', 'maternelle', '#FF6B35', true)
    RETURNING id INTO v_centre_mat_id;
    
    -- Créer groupes pour maternelle
    INSERT INTO groups (label, centre_id, is_active)
    VALUES 
      ('Étoiles de mer', v_centre_mat_id, true),
      ('Hippocampes', v_centre_mat_id, true);
  END IF;
  
  -- Créer les activités
  INSERT INTO activity (name, type, family, description, default_points, requires_facilitator, repeatable, thresholds_elem, thresholds_mat, is_active)
  VALUES 
    ('Tir de précision', 'activite', 'precision', 'Viser au centre de la cible avec des balles en mousse', 10, true, true, 
     '{"passable": 50, "bon": 30, "excellent": 15}', 
     '{"passable": 70, "bon": 50, "excellent": 30}', true),
    
    ('Lancer de distance', 'activite', 'lance', 'Lancer le plus loin possible avec un frisbee', 10, false, true,
     '{"passable": 10, "bon": 15, "excellent": 20}',
     '{"passable": 8, "bon": 12, "excellent": 16}', true),
     
    ('Course d''endurance', 'activite', 'endurance', 'Parcourir le maximum de tours en 5 minutes', 10, true, false,
     '{"passable": 300, "bon": 240, "excellent": 180}',
     '{"passable": 360, "bon": 300, "excellent": 240}', true),
     
    ('Défi coopération', 'activite', 'coop', 'Transporter un objet fragile en équipe sans le faire tomber', 10, true, true,
     '{"passable": 60, "bon": 80, "excellent": 95}',
     '{"passable": 50, "bon": 70, "excellent": 85}', true)
  RETURNING id INTO v_activity_precision_id, v_activity_lance_id, v_activity_endurance_id, v_activity_coop_id;
  
  -- Créer les énigmes temporaires (seront mises à jour après création des stations)
  INSERT INTO riddle (question, solution, hint_text, points_base, hint_malus_elem, hint_malus_mat, is_active, station_id)
  VALUES 
    ('Quel animal marin peut changer de couleur pour se camoufler ?', 'poulpe', 'Cet animal a 8 tentacules et est très intelligent', 15, -5, -3, true, (SELECT id FROM station LIMIT 1)),
    ('Combien de cœurs a une pieuvre ?', '3', 'Elle en a plus que nous mais moins que 5', 15, -5, -3, true, (SELECT id FROM station LIMIT 1))
  RETURNING id INTO v_riddle1_id, v_riddle2_id;
  
  -- Créer les stations
  INSERT INTO station (name, description, qr_code, zone_id, activity_id, is_active)
  VALUES 
    ('Station Tir de Précision', 'Vise au centre de la cible avec les balles en mousse. Plus tu es proche du centre, plus tu gagnes de points !', 'QR_STATION_TIR_001', v_zone_int_id, v_activity_precision_id, true),
    ('Station Lancer Frisbee', 'Lance le frisbee le plus loin possible ! Technique et force sont nécessaires.', 'QR_STATION_FRISBEE_001', v_zone_ext_id, v_activity_lance_id, true),
    ('Station Course Marine', 'Cours autour du parcours pendant 5 minutes. Compte tes tours !', 'QR_STATION_COURSE_001', v_zone_ext_id, v_activity_endurance_id, true),
    ('Station Coopération', 'En équipe, transportez l''œuf fragile sans le casser. Communication essentielle !', 'QR_STATION_COOP_001', v_zone_int_id, v_activity_coop_id, true)
  RETURNING id INTO v_station1_id, v_station2_id, v_station3_id, v_station4_id;
  
  -- Associer les énigmes aux stations
  UPDATE riddle SET station_id = v_station1_id WHERE id = v_riddle1_id;
  UPDATE riddle SET station_id = v_station2_id WHERE id = v_riddle2_id;
  
  -- Créer les occupations (toutes libres pour commencer)
  INSERT INTO occupation (station_id, status, by_centre_id, since)
  VALUES 
    (v_station1_id, 'libre', NULL, now()),
    (v_station2_id, 'libre', NULL, now()),
    (v_station3_id, 'libre', NULL, now()),
    (v_station4_id, 'libre', NULL, now());
  
  RAISE NOTICE 'Données de démonstration créées avec succès!';
  RAISE NOTICE 'Événement: % | Centres: 2 | Stations: 4 | Activités: 4 | Énigmes: 2', v_event_id;
END $$;