-- ====================================================
-- BIANCOTTO V2 - RLS et données seed
-- ====================================================

-- ====================================================
-- 1. ACTIVATION RLS SUR TOUTES LES TABLES
-- ====================================================

ALTER TABLE public.event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riddle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centre ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riddle_answer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_hoc_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupation ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- 2. FONCTIONS DE SÉCURITÉ
-- ====================================================

-- Obtenir le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_user_staff_role()
RETURNS staff_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM staff WHERE user_id = auth.uid() AND is_active = true;
$$;

-- Vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff 
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

-- Vérifier si l'utilisateur est facilitateur
CREATE OR REPLACE FUNCTION public.is_facilitateur()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff 
    WHERE user_id = auth.uid() AND role = 'facilitateur' AND is_active = true
  );
$$;

-- Vérifier si un facilitateur est présent sur une station
CREATE OR REPLACE FUNCTION public.has_facilitator_on_station(station_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM presence p
    INNER JOIN staff s ON s.id = p.staff_id
    WHERE p.station_id = station_id_param 
      AND p.ended_at IS NULL 
      AND s.role = 'facilitateur'
      AND s.is_active = true
  );
$$;

-- ====================================================
-- 3. POLITIQUES RLS
-- ====================================================

-- EVENT : Lecture pour tous authentifiés, écriture admin
CREATE POLICY "All authenticated users can view events"
ON public.event FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage events"
ON public.event FOR ALL
USING (public.is_admin());

-- ZONE : Lecture pour tous, écriture admin
CREATE POLICY "All authenticated users can view zones"
ON public.zone FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage zones"
ON public.zone FOR ALL
USING (public.is_admin());

-- STATION : Lecture pour tous, écriture admin
CREATE POLICY "All authenticated users can view stations"
ON public.station FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage stations"
ON public.station FOR ALL
USING (public.is_admin());

-- ACTIVITY : Lecture pour tous, écriture admin
CREATE POLICY "All authenticated users can view activities"
ON public.activity FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage activities"
ON public.activity FOR ALL
USING (public.is_admin());

-- RIDDLE : Lecture pour tous, écriture admin
CREATE POLICY "All authenticated users can view riddles"
ON public.riddle FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage riddles"
ON public.riddle FOR ALL
USING (public.is_admin());

-- CENTRE : Lecture minimale pour tous
CREATE POLICY "All authenticated users can view centres"
ON public.centre FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage centres"
ON public.centre FOR ALL
USING (public.is_admin());

-- GROUPS : Lecture minimale pour tous
CREATE POLICY "All authenticated users can view groups"
ON public.groups FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage groups"
ON public.groups FOR ALL
USING (public.is_admin());

-- STAFF : Lecture limitée, écriture admin
CREATE POLICY "Users can view basic staff info"
ON public.staff FOR SELECT
TO authenticated
USING (public.is_admin() OR public.is_facilitateur());

CREATE POLICY "Only admins can manage staff"
ON public.staff FOR ALL
USING (public.is_admin());

-- PRESENCE : Staff peut gérer ses présences
CREATE POLICY "Staff can view presence"
ON public.presence FOR SELECT
TO authenticated
USING (
  public.is_admin() OR 
  (public.is_facilitateur() AND staff_id IN (
    SELECT id FROM staff WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "Staff can manage their presence"
ON public.presence FOR ALL
USING (
  public.is_admin() OR 
  (public.is_facilitateur() AND staff_id IN (
    SELECT id FROM staff WHERE user_id = auth.uid()
  ))
);

-- ATTEMPT : Bornée par event et centre
CREATE POLICY "Users can view attempts in active event"
ON public.attempt FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM event WHERE id = attempt.event_id AND is_active = true)
);

CREATE POLICY "Staff can create attempts"
ON public.attempt FOR INSERT
WITH CHECK (
  (public.is_admin() OR public.is_facilitateur()) AND
  EXISTS (SELECT 1 FROM event WHERE id = attempt.event_id AND is_active = true)
);

-- Contrainte : tentatives supervisées nécessitent facilitateur présent
CREATE POLICY "Supervised attempts require facilitator"
ON public.attempt FOR INSERT
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM activity a 
    WHERE a.id = attempt.activity_id 
      AND a.type = 'supervisee'
      AND a.requires_facilitator = true
  ) OR public.has_facilitator_on_station((
    SELECT s.id FROM station s 
    INNER JOIN activity a ON a.id = s.activity_id 
    WHERE a.id = attempt.activity_id
  ))
);

