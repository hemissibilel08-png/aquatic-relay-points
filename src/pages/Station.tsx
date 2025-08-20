import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, QrCode, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BiancottoLayout } from "@/components/BiancottoLayout";
import { ReservationSystem } from "@/components/ReservationSystem";
import { ActivityManager } from "@/components/ActivityManager";
import { QrCameraScanner } from "@/components/QrCameraScanner";
import { useSessionCentre } from "@/hooks/useSessionCentre";

interface StationData {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  zone: {
    id: string;
    name: string;
  };
  occupation: {
    status: 'libre' | 'occupee' | 'reservee';
    by_centre_id?: string;
    since: string;
  } | null;
  activity?: {
    id: string;
    name: string;
    description?: string;
    type: string;
    family?: string;
    default_points: number;
    requires_facilitator: boolean;
    thresholds_elem?: any;
    thresholds_mat?: any;
  };
  riddle?: {
    id: string;
    question: string;
    hint_text?: string;
    points_base: number;
    hint_malus_elem: number;
    hint_malus_mat: number;
    station_id: string;
  };
}

export default function Station() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [station, setStation] = useState<StationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const { toast } = useToast();
  const { sessionCentre } = useSessionCentre();

  useEffect(() => {
    if (id) {
      fetchStation();
    } else {
      setShowQRScanner(true);
    }
  }, [id]);

  const fetchStation = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Récupérer les données de la station avec ses relations
      const { data: stationData, error: stationError } = await supabase
        .from('station')
        .select(`
          id,
          name,
          description,
          image_url,
          zone:zone_id (
            id,
            name
          ),
          activity:activity_id (
            id,
            name,
            description,
            type,
            family,
            default_points,
            requires_facilitator,
            thresholds_elem,
            thresholds_mat
          )
        `)
        .eq('id', id)
        .single();

      if (stationError) throw stationError;

      // Récupérer l'occupation actuelle
      const { data: occupationData, error: occupationError } = await supabase
        .from('occupation')
        .select('status, by_centre_id, since')
        .eq('station_id', id)
        .single();

      // Récupérer l'énigme si elle existe
      const { data: riddleData, error: riddleError } = await supabase
        .from('riddle')
        .select('id, question, hint_text, points_base, hint_malus_elem, hint_malus_mat, station_id')
        .eq('station_id', id)
        .eq('is_active', true)
        .maybeSingle();

      const stationWithData: StationData = {
        ...stationData,
        occupation: occupationData || null,
        riddle: riddleData || undefined
      };

      setStation(stationWithData);

    } catch (error) {
      console.error('Erreur lors du chargement de la station:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de la station",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = (stationId: string) => {
    navigate(`/station/${stationId}`);
    setShowQRScanner(false);
  };

  if (showQRScanner) {
    return (
      <BiancottoLayout>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Scanner une Station
              </CardTitle>
              <CardDescription>
                Pointez votre caméra vers le QR code de la station
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QrCameraScanner />
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/stations')}
                >
                  Voir toutes les stations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </BiancottoLayout>
    );
  }

  if (loading) {
    return (
      <BiancottoLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-primary"></div>
        </div>
      </BiancottoLayout>
    );
  }

  if (!station) {
    return (
      <BiancottoLayout>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Station non trouvée
            </h3>
            <p className="text-muted-foreground mb-4">
              La station demandée n'existe pas ou n'est pas disponible
            </p>
            <Button onClick={() => navigate('/stations')}>
              Retour aux stations
            </Button>
          </CardContent>
        </Card>
      </BiancottoLayout>
    );
  }

  return (
    <BiancottoLayout>
      <div className="space-y-6">
        {/* En-tête de la station */}
        <Card className="bg-gradient-to-r from-ocean-primary/10 via-turquoise/10 to-foam">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl text-ocean-deep mb-2">
                  {station.name}
                </CardTitle>
                <CardDescription className="text-base">
                  {station.description || 'Station d\'activité maritime'}
                </CardDescription>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {station.zone.name}
                  </Badge>
                  {station.activity && (
                    <Badge variant="secondary">
                      {station.activity.family || station.activity.type}
                    </Badge>
                  )}
                  {station.riddle && (
                    <Badge variant="secondary" className="bg-coral/20 text-coral">
                      Énigme disponible
                    </Badge>
                  )}
                </div>
              </div>
              {station.image_url && (
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-wave/20">
                  <img 
                    src={station.image_url} 
                    alt={station.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Avertissement session */}
        {!sessionCentre.centre_id && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-900">
                    Sélectionnez votre groupe
                  </p>
                  <p className="text-orange-800 text-sm">
                    Vous devez choisir un groupe pour participer aux activités et voir les options de réservation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Système de réservation */}
        <ReservationSystem
          stationId={station.id}
          stationName={station.name}
          currentStatus={(station.occupation?.status as 'libre' | 'occupee' | 'fermee') || 'libre'}
          onStatusChange={fetchStation}
        />

        {/* Gestionnaire d'activités */}
        <ActivityManager
          stationId={station.id}
          stationName={station.name}
          activity={station.activity}
          riddle={station.riddle}
          onActivityComplete={fetchStation}
        />

        {/* Navigation */}
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/stations')}
            className="flex-1"
          >
            Toutes les stations
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowQRScanner(true)}
            className="flex-1"
          >
            Scanner une autre station
          </Button>
        </div>
      </div>
    </BiancottoLayout>
  );
}