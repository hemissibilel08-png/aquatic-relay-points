-- ====================================================
-- BIANCOTTO V2 - Données SEED pour le système
-- ====================================================

-- Événement principal
INSERT INTO public.event (name, description) VALUES
('Journée Sportive Maritime 2024', 'Événement principal pour démonstration du système Biancotto');

-- Variables pour les insertions liées
DO $$
DECLARE
  event_id UUID;
  zone_gymnase_id UUID;
  zone_couloirs_id UUID;
  zone_exterieur_id UUID;
  activity_cecifoot_id UUID;
  activity_parcours_id UUID;
  activity_lancer_id UUID;
  activity_course_id UUID;
  activity_tech_id UUID;
  activity_relais_id UUID;
  station_cecifoot_id UUID;
  station_parcours_id UUID;
  station_lancer_id UUID;
  station_course_id UUID;
  station_tech_id UUID;
  station_relais_id UUID;
  centre_atlantique_id UUID;
  centre_pacifique_id UUID;
BEGIN
  -- Récupération de l'ID de l'événement
  SELECT id INTO event_id FROM event WHERE name = 'Journée Sportive Maritime 2024';

  -- Création des zones
  INSERT INTO public.zone (event_id, name, description) VALUES
  (event_id, 'Gymnase', 'Activités en salle couverte') RETURNING id INTO zone_gymnase_id;
  
  INSERT INTO public.zone (event_id, name, description) VALUES
  (event_id, 'Couloirs', 'Parcours et circulation intérieure') RETURNING id INTO zone_couloirs_id;
  
  INSERT INTO public.zone (event_id, name, description) VALUES
  (event_id, 'Extérieur', 'Activités de plein air') RETURNING id INTO zone_exterieur_id;

  -- Création des activités avec seuils Élémentaire et Maternelle
  INSERT INTO public.activity (name, description, type, family, repeatable, thresholds_elem, thresholds_mat, requires_facilitator) VALUES
  ('Cécifoot', 'Football à l''aveugle en autonomie complète', 'autonomie', 'coop', true, 
   '{"bronze": 3, "argent": 5, "or": 8}', 
   '{"bronze": 2, "argent": 3, "or": 5}', false) RETURNING id INTO activity_cecifoot_id;

  INSERT INTO public.activity (name, description, type, family, repeatable, thresholds_elem, thresholds_mat, requires_facilitator) VALUES
  ('Parcours à l''aveugle', 'Navigation d''obstacles les yeux bandés', 'autonomie', 'precision', true,
   '{"bronze": 120, "argent": 90, "or": 60}',
   '{"bronze": 150, "argent": 120, "or": 90}', false) RETURNING id INTO activity_parcours_id;

  INSERT INTO public.activity (name, description, type, family, repeatable, thresholds_elem, thresholds_mat, requires_facilitator) VALUES
  ('Lancer de précision', 'Viser des cibles avec différents objets', 'supervisee', 'precision', false,
   '{"bronze": 15, "argent": 25, "or": 35}',
   '{"bronze": 10, "argent": 18, "or": 25}', true) RETURNING id INTO activity_lancer_id;

  INSERT INTO public.activity (name, description, type, family, repeatable, thresholds_elem, thresholds_mat, requires_facilitator) VALUES
  ('Course d''endurance', 'Course de fond chronométrée', 'autonomie', 'endurance', false,
   '{"bronze": 480, "argent": 420, "or": 360}',
   '{"bronze": 540, "argent": 480, "or": 420}', false) RETURNING id INTO activity_course_id;

  INSERT INTO public.activity (name, description, type, family, repeatable, thresholds_elem, thresholds_mat, requires_facilitator) VALUES
  ('Tech Challenge', 'Défis techniques avec facilitateur', 'tech', 'precision', true,
   '{}', '{}', true) RETURNING id INTO activity_tech_id;

  INSERT INTO public.activity (name, description, type, family, repeatable, thresholds_elem, thresholds_mat, requires_facilitator) VALUES
  ('Relais coopératif', 'Course en équipe avec obstacles', 'supervisee', 'coop', false,
   '{"bronze": 300, "argent": 240, "or": 180}',
   '{"bronze": 360, "argent": 300, "or": 240}', true) RETURNING id INTO activity_relais_id;

  -- Création des stations liées aux zones et activités
  INSERT INTO public.station (zone_id, name, description, qr_code, activity_id) VALUES
  (zone_gymnase_id, 'Station Cécifoot', 'Terrain de cécifoot autonome', 'QR_STATION_CECIFOOT_001', activity_cecifoot_id) RETURNING id INTO station_cecifoot_id;

  INSERT INTO public.station (zone_id, name, description, qr_code, activity_id) VALUES
  (zone_couloirs_id, 'Station Parcours Aveugle', 'Parcours d''obstacles à l''aveugle', 'QR_STATION_PARCOURS_002', activity_parcours_id) RETURNING id INTO station_parcours_id;

  INSERT INTO public.station (zone_id, name, description, qr_code, activity_id) VALUES
  (zone_gymnase_id, 'Station Lancer', 'Zone de lancer de précision supervisée', 'QR_STATION_LANCER_003', activity_lancer_id) RETURNING id INTO station_lancer_id;

  INSERT INTO public.station (zone_id, name, description, qr_code, activity_id) VALUES
  (zone_exterieur_id, 'Station Course', 'Piste de course d''endurance', 'QR_STATION_COURSE_004', activity_course_id) RETURNING id INTO station_course_id;

  INSERT INTO public.station (zone_id, name, description, qr_code, activity_id) VALUES
  (zone_couloirs_id, 'Station Tech', 'Station technique avec facilitateur', 'QR_STATION_TECH_005', activity_tech_id) RETURNING id INTO station_tech_id;

  INSERT INTO public.station (zone_id, name, description, qr_code, activity_id) VALUES
  (zone_exterieur_id, 'Station Relais', 'Zone de relais coopératif', 'QR_STATION_RELAIS_006', activity_relais_id) RETURNING id INTO station_relais_id;

  -- Énigmes sur stations Tech et Lancer
  INSERT INTO public.riddle (station_id, question, solution, hint_text) VALUES
  (station_tech_id, 'Quel animal marin peut changer de couleur pour se camoufler ?', 'poulpe', 'Il a 8 tentacules et vit dans les océans'),
  (station_lancer_id, 'Combien de nageoires a un requin ?', '7', 'Comptez les nageoires dorsales, pectorales, pelviennes, anale et caudale');

  -- Création des centres
  INSERT INTO public.centre (name, profile, color) VALUES
  ('Centre Atlantique', 'elementaire', '#0066CC') RETURNING id INTO centre_atlantique_id;

  INSERT INTO public.centre (name, profile, color) VALUES
  ('Centre Pacifique', 'maternelle', '#FF6B35') RETURNING id INTO centre_pacifique_id;

  -- Groupes pour chaque centre (Dauphins, Tortues, Requins)
  INSERT INTO public.groups (centre_id, label) VALUES
  (centre_atlantique_id, 'Dauphins'),
  (centre_atlantique_id, 'Tortues'), 
  (centre_atlantique_id, 'Requins'),
  (centre_pacifique_id, 'Dauphins'),
  (centre_pacifique_id, 'Tortues'),
  (centre_pacifique_id, 'Requins');

  -- Occupations initiales (toutes libres)
  INSERT INTO public.occupation (station_id, status) VALUES
  (station_cecifoot_id, 'libre'),
  (station_parcours_id, 'libre'),
  (station_lancer_id, 'libre'),
  (station_course_id, 'libre'),
  (station_tech_id, 'libre'),
  (station_relais_id, 'libre');

