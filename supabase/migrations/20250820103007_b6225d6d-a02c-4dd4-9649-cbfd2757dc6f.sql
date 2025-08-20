-- Insérer des groupes pour le centre existant
INSERT INTO groups (label, centre_id, is_active)
VALUES 
  ('Dauphins', '11111111-1111-1111-1111-111111111111', true),
  ('Tortues', '11111111-1111-1111-1111-111111111111', true),
  ('Requins', '11111111-1111-1111-1111-111111111111', true)
ON CONFLICT DO NOTHING;

-- Créer un événement actif pour les tests
INSERT INTO event (name, description, date, is_active) 
VALUES ('Olympiades Biancotto 2025', 'Journée sportive inter-centres', CURRENT_DATE, true)
ON CONFLICT DO NOTHING;

-- Créer une zone de test et des stations
DO $$
DECLARE
  event_id_var UUID;
  zone_id_var UUID;
  activity_id_var UUID;
BEGIN
  -- Récupérer l'ID de l'événement
  SELECT id INTO event_id_var FROM event WHERE name = 'Olympiades Biancotto 2025' LIMIT 1;
  
  -- Créer une zone si elle n'existe pas
  INSERT INTO zone (name, description, event_id, is_active) 
  VALUES ('Zone Marine', 'Zone principale des activités', event_id_var, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO zone_id_var;
  
  -- Si la zone existe déjà, récupérer son ID
  IF zone_id_var IS NULL THEN
    SELECT id INTO zone_id_var FROM zone WHERE name = 'Zone Marine' LIMIT 1;
  END IF;
  
  -- Créer une activité de test avec le bon type enum
  INSERT INTO activity (name, description, type, family, is_active) 
  VALUES ('Lancer de Bouée', 'Activité de précision marine', 'autonomie', 'precision', true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO activity_id_var;
  
  -- Si l'activité existe déjà, récupérer son ID  
  IF activity_id_var IS NULL THEN
    SELECT id INTO activity_id_var FROM activity WHERE name = 'Lancer de Bouée' LIMIT 1;
  END IF;
  
  -- Créer des stations de test
  INSERT INTO station (name, description, qr_code, zone_id, activity_id, is_active)
  VALUES 
    ('Station Dauphins', 'Station d''activité pour les dauphins', 'biancotto://station/station-1', zone_id_var, activity_id_var, true),
    ('Station Tortues', 'Station d''activité pour les tortues', 'biancotto://station/station-2', zone_id_var, activity_id_var, true),
    ('Station Requins', 'Station d''activité pour les requins', 'biancotto://station/station-3', zone_id_var, activity_id_var, true)
  ON CONFLICT DO NOTHING;
  
  -- Créer les entrées d'occupation pour ces stations
  INSERT INTO occupation (station_id, status, since)
  SELECT s.id, 'libre', now()
  FROM station s 
  WHERE s.name IN ('Station Dauphins', 'Station Tortues', 'Station Requins')
  ON CONFLICT DO NOTHING;
  
END $$;