-- Correction des avertissements de sécurité - SET search_path pour toutes les fonctions
ALTER FUNCTION public.activate_rain_mode() SET search_path = public;
ALTER FUNCTION public.deactivate_rain_mode() SET search_path = public;