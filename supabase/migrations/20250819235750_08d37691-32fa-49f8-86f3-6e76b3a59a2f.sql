-- Corriger la récursion infinie dans les politiques RLS
-- Supprimer les anciennes fonctions problématiques
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_facilitateur();
DROP FUNCTION IF EXISTS public.get_user_staff_role();
DROP FUNCTION IF EXISTS public.get_user_centre_id();
DROP FUNCTION IF EXISTS public.user_belongs_to_centre(uuid);

-- Créer des fonctions sécurisées qui contournent les RLS
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

-- Recréer les politiques RLS pour éviter la récursion
-- Staff table policies
DROP POLICY IF EXISTS "staff_select_policy" ON public.staff;
DROP POLICY IF EXISTS "staff_modify_policy" ON public.staff;

CREATE POLICY "staff_select_policy" 
ON public.staff 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  public.is_admin()
);

CREATE POLICY "staff_modify_policy" 
ON public.staff 
FOR ALL 
USING (public.is_admin());

-- Centre policies  
DROP POLICY IF EXISTS "centre_select_policy" ON public.centre;
DROP POLICY IF EXISTS "centre_modify_policy" ON public.centre;

CREATE POLICY "centre_select_policy" 
ON public.centre 
FOR SELECT 
USING (
  public.is_admin() OR 
  id = public.get_user_centre_id()
);

CREATE POLICY "centre_modify_policy" 
ON public.centre 
FOR ALL 
USING (public.is_admin());

-- Groups policies
DROP POLICY IF EXISTS "groups_select_policy" ON public.groups;
DROP POLICY IF EXISTS "groups_modify_policy" ON public.groups;

CREATE POLICY "groups_select_policy" 
ON public.groups 
FOR SELECT 
USING (
  public.is_admin() OR 
  public.user_belongs_to_centre(centre_id)
);

CREATE POLICY "groups_modify_policy" 
ON public.groups 
FOR ALL 
USING (public.is_admin());

-- Créer un utilisateur admin par défaut pour les tests
INSERT INTO centre (id, name, profile, color, is_active) 
VALUES (
  '11111111-1111-1111-1111-111111111111', 
  'Centre Test Admin', 
  'elementaire', 
  '#0066CC', 
  true
) ON CONFLICT (id) DO NOTHING;

-- Créer un profil staff admin pour l'utilisateur actuel s'il n'existe pas
DO $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Récupérer l'ID de l'utilisateur actuel depuis auth.users
    SELECT id INTO current_user_id 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Créer un profil staff admin s'il n'existe pas
    IF current_user_id IS NOT NULL THEN
        INSERT INTO staff (user_id, name, role, centre_id, is_active)
        VALUES (
            current_user_id,
            'Admin Test',
            'admin',
            '11111111-1111-1111-1111-111111111111',
            true
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END $$;