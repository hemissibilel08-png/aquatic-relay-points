import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSessionCentre } from "@/hooks/useSessionCentre";

interface ReservationSystemProps {
  stationId: string;
  stationName: string;
  currentStatus: 'libre' | 'occupee' | 'fermee';
  onStatusChange?: () => void;
}

export function ReservationSystem({ 
  stationId, 
  stationName, 
  currentStatus, 
  onStatusChange 
}: ReservationSystemProps) {
  const [isReserving, setIsReserving] = useState(false);
  const [isOccupying, setIsOccupying] = useState(false);
  const { toast } = useToast();
  const { sessionCentre } = useSessionCentre();

  const handleReserve = async () => {
    if (!sessionCentre.centre_id) {
      toast({
        title: "Session requise",
        description: "Veuillez sélectionner un groupe avant de réserver",
        variant: "destructive",
      });
      return;
    }

    setIsReserving(true);
    try {
      // Mettre en file d'attente
      const { error } = await supabase
        .from('occupation')
        .update({ 
          queue_centre_id: sessionCentre.centre_id,
          since: new Date().toISOString()
        })
        .eq('station_id', stationId);

      if (error) throw error;

      toast({
        title: "Réservation effectuée 🎯",
        description: `Vous êtes en file d'attente pour ${stationName}`,
      });
      
      onStatusChange?.();
    } catch (error) {
      console.error('Erreur réservation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de réserver la station",
        variant: "destructive",
      });
    } finally {
      setIsReserving(false);
    }
  };

  const handleOccupy = async () => {
    if (!sessionCentre.centre_id) {
      toast({
        title: "Session requise",
        description: "Veuillez sélectionner un groupe avant d'occuper",
        variant: "destructive",
      });
      return;
    }

    setIsOccupying(true);
    try {
      // Utiliser la fonction RPC pour l'occupation atomique
      const { data, error } = await supabase.rpc('start_occupation', {
        p_station_id: stationId,
        p_centre_id: sessionCentre.centre_id
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        toast({
          title: "Station occupée ! 🌊",
          description: `${stationName} est maintenant occupée par votre groupe`,
        });
        onStatusChange?.();
      } else if (result?.error === 'collision') {
        toast({
          title: "Station occupée",
          description: `Cette station est déjà occupée par ${result.occupied_by}`,
          variant: "destructive",
        });
      } else if (result?.error === 'needs_facilitator') {
        toast({
          title: "Facilitateur requis",
          description: "Cette activité nécessite la présence d'un facilitateur",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur occupation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'occuper la station",
        variant: "destructive",
      });
    } finally {
      setIsOccupying(false);
    }
  };

  const handleRelease = async () => {
    try {
      const { data, error } = await supabase.rpc('finish_occupation', {
        p_station_id: stationId
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        toast({
          title: "Station libérée 📤",
          description: `${stationName} est maintenant disponible`,
        });
        onStatusChange?.();
      }
    } catch (error) {
      console.error('Erreur libération:', error);
      toast({
        title: "Erreur",
        description: "Impossible de libérer la station",
        variant: "destructive",
      });
    }
  };

  const getStatusInfo = () => {
    switch (currentStatus) {
      case 'libre':
        return {
          color: 'status-libre',
          label: 'Libre',
          icon: CheckCircle,
          description: 'Station disponible'
        };
      case 'occupee':
        return {
          color: 'status-occupee',
          label: 'Occupée',
          icon: Users,
          description: 'Station en cours d\'utilisation'
        };
      case 'fermee':
        return {
          color: 'status-fermee',
          label: 'Fermée',
          icon: AlertCircle,
          description: 'Station temporairement fermée'
        };
      default:
        return {
          color: 'status-libre',
          label: 'Inconnu',
          icon: AlertCircle,
          description: 'Statut inconnu'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-ocean-deep">
            Réservation - {stationName}
          </CardTitle>
          <Badge 
            variant="secondary" 
            className={`bg-${statusInfo.color}/20 text-${statusInfo.color} border-${statusInfo.color}/30`}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {statusInfo.description}
        </p>

        <div className="flex gap-2">
          {currentStatus === 'libre' && (
            <>
              <Button 
                onClick={handleOccupy}
                disabled={isOccupying || !sessionCentre.centre_id}
                className="flex-1 bg-gradient-ocean hover:shadow-soft transition-all"
                size="sm"
              >
                <Users className="w-4 h-4 mr-1" />
                {isOccupying ? "Occupation..." : "J'y suis !"}
              </Button>
              
              <Button 
                onClick={handleReserve}
                disabled={isReserving || !sessionCentre.centre_id}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <Clock className="w-4 h-4 mr-1" />
                {isReserving ? "Réservation..." : "Réserver"}
              </Button>
            </>
          )}

          {currentStatus === 'occupee' && sessionCentre.centre_id && (
            <Button 
              onClick={handleRelease}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Libérer la station
            </Button>
          )}

          {currentStatus === 'fermee' && (
            <Button disabled size="sm" className="w-full">
              Station fermée
            </Button>
          )}
        </div>

        {!sessionCentre.centre_id && (
          <p className="text-xs text-muted-foreground text-center">
            Sélectionnez un groupe dans "Mon Centre" pour utiliser les stations
          </p>
        )}
      </CardContent>
    </Card>
  );
}