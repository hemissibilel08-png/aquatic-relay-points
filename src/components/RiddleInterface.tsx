import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Lightbulb, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSessionCentre } from "@/hooks/useSessionCentre";
import { useActiveEvent } from "@/hooks/useActiveEvent";

interface RiddleData {
  id: string;
  question: string;
  hint_text?: string;
  points_base: number;
  hint_malus_elem: number;
  hint_malus_mat: number;
  station_id: string;
}

interface RiddleInterfaceProps {
  riddle: RiddleData;
  onRiddleComplete?: () => void;
}

export function RiddleInterface({ riddle, onRiddleComplete }: RiddleInterfaceProps) {
  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; points: number } | null>(null);
  const { toast } = useToast();
  const { sessionCentre } = useSessionCentre();
  const { activeEvent } = useActiveEvent();

  const handleHintClick = () => {
    setShowHint(true);
  };

  const submitRiddle = async () => {
    if (!answer.trim()) {
      toast({
        title: "Réponse manquante",
        description: "Veuillez saisir une réponse avant de valider",
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
      setAttemptCount(prev => prev + 1);

      // Vérifier la réponse via la fonction edge
      const { data, error } = await supabase.functions.invoke('verify-riddle', {
        body: {
          riddle_id: riddle.id,
          answer: answer.trim(),
          centre_id: sessionCentre.centre_id,
          group_id: sessionCentre.group_label, // Si vous avez l'ID du groupe
          event_id: activeEvent.id,
          hint_used: showHint,
          centre_profile: sessionCentre.profil || 'elementaire'
        }
      });

      if (error) throw error;

      const response = data;
      
      if (response.correct) {
        setResult({
          success: true,
          message: response.message || 'Bravo ! Réponse correcte !',
          points: response.points || 0
        });
        
        toast({
          title: "Énigme résolue !",
          description: `Félicitations ! Vous avez gagné ${response.points} points`,
        });

        setTimeout(() => {
          onRiddleComplete?.();
        }, 3000);
      } else {
        setResult({
          success: false,
          message: response.message || 'Réponse incorrecte, essayez encore',
          points: 0
        });
        
        toast({
          title: "Réponse incorrecte",
          description: response.message || "Essayez encore !",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Erreur lors de la soumission de l\'énigme:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier la réponse",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (result?.success) {
    return (
      <Card className="bg-gradient-to-br from-status-libre/20 to-foam">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-16 h-16 text-status-libre mx-auto mb-4" />
          <h3 className="text-xl font-bold text-ocean-deep mb-2">
            Énigme résolue !
          </h3>
          <p className="text-muted-foreground mb-4">
            {result.message}
          </p>
          <Badge className="text-lg font-bold bg-gradient-ocean">
            +{result.points} points
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-ocean-deep">
            Question
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed">
            {riddle.question}
          </p>
        </CardContent>
      </Card>

      {/* Zone de réponse */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-ocean-deep">
            Votre réponse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="answer">Réponse</Label>
            <Input
              id="answer"
              type="text"
              placeholder="Tapez votre réponse ici..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !submitting) {
                  submitRiddle();
                }
              }}
              disabled={submitting}
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={submitRiddle}
              disabled={submitting || !answer.trim()}
              className="flex-1 bg-gradient-ocean hover:bg-gradient-ocean/90"
            >
              {submitting ? 'Vérification...' : 'Valider la réponse'}
            </Button>
            
            {riddle.hint_text && !showHint && (
              <Button
                variant="outline"
                onClick={handleHintClick}
                className="flex items-center gap-2"
              >
                <Lightbulb className="w-4 h-4" />
                Indice
              </Button>
            )}
          </div>

          {/* Affichage de l'indice */}
          {showHint && riddle.hint_text && (
            <Alert>
              <Lightbulb className="w-4 h-4" />
              <AlertDescription>
                <strong>Indice :</strong> {riddle.hint_text}
                <br />
                <span className="text-xs text-muted-foreground">
                  Utiliser un indice réduit les points gagnés
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Résultat de la tentative */}
          {result && !result.success && (
            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertDescription>
                {result.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Information sur les tentatives */}
          {attemptCount > 0 && (
            <div className="text-xs text-muted-foreground">
              Tentatives : {attemptCount}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info points */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span>Points possibles :</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Sans indice: {riddle.points_base}pts
              </Badge>
              {riddle.hint_text && (
                <Badge variant="outline">
                  Avec indice: {riddle.points_base + (sessionCentre.profil === 'maternelle' ? riddle.hint_malus_mat : riddle.hint_malus_elem)}pts
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}