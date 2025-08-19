-- ====================================================
-- BIANCOTTO - Configuration RLS et politiques de sécurité
-- ====================================================

-- Activation RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groupes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enigmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tentatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilitateur_postes ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- FONCTIONS DE SÉCURITÉ (Security Definer pour éviter récursion)
-- ====================================================

-- Fonction pour obtenir le rôle de l'utilisateur actuel
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Fonction pour obtenir le centre de l'utilisateur actuel
CREATE OR REPLACE FUNCTION public.get_current_user_centre_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT centre_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Fonction pour vérifier si l'utilisateur a un rôle spécifique
CREATE OR REPLACE FUNCTION public.has_role(role_name app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = role_name AND active = true
  );
$$;

-- ====================================================
-- POLITIQUES RLS
-- ====================================================

-- PROFILES: Chacun peut voir son profil, admin peut tout voir
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.has_role('admin'));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.has_role('admin'));

CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (public.has_role('admin'));

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (public.has_role('admin'));

-- CENTRES: Animateurs voient leur centre, autres rôles voient tout
CREATE POLICY "Users can view centres"
ON public.centres FOR SELECT
USING (
  public.has_role('admin') OR 
  public.has_role('rev') OR 
  public.has_role('facilitateur') OR
  (public.has_role('animateur') AND id = public.get_current_user_centre_id())
);

CREATE POLICY "Admins can manage centres"
ON public.centres FOR ALL
USING (public.has_role('admin'));

-- GROUPES: Animateurs voient leurs groupes, autres rôles voient tout
CREATE POLICY "Users can view groupes"
ON public.groupes FOR SELECT
USING (
  public.has_role('admin') OR 
  public.has_role('rev') OR 
  public.has_role('facilitateur') OR
  (public.has_role('animateur') AND centre_id = public.get_current_user_centre_id())
);

CREATE POLICY "Admins can manage groupes"
ON public.groupes FOR ALL
USING (public.has_role('admin'));

CREATE POLICY "Animateurs can update their groupes"
ON public.groupes FOR UPDATE
USING (
  public.has_role('animateur') AND 
  centre_id = public.get_current_user_centre_id()
);

-- STATIONS: Tous peuvent voir, admin peut gérer
CREATE POLICY "All authenticated users can view stations"
ON public.stations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage stations"
ON public.stations FOR ALL
USING (public.has_role('admin'));

-- STATION_OCCUPATIONS: Tous peuvent voir, facilitateurs/animateurs peuvent modifier
CREATE POLICY "All authenticated users can view station occupations"
ON public.station_occupations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Facilitateurs and animateurs can manage occupations"
ON public.station_occupations FOR ALL
USING (
  public.has_role('admin') OR
  public.has_role('facilitateur') OR
  public.has_role('animateur')
);

-- ACTIVITES: Tous peuvent voir, admin peut gérer
CREATE POLICY "All authenticated users can view activites"
ON public.activites FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage activites"
ON public.activites FOR ALL
USING (public.has_role('admin'));

-- ENIGMES: Tous peuvent voir, admin peut gérer
CREATE POLICY "All authenticated users can view enigmes"
ON public.enigmes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage enigmes"
ON public.enigmes FOR ALL
USING (public.has_role('admin'));

-- TENTATIVES: Animateurs voient leurs tentatives, autres rôles voient tout
CREATE POLICY "Users can view tentatives"
ON public.tentatives FOR SELECT
USING (
  public.has_role('admin') OR 
  public.has_role('rev') OR 
  public.has_role('facilitateur') OR
  (public.has_role('animateur') AND groupe_id IN (
    SELECT id FROM groupes WHERE centre_id = public.get_current_user_centre_id()
  ))
);

CREATE POLICY "Facilitateurs and animateurs can create tentatives"
ON public.tentatives FOR INSERT
WITH CHECK (
  public.has_role('facilitateur') OR
  public.has_role('animateur') OR
  public.has_role('admin')
);

CREATE POLICY "Facilitateurs and animateurs can update tentatives"
ON public.tentatives FOR UPDATE
USING (
  public.has_role('facilitateur') OR
  public.has_role('animateur') OR
  public.has_role('admin')
);

-- RECORDS: Lecture publique (pour page records), admin peut gérer
CREATE POLICY "All authenticated users can view records"
ON public.records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Facilitateurs and animateurs can create records"
ON public.records FOR INSERT
WITH CHECK (
  public.has_role('facilitateur') OR
  public.has_role('animateur') OR
  public.has_role('admin')
);

CREATE POLICY "Admins can manage records"
ON public.records FOR ALL
USING (public.has_role('admin'));

-- FACILITATEUR_POSTES: Chacun voit ses postes, admin voit tout
CREATE POLICY "Users can view facilitateur postes"
ON public.facilitateur_postes FOR SELECT
USING (
  public.has_role('admin') OR
  facilitateur_id = auth.uid()
);

CREATE POLICY "Facilitateurs can manage their own postes"
ON public.facilitateur_postes FOR ALL
USING (
  public.has_role('admin') OR
  (public.has_role('facilitateur') AND facilitateur_id = auth.uid())
);

-- ====================================================
-- CORRECTION DES FONCTIONS (search_path)
-- ====================================================

-- Mise à jour fonction calcul points avec search_path
CREATE OR REPLACE FUNCTION public.calculer_points_tentative(
  p_type activite_type,
  p_activite_id UUID,
  p_niveau_perf perf_niveau,
  p_co_validee BOOLEAN,
  p_indice_utilise BOOLEAN,
  p_ad_hoc_points INTEGER,
  p_centre_profil centre_profil
) RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Mise à jour fonction timestamp avec search_path
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