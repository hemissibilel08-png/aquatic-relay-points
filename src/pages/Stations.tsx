import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Waves, QrCode, MapPin, Shield, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BiancottoLayout } from "@/components/BiancottoLayout";
import { useUserCentre } from "@/hooks/useUserCentre";

interface Station {
  id: string;
  name: string;
  description: string;
  qr_code: string;
  is_active: boolean;
  zone_id: string;
  activity_id: string;
  occupation?: {
    id: string;
    status: 'libre' | 'occupee' | 'fermee';
    by_centre_id: string;
    since: string;
  };
  activity?: {
    id: string;
    name: string;
    type: string;
  };
}

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
  const navigate = useNavigate();
  const { canCreateStations } = useUserCentre();

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const { data, error } = await supabase
        .from('station')
        .select(`
          *,
          occupation (
            id,
            status,
            by_centre_id,
            since
          ),
          activity (
            id,
            name,
            type
          )
        `)
        .eq('is_active', true)
        .order('name');

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
              Stations Marines
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestion et surveillance des stations d'activités
            </p>
          </div>
          
          {canCreateStations() && (
            <Button 
              className="bg-gradient-ocean hover:shadow-medium transition-all"
              onClick={() => navigate('/station-detail/new')}
            >
              <Waves className="w-4 h-4 mr-2" />
              Nouvelle Station
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {stations.map((station) => {
            const status = station.occupation?.status || 'libre';
            
            return (
              <Card key={station.id} className="shadow-soft hover:shadow-medium transition-all bg-gradient-to-br from-card to-wave/30">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-ocean-deep flex items-center gap-2">
                        <Waves className="w-5 h-5 text-ocean-primary" />
                        {station.name}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {station.description}
                      </CardDescription>
                    </div>
                    
                    <Badge 
                      variant="secondary" 
                      className={`bg-${statusColors[status]}/20 text-${statusColors[status]} border-${statusColors[status]}/30`}
                    >
                      {statusLabels[status]}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Activité */}
                  {station.activity && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Activité</span>
                      </div>
                      
                      <Badge variant="outline" className="text-xs">
                        {station.activity.name}
                      </Badge>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => {
                        // Générer QR code ou afficher QR existant
                        toast({
                          title: "QR Code",
                          description: `QR Code: ${station.qr_code}`,
                        });
                      }}
                    >
                      <QrCode className="w-4 h-4" />
                      QR Code
                    </Button>
                    
                    <div className="flex gap-2">
                      {canCreateStations() && (
                        <Button 
                          variant="outline"
                          size="sm" 
                          onClick={() => navigate(`/station-detail/${station.id}`)}
                        >
                          Gérer
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        className="bg-gradient-ocean hover:shadow-soft transition-all"
                        onClick={() => navigate(`/station/${station.id}`)}
                      >
                        Ouvrir
                      </Button>
                    </div>
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
    </BiancottoLayout>
  );
}