CREATE POLICY "Staff can update attempts"
ON public.attempt FOR UPDATE
USING (public.is_admin() OR public.is_facilitateur());

-- RIDDLE_ANSWER : Similaire aux tentatives
CREATE POLICY "Users can view riddle answers in active event"
ON public.riddle_answer FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM event WHERE id = riddle_answer.event_id AND is_active = true)
);

CREATE POLICY "Staff can manage riddle answers"
ON public.riddle_answer FOR ALL
USING (
  (public.is_admin() OR public.is_facilitateur()) AND
  EXISTS (SELECT 1 FROM event WHERE id = riddle_answer.event_id AND is_active = true)
);

-- AD_HOC_POINTS : Bornée par event et centre
CREATE POLICY "Users can view ad hoc points in active event"
ON public.ad_hoc_points FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM event WHERE id = ad_hoc_points.event_id AND is_active = true)
);

CREATE POLICY "Staff can manage ad hoc points"
ON public.ad_hoc_points FOR ALL
USING (
  (public.is_admin() OR public.is_facilitateur()) AND
  EXISTS (SELECT 1 FROM event WHERE id = ad_hoc_points.event_id AND is_active = true)
);

-- OCCUPATION : Lecture libre, écriture via fonctions uniquement
CREATE POLICY "All authenticated users can view occupations"
ON public.occupation FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can directly manage occupations"
ON public.occupation FOR ALL
USING (public.is_admin());

-- ====================================================
-- 4. DONNÉES SEED
-- ====================================================

-- Événement test
INSERT INTO public.event (name, description) VALUES
('Journée Sportive Maritime 2024', 'Événement de test pour le système Biancotto');

-- Récupération de l'ID de l'événement créé
WITH event_data AS (
  SELECT id as event_id FROM event WHERE name = 'Journée Sportive Maritime 2024'
)

-- Zones
, zone_inserts AS (
  INSERT INTO public.zone (event_id, name, description)
  SELECT event_id, 'Gymnase', 'Activités en salle' FROM event_data
  UNION ALL
  SELECT event_id, 'Couloirs', 'Parcours et circulation' FROM event_data
  UNION ALL
  SELECT event_id, 'Extérieur', 'Activités de plein air' FROM event_data
  RETURNING id, name
)

-- Activités avec seuils
, activity_inserts AS (
  INSERT INTO public.activity (name, description, type, family, repeatable, thresholds_elem, thresholds_mat, requires_facilitator)
  VALUES 
  ('Cécifoot', 'Football à l''aveugle en autonomie', 'autonomie', 'coop', true, 
   '{"bronze": 3, "argent": 5, "or": 8}', 
   '{"bronze": 2, "argent": 3, "or": 5}', false),
  ('Parcours à l''aveugle', 'Parcours d''obstacles les yeux bandés', 'autonomie', 'precision', true,
   '{"bronze": 120, "argent": 90, "or": 60}',
   '{"bronze": 150, "argent": 120, "or": 90}', false),
  ('Lancer de précision', 'Viser des cibles avec différents objets', 'supervisee', 'precision', false,
   '{"bronze": 15, "argent": 25, "or": 35}',
   '{"bronze": 10, "argent": 18, "or": 25}', true),
  ('Course d''endurance', 'Course de fond chronométrée', 'autonomie', 'endurance', false,
   '{"bronze": 480, "argent": 420, "or": 360}',
   '{"bronze": 540, "argent": 480, "or": 420}', false),
  ('Tech Challenge', 'Défis techniques avec facilitateur', 'tech', 'precision', true,
   '{}', '{}', true),
  ('Relais coopératif', 'Course en équipe avec obstacles', 'supervisee', 'coop', false,
   '{"bronze": 300, "argent": 240, "or": 180}',
   '{"bronze": 360, "argent": 300, "or": 240}', true)
  RETURNING id, name, type
)

