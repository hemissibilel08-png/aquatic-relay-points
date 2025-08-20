import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Trophy, Target, CheckCircle, Timer, Zap, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSessionCentre } from "@/hooks/useSessionCentre";
import { useActiveEvent } from "@/hooks/useActiveEvent";

interface ActivityData {
  id: string;
  name: string;
  type: string;
  family?: string;
  default_points: number;
  requires_facilitator: boolean;
  thresholds_elem?: any;
  thresholds_mat?: any;
}

interface ScoreEntryProps {
  stationId: string;
  activity: ActivityData;
  onScoreSubmitted?: () => void;
}

export function ScoreEntry({ stationId, activity, onScoreSubmitted }: ScoreEntryProps) {
  const [result, setResult] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [calculatedPoints, setCalculatedPoints] = useState<number | null>(null);
  const { toast } = useToast();
  const { sessionCentre } = useSessionCentre();
  const { activeEvent } = useActiveEvent();

  // Calculer les points en temps réel
  const calculatePreviewPoints = async (resultValue: string) => {
    if (!resultValue || !activeEvent) return;

    try {
      const { data, error } = await supabase.rpc('calculate_activity_points', {
        activity_type: 'activite',
        activity_family: activity.family,
        raw_result: resultValue,
        thresholds_elem: activity.thresholds_elem,
        thresholds_mat: activity.thresholds_mat,
        centre_profile: sessionCentre.profil || 'elementaire',
        is_co_validated: activity.requires_facilitator,
        hint_used: false,
        attempt_count: 1
      });

      if (error) throw error;
      
      if (data && typeof data === 'object' && 'total' in data) {
        setCalculatedPoints(data.total as number);
      }
    } catch (error) {
      console.error('Erreur calcul points:', error);
    }
  };

  const handleResultChange = (value: string) => {
    setResult(value);
    if (value.trim()) {
      calculatePreviewPoints(value);
    } else {
      setCalculatedPoints(null);
    }
  };

  const submitScore = async () => {
    if (!result.trim()) {
      toast({
        title: "Résultat manquant",
        description: "Veuillez saisir un résultat avant de soumettre",
        variant: "destructive",
      });
      return;
    }

    if (!sessionCentre.centre_id || !activeEvent) {
      toast({
        title: "Erreur de session",
        description: "Session ou événement non trouvé",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Calculer les points finaux
      const { data: pointsData, error: pointsError } = await supabase.rpc('calculate_activity_points', {
        activity_type: 'activite',
        activity_family: activity.family,
        raw_result: result,
        thresholds_elem: activity.thresholds_elem,
        thresholds_mat: activity.thresholds_mat,
        centre_profile: sessionCentre.profil || 'elementaire',
        is_co_validated: activity.requires_facilitator,
        hint_used: false,
        attempt_count: 1
      });

      if (pointsError) throw pointsError;

      const finalPoints = (pointsData && typeof pointsData === 'object' && 'total' in pointsData) ? pointsData.total as number : activity.default_points;

      // Créer l'enregistrement de tentative
      const { data: attemptData, error: attemptError } = await supabase
        .from('attempt')
        .insert({
          activity_id: activity.id,
          centre_id: sessionCentre.centre_id,
          group_id: null, // TODO: récupérer l'ID du groupe si nécessaire
          event_id: activeEvent.id,
          raw_result: result,
          points: finalPoints,
          photo_url: null, // TODO: gérer l'upload de photo
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString()
        })
        .select()
        .single();

      if (attemptError) throw attemptError;

      setSuccess(true);
      setCalculatedPoints(finalPoints);

      toast({
        title: "Score enregistré !",
        description: `Vous avez gagné ${finalPoints} points`,
      });

      setTimeout(() => {
        onScoreSubmitted?.();
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de la soumission du score:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le score",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getFamilyIcon = (family?: string) => {
    switch (family) {
      case 'precision': return Target;
      case 'endurance': return Timer;
      case 'lance': return Zap;
      case 'coop': return Users;
      default: return Trophy;
    }
  };

  const getFamilyLabel = (family?: string) => {
    switch (family) {
      case 'precision': return 'Précision';
      case 'endurance': return 'Endurance';
      case 'lance': return 'Lancer';
      case 'coop': return 'Coopération';
      default: return 'Activité';
    }
  };

  if (!sessionCentre.centre_id) {
    return (
      <Alert>
        <AlertDescription>
          Vous devez sélectionner un groupe pour participer aux activités.
        </AlertDescription>
      </Alert>
    );
  }

  if (success) {
    return (
      <Card className="bg-gradient-to-br from-status-libre/20 to-foam">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-16 h-16 text-status-libre mx-auto mb-4" />
          <h3 className="text-xl font-bold text-ocean-deep mb-2">
            Score enregistré !
          </h3>
          <p className="text-muted-foreground mb-4">
            Votre performance a été sauvegardée avec succès
          </p>
          <Badge className="text-lg font-bold bg-gradient-ocean">
            +{calculatedPoints} points
          </Badge>
        </CardContent>
      </Card>
    );
  }

  const FamilyIcon = getFamilyIcon(activity.family);
  const familyLabel = getFamilyLabel(activity.family);

  return (
    <div className="space-y-4">
      {/* Informations activité */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FamilyIcon className="w-5 h-5 text-ocean-primary" />
            {familyLabel}
          </CardTitle>
          <CardDescription>
            Saisissez votre résultat pour cette activité
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Formulaire de saisie */}
      <Card>
        <CardHeader>
          <CardTitle>Enregistrer votre performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="result">
              Résultat *
              {activity.family === 'precision' && (
                <span className="text-xs text-muted-foreground ml-2">
                  (distance en cm ou temps en secondes)
                </span>
              )}
              {activity.family === 'lance' && (
                <span className="text-xs text-muted-foreground ml-2">
                  (distance en mètres)
                </span>
              )}
              {activity.family === 'endurance' && (
                <span className="text-xs text-muted-foreground ml-2">
                  (temps en secondes)
                </span>
              )}
              {activity.family === 'coop' && (
                <span className="text-xs text-muted-foreground ml-2">
                  (score sur 100)
                </span>
              )}
            </Label>
            <Input
              id="result"
              type="number"
              step="0.01"
              placeholder="Ex: 1.50"
              value={result}
              onChange={(e) => handleResultChange(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Commentaires, observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              rows={2}
            />
          </div>

          {/* Photo (pour plus tard) */}
          <div>
            <Label>Photo (bientôt disponible)</Label>
            <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center text-muted-foreground">
              <Camera className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm">Fonctionnalité à venir</span>
            </div>
          </div>

          {/* Aperçu des points */}
          {calculatedPoints !== null && (
            <Alert>
              <Trophy className="w-4 h-4" />
              <AlertDescription>
                Points estimés : <strong>{calculatedPoints} points</strong>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={submitScore}
            disabled={submitting || !result.trim()}
            className="w-full bg-gradient-ocean hover:bg-gradient-ocean/90"
          >
            {submitting ? 'Enregistrement...' : 'Enregistrer le score'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}