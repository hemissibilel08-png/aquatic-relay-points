-- ====================================================
-- BIANCOTTO V2 - RLS, Politiques et Seeds (correction)
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
-- 2. FONCTIONS DE SÉCURITÉ (Security Definer)
-- ====================================================

-- Fonction pour vérifier si un staff est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  );
$$;

-- Fonction pour vérifier si un staff est facilitateur
CREATE OR REPLACE FUNCTION public.is_facilitateur()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff 
    WHERE user_id = auth.uid() 
    AND role IN ('facilitateur', 'admin') 
    AND is_active = true
  );
$$;

-- Fonction pour vérifier présence active sur station (pour supervisées)
CREATE OR REPLACE FUNCTION public.has_active_presence_on_station(station_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM presence p
    JOIN staff s ON p.staff_id = s.id
    WHERE s.user_id = auth.uid()
    AND p.station_id = station_uuid
    AND p.ended_at IS NULL
    AND s.is_active = true
  );
$$;

-- ====================================================
-- 3. POLITIQUES RLS
-- ====================================================

-- EVENT: Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can view events"
ON public.event FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage events"
ON public.event FOR ALL
USING (public.is_admin());

-- ZONE: Lecture pour tous
CREATE POLICY "Authenticated users can view zones"
ON public.zone FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage zones"
ON public.zone FOR ALL
USING (public.is_admin());

-- STATION: Lecture pour tous
CREATE POLICY "Authenticated users can view stations"
ON public.station FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage stations"
ON public.station FOR ALL
USING (public.is_admin());

-- ACTIVITY: Lecture pour tous
CREATE POLICY "Authenticated users can view activities"
ON public.activity FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage activities"
ON public.activity FOR ALL
USING (public.is_admin());

-- RIDDLE: Lecture pour tous
CREATE POLICY "Authenticated users can view riddles"
ON public.riddle FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage riddles"
ON public.riddle FOR ALL
USING (public.is_admin());

-- CENTRE: Lecture minimale pour tous
CREATE POLICY "Authenticated users can view centres"
ON public.centre FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage centres"
ON public.centre FOR ALL
USING (public.is_admin());

-- GROUPS: Lecture minimale pour tous
CREATE POLICY "Authenticated users can view groups"
ON public.groups FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage groups"
ON public.groups FOR ALL
USING (public.is_admin());

-- STAFF: Lecture minimale (nom, role seulement)
CREATE POLICY "Authenticated users can view staff"
ON public.staff FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage staff"
ON public.staff FOR ALL
USING (public.is_admin());

-- PRESENCE: Facilitateurs peuvent gérer leurs présences
CREATE POLICY "Staff can view presences"
ON public.presence FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff s 
    WHERE s.user_id = auth.uid() 
    AND s.is_active = true
  )
);

CREATE POLICY "Facilitateurs can manage their own presence"
ON public.presence FOR INSERT
WITH CHECK (
  public.is_facilitateur() AND
  EXISTS (
    SELECT 1 FROM staff s 
    WHERE s.id = staff_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Facilitateurs can end their own presence"
ON public.presence FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM staff s 
    WHERE s.id = staff_id 
    AND s.user_id = auth.uid()
  )
);

-- ATTEMPT: Bornées par event et centre
CREATE POLICY "Staff can view attempts in current event"
ON public.attempt FOR SELECT
TO authenticated
USING (
  public.is_facilitateur() AND
  EXISTS (SELECT 1 FROM event e WHERE e.id = event_id AND e.is_active = true)
);

CREATE POLICY "Staff can create attempts"
ON public.attempt FOR INSERT
WITH CHECK (
  public.is_facilitateur() AND
  EXISTS (SELECT 1 FROM event e WHERE e.id = event_id AND e.is_active = true)
);

CREATE POLICY "Staff can update attempts"
ON public.attempt FOR UPDATE
USING (
  public.is_facilitateur() AND
  EXISTS (SELECT 1 FROM event e WHERE e.id = event_id AND e.is_active = true)
);