-- Stations liées aux zones et activités
, station_inserts AS (
  INSERT INTO public.station (zone_id, name, description, qr_code, activity_id)
  SELECT 
    z.id,
    CASE 
      WHEN a.name = 'Cécifoot' THEN 'Station Cécifoot'
      WHEN a.name = 'Parcours à l''aveugle' THEN 'Station Parcours Aveugle'
      WHEN a.name = 'Lancer de précision' THEN 'Station Lancer'
      WHEN a.name = 'Course d''endurance' THEN 'Station Course'
      WHEN a.name = 'Tech Challenge' THEN 'Station Tech'
      WHEN a.name = 'Relais coopératif' THEN 'Station Relais'
    END,
    'Station dédiée à l''activité ' || a.name,
    'QR_STATION_' || UPPER(REPLACE(a.name, ' ', '_')) || '_' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
    a.id
  FROM zone_inserts z, activity_inserts a
  WHERE (z.name = 'Gymnase' AND a.name IN ('Cécifoot', 'Lancer de précision'))
     OR (z.name = 'Couloirs' AND a.name IN ('Parcours à l''aveugle', 'Tech Challenge'))
     OR (z.name = 'Extérieur' AND a.name IN ('Course d''endurance', 'Relais coopératif'))
  RETURNING id, name, zone_id
)

-- Énigmes sur quelques stations
, riddle_inserts AS (
  INSERT INTO public.riddle (station_id, question, solution, hint_text)
  SELECT 
    s.id,
    'Quel animal marin peut changer de couleur pour se camoufler ?',
    'poulpe',
    'Il a 8 tentacules et vit dans les océans'
  FROM station_inserts s
  WHERE s.name LIKE '%Tech%'
  UNION ALL
  SELECT 
    s.id,
    'Combien de nageoires a un requin ?',
    '7',
    'Comptez les nageoires dorsales, pectorales, pelviennes, anale et caudale'
  FROM station_inserts s
  WHERE s.name LIKE '%Lancer%'
  RETURNING id, question
)

-- Centres
, centre_inserts AS (
  INSERT INTO public.centre (name, profile, color)
  VALUES 
  ('Centre Atlantique', 'elementaire', '#0066CC'),
  ('Centre Pacifique', 'maternelle', '#FF6B35')
  RETURNING id, name, profile
)

-- Groupes par centre
, group_inserts AS (
  INSERT INTO public.groups (centre_id, label)
  SELECT c.id, g.label
  FROM centre_inserts c
  CROSS JOIN (
    VALUES ('Dauphins'), ('Tortues'), ('Requins')
  ) AS g(label)
  RETURNING id, centre_id, label
)

-- Occupations initiales (toutes libres)
, occupation_inserts AS (
  INSERT INTO public.occupation (station_id, status)
  SELECT s.id, 'libre'
  FROM station_inserts s
  RETURNING station_id, status
)

SELECT 'Données seed créées avec succès' as result;

-- Résumé des données créées
SELECT 
  'Créé: ' || 
  (SELECT COUNT(*) FROM event WHERE is_active = true) || ' événement(s), ' ||
  (SELECT COUNT(*) FROM zone WHERE is_active = true) || ' zone(s), ' ||
  (SELECT COUNT(*) FROM station WHERE is_active = true) || ' station(s), ' ||
  (SELECT COUNT(*) FROM activity WHERE is_active = true) || ' activité(s), ' ||
  (SELECT COUNT(*) FROM riddle WHERE is_active = true) || ' énigme(s), ' ||
  (SELECT COUNT(*) FROM centre WHERE is_active = true) || ' centre(s), ' ||
  (SELECT COUNT(*) FROM groups WHERE is_active = true) || ' groupe(s)' 
  as summary;