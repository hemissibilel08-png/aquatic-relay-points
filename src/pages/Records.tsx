import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, Fish, Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RecordItem {
  id: string;
  valeur: number;
  unite: string;
  description: string;
  date_record: string;
  activite: {
    nom: string;
    station: {
      nom: string;
      zone: string;
      categorie: string;
    };
  };
  groupe: {
    animal: 'dauphins' | 'tortues' | 'requins';
  };
  centre: {
    nom: string;
    profil: 'maternelle' | 'elementaire';
  };
}

const animalIcons = {
  dauphins: '🐬',
  tortues: '🐢', 
  requins: '🦈'
};

const animalColors = {
  dauphins: 'dauphin',
  tortues: 'tortue', 
  requins: 'requin'
};

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
        .from('records')
        .select(`
          *,
          activite:activites (
            nom,
            station:stations (
              nom,
              zone,
              categorie
            )
          ),
          groupe:groupes (
            animal
          ),
          centre:centres (
            nom,
            profil
          )
        `);

      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        query = query.eq('date_record', today);
      }

      const { data, error } = await query
        .order('valeur', { ascending: false })
        .order('created_at', { ascending: false });

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
      const activityKey = record.activite.nom;
      if (!acc[activityKey]) {
        acc[activityKey] = [];
      }
      acc[activityKey].push(record);
      return acc;
    }, {} as Record<string, RecordItem[]>);

    // Trier chaque groupe par valeur décroissante et ne garder que le top 3
    Object.keys(grouped).forEach(key => {
      grouped[key] = grouped[key]
        .sort((a, b) => b.valeur - a.valeur)
        .slice(0, 3);
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-primary"></div>
      </div>
    );
  }

  const groupedRecords = groupRecordsByActivity(records);

  return (
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
                {activityRecords[0]?.activite.station.nom} • {activityRecords[0]?.activite.station.zone}
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
                              {record.valeur} {record.unite}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{animalIcons[record.groupe.animal]}</span>
                              <span className={`text-sm font-medium capitalize text-${animalColors[record.groupe.animal]}`}>
                                {record.groupe.animal}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Fish className="w-3 h-3" />
                              {record.centre.nom}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(record.date_record).toLocaleDateString('fr-FR')}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {record.centre.profil}
                            </Badge>
                          </div>
                          
                          {record.description && (
                            <p className="text-sm text-muted-foreground mt-1 italic">
                              {record.description}
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
  );
}