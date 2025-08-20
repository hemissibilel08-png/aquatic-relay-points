-- Créer un utilisateur admin avec l'un des utilisateurs existants
-- Remplacer par votre email actuel dans la requête suivante

INSERT INTO staff (
  name, 
  role, 
  centre_id, 
  user_id, 
  is_active
) 
VALUES (
  'Admin Principal',
  'admin',
  '11111111-1111-1111-1111-111111111111', -- Centre test créé précédemment
  (SELECT id FROM auth.users WHERE email = 'hemissbilel08+1@gmail.com' LIMIT 1),
  true
);