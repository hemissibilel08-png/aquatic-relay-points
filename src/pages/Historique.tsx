import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Activity, HelpCircle, Filter, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BiancottoLayout } from "@/components/BiancottoLayout";
import { useSessionCentre } from "@/hooks/useSessionCentre";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface HistoryItem {
  id: string;
  type: 'activite' | 'enigme';
  created_at: string;
  points: number;
  activity_name?: string;
  riddle_question?: string;
  group_label?: string;
  station_name?: string;
  zone_name?: string;
  raw_result?: string;
  photo_url?: string;
  validated_by_staff?: string;
}

interface CurrentEvent {
  id: string;
  name: string;
  date: string;
}

export default function Historique() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'activite' | 'enigme'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [groups, setGroups] = useState<Array<{id: string, label: string}>>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentEvent, setCurrentEvent] = useState<CurrentEvent | null>(null);
  const toast = useToast();
  const { sessionCentre } = useSessionCentre();

  useEffect(() => {
    fetchCurrentEvent();
  }, []);

  useEffect(() => {
    if (sessionCentre.centre_id && currentEvent) {
      fetchHistory();
      fetchGroups();
    }
  }, [sessionCentre.centre_id, currentEvent, filter, groupFilter]);

  const fetchCurrentEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('event')
        .select('id, name, date')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setCurrentEvent(data);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'événement:', error);
    }
  };

  const fetchGroups = async () => {
    if (!sessionCentre.centre_id) return;
    
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, label')
        .eq('centre_id', sessionCentre.centre_id)
        .eq('is_active', true);

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des groupes:', error);
    }
  };

  const fetchHistory = async () => {
    if (!sessionCentre.centre_id || !currentEvent) return;

    try {
      setLoading(true);
      const historyItems: HistoryItem[] = [];

      // Récupérer les activités
      if (filter === 'all' || filter === 'activite') {
        const attemptQuery = supabase
          .from('attempt')
          .select(`
            id,
            created_at,
            points,
            raw_result,
            photo_url,
            activity:activity_id (name),
            group:group_id (label),
            staff:validated_by_staff_id (name)
          `)
          .eq('centre_id', sessionCentre.centre_id)
          .eq('event_id', currentEvent.id)
          .not('ended_at', 'is', null);

        if (groupFilter !== 'all') {
          attemptQuery.eq('group_id', groupFilter);
        }

        const { data: attempts, error: attemptError } = await attemptQuery.order('created_at', { ascending: false });

        if (attemptError) throw attemptError;

        attempts?.forEach(attempt => {
          historyItems.push({
            id: attempt.id,
            type: 'activite',
            created_at: attempt.created_at,
            points: attempt.points,
            activity_name: attempt.activity?.name,
            group_label: attempt.group?.label,
            raw_result: attempt.raw_result,
            photo_url: attempt.photo_url,
            validated_by_staff: attempt.staff?.name
          });
        });
      }

      // Récupérer les énigmes
      if (filter === 'all' || filter === 'enigme') {
        const riddleQuery = supabase
          .from('riddle_answer')
          .select(`
            id,
            created_at,
            points,
            answer_text,
            correct,
            hint_used,
            riddle:riddle_id (question),
            group:group_id (label)
          `)
          .eq('centre_id', sessionCentre.centre_id)
          .eq('event_id', currentEvent.id)
          .eq('correct', true);

        if (groupFilter !== 'all') {
          riddleQuery.eq('group_id', groupFilter);
        }

        const { data: riddles, error: riddleError } = await riddleQuery.order('created_at', { ascending: false });

        if (riddleError) throw riddleError;

        riddles?.forEach(riddle => {
          historyItems.push({
            id: riddle.id,
            type: 'enigme',
            created_at: riddle.created_at,
            points: riddle.points,
            riddle_question: riddle.riddle?.question,
            group_label: riddle.group?.label
          });
        });
      }

      // Trier par date décroissante
      historyItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setHistory(historyItems);
      
      // Calculer le total des points
      const total = historyItems.reduce((sum, item) => sum + item.points, 0);
      setTotalPoints(total);

    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      toast.toast({
        title: "Erreur",
        description: "Impossible de charger l'historique",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'activite' ? Activity : HelpCircle;
  };

  const getTypeColor = (type: string) => {
    return type === 'activite' ? 'bg-gradient-ocean' : 'bg-gradient-coral';
  };

  if (loading) {
    return (
      <BiancottoLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-primary"></div>
        </div>
      </BiancottoLayout>
    );
  }

  return (
    <BiancottoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-foam" />
          </div>
          <h1 className="text-2xl font-bold text-ocean-deep mb-2">
            Historique des Activités
          </h1>
          <p className="text-muted-foreground">
            {sessionCentre.centre_name} - Toutes vos activités et énigmes réalisées
          </p>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-ocean-deep">{totalPoints}</div>
              <p className="text-sm text-muted-foreground">Points Total</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-ocean-deep">
                {history.filter(h => h.type === 'activite').length}
              </div>
              <p className="text-sm text-muted-foreground">Activités</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-ocean-deep">
                {history.filter(h => h.type === 'enigme').length}
              </div>
              <p className="text-sm text-muted-foreground">Énigmes</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Type d'activité</label>
              <Tabs value={filter} onValueChange={(value: any) => setFilter(value)} className="mt-2">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">Toutes</TabsTrigger>
                  <TabsTrigger value="activite">Activités</TabsTrigger>
                  <TabsTrigger value="enigme">Énigmes</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Groupe marin</label>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Tous les groupes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les groupes</SelectItem>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste historique */}
        <div className="space-y-4">
          {history.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">Aucune activité</h3>
                <p className="text-muted-foreground">
                  Commencez à réaliser des activités pour voir votre historique ici
                </p>
              </CardContent>
            </Card>
          ) : (
            history.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              return (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${getTypeColor(item.type)} rounded-lg flex items-center justify-center`}>
                          <TypeIcon className="w-6 h-6 text-foam" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-ocean-deep">
                            {item.activity_name || item.riddle_question}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {item.type === 'activite' ? 'Activité' : 'Énigme'}
                            </Badge>
                            {item.group_label && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {item.group_label}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(item.created_at), 'dd/MM HH:mm', { locale: fr })}
                            </Badge>
                          </div>
                          
                          {item.raw_result && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Résultat: {item.raw_result}
                            </p>
                          )}
                          
                          {item.validated_by_staff && (
                            <p className="text-sm text-muted-foreground">
                              Validé par {item.validated_by_staff}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-ocean-primary">
                          +{item.points}
                        </div>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                    
                    {item.photo_url && (
                      <div className="mt-4">
                        <img
                          src={item.photo_url}
                          alt="Photo de l'activité"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </BiancottoLayout>
  );
}