import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle, Brain, Lightbulb, Award, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BiancottoLayout } from "@/components/BiancottoLayout";
import { useUserCentre } from "@/hooks/useUserCentre";

interface Riddle {
  id: string;
  question: string;
  solution: string;
  hint_text: string;
  points_base: number;
  hint_malus_elem: number;
  hint_malus_mat: number;
  is_active: boolean;
  station?: {
    id: string;
    name: string;
  };
}

export default function Enigmes() {
  const [riddles, setRiddles] = useState<Riddle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRiddle, setSelectedRiddle] = useState<Riddle | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const { toast } = useToast();
  const { userCentre, canManageActivities } = useUserCentre();

  useEffect(() => {
    fetchRiddles();
  }, []);

  const fetchRiddles = async () => {
    try {
      const { data, error } = await supabase
        .from('riddle')
        .select(`
          *,
          station (id, name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRiddles(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des énigmes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les énigmes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (riddle: Riddle) => {
    if (!userAnswer.trim()) {
      toast({
        title: "Réponse manquante",
        description: "Veuillez saisir une réponse",
        variant: "destructive",
      });
      return;
    }

    const isCorrect = userAnswer.toLowerCase().trim() === riddle.solution.toLowerCase().trim();
    
    try {
      // Calculer les points
      let points = riddle.points_base;
      if (hintUsed) {
        const malus = userCentre.centre_profile === 'maternelle' 
          ? riddle.hint_malus_mat 
          : riddle.hint_malus_elem;
        points = Math.max(0, points + malus); // malus est négatif
      }

      // Enregistrer la réponse
      const { error } = await supabase.from('riddle_answer').insert({
        riddle_id: riddle.id,
        centre_id: userCentre.centre_id,
        group_id: null, // À définir selon la logique métier
        answer_text: userAnswer,
        correct: isCorrect,
        hint_used: hintUsed,
        points: isCorrect ? points : 0,
        event_id: '00000000-0000-0000-0000-000000000000' // À récupérer de l'événement actif
      });

      if (error) throw error;

      toast({
        title: isCorrect ? "Bonne réponse!" : "Mauvaise réponse",
        description: isCorrect 
          ? `Bravo! Vous gagnez ${points} points` 
          : "Réessayez ou demandez un indice",
        variant: isCorrect ? "default" : "destructive",
      });

      if (isCorrect) {
        setSelectedRiddle(null);
        setUserAnswer('');
        setHintUsed(false);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la réponse",
        variant: "destructive",
      });
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
              Énigmes Marines
            </h1>
            <p className="text-muted-foreground mt-1">
              Résolvez les énigmes pour gagner des points bonus
            </p>
          </div>

          {canManageActivities() && (
            <Button className="bg-gradient-ocean hover:shadow-medium transition-all">
              <Brain className="w-4 h-4 mr-2" />
              Nouvelle Énigme
            </Button>
          )}
        </div>

        {selectedRiddle ? (
          <Card className="shadow-soft max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-ocean-primary" />
                Énigme en cours
              </CardTitle>
              <CardDescription>
                Station: {selectedRiddle.station?.name || 'Énigme générale'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-lg font-medium">{selectedRiddle.question}</p>
              </div>

              {hintUsed && selectedRiddle.hint_text && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Indice</span>
                  </div>
                  <p className="text-amber-700">{selectedRiddle.hint_text}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Votre réponse</label>
                <Input
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Tapez votre réponse..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAnswerSubmit(selectedRiddle)}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  {!hintUsed && selectedRiddle.hint_text && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHintUsed(true)}
                      className="gap-2"
                    >
                      <Lightbulb className="w-4 h-4" />
                      Demander un indice
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedRiddle(null);
                      setUserAnswer('');
                      setHintUsed(false);
                    }}
                  >
                    Retour
                  </Button>
                </div>

                <Button onClick={() => handleAnswerSubmit(selectedRiddle)}>
                  Valider la réponse
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Points: {selectedRiddle.points_base}
                {hintUsed && ` (${selectedRiddle.points_base + (userCentre.centre_profile === 'maternelle' ? selectedRiddle.hint_malus_mat : selectedRiddle.hint_malus_elem)} avec indice)`}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {riddles.map((riddle) => (
              <Card key={riddle.id} className="shadow-soft hover:shadow-medium transition-all cursor-pointer">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-ocean-deep flex items-center gap-2">
                        <Brain className="w-5 h-5 text-ocean-primary" />
                        Énigme #{riddle.id.slice(-4)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {riddle.station?.name || 'Énigme générale'}
                      </CardDescription>
                    </div>
                    
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {riddle.points_base} pts
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <Button
                    className="w-full bg-gradient-ocean hover:shadow-soft transition-all"
                    onClick={() => setSelectedRiddle(riddle)}
                  >
                    Résoudre l'énigme
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!selectedRiddle && riddles.length === 0 && (
          <div className="text-center py-12">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Aucune énigme disponible
            </h3>
            <p className="text-muted-foreground">
              Les énigmes apparaîtront ici quand elles seront configurées
            </p>
          </div>
        )}
      </div>
    </BiancottoLayout>
  );
}