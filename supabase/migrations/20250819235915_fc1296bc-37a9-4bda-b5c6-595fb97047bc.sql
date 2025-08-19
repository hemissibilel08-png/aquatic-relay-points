-- Ajouter la valeur 'rev' à l'enum staff_role
ALTER TYPE staff_role ADD VALUE IF NOT EXISTS 'rev';

-- Maintenant recréer les fonctions sécurisées
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff 
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_facilitateur()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff 
    WHERE user_id = auth.uid() AND role = 'facilitateur' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_rev()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff 
    WHERE user_id = auth.uid() AND role = 'rev' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_staff_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM staff WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_centre_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT centre_id FROM staff WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_centre(_centre_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff 
    WHERE user_id = auth.uid() 
      AND centre_id = _centre_id 
      AND is_active = true
  );
$$;

-- Corriger la politique staff_select_policy pour éviter la récursion
DROP POLICY IF EXISTS "staff_select_policy" ON public.staff;

CREATE POLICY "staff_select_policy" 
ON public.staff 
FOR SELECT 
USING (
  -- Un utilisateur peut voir son propre profil OU si il est admin
  user_id = auth.uid() OR 
  (EXISTS (
    SELECT 1 FROM staff s2 
    WHERE s2.user_id = auth.uid() 
      AND s2.role = 'admin' 
      AND s2.is_active = true
  ))
);

-- Créer des données de test
INSERT INTO centre (id, name, profile, color, is_active) 
VALUES (
  '11111111-1111-1111-1111-111111111111', 
  'Centre Test Admin', 
  'elementaire', 
  '#0066CC', 
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO event (id, name, description, date, is_active)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Événement Test Biancotto',
  'Événement de test pour les fonctionnalités',
  CURRENT_DATE,
  true
) ON CONFLICT (id) DO NOTHING;