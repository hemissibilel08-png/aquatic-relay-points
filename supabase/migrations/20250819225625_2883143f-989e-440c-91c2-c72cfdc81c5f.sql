-- ====================================================
-- BIANCOTTO V2 - RLS, Fonctions et Politiques de Sécurité
-- ====================================================

-- Activation RLS sur toutes les tables
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
-- FONCTIONS DE SÉCURITÉ
-- ====================================================

-- Fonction pour obtenir le rôle de l'utilisateur connecté
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
-- POLITIQUES RLS
-- ====================================================

-- EVENT : Lecture pour tous authentifiés, écriture admin
CREATE POLICY "event_select_policy" ON public.event FOR SELECT TO authenticated USING (true);
CREATE POLICY "event_modify_policy" ON public.event FOR ALL USING (public.is_admin());

-- ZONE : Lecture pour tous, écriture admin
CREATE POLICY "zone_select_policy" ON public.zone FOR SELECT TO authenticated USING (true);
CREATE POLICY "zone_modify_policy" ON public.zone FOR ALL USING (public.is_admin());

-- STATION : Lecture pour tous, écriture admin
CREATE POLICY "station_select_policy" ON public.station FOR SELECT TO authenticated USING (true);
CREATE POLICY "station_modify_policy" ON public.station FOR ALL USING (public.is_admin());

-- ACTIVITY : Lecture pour tous, écriture admin
CREATE POLICY "activity_select_policy" ON public.activity FOR SELECT TO authenticated USING (true);
CREATE POLICY "activity_modify_policy" ON public.activity FOR ALL USING (public.is_admin());

-- RIDDLE : Lecture pour tous, écriture admin
CREATE POLICY "riddle_select_policy" ON public.riddle FOR SELECT TO authenticated USING (true);
CREATE POLICY "riddle_modify_policy" ON public.riddle FOR ALL USING (public.is_admin());

-- CENTRE : Lecture minimale pour tous
CREATE POLICY "centre_select_policy" ON public.centre FOR SELECT TO authenticated USING (true);
CREATE POLICY "centre_modify_policy" ON public.centre FOR ALL USING (public.is_admin());

-- GROUPS : Lecture minimale pour tous
CREATE POLICY "groups_select_policy" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "groups_modify_policy" ON public.groups FOR ALL USING (public.is_admin());

-- STAFF : Lecture limitée, écriture admin
CREATE POLICY "staff_select_policy" ON public.staff FOR SELECT TO authenticated 
USING (public.is_admin() OR public.is_facilitateur());
CREATE POLICY "staff_modify_policy" ON public.staff FOR ALL USING (public.is_admin());

-- PRESENCE : Staff peut gérer ses présences
CREATE POLICY "presence_select_policy" ON public.presence FOR SELECT TO authenticated USING (
  public.is_admin() OR 
  (public.is_facilitateur() AND staff_id IN (
    SELECT id FROM staff WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "presence_modify_policy" ON public.presence FOR ALL USING (
  public.is_admin() OR 
  (public.is_facilitateur() AND staff_id IN (
    SELECT id FROM staff WHERE user_id = auth.uid()
  ))
);

-- ATTEMPT : Bornée par event actif
CREATE POLICY "attempt_select_policy" ON public.attempt FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM event WHERE id = attempt.event_id AND is_active = true)
);
CREATE POLICY "attempt_insert_policy" ON public.attempt FOR INSERT WITH CHECK (
  (public.is_admin() OR public.is_facilitateur()) AND
  EXISTS (SELECT 1 FROM event WHERE id = attempt.event_id AND is_active = true)
);
CREATE POLICY "attempt_update_policy" ON public.attempt FOR UPDATE 
USING (public.is_admin() OR public.is_facilitateur());
CREATE POLICY "attempt_delete_policy" ON public.attempt FOR DELETE 
USING (public.is_admin());

-- RIDDLE_ANSWER : Similaire aux tentatives
CREATE POLICY "riddle_answer_select_policy" ON public.riddle_answer FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM event WHERE id = riddle_answer.event_id AND is_active = true)
);
CREATE POLICY "riddle_answer_modify_policy" ON public.riddle_answer FOR ALL USING (
  (public.is_admin() OR public.is_facilitateur()) AND
  EXISTS (SELECT 1 FROM event WHERE id = riddle_answer.event_id AND is_active = true)
);

-- AD_HOC_POINTS : Bornée par event
CREATE POLICY "ad_hoc_points_select_policy" ON public.ad_hoc_points FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM event WHERE id = ad_hoc_points.event_id AND is_active = true)
);
CREATE POLICY "ad_hoc_points_modify_policy" ON public.ad_hoc_points FOR ALL USING (
  (public.is_admin() OR public.is_facilitateur()) AND
  EXISTS (SELECT 1 FROM event WHERE id = ad_hoc_points.event_id AND is_active = true)
);

-- OCCUPATION : Lecture libre, écriture admin
CREATE POLICY "occupation_select_policy" ON public.occupation FOR SELECT TO authenticated USING (true);
CREATE POLICY "occupation_modify_policy" ON public.occupation FOR ALL USING (public.is_admin());

-- ====================================================
-- TRIGGERS POUR TIMESTAMPS
-- ====================================================

-- Fonction de mise à jour des timestamps
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