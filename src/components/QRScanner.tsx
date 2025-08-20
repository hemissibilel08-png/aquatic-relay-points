import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Camera, MapPin, Activity, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BiancottoLayout } from "@/components/BiancottoLayout";

interface StationWithOccupation {
  id: string;
  name: string;
  description: string;
  qr_code: string;
  zone_name: string;
  activity_name: string;
  activity_type: string;
  requires_facilitator: boolean;
  occupation_status: 'libre' | 'occupee' | 'fermee';
  occupied_by: string | null;
}

export function QRScanner() {
  const [stations, setStations] = useState<StationWithOccupation[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualQR, setManualQR] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const { data, error } = await supabase
        .from('station')
        .select(`
          id,
          name,
          description,
          qr_code,
          zone:zone_id (
            name
          ),
          activity:activity_id (
            name,
            type,
            requires_facilitator
          ),
          occupation!station_id (
            status,
            by_centre_id,
            centre:by_centre_id (
              name
            )
          )
        `)
        .eq('is_active', true);

      if (error) throw error;

      const transformedData: StationWithOccupation[] = data.map((station: any) => ({
        id: station.id,
        name: station.name,
        description: station.description,
        qr_code: station.qr_code,
        zone_name: station.zone?.name || 'Zone inconnue',
        activity_name: station.activity?.name || 'Aucune activité',
        activity_type: station.activity?.type || 'inconnu',
        requires_facilitator: station.activity?.requires_facilitator || false,
        occupation_status: station.occupation?.[0]?.status || 'libre',
        occupied_by: station.occupation?.[0]?.centre?.name || null
      }));

      setStations(transformedData);
    } catch (error) {
      console.error('Erreur chargement stations:', error);
      toast.toast({
        title: "Erreur",
        description: "Impossible de charger les stations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStationAccess = (stationId: string, qrCode: string) => {
    // Simuler le scan du QR code
    if (qrCode) {
      navigate(`/station/${stationId}`);
    }
  };

  const handleManualQR = () => {
    if (!manualQR.trim()) return;
    
    // Recherche de la station par QR code
    const station = stations.find(s => s.qr_code.toLowerCase() === manualQR.toLowerCase());
    if (station) {
      navigate(`/station/${station.id}`);
    } else {
      toast.toast({
        title: "QR Code invalide",
        description: "Ce QR code ne correspond à aucune station",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'libre': return 'bg-status-libre text-white';
      case 'occupee': return 'bg-status-occupee text-white';
      case 'fermee': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'libre': return 'Libre';
      case 'occupee': return 'Occupée';
      case 'fermee': return 'Fermée';
      default: return 'Inconnue';
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
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-foam" />
          </div>
          <h1 className="text-2xl font-bold text-ocean-deep mb-2">
            Scanner une Station
          </h1>
          <p className="text-muted-foreground">
            Choisissez une station ou scannez son QR code
          </p>
        </div>

        {/* Saisie manuelle QR */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              QR Code Manuel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="qr">Code QR de la station</Label>
                <Input
                  id="qr"
                  placeholder="Ex: QR_STATION_CECIFOOT_001"
                  value={manualQR}
                  onChange={(e) => setManualQR(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualQR()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleManualQR} disabled={!manualQR.trim()}>
                  Scanner
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des stations */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ocean-deep flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Stations Disponibles
          </h2>
          
          <div className="grid gap-4">
            {stations.map((station) => (
              <Card key={station.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-ocean rounded-lg flex items-center justify-center">
                          <Activity className="w-5 h-5 text-foam" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-ocean-deep">{station.name}</h3>
                          <p className="text-sm text-muted-foreground">{station.zone_name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {station.activity_name}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {station.activity_type}
                        </Badge>
                        {station.requires_facilitator && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Supervisée
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {station.description}
                      </p>
                      
                      {station.occupied_by && (
                        <p className="text-sm text-status-occupee mt-1">
                          Occupée par {station.occupied_by}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <Badge className={getStatusColor(station.occupation_status)}>
                        {getStatusText(station.occupation_status)}
                      </Badge>
                      
                      <Button
                        onClick={() => handleStationAccess(station.id, station.qr_code)}
                        disabled={station.occupation_status === 'fermee'}
                        size="sm"
                        className={
                          station.occupation_status === 'libre' 
                            ? 'bg-gradient-ocean' 
                            : station.occupation_status === 'occupee'
                            ? 'bg-status-occupee hover:bg-status-occupee/90'
                            : ''
                        }
                      >
                        {station.occupation_status === 'libre' 
                          ? "J'y suis !" 
                          : station.occupation_status === 'occupee'
                          ? "Voir détails"
                          : "Fermée"
                        }
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </BiancottoLayout>
  );
}