END $$;

-- Résumé des données créées
SELECT 
  'BIANCOTTO V2 - Données seed créées avec succès !' as message,
  (SELECT COUNT(*) FROM event WHERE is_active = true) || ' événement(s)' as events,
  (SELECT COUNT(*) FROM zone WHERE is_active = true) || ' zone(s)' as zones,
  (SELECT COUNT(*) FROM station WHERE is_active = true) || ' station(s)' as stations,
  (SELECT COUNT(*) FROM activity WHERE is_active = true) || ' activité(s)' as activities,
  (SELECT COUNT(*) FROM riddle WHERE is_active = true) || ' énigme(s)' as riddles,
  (SELECT COUNT(*) FROM centre WHERE is_active = true) || ' centre(s)' as centres,
  (SELECT COUNT(*) FROM groups WHERE is_active = true) || ' groupe(s)' as groups;

-- Affichage de la structure créée pour validation
SELECT 
  z.name as zone,
  s.name as station,
  a.name as activity,
  a.type as activity_type,
  CASE WHEN r.id IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_riddle
FROM zone z
INNER JOIN station s ON s.zone_id = z.id  
LEFT JOIN activity a ON a.id = s.activity_id
LEFT JOIN riddle r ON r.station_id = s.id
ORDER BY z.name, s.name;