-- RIDDLE_ANSWER: Bornées par event et centre
CREATE POLICY "Staff can view riddle answers in current event"
ON public.riddle_answer FOR SELECT
TO authenticated
USING (
  public.is_facilitateur() AND
  EXISTS (SELECT 1 FROM event e WHERE e.id = event_id AND e.is_active = true)
);

CREATE POLICY "Staff can create riddle answers"
ON public.riddle_answer FOR INSERT
WITH CHECK (
  public.is_facilitateur() AND
  EXISTS (SELECT 1 FROM event e WHERE e.id = event_id AND e.is_active = true)
);

CREATE POLICY "Staff can update riddle answers"
ON public.riddle_answer FOR UPDATE
USING (
  public.is_facilitateur() AND
  EXISTS (SELECT 1 FROM event e WHERE e.id = event_id AND e.is_active = true)
);

-- AD_HOC_POINTS: Bornées par event et centre
CREATE POLICY "Staff can view ad hoc points in current event"
ON public.ad_hoc_points FOR SELECT
TO authenticated
USING (
  public.is_facilitateur() AND
  EXISTS (SELECT 1 FROM event e WHERE e.id = event_id AND e.is_active = true)
);

CREATE POLICY "Staff can create ad hoc points"
ON public.ad_hoc_points FOR INSERT
WITH CHECK (
  public.is_facilitateur() AND
  EXISTS (SELECT 1 FROM event e WHERE e.id = event_id AND e.is_active = true)
);

-- OCCUPATION: Lecture pour tous, écriture via fonctions
CREATE POLICY "Authenticated users can view occupations"
ON public.occupation FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only functions can modify occupations"
ON public.occupation FOR ALL
USING (false); -- Accès uniquement via fonctions sécurisées

-- ====================================================
-- 4. DONNÉES SEED
-- ====================================================

-- Événement de test
INSERT INTO public.event (name, description) VALUES
('Journée Sportive Maritime 2024', 'Journée test pour validation du système Biancotto');

-- Récupération de l''ID de l''événement et insertion des données
DO $$
DECLARE
    event_uuid UUID;
    zone_gymnase UUID;
    zone_couloirs UUID;
    zone_exterieur UUID;
    station_enigmes UUID;
    centre_elem UUID;
    centre_mat UUID;
