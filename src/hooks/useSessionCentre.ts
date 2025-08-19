import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface SessionCentre {
  centre_id: string | null;
  centre_name: string | null;
  group_label: string | null;
  profil: 'elementaire' | 'maternelle' | null;
}

const SESSION_CENTRE_KEY = 'biancotto_session_centre';

export function useSessionCentre() {
  const { user } = useAuth();
  const [sessionCentre, setSessionCentre] = useState<SessionCentre>({
    centre_id: null,
    centre_name: null,
    group_label: null,
    profil: null,
  });

  // Charger la session centre depuis localStorage au démarrage
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_CENTRE_KEY);
    if (stored) {
      try {
        setSessionCentre(JSON.parse(stored));
      } catch (error) {
        console.error('Erreur parsing session centre:', error);
        localStorage.removeItem(SESSION_CENTRE_KEY);
      }
    }
  }, []);

  // Sauvegarder en localStorage à chaque changement
  useEffect(() => {
    if (sessionCentre.centre_id) {
      localStorage.setItem(SESSION_CENTRE_KEY, JSON.stringify(sessionCentre));
    }
  }, [sessionCentre]);

  // Nettoyer la session si l'utilisateur se déconnecte
  useEffect(() => {
    if (!user) {
      clearSessionCentre();
    }
  }, [user]);

  const setSessionCentreData = async (centreId: string, groupLabel?: string) => {
    try {
      // Récupérer les infos du centre
      const { data: centre, error } = await supabase
        .from('centre')
        .select('name, profile')
        .eq('id', centreId)
        .single();

      if (error) throw error;

      const newSession: SessionCentre = {
        centre_id: centreId,
        centre_name: centre.name,
        group_label: groupLabel || null,
        profil: centre.profile,
      };

      setSessionCentre(newSession);
      return { success: true, error: null };
    } catch (error) {
      console.error('Erreur lors de la configuration de la session centre:', error);
      return { success: false, error };
    }
  };

  const updateGroupLabel = (groupLabel: string) => {
    setSessionCentre(prev => ({
      ...prev,
      group_label: groupLabel,
    }));
  };

  const clearSessionCentre = () => {
    setSessionCentre({
      centre_id: null,
      centre_name: null,
      group_label: null,
      profil: null,
    });
    localStorage.removeItem(SESSION_CENTRE_KEY);
  };

  const isSessionActive = () => {
    return sessionCentre.centre_id !== null;
  };

  return {
    sessionCentre,
    setSessionCentreData,
    updateGroupLabel,
    clearSessionCentre,
    isSessionActive,
  };
}