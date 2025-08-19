-- ====================================================
-- BIANCOTTO - Schéma de base pour journées sportives maritimes
-- ====================================================

-- Types énumérés pour le système
CREATE TYPE public.app_role AS ENUM ('admin', 'rev', 'facilitateur', 'animateur');
CREATE TYPE public.centre_profil AS ENUM ('maternelle', 'elementaire');
CREATE TYPE public.groupe_animal AS ENUM ('dauphins', 'tortues', 'requins');
CREATE TYPE public.station_type AS ENUM ('autonome', 'supervisee');
CREATE TYPE public.station_status AS ENUM ('libre', 'occupee', 'fermee');
CREATE TYPE public.activite_type AS ENUM ('activite', 'enigme', 'dessin_manuel', 'ponctuelle_tech');
CREATE TYPE public.perf_niveau AS ENUM ('participation', 'bronze', 'argent', 'or');

-- ====================================================
-- 1. GESTION DES UTILISATEURS ET RÔLES
-- ====================================================

-- Table des profils utilisateurs (liée à auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'animateur',
  centre_id UUID, -- Référence vers le centre (définie plus tard)
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================
-- 2. CENTRES ET GROUPES
-- ====================================================

-- Table des centres
CREATE TABLE public.centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  profil centre_profil NOT NULL DEFAULT 'elementaire',
  code_qr TEXT NOT NULL UNIQUE, -- QR code permanent du centre
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des groupes par centre
CREATE TABLE public.groupes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
  animal groupe_animal NOT NULL,
  nb_participants INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(centre_id, animal)
);

-- ====================================================
-- 3. STATIONS ET ACTIVITÉS
-- ====================================================

-- Table des stations
CREATE TABLE public.stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  type station_type NOT NULL DEFAULT 'autonome',
  code_qr TEXT NOT NULL UNIQUE, -- QR code permanent de la station
  zone TEXT, -- Pour filtres records (optionnel)
  categorie TEXT, -- Pour filtres records (optionnel)
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- États d'occupation des stations
CREATE TABLE public.station_occupations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  groupe_id UUID REFERENCES groupes(id) ON DELETE SET NULL,
  facilitateur_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status station_status NOT NULL DEFAULT 'libre',
  debut_occupation TIMESTAMPTZ,
  fin_occupation TIMESTAMPTZ,
  auto_release_at TIMESTAMPTZ, -- Auto-libération après 20 min d'inactivité
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des activités disponibles par station
CREATE TABLE public.activites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  type activite_type NOT NULL DEFAULT 'activite',
  points_participation INTEGER NOT NULL DEFAULT 10,
  points_bronze INTEGER NOT NULL DEFAULT 4,
  points_argent INTEGER NOT NULL DEFAULT 7,
  points_or INTEGER NOT NULL DEFAULT 10,
  points_supervisee_bonus INTEGER NOT NULL DEFAULT 5,
  points_enigme_sans_indice INTEGER NOT NULL DEFAULT 15,
  points_enigme_avec_indice INTEGER NOT NULL DEFAULT 10,
  points_dessin_fixe INTEGER NOT NULL DEFAULT 5,
  repetable BOOLEAN NOT NULL DEFAULT false,
  cooldown_minutes INTEGER DEFAULT 0, -- Pour activités répétables
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================
-- 4. ÉNIGMES
-- ====================================================

-- Table des énigmes
CREATE TABLE public.enigmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  reponse_correcte TEXT NOT NULL,
  indice TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================
-- 5. TENTATIVES ET SCORING
-- ====================================================

