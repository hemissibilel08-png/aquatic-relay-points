import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Crown, Fish, Calendar, Target, Timer, Zap, Waves, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BiancottoLayout } from "@/components/BiancottoLayout";

interface ActivityRecord {
  id: string;
  points: number;
  raw_result: string;
  started_at: string;
  activity: {
    id: string;
    name: string;
    family: 'precision' | 'lance' | 'endurance' | 'coop';
  };
  groups: {
    label: string;
  } | null;
  centre: {
    id: string;
    name: string;
    profile: 'elementaire' | 'maternelle';
    color: string;
  };
}

interface CentreRanking {
  centre_id: string;
  centre_name: string;
  centre_color: string;
  total_points: number;
  attempts_points: number;
  riddles_points: number;
  adhoc_points: number;
}

interface Zone {
  id: string;
  name: string;
}

type ActivityFamily = 'precision' | 'lance' | 'endurance' | 'coop' | 'all';

const podiumIcons = [Crown, Trophy, Medal];
const podiumColors = ['or', 'argent', 'bronze'];

export default function Records() {
  const [activityRecords, setActivityRecords] = useState<ActivityRecord[]>([]);
  const [centreRankings, setCentreRankings] = useState<CentreRanking[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'today' | 'all'>('today');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<ActivityFamily>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [timeFilter, zoneFilter, categoryFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchActivityRecords(),
        fetchCentreRankings(),
        fetchZones()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityRecords = async () => {
    let query = supabase
      .from('attempt')
      .select(`
        id,
        points,
        raw_result,
        started_at,
        activity:activity_id (
          id,
          name,
          family
        ),
        groups:group_id (
          label
        ),
        centre:centre_id (
          id,
          name,
          profile,
          color
        ),
        station:station_id!inner (
          zone:zone_id (
            id,
            name
          )
        )
      `)
      .not('raw_result', 'is', null)
      .not('activity', 'is', null);

    // Filtre temporel
    if (timeFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('started_at', today);
    }

    // Filtre par catégorie
    if (categoryFilter !== 'all') {
      query = query.eq('activity.family', categoryFilter);
    }

    const { data, error } = await query.order('started_at', { ascending: false });

    if (error) throw error;
    setActivityRecords(data || []);
  };

  const fetchCentreRankings = async () => {
    const today = timeFilter === 'today' 
      ? new Date().toISOString().split('T')[0]
      : '1970-01-01';

    // Récupérer tous les points par centre
    const [attemptsRes, riddlesRes, adhocRes] = await Promise.all([
      // Points des tentatives
      supabase
        .from('attempt')
        .select(`
          points,
          centre_id,
          started_at,
          centre (name, color)
        `)
        .gte('started_at', today),
      
      // Points des énigmes
      supabase
        .from('riddle_answer')
        .select(`
          points,
          centre_id,
          created_at,
          centre (name, color)
        `)
        .gte('created_at', today),
        
      // Points ad hoc
      supabase
        .from('ad_hoc_points')
        .select(`
          points,
          centre_id,
          created_at,
          centre (name, color)
        `)
        .gte('created_at', today)
    ]);

    // Agréger les points par centre
    const centrePoints: Record<string, CentreRanking> = {};

    // Traiter les tentatives
    attemptsRes.data?.forEach(item => {
      if (!centrePoints[item.centre_id]) {
        centrePoints[item.centre_id] = {
          centre_id: item.centre_id,
          centre_name: item.centre.name,
          centre_color: item.centre.color,
          total_points: 0,
          attempts_points: 0,
          riddles_points: 0,
          adhoc_points: 0
        };
      }
      centrePoints[item.centre_id].attempts_points += item.points;
    });

    // Traiter les énigmes
    riddlesRes.data?.forEach(item => {
      if (!centrePoints[item.centre_id]) {
        centrePoints[item.centre_id] = {
          centre_id: item.centre_id,
          centre_name: item.centre.name,
          centre_color: item.centre.color,
          total_points: 0,
          attempts_points: 0,
          riddles_points: 0,
          adhoc_points: 0
        };
      }
      centrePoints[item.centre_id].riddles_points += item.points;
    });

    // Traiter les points ad hoc
    adhocRes.data?.forEach(item => {
      if (!centrePoints[item.centre_id]) {
        centrePoints[item.centre_id] = {
          centre_id: item.centre_id,
          centre_name: item.centre.name,
          centre_color: item.centre.color,
          total_points: 0,
          attempts_points: 0,
          riddles_points: 0,
          adhoc_points: 0
        };
      }
      centrePoints[item.centre_id].adhoc_points += item.points;
    });

    // Calculer totaux et trier
    const rankings = Object.values(centrePoints).map(centre => ({
      ...centre,
      total_points: centre.attempts_points + centre.riddles_points + centre.adhoc_points
    })).sort((a, b) => b.total_points - a.total_points);

    setCentreRankings(rankings);
  };

  const fetchZones = async () => {
    const { data, error } = await supabase
      .from('zone')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
      
    if (error) throw error;
    setZones(data || []);
  };

  const groupRecordsByActivity = (records: ActivityRecord[]) => {
    const grouped = records.reduce((acc, record) => {
      const activityKey = `${record.activity?.name}-${record.activity?.id}` || 'Activité inconnue';
      if (!acc[activityKey]) {
        acc[activityKey] = {
          activity: record.activity,
          records: []
        };
      }
      acc[activityKey].records.push(record);
      return acc;
    }, {} as Record<string, { activity: ActivityRecord['activity'], records: ActivityRecord[] }>);

    // Trier chaque groupe selon le type d'activité
    Object.keys(grouped).forEach(key => {
      const group = grouped[key];
      const family = group.activity?.family;
      
      if (family === 'precision' || family === 'endurance') {
        // Pour précision et endurance: plus petit c'est mieux (min chrono, précision)
        group.records = group.records
          .filter(r => r.raw_result && !isNaN(parseFloat(r.raw_result)))
          .sort((a, b) => parseFloat(a.raw_result) - parseFloat(b.raw_result))
          .slice(0, 3);
      } else {
        // Pour lancer et coopération: plus grand c'est mieux (max distance, score)
        group.records = group.records
          .filter(r => r.raw_result && !isNaN(parseFloat(r.raw_result)))
          .sort((a, b) => parseFloat(b.raw_result) - parseFloat(a.raw_result))
          .slice(0, 3);
      }
    });

    return grouped;
  };

  const getFamilyIcon = (family: string) => {
    switch (family) {
      case 'precision': return Target;
      case 'endurance': return Timer;
      case 'lance': return Zap;
      case 'coop': return Fish;
      default: return Trophy;
    }
  };

  const getFamilyLabel = (family: string) => {
    switch (family) {
      case 'precision': return 'Précision';
      case 'endurance': return 'Endurance';
      case 'lance': return 'Lancer';
      case 'coop': return 'Coopération';
      default: return 'Activité';
    }
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

  const groupedRecords = groupRecordsByActivity(activityRecords);

  return (
    <BiancottoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
                Hall des Records
              </h1>
              <p className="text-muted-foreground mt-1">
                Les meilleures performances par activité et classement des centres
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={timeFilter === 'today' ? 'default' : 'outline'}
                onClick={() => setTimeFilter('today')}
                className="bg-gradient-ocean hover:bg-gradient-ocean/90"
              >
                Aujourd'hui
              </Button>
              <Button
                variant={timeFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setTimeFilter('all')}
                className="bg-gradient-ocean hover:bg-gradient-ocean/90"
              >
                Historique
              </Button>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-4 p-4 bg-wave/20 rounded-lg border border-wave/30">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-ocean-primary" />
              <span className="text-sm font-medium text-ocean-deep">Filtres:</span>
            </div>
            
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les zones</SelectItem>
                {zones.map(zone => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={(value: ActivityFamily) => setCategoryFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="precision">Précision</SelectItem>
                <SelectItem value="lance">Lancer</SelectItem>
                <SelectItem value="endurance">Endurance</SelectItem>
                <SelectItem value="coop">Coopération</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Classement des centres */}
        {centreRankings.length > 0 && (
          <Card className="shadow-soft bg-gradient-to-br from-card via-wave/10 to-foam/20">
            <CardHeader>
              <CardTitle className="text-xl text-ocean-deep flex items-center gap-2">
                <Crown className="w-5 h-5 text-or" />
                Classement des Centres ({timeFilter === 'today' ? 'Aujourd\'hui' : 'Historique'})
              </CardTitle>
              <CardDescription>
                Somme des points (activités + énigmes + points bonus)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {centreRankings.slice(0, 5).map((ranking, index) => {
                  const PodiumIcon = podiumIcons[index] || Trophy;
                  const podiumColor = podiumColors[index] || 'bronze';
                  
                  return (
                    <div
                      key={ranking.centre_id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-all hover:shadow-soft`}
                      style={{
                        backgroundColor: `${ranking.centre_color}20`,
                        borderColor: `${ranking.centre_color}40`,
                        borderWidth: '1px'
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full bg-${podiumColor}/20 flex items-center justify-center`}>
                          <PodiumIcon className={`w-5 h-5 text-${podiumColor}`} />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-lg font-bold text-ocean-deep">
                              {ranking.centre_name}
                            </span>
                            <span className="text-2xl font-bold" style={{ color: ranking.centre_color }}>
                              {ranking.total_points} pts
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Activités: {ranking.attempts_points}</span>
                            <span>Énigmes: {ranking.riddles_points}</span>
                            <span>Bonus: {ranking.adhoc_points}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Badge 
                        variant="secondary" 
                        className={`bg-${podiumColor}/20 text-${podiumColor} text-lg font-bold px-3 py-1`}
                      >
                        #{index + 1}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Records par activité */}
        <div className="grid gap-6">
          {Object.entries(groupedRecords).map(([activityKey, { activity, records }]) => {
            const FamilyIcon = getFamilyIcon(activity?.family);
            const familyLabel = getFamilyLabel(activity?.family);
            const isMinBetter = activity?.family === 'precision' || activity?.family === 'endurance';
            
            return (
              <Card key={activityKey} className="shadow-soft bg-gradient-to-br from-card via-wave/10 to-foam/20">
                <CardHeader>
                  <CardTitle className="text-xl text-ocean-deep flex items-center gap-2">
                    <FamilyIcon className="w-5 h-5 text-ocean-primary" />
                    {activity?.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="outline">{familyLabel}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {isMinBetter ? 'Meilleur temps/précision' : 'Meilleure distance/score'}
                    </span>
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {records.map((record, index) => {
                      const PodiumIcon = podiumIcons[index] || Medal;
                      const podiumColor = podiumColors[index] || 'bronze';
                      
                      return (
                        <div
                          key={record.id}
                          className={`flex items-center justify-between p-4 rounded-lg transition-all hover:shadow-soft`}
                          style={{
                            backgroundColor: `${record.centre.color}15`,
                            borderColor: `${record.centre.color}30`,
                            borderWidth: '1px'
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full bg-${podiumColor}/20 flex items-center justify-center`}>
                              <PodiumIcon className={`w-5 h-5 text-${podiumColor}`} />
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-xl font-bold" style={{ color: record.centre.color }}>
                                  {record.raw_result}
                                  {activity?.family === 'endurance' && 's'}
                                  {activity?.family === 'lance' && 'm'}
                                  {activity?.family === 'precision' && 'cm'}
                                </span>
                                <span className="text-sm font-medium text-ocean-primary">
                                  {record.points} pts
                                </span>
                                {record.groups && (
                                  <Badge variant="outline" className="text-xs">
                                    {record.groups.label}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Fish className="w-3 h-3" />
                                  {record.centre.name}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(record.started_at).toLocaleDateString('fr-FR')}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {record.centre.profile}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <Badge 
                            variant="secondary" 
                            className={`bg-${podiumColor}/20 text-${podiumColor} text-lg font-bold px-3 py-1`}
                          >
                            #{index + 1}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* État vide */}
        {Object.keys(groupedRecords).length === 0 && centreRankings.length === 0 && (
          <div className="text-center py-12">
            <Waves className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Aucun record {timeFilter === 'today' ? "aujourd'hui" : 'trouvé'}
            </h3>
            <p className="text-muted-foreground">
              {timeFilter === 'today' 
                ? "Les records d'aujourd'hui apparaîtront ici au fur et à mesure des activités"
                : "Commencez les activités pour établir vos premiers records"
              }
            </p>
          </div>
        )}
      </div>
    </BiancottoLayout>
  );
}