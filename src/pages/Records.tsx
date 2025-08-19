import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, Fish, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BiancottoLayout } from "@/components/BiancottoLayout";

interface RecordItem {
  id: string;
  points: number;
  raw_result: string;
  started_at: string;
  activity: {
    name: string;
  };
  groups: {
    label: string;
  } | null;
  centre: {
    name: string;
    profile: 'elementaire' | 'maternelle';
  };
}

const podiumIcons = [Crown, Trophy, Medal];
const podiumColors = ['or', 'argent', 'bronze'];

export default function Records() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today'>('today');
  const { toast } = useToast();

  useEffect(() => {
    fetchRecords();
  }, [filter]);

  const fetchRecords = async () => {
    try {
      let query = supabase
        .from('attempt')
        .select(`
          id,
          points,
          raw_result,
          started_at,
          activity:activity_id (
            name
          ),
          groups:group_id (
            label
          ),
          centre:centre_id (
            name,
            profile
          )
        `);

      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('started_at', today);
      }

      const { data, error } = await query
        .order('points', { ascending: false })
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des records:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const groupRecordsByActivity = (records: RecordItem[]) => {
    const grouped = records.reduce((acc, record) => {
      const activityKey = record.activity?.name || 'Activité inconnue';
      if (!acc[activityKey]) {
        acc[activityKey] = [];
      }
      acc[activityKey].push(record);
      return acc;
    }, {} as Record<string, RecordItem[]>);

    // Trier chaque groupe par points décroissants et ne garder que le top 3
    Object.keys(grouped).forEach(key => {
      grouped[key] = grouped[key]
        .sort((a, b) => b.points - a.points)
        .slice(0, 3);
    });

    return grouped;
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

  const groupedRecords = groupRecordsByActivity(records);

  return (
    <BiancottoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
              Hall des Records
            </h1>
            <p className="text-muted-foreground mt-1">
              Les meilleures performances des journées sportives
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'today'
                  ? 'bg-gradient-ocean text-foam shadow-soft'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-gradient-ocean text-foam shadow-soft'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Tous les temps
            </button>
          </div>
        </div>

        {/* Records par activité */}
        <div className="grid gap-6">
          {Object.entries(groupedRecords).map(([activityName, activityRecords]) => (
            <Card key={activityName} className="shadow-soft bg-gradient-to-br from-card to-wave/30">
              <CardHeader>
                <CardTitle className="text-xl text-ocean-deep flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-or" />
                  {activityName}
                </CardTitle>
                <CardDescription>
                  Activité: {activityRecords[0]?.activity?.name}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {activityRecords.map((record, index) => {
                    const PodiumIcon = podiumIcons[index] || Medal;
                    const podiumColor = podiumColors[index] || 'bronze';
                    
                    return (
                      <div
                        key={record.id}
                        className={`flex items-center justify-between p-4 rounded-lg bg-${podiumColor}/10 border border-${podiumColor}/20 transition-all hover:shadow-soft`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full bg-${podiumColor}/20 flex items-center justify-center`}>
                            <PodiumIcon className={`w-5 h-5 text-${podiumColor}`} />
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-lg font-bold text-ocean-deep">
                                {record.points} points
                              </span>
                              {record.groups && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-ocean-primary">
                                    {record.groups.label}
                                  </span>
                                </div>
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
                            
                            {record.raw_result && (
                              <p className="text-sm text-muted-foreground mt-1 italic">
                                {record.raw_result}
                              </p>
                            )}
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
          ))}
        </div>

        {/* État vide */}
        {Object.keys(groupedRecords).length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Aucun record {filter === 'today' ? "aujourd'hui" : 'trouvé'}
            </h3>
            <p className="text-muted-foreground">
              {filter === 'today' 
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