-- Table des tentatives
CREATE TABLE public.tentatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  groupe_id UUID NOT NULL REFERENCES groupes(id) ON DELETE CASCADE,
  activite_id UUID REFERENCES activites(id) ON DELETE CASCADE,
  enigme_id UUID REFERENCES enigmes(id) ON DELETE CASCADE,
  facilitateur_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Type de tentative
  type activite_type NOT NULL,
  
  -- Performance et validation
  niveau_perf perf_niveau,
  co_validee BOOLEAN NOT NULL DEFAULT false,
  indice_utilise BOOLEAN NOT NULL DEFAULT false,
  reponse_enigme TEXT, -- Pour les énigmes
  ad_hoc_points INTEGER DEFAULT 0, -- Pour ponctuelles tech
  
  -- Scoring calculé
  points_obtenus INTEGER NOT NULL DEFAULT 0,
  
  -- Métadonnées
  commentaire TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes anti-spam
  CONSTRAINT activite_ou_enigme CHECK (
    (activite_id IS NOT NULL AND enigme_id IS NULL) OR 
    (activite_id IS NULL AND enigme_id IS NOT NULL)
  )
);

-- ====================================================
-- 6. RECORDS ET CLASSEMENTS
-- ====================================================

-- Table des records
CREATE TABLE public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activite_id UUID NOT NULL REFERENCES activites(id) ON DELETE CASCADE,
  groupe_id UUID NOT NULL REFERENCES groupes(id) ON DELETE CASCADE,
  centre_id UUID NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
  
  -- Valeurs du record
  valeur DECIMAL,
  unite TEXT,
  description TEXT,
  
  -- Métadonnées
  date_record DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Index pour performance
  UNIQUE(activite_id, date_record, groupe_id)
);

-- ====================================================
-- 7. FACILITATEURS ET POSTES
-- ====================================================

-- Table des prises de poste facilitateurs
CREATE TABLE public.facilitateur_postes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facilitateur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  station_id UUID REFERENCES stations(id) ON DELETE SET NULL,
  code_pin TEXT, -- PIN pour connexion alternative
  prise_poste_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  fin_poste_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  
  -- Un facilitateur ne peut être qu'à un poste à la fois
  UNIQUE(facilitateur_id, active) DEFERRABLE INITIALLY DEFERRED
);

-- ====================================================
-- 8. CONTRAINTES SUPPLÉMENTAIRES ET INDEX
-- ====================================================

-- Mise à jour du lien centre dans profiles
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_centre FOREIGN KEY (centre_id) REFERENCES centres(id) ON DELETE SET NULL;

-- Index pour les performances
CREATE INDEX idx_tentatives_groupe_date ON tentatives(groupe_id, created_at);
CREATE INDEX idx_station_occupations_status ON station_occupations(station_id, status);
CREATE INDEX idx_records_date ON records(date_record, activite_id);
CREATE INDEX idx_facilitateur_postes_active ON facilitateur_postes(facilitateur_id, active);

-- ====================================================
-- 9. FONCTIONS TRIGGERS POUR LES TIMESTAMPS
-- ====================================================

-- Fonction générique de mise à jour des timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_centres_updated_at BEFORE UPDATE ON public.centres FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_groupes_updated_at BEFORE UPDATE ON public.groupes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON public.stations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_station_occupations_updated_at BEFORE UPDATE ON public.station_occupations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_activites_updated_at BEFORE UPDATE ON public.activites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_records_updated_at BEFORE UPDATE ON public.records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================
-- 10. FONCTION DE CALCUL DES POINTS
-- ====================================================

-- Fonction pour calculer les points d'une tentative
CREATE OR REPLACE FUNCTION public.calculer_points_tentative(
  p_type activite_type,
  p_activite_id UUID,
  p_niveau_perf perf_niveau,
  p_co_validee BOOLEAN,
  p_indice_utilise BOOLEAN,
  p_ad_hoc_points INTEGER,
  p_centre_profil centre_profil
) RETURNS INTEGER AS $$
DECLARE
  points INTEGER := 0;
  activite_points RECORD;
  bonus_maternelle NUMERIC := 0.7; -- 30% d'assouplissement
