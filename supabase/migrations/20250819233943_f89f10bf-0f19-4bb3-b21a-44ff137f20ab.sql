-- Amélioration du système d'autorisation et gestion des images
-- 1. Ajouter une colonne centre_id à la table staff pour lier les utilisateurs aux centres
ALTER TABLE staff ADD COLUMN IF NOT EXISTS centre_id uuid REFERENCES centre(id);

-- 2. Ajouter une colonne image_url à la table station
ALTER TABLE station ADD COLUMN IF NOT EXISTS image_url text;

-- 3. Créer une fonction pour obtenir le centre de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_user_centre_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT centre_id FROM staff WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

-- 4. Fonction pour vérifier si l'utilisateur appartient à un centre
CREATE OR REPLACE FUNCTION public.user_belongs_to_centre(centre_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff 
    WHERE user_id = auth.uid() 
      AND centre_id = centre_uuid 
      AND is_active = true
  );
$$;

-- 5. Mettre à jour les politiques RLS pour les centres (seulement voir son centre)
DROP POLICY IF EXISTS "centre_select_policy" ON centre;
CREATE POLICY "centre_select_policy" ON centre
  FOR SELECT
  USING (
    -- Admins voient tout, ou utilisateurs voient leur centre
    is_admin() OR id = get_user_centre_id()
  );

-- 6. Politique pour les groupes (seulement voir les groupes de son centre)
DROP POLICY IF EXISTS "groups_select_policy" ON groups;
CREATE POLICY "groups_select_policy" ON groups
  FOR SELECT
  USING (
    -- Admins voient tout, ou utilisateurs voient les groupes de leur centre
    is_admin() OR user_belongs_to_centre(centre_id)
  );

-- 7. Fonction d'initialisation pour créer un utilisateur staff avec centre
CREATE OR REPLACE FUNCTION public.create_staff_user(
  p_name text,
  p_email text,
  p_role staff_role DEFAULT 'facilitateur',
  p_centre_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
  staff_record RECORD;
BEGIN
  -- Créer l'utilisateur auth (temporairement avec un mot de passe par défaut)
  -- Note: En production, il faudrait envoyer un email d'invitation
  
  -- Pour l'instant, on crée juste l'enregistrement staff avec l'utilisateur actuel
  -- En supposant que l'admin crée d'abord l'utilisateur auth puis appelle cette fonction
  
  INSERT INTO staff (name, role, centre_id, user_id, is_active)
  VALUES (p_name, p_role, p_centre_id, auth.uid(), true)
  RETURNING * INTO staff_record;
  
  RETURN jsonb_build_object(
    'success', true,
    'staff_id', staff_record.id,
    'message', 'Utilisateur staff créé avec succès'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;