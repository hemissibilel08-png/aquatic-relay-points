import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trophy, Camera, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSessionCentre } from "@/hooks/useSessionCentre";

interface ScoreEntryProps {
  stationId: string;
  activity: {
    id: string;
    name: string;
    type: string;
    default_points: number;
    thresholds_elem: any;
    thresholds_mat: any;
  };
  onScoreSubmitted?: () => void;
}

export function ScoreEntry({ stationId, activity, onScoreSubmitted }: ScoreEntryProps) {
  const [result, setResult] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { sessionCentre, isSessionActive } = useSessionCentre();

  const calculatePoints = async (result: string): Promise<number> => {
    if (!result) return activity.default_points;
    
    try {
      const { data, error } = await supabase.rpc('calculate_activity_points', {
        activity_type: activity.type === 'supervisee' ? 'activite' : 'activite',
        activity_family: 'precision',
        raw_result: result,
        thresholds_elem: activity.thresholds_elem,
        thresholds_mat: activity.thresholds_mat,
        centre_profile: sessionCentre.profil,
        is_co_validated: activity.type === 'supervisee',
        hint_used: false,
        attempt_count: 1
      });

      if (error) throw error;
      return (data as any)?.total || activity.default_points;
    } catch (error) {
      console.error('Erreur calcul points:', error);
      return activity.default_points;
    }
  };

  const getCurrentEvent = async () => {
    const { data, error } = await supabase
      .from('event')
      .select('id')
      .eq('is_active', true)
      .maybeSingle();
    
    if (error) throw error;
    return data?.id;
  };

  const submitScore = async () => {
    if (!isSessionActive() || !result) return;
    
    setSubmitting(true);
    
    try {
      // 1. Obtenir l'événement actuel
      const eventId = await getCurrentEvent();
      if (!eventId) {
        throw new Error('Aucun événement actif');
      }

      // 2. Calculer les points
      const points = await calculatePoints(result);
      
      // 3. Enregistrer la tentative
      const { data: attemptData, error } = await supabase
        .from('attempt')
        .insert({
          activity_id: activity.id,
          centre_id: sessionCentre.centre_id!,
          group_id: null,
          event_id: eventId,
          raw_result: result,
          points: points,
          photo_url: null,
          ended_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Score enregistré ! 🎉",
        description: `+${points} points pour ${sessionCentre.group_label || 'votre groupe'} !`,
      });
      
      // Reset form
      setResult('');
      setNotes('');
      setPhoto(null);
      
      onScoreSubmitted?.();
      
    } catch (error) {
      console.error('Erreur soumission score:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'enregistrer le score",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSessionActive()) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-4">
          <p className="text-destructive">
            Vous devez sélectionner un centre et un groupe pour enregistrer des scores.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-ocean-deep">
          <Trophy className="w-5 h-5 text-or" />
          Enregistrer un score - {activity.name}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{activity.type}</Badge>
          <Badge variant="secondary">{activity.default_points} points de base</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="result">Résultat *</Label>
          <Input
            id="result"
            type="number"
            step="0.01"
            placeholder="Entrez le résultat (ex: 15.5)"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optionnel)</Label>
          <Textarea
            id="notes"
            placeholder="Commentaires ou observations..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="space-y-2">
          <Label>Photo (optionnel)</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Cliquez pour ajouter une photo
            </p>
          </div>
        </div>

        {result && (
          <div className="p-4 bg-ocean-light/10 rounded-lg">
            <p className="text-sm text-ocean-primary">
              Points estimés: Calcul en cours...
            </p>
          </div>
        )}

        <Button 
          onClick={submitScore}
          disabled={!result || submitting}
          className="w-full bg-gradient-ocean hover:shadow-soft transition-all"
          size="lg"
        >
          <Trophy className="w-4 h-4 mr-2" />
          {submitting ? "Enregistrement..." : "Enregistrer le score"}
        </Button>
      </CardContent>
    </Card>
  );
}