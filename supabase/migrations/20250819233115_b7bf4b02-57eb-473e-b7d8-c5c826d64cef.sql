-- Migration simplifiée - Fonctions Mode Pluie
CREATE OR REPLACE FUNCTION public.activate_rain_mode()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Basculer les stations vers zones de repli
  UPDATE station SET 
    zone_id = (
      SELECT z.fallback_zone_id 
      FROM zone z 
      WHERE z.id = station.zone_id 
      AND z.fallback_zone_id IS NOT NULL
    )
  WHERE is_active = true 
    AND zone_id IN (
      SELECT id FROM zone WHERE fallback_zone_id IS NOT NULL
    );
    
  RAISE NOTICE 'Mode pluie activé';
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_rain_mode()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Restaurer les zones originales
  UPDATE station SET 
    zone_id = (
      SELECT z_parent.id 
      FROM zone z_parent 
      WHERE z_parent.fallback_zone_id = station.zone_id
      LIMIT 1
    )
  WHERE is_active = true 
    AND zone_id IN (
      SELECT fallback_zone_id FROM zone WHERE fallback_zone_id IS NOT NULL
    );
    
  RAISE NOTICE 'Mode pluie désactivé';
END;
$$;