import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Clock, Lock, Unlock, UserCheck, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BiancottoLayout } from "@/components/BiancottoLayout";

interface Facilitator {
  id: string;
  name: string;
  role: 'facilitateur' | 'admin' | 'rev';
  is_active: boolean;
  presence?: {
    id: string;
    station_id: string;
    started_at: string;
    ended_at: string | null;
    station: {
      name: string;
      zone_id: string;
    };
  }[];
}

interface Station {
  id: string;
  name: string;
  description: string;
  activity?: {
    requires_facilitator: boolean;
  };
  occupation?: {
    status: 'libre' | 'occupee' | 'fermee';
  };
}

export default function Facilitateurs() {
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Récupérer les facilitateurs
      const { data: facilitatorsData, error: facilitatorsError } = await supabase
        .from('staff')
        .select(`
          id,
          name,
          role,
          is_active,
          presence (
            id,
            station_id,
            started_at,
            ended_at,
            station (
              name,
              zone_id
            )
          )
        `)
        .eq('role', 'facilitateur')
        .eq('is_active', true);

      if (facilitatorsError) throw facilitatorsError;

      // Récupérer les stations supervisées
      const { data: stationsData, error: stationsError } = await supabase
        .from('station')
        .select(`
          id,
          name,
          description,
          activity (
            requires_facilitator
          ),
          occupation (
            status
          )
        `)
        .eq('is_active', true);

      if (stationsError) throw stationsError;

      setFacilitators(facilitatorsData || []);
      setStations(stationsData?.filter(s => s.activity?.requires_facilitator) || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignFacilitator = async (facilitatorId: string, stationId: string) => {
    try {
      const { error } = await supabase
        .from('presence')
        .insert({
          staff_id: facilitatorId,
          station_id: stationId,
          started_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Affectation réussie",
        description: "Facilitateur affecté à la station",
      });
      
      fetchData(); // Rafraîchir les données
    } catch (error) {
      console.error('Erreur affectation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'affecter le facilitateur",
        variant: "destructive",
      });
    }
  };

  const releaseFacilitator = async (presenceId: string) => {
    try {
      const { error } = await supabase
        .from('presence')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', presenceId);

      if (error) throw error;

      toast({
        title: "Libération réussie",
        description: "Facilitateur libéré de son poste",
      });
      
      fetchData();
    } catch (error) {
      console.error('Erreur libération:', error);
      toast({
        title: "Erreur",
        description: "Impossible de libérer le facilitateur",
        variant: "destructive",
      });
    }
  };

  const toggleStationStatus = async (stationId: string, newStatus: 'libre' | 'fermee') => {
    try {
      const { error } = await supabase
        .from('occupation')
        .update({ status: newStatus })
        .eq('station_id', stationId);

      if (error) throw error;

      toast({
        title: "Statut modifié",
        description: `Station ${newStatus === 'fermee' ? 'fermée' : 'ouverte'}`,
      });
      
      fetchData();
    } catch (error) {
      console.error('Erreur modification statut:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      });
    }
  };

  const getActiveFacilitators = () => {
    return facilitators.filter(f => 
      f.presence?.some(p => p.ended_at === null)
    );
  };

  const getAvailableFacilitators = () => {
    return facilitators.filter(f => 
      !f.presence?.some(p => p.ended_at === null)
    );
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
        <div>
          <h1 className="text-3xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
            Gestion Facilitateurs
          </h1>
          <p className="text-muted-foreground mt-1">
            Répartition et supervision des stations supervisées
          </p>
        </div>

        {/* Vue d'ensemble */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-ocean-primary">
                {getActiveFacilitators().length}
              </div>
              <div className="text-sm text-muted-foreground">En poste</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-status-libre">
                {getAvailableFacilitators().length}
              </div>
              <div className="text-sm text-muted-foreground">Disponibles</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-coral">
                {stations.filter(s => s.occupation?.status === 'fermee').length}
              </div>
              <div className="text-sm text-muted-foreground">Fermées</div>
            </CardContent>
          </Card>
          <Card className={getActiveFacilitators().length >= 4 ? "border-coral/30 bg-coral/10" : ""}>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${getActiveFacilitators().length >= 4 ? "text-coral" : "text-or"}`}>
                {getActiveFacilitators().length}/4
              </div>
              <div className="text-sm text-muted-foreground">Limite supervisées</div>
            </CardContent>
          </Card>
        </div>

        {/* Alerte limite atteinte */}
        {getActiveFacilitators().length >= 4 && (
          <Card className="border-coral/30 bg-coral/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-coral">
                <Clock className="w-5 h-5" />
                <span className="font-medium">
                  Limite de 4 stations supervisées atteinte - Nouvelles affectations limitées
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Facilitateurs actifs */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-ocean-deep">
            Facilitateurs en poste
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getActiveFacilitators().map((facilitator) => {
              const activePresence = facilitator.presence?.find(p => p.ended_at === null);
              
              return (
                <Card key={facilitator.id} className="border-ocean-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-status-libre" />
                        {facilitator.name}
                      </CardTitle>
                      <Badge variant="secondary" className="bg-status-libre/20 text-status-libre">
                        En poste
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {activePresence && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {activePresence.station.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          Depuis {new Date(activePresence.started_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => activePresence && releaseFacilitator(activePresence.id)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Libérer du poste
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {getActiveFacilitators().length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Aucun facilitateur actuellement en poste
              </CardContent>
            </Card>
          )}
        </div>

        {/* Affectations disponibles */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-ocean-deep">
            Stations supervisées
          </h2>
          
          <div className="space-y-4">
            {stations.map((station) => {
              const isOccupied = station.occupation?.status === 'occupee';
              const isClosed = station.occupation?.status === 'fermee';
              
              return (
                <Card key={station.id} className={`${
                  isClosed ? 'border-coral/20 bg-coral/5' : 
                  isOccupied ? 'border-status-occupee/20 bg-status-occupee/5' : 
                  'border-status-libre/20 bg-status-libre/5'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-medium text-ocean-deep">
                            {station.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {station.description}
                          </p>
                        </div>
                        
                        <Badge variant="outline" className={
                          isClosed ? 'text-coral border-coral/30' :
                          isOccupied ? 'text-status-occupee border-status-occupee/30' :
                          'text-status-libre border-status-libre/30'
                        }>
                          {isClosed ? 'Fermée' : isOccupied ? 'Occupée' : 'Libre'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Toggle station status */}
                        <Button
                          onClick={() => toggleStationStatus(
                            station.id, 
                            isClosed ? 'libre' : 'fermee'
                          )}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          {isClosed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          {isClosed ? 'Ouvrir' : 'Fermer'}
                        </Button>
                        
                        {/* Assign facilitator */}
                        {!isOccupied && !isClosed && getAvailableFacilitators().length > 0 && getActiveFacilitators().length < 4 && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                assignFacilitator(e.target.value, station.id);
                                e.target.value = '';
                              }
                            }}
                            className="px-3 py-2 border rounded-md text-sm"
                          >
                            <option value="">Affecter facilitateur</option>
                            {getAvailableFacilitators().map((facilitator) => (
                              <option key={facilitator.id} value={facilitator.id}>
                                {facilitator.name}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Message si limite atteinte */}
                        {!isOccupied && !isClosed && getActiveFacilitators().length >= 4 && (
                          <Badge variant="outline" className="text-coral border-coral/30">
                            Limite atteinte (4/4)
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Facilitateurs disponibles */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-ocean-deep">
            Facilitateurs disponibles ({getAvailableFacilitators().length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getAvailableFacilitators().map((facilitator) => (
              <Card key={facilitator.id}>
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-ocean-primary mx-auto mb-2" />
                  <div className="font-medium text-ocean-deep">
                    {facilitator.name}
                  </div>
                  <Badge variant="outline" className="mt-2">
                    Disponible
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {getAvailableFacilitators().length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Tous les facilitateurs sont actuellement affectés
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </BiancottoLayout>
  );
}