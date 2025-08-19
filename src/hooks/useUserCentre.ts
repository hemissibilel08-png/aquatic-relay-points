import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface UserCentre {
  centre_id: string | null;
  centre_name: string | null;
  centre_color: string | null;
  centre_profile: 'elementaire' | 'maternelle' | null;
  user_role: 'admin' | 'facilitateur' | null;
  groups: Array<{
    id: string;
    label: string;
  }>;
}

export function useUserCentre() {
  const { user } = useAuth();
  const [userCentre, setUserCentre] = useState<UserCentre>({
    centre_id: null,
    centre_name: null,
    centre_color: null,
    centre_profile: null,
    user_role: null,
    groups: []
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserCentre();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserCentre = async () => {
    try {
      setLoading(true);

      // Récupérer les informations staff de l'utilisateur
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select(`
          id,
          role,
          centre_id
        `)
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .single();

      if (staffError) {
        console.warn('Utilisateur non trouvé dans staff:', staffError);
        // L'utilisateur n'est peut-être pas encore configuré
        return;
      }

      if (staffData?.centre_id) {
        // Récupérer les informations du centre
        const { data: centreData, error: centreError } = await supabase
          .from('centre')
          .select(`
            id,
            name,
            color,
            profile
          `)
          .eq('id', staffData.centre_id)
          .single();

        // Récupérer les groupes du centre
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('id, label')
          .eq('centre_id', staffData.centre_id)
          .eq('is_active', true);

        if (centreData && !centreError) {
          setUserCentre({
            centre_id: centreData.id,
            centre_name: centreData.name,
            centre_color: centreData.color,
            centre_profile: centreData.profile,
            user_role: staffData.role,
            groups: groupsData || []
          });
          setIsAdmin(staffData.role === 'admin');
        }
      }

    } catch (error) {
      console.error('Erreur lors du chargement du centre utilisateur:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAccessToMultipleCentres = () => {
    return isAdmin;
  };

  const canManageStations = () => {
    return isAdmin || userCentre.user_role === 'facilitateur';
  };

  const getUserCentreGroups = () => {
    return userCentre.groups;
  };

  return {
    userCentre,
    loading,
    isAdmin,
    hasAccessToMultipleCentres,
    canManageStations,
    getUserCentreGroups,
    refetch: fetchUserCentre
  };
}