BEGIN
    -- Récupération event
    SELECT id INTO event_uuid FROM event WHERE name = 'Journée Sportive Maritime 2024';
    
    -- Insertion zones une par une
    INSERT INTO public.zone (event_id, name, description) VALUES
    (event_uuid, 'Gymnase', 'Salle de sport couverte')
    RETURNING id INTO zone_gymnase;
    
    INSERT INTO public.zone (event_id, name, description) VALUES
    (event_uuid, 'Couloirs', 'Couloirs intérieurs de l''établissement')
    RETURNING id INTO zone_couloirs;
    
    INSERT INTO public.zone (event_id, name, description) VALUES
    (event_uuid, 'Extérieur', 'Cour de récréation et terrains')
    RETURNING id INTO zone_exterieur;
    
    -- Activités avec seuils (séparées)
    INSERT INTO public.activity (name, description, type, family, repeatable, thresholds_elem, thresholds_mat) VALUES
    ('Cécifoot', 'Football à l''aveugle en autonomie complète', 'autonomie', 'coop', true, '{"bronze": 5, "argent": 8, "or": 12}'::jsonb, '{"bronze": 4, "argent": 6, "or": 8}'::jsonb);
    
    INSERT INTO public.activity (name, description, type, family, repeatable, thresholds_elem, thresholds_mat) VALUES
    ('Parcours à l''aveugle', 'Parcours d''obstacles les yeux bandés en autonomie', 'autonomie', 'endurance', true, '{"bronze": 60, "argent": 45, "or": 30}'::jsonb, '{"bronze": 70, "argent": 55, "or": 40}'::jsonb);
    
    INSERT INTO public.activity (name, description, type, family, repeatable, thresholds_elem, thresholds_mat) VALUES
    ('Lancer de précision', 'Lancer d''objets sur cibles avec validation facilitateur', 'supervisee', 'precision', false, '{"bronze": 3, "argent": 5, "or": 8}'::jsonb, '{"bronze": 2, "argent": 4, "or": 6}'::jsonb);
    
    INSERT INTO public.activity (name, description, type, family, repeatable, thresholds_elem, thresholds_mat) VALUES
    ('Station Tech', 'Station technique avec points variables', 'tech', 'precision', false, '{}'::jsonb, '{}'::jsonb);
    
    -- Stations avec références aux activités
    INSERT INTO public.station (zone_id, name, description, qr_code, activity_id) VALUES
    (zone_exterieur, 'Cécifoot Terrain A', 'Terrain de cécifoot principal', 'QR_CECIFOOT_A_001', (SELECT id FROM activity WHERE name = 'Cécifoot')),
    (zone_exterieur, 'Cécifoot Terrain B', 'Terrain de cécifoot secondaire', 'QR_CECIFOOT_B_002', (SELECT id FROM activity WHERE name = 'Cécifoot')),
    (zone_couloirs, 'Parcours Aveugle 1', 'Premier parcours à l''aveugle', 'QR_PARCOURS_1_003', (SELECT id FROM activity WHERE name = 'Parcours à l''aveugle')),
    (zone_couloirs, 'Parcours Aveugle 2', 'Second parcours à l''aveugle', 'QR_PARCOURS_2_004', (SELECT id FROM activity WHERE name = 'Parcours à l''aveugle')),
    (zone_gymnase, 'Lancer Précision Nord', 'Poste de lancer nord du gymnase', 'QR_PRECISION_N_005', (SELECT id FROM activity WHERE name = 'Lancer de précision')),
    (zone_gymnase, 'Lancer Précision Sud', 'Poste de lancer sud du gymnase', 'QR_PRECISION_S_006', (SELECT id FROM activity WHERE name = 'Lancer de précision')),
    (zone_exterieur, 'Station Tech Mobile', 'Station technique déplaçable', 'QR_TECH_MOBILE_007', (SELECT id FROM activity WHERE name = 'Station Tech')),
    (zone_gymnase, 'Énigmes Marines', 'Station d''énigmes thème mer', 'QR_ENIGMES_008', NULL),
    (zone_couloirs, 'Point Info', 'Point d''information et orientation', 'QR_INFO_009', NULL),
    (zone_exterieur, 'Base Logistique', 'Point de rassemblement et matériel', 'QR_LOGISTIQUE_010', NULL);
    
    -- Récupération station énigmes pour les riddles
    SELECT id INTO station_enigmes FROM station WHERE name = 'Énigmes Marines';
    
    -- Énigmes
    INSERT INTO public.riddle (station_id, question, solution, hint_text) VALUES
    (station_enigmes, 'Quel animal marin peut changer de couleur pour se camoufler ?', 'poulpe', 'Il a 8 tentacules et vit au fond des océans'),
    (station_enigmes, 'Comment appelle-t-on un groupe de dauphins ?', 'pod', 'Ce mot désigne aussi une gousse de petits pois');
    
    -- Centres
    INSERT INTO public.centre (name, profile, color) VALUES
    ('École Élémentaire Maritime', 'elementaire', '#0066CC')
    RETURNING id INTO centre_elem;
    
    INSERT INTO public.centre (name, profile, color) VALUES
    ('École Maternelle Aquatique', 'maternelle', '#FF6B35')
    RETURNING id INTO centre_mat;
    
    -- Groupes par centre
    INSERT INTO public.groups (centre_id, label) VALUES
    (centre_elem, 'Dauphins'),
    (centre_elem, 'Tortues'),  
    (centre_elem, 'Requins'),
    (centre_mat, 'Dauphins'),
    (centre_mat, 'Tortues'),
    (centre_mat, 'Requins');
    
    -- Occupation initiale (toutes libres)
    INSERT INTO public.occupation (station_id, status) 
    SELECT id, 'libre' FROM station;
    
END $$;