BEGIN
  -- Récupération des points de l'activité
  IF p_activite_id IS NOT NULL THEN
    SELECT * INTO activite_points FROM activites WHERE id = p_activite_id;
  END IF;
  
  CASE p_type
    WHEN 'activite' THEN
      -- Points de base selon performance
      CASE p_niveau_perf
        WHEN 'participation' THEN points := activite_points.points_participation;
        WHEN 'bronze' THEN points := activite_points.points_participation + activite_points.points_bronze;
        WHEN 'argent' THEN points := activite_points.points_participation + activite_points.points_argent;
        WHEN 'or' THEN points := activite_points.points_participation + activite_points.points_or;
        ELSE points := activite_points.points_participation;
      END CASE;
      
      -- Bonus supervisée
      IF p_co_validee THEN
        points := points + activite_points.points_supervisee_bonus;
      END IF;
      
    WHEN 'enigme' THEN
      IF p_indice_utilise THEN
        points := activite_points.points_enigme_avec_indice;
      ELSE
        points := activite_points.points_enigme_sans_indice;
      END IF;
      
    WHEN 'dessin_manuel' THEN
      points := activite_points.points_dessin_fixe;
      
    WHEN 'ponctuelle_tech' THEN
      points := COALESCE(p_ad_hoc_points, 0);
      
  END CASE;
  
  -- Assouplissement pour maternelle
  IF p_centre_profil = 'maternelle' THEN
    points := CEIL(points * bonus_maternelle);
  END IF;
  
  RETURN points;
END;
$$ LANGUAGE plpgsql;

-- ====================================================
-- 11. DONNÉES D'EXEMPLE (SEEDS)
-- ====================================================

-- Insertion d'un centre d'exemple
INSERT INTO public.centres (nom, profil, code_qr) VALUES
('Centre Atlantique', 'elementaire', 'QR_CENTRE_ATLANTIQUE_001'),
('Centre Pacifique', 'maternelle', 'QR_CENTRE_PACIFIQUE_002');

-- Insertion des groupes pour chaque centre
INSERT INTO public.groupes (centre_id, animal, nb_participants) 
SELECT c.id, animal, 8
FROM centres c, UNNEST(ARRAY['dauphins', 'tortues', 'requins']::groupe_animal[]) AS animal;

-- Stations d'exemple
INSERT INTO public.stations (nom, description, type, code_qr, zone, categorie) VALUES
('Parcours Aquatique', 'Parcours d''obstacles nautiques', 'autonome', 'QR_STATION_PARCOURS_001', 'Zone A', 'Sport'),
('Énigmes Marines', 'Station d''énigmes sur le thème marin', 'supervisee', 'QR_STATION_ENIGMES_002', 'Zone B', 'Réflexion'),
('Cécifoot', 'Football à l''aveugle en autonomie', 'autonome', 'QR_STATION_CECIFOOT_003', 'Zone A', 'Sport'),
('Création Corail', 'Atelier créatif dessin/manuel', 'supervisee', 'QR_STATION_CREATION_004', 'Zone C', 'Créatif');

-- Activités par station
INSERT INTO public.activites (station_id, nom, description, type, repetable, cooldown_minutes)
SELECT s.id, s.nom, 'Activité principale de ' || s.nom, 
       CASE WHEN s.nom LIKE '%Énigmes%' THEN 'enigme'::activite_type
            WHEN s.nom LIKE '%Création%' THEN 'dessin_manuel'::activite_type  
            ELSE 'activite'::activite_type END,
       CASE WHEN s.nom LIKE '%Parcours%' THEN true ELSE false END,
       CASE WHEN s.nom LIKE '%Parcours%' THEN 15 ELSE 0 END
FROM stations s;

-- Énigmes d'exemple
INSERT INTO public.enigmes (station_id, question, reponse_correcte, indice)
SELECT s.id, 
       'Quel animal marin peut changer de couleur ?',
       'poulpe',
       'Il a 8 tentacules'
FROM stations s WHERE s.nom LIKE '%Énigmes%';