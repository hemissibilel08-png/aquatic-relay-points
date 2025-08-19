-- ====================================================
-- BIANCOTTO V2 - Nouveau schéma structuré (correction syntaxe)
-- ====================================================

-- Suppression des anciennes tables pour repartir à neuf
DROP TABLE IF EXISTS public.facilitateur_postes CASCADE;
DROP TABLE IF EXISTS public.records CASCADE;
DROP TABLE IF EXISTS public.tentatives CASCADE;
DROP TABLE IF EXISTS public.enigmes CASCADE;
DROP TABLE IF EXISTS public.activites CASCADE;
DROP TABLE IF EXISTS public.station_occupations CASCADE;
DROP TABLE IF EXISTS public.stations CASCADE;
DROP TABLE IF EXISTS public.groupes CASCADE;
DROP TABLE IF EXISTS public.centres CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Suppression des anciens types
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.centre_profil CASCADE;
DROP TYPE IF EXISTS public.groupe_animal CASCADE;
DROP TYPE IF EXISTS public.station_type CASCADE;
DROP TYPE IF EXISTS public.station_status CASCADE;
DROP TYPE IF EXISTS public.activite_type CASCADE;
DROP TYPE IF EXISTS public.perf_niveau CASCADE;

-- ====================================================
-- 1. TYPES ÉNUMÉRÉS
-- ====================================================

CREATE TYPE public.profile_type AS ENUM ('maternelle', 'elementaire');
CREATE TYPE public.staff_role AS ENUM ('admin', 'facilitateur');
CREATE TYPE public.activity_type AS ENUM ('autonomie', 'supervisee', 'tech');
CREATE TYPE public.activity_family AS ENUM ('precision', 'lance', 'endurance', 'coop');
CREATE TYPE public.station_status AS ENUM ('libre', 'occupee', 'fermee');

-- ====================================================
-- 2. TABLES DE BASE
-- ====================================================

-- Table des événements (journées sportives)
CREATE TABLE public.event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des zones
CREATE TABLE public.zone (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  fallback_zone_id UUID REFERENCES zone(id), -- Pour mode pluie
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des stations
CREATE TABLE public.station (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES zone(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  qr_code TEXT NOT NULL UNIQUE,
  activity_id UUID, -- 0..1 activité liée (sera référencée plus tard)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des activités
CREATE TABLE public.activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type activity_type NOT NULL DEFAULT 'autonomie',
  family activity_family NOT NULL DEFAULT 'precision',
  repeatable BOOLEAN NOT NULL DEFAULT false,
  default_points INTEGER DEFAULT 10,
  requires_facilitator BOOLEAN NOT NULL DEFAULT false,
  thresholds_elem JSONB, -- Seuils élémentaire { bronze: X, argent: Y, or: Z }
  thresholds_mat JSONB,  -- Seuils maternelle (assouplies)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ajout de la contrainte foreign key pour station.activity_id
ALTER TABLE public.station 
ADD CONSTRAINT fk_station_activity 
FOREIGN KEY (activity_id) REFERENCES activity(id) ON DELETE SET NULL;

-- Table des énigmes (0..N par station)
CREATE TABLE public.riddle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES station(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  solution TEXT NOT NULL,
  points_base INTEGER NOT NULL DEFAULT 15,
  hint_text TEXT,
  hint_malus_elem INTEGER NOT NULL DEFAULT -5,
  hint_malus_mat INTEGER NOT NULL DEFAULT -3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des centres
CREATE TABLE public.centre (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  profile profile_type NOT NULL DEFAULT 'elementaire',
  color TEXT NOT NULL DEFAULT '#0066CC', -- Couleur d'identification
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des groupes (par centre)
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES centre(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- Dauphins, Tortues, Requins
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(centre_id, label)
);

-- Table du personnel (staff)
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role staff_role NOT NULL DEFAULT 'facilitateur',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Table des présences (staff sur stations)
CREATE TABLE public.presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES station(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des tentatives d'activités
CREATE TABLE public.attempt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  centre_id UUID NOT NULL REFERENCES centre(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activity(id) ON DELETE CASCADE,
  raw_result TEXT, -- Résultat brut (temps, distance, etc.)
  points INTEGER NOT NULL DEFAULT 0,
  photo_url TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  validated_by_staff_id UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contrainte d'unicité pour activités non répétables
  UNIQUE(event_id, centre_id, COALESCE(group_id::text, 'NULL_GROUP'), activity_id)
);

-- Table des réponses aux énigmes
CREATE TABLE public.riddle_answer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  centre_id UUID NOT NULL REFERENCES centre(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  riddle_id UUID NOT NULL REFERENCES riddle(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  correct BOOLEAN NOT NULL DEFAULT false,
  points INTEGER NOT NULL DEFAULT 0,
  hint_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Une seule réponse correcte par groupe pour chaque énigme
  UNIQUE(event_id, centre_id, COALESCE(group_id::text, 'NULL_GROUP'), riddle_id, correct) DEFERRABLE INITIALLY DEFERRED
);

-- Table des points ad-hoc
CREATE TABLE public.ad_hoc_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  centre_id UUID NOT NULL REFERENCES centre(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  station_id UUID REFERENCES station(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des occupations de stations
CREATE TABLE public.occupation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES station(id) ON DELETE CASCADE,
  status station_status NOT NULL DEFAULT 'libre',
  by_centre_id UUID REFERENCES centre(id) ON DELETE SET NULL,
  since TIMESTAMPTZ NOT NULL DEFAULT now(),
  queue_centre_id UUID REFERENCES centre(id) ON DELETE SET NULL, -- File d'attente
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Une seule occupation active par station
  UNIQUE(station_id)
);

-- ====================================================
-- 3. INDEX POUR PERFORMANCES
-- ====================================================

CREATE INDEX idx_attempt_event_centre ON attempt(event_id, centre_id);
CREATE INDEX idx_riddle_answer_event_centre ON riddle_answer(event_id, centre_id);
CREATE INDEX idx_ad_hoc_points_event_centre ON ad_hoc_points(event_id, centre_id);
CREATE INDEX idx_presence_staff_active ON presence(staff_id) WHERE ended_at IS NULL;
CREATE INDEX idx_occupation_station ON occupation(station_id, status);

-- ====================================================
-- 4. TRIGGERS POUR LES TIMESTAMPS
-- ====================================================

-- Fonction générique de mise à jour des timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Application des triggers
CREATE TRIGGER update_event_updated_at BEFORE UPDATE ON public.event FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_zone_updated_at BEFORE UPDATE ON public.zone FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_station_updated_at BEFORE UPDATE ON public.station FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_activity_updated_at BEFORE UPDATE ON public.activity FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_riddle_updated_at BEFORE UPDATE ON public.riddle FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_centre_updated_at BEFORE UPDATE ON public.centre FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_presence_updated_at BEFORE UPDATE ON public.presence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_attempt_updated_at BEFORE UPDATE ON public.attempt FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_riddle_answer_updated_at BEFORE UPDATE ON public.riddle_answer FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ad_hoc_points_updated_at BEFORE UPDATE ON public.ad_hoc_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_occupation_updated_at BEFORE UPDATE ON public.occupation FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();