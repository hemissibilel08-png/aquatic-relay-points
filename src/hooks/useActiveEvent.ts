import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActiveEvent {
  id: string;
  name: string;
  date: string;
  description?: string;
}

export function useActiveEvent() {
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveEvent();
  }, []);

  const fetchActiveEvent = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('event')
        .select('id, name, date, description')
        .eq('is_active', true)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Aucun événement actif trouvé');
        } else {
          throw fetchError;
        }
        return;
      }

      setActiveEvent(data);
    } catch (err) {
      console.error('Erreur lors du chargement de l\'événement actif:', err);
      setError('Erreur lors du chargement de l\'événement');
    } finally {
      setLoading(false);
    }
  };

  return {
    activeEvent,
    loading,
    error,
    refetch: fetchActiveEvent
  };
}