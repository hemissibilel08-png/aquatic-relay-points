-- Étape 1: Ajouter seulement la valeur 'rev' à l'enum
ALTER TYPE staff_role ADD VALUE IF NOT EXISTS 'rev';

-- Créer les données de test
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