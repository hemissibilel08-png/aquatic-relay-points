import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Waves, Users, QrCode, MapPin, Clock, Shield, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Station {
  id: string;
  nom: string;
  description: string;
  type: 'autonome' | 'supervisee';
  code_qr: string;
  zone: string;
  categorie: string;
  active: boolean;
  station_occupations?: Array<{
    id: string;
    status: 'libre' | 'occupee' | 'fermee';
    groupe_id: string;
    facilitateur_id: string;
    debut_occupation: string;
    auto_release_at: string;
  }>;
  activites?: Array<{
    id: string;
    nom: string;
    type: 'activite' | 'enigme' | 'dessin_manuel' | 'ponctuelle_tech';
  }>;
}

const typeIcons = {
  autonome: Zap,
  supervisee: Shield,
};

const statusColors = {
  libre: 'status-libre',
  occupee: 'status-occupee', 
  fermee: 'status-fermee',
};

const statusLabels = {
  libre: 'Libre',
  occupee: 'Occupée',
  fermee: 'Fermée',
};

export default function Stations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const { data, error } = await supabase
        .from('stations')
        .select(`
          *,
          station_occupations!inner (
            id,
            status,
            groupe_id,
            facilitateur_id,
            debut_occupation,
            auto_release_at
          ),
          activites (
            id,
            nom,
            type
          )
        `)
        .eq('active', true)
        .order('nom');

      if (error) throw error;
      setStations(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des stations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les stations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentOccupation = (station: Station) => {
    return station.station_occupations?.[0];
  };

  const getTimeRemaining = (autoReleaseAt: string) => {
    const now = new Date();
    const releaseTime = new Date(autoReleaseAt);
    const diff = releaseTime.getTime() - now.getTime();
    
    if (diff <= 0) return "Expiré";
    
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
            Stations Marines
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion et surveillance des stations d'activités
          </p>
        </div>
        
        <Button className="bg-gradient-ocean hover:shadow-medium transition-all">
          <Waves className="w-4 h-4 mr-2" />
          Nouvelle Station
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {stations.map((station) => {
          const currentOccupation = getCurrentOccupation(station);
          const TypeIcon = typeIcons[station.type];
          const status = currentOccupation?.status || 'libre';
          
          return (
            <Card key={station.id} className="shadow-soft hover:shadow-medium transition-all bg-gradient-to-br from-card to-wave/30">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-ocean-deep flex items-center gap-2">
                      <Waves className="w-5 h-5 text-ocean-primary" />
                      {station.nom}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {station.description}
                    </CardDescription>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`bg-${statusColors[status]}/20 text-${statusColors[status]} border-${statusColors[status]}/30`}
                    >
                      {statusLabels[status]}
                    </Badge>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TypeIcon className="w-3 h-3" />
                      {station.type === 'autonome' ? 'Autonome' : 'Supervisée'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Informations de la station */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{station.zone || 'Zone non définie'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{station.categorie || 'Catégorie'}</span>
                  </div>
                </div>

                {/* État d'occupation */}
                {currentOccupation && status === 'occupee' && (
                  <div className="bg-status-occupee/10 border border-status-occupee/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Occupation en cours</span>
                      {currentOccupation.auto_release_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {getTimeRemaining(currentOccupation.auto_release_at)}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Depuis {new Date(currentOccupation.debut_occupation).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                )}

                {/* Activités */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Activités</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {station.activites?.slice(0, 3).map((activite) => (
                      <Badge key={activite.id} variant="outline" className="text-xs">
                        {activite.nom}
                      </Badge>
                    )) || (
                      <span className="text-xs text-muted-foreground italic">
                        Aucune activité
                      </span>
                    )}
                    {station.activites && station.activites.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{station.activites.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <Button variant="outline" size="sm" className="gap-2">
                    <QrCode className="w-4 h-4" />
                    QR Code
                  </Button>
                  
                  <Button size="sm" className="bg-gradient-ocean hover:shadow-soft transition-all">
                    Ouvrir
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {stations.length === 0 && (
        <div className="text-center py-12">
          <Waves className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Aucune station configurée
          </h3>
          <p className="text-muted-foreground">
            Créez votre première station d'activités pour commencer
          </p>
        </div>
      )}
    </div>
  );
}