import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Waves, Camera, Trophy, HelpCircle, CheckCircle, XCircle, Upload, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BiancottoLayout } from "@/components/BiancottoLayout";
import { useSessionCentre } from "@/hooks/useSessionCentre";
import { QRScanner } from "@/components/QRScanner";

interface StationData {
  id: string;
  name: string;
  description: string;
  activity?: {
    id: string;
    name: string;
    description?: string;
    type: string;
    default_points: number;
    thresholds_elem: any;
    thresholds_mat: any;
  };
  riddle?: {
    id: string;
    question: string;
    hint_text?: string;
    points_base: number;
    hint_malus_elem: number;
    hint_malus_mat: number;
  };
}

export default function Station() {
  const { id } = useParams();
  const [station, setStation] = useState<StationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // État activité
  const [activityResult, setActivityResult] = useState('');
  const [activityNotes, setActivityNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  
  // État énigme
  const [riddleAnswer, setRiddleAnswer] = useState('');
  const [riddleAttempts, setRiddleAttempts] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [riddleResult, setRiddleResult] = useState<'none' | 'correct' | 'incorrect'>('none');
  
  const { toast } = useToast();
  const { sessionCentre, isSessionActive } = useSessionCentre();

  useEffect(() => {
    if (id && id !== 'scan') {
      fetchStation();
    }
  }, [id]);

  const fetchStation = async () => {
    if (!id || id === 'scan') return;
    
    try {
      const { data, error } = await supabase
        .from('station')
        .select(`
          *,
          activity (
            id,
            name,
            description,
            type,
            default_points,
            thresholds_elem,
            thresholds_mat
          ),
          riddle!inner (
            id,
            question,
            hint_text,
            points_base,
            hint_malus_elem,
            hint_malus_mat
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Transformer les données pour avoir riddle comme objet unique
      const transformedData = {
        ...data,
        riddle: Array.isArray(data.riddle) && data.riddle.length > 0 ? data.riddle[0] : undefined
      };
      
      setStation(transformedData);
    } catch (error) {
      console.error('Erreur lors du chargement de la station:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la station",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePoints = async (result: string): Promise<number> => {
    if (!station?.activity || !result) return 0;
    
    try {
      // Utiliser la fonction Supabase pour calculer les points
      const { data, error } = await supabase.rpc('calculate_activity_points', {
        activity_type: station.activity.type === 'supervisee' ? 'activite' : 'activite',
        activity_family: 'precision', // À récupérer depuis la DB
        raw_result: result,
        thresholds_elem: station.activity.thresholds_elem,
        thresholds_mat: station.activity.thresholds_mat,
        centre_profile: sessionCentre.profil,
        is_co_validated: station.activity.type === 'supervisee',
        hint_used: false,
        attempt_count: 1
      });

      if (error) throw error;
      return (data as any)?.total || station.activity.default_points;
    } catch (error) {
      console.error('Erreur calcul points:', error);
      return station.activity.default_points;
    }
  };

  const getCurrentEvent = async () => {
    const { data, error } = await supabase
      .from('event')
      .select('id')
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    return data.id;
  };

  const occupyStation = async () => {
    if (!station || !sessionCentre.centre_id) return false;
    
    try {
      const { error } = await supabase
        .from('occupation')
        .update({
          status: 'occupee',
          by_centre_id: sessionCentre.centre_id,
          since: new Date().toISOString()
        })
        .eq('station_id', station.id);

      return !error;
    } catch (error) {
      console.error('Erreur occupation:', error);
      return false;
    }
  };

  const releaseStation = async () => {
    if (!station) return;
    
    try {
      await supabase
        .from('occupation')
        .update({
          status: 'libre',
          by_centre_id: null,
          since: new Date().toISOString()
        })
        .eq('station_id', station.id);
    } catch (error) {
      console.error('Erreur libération:', error);
    }
  };

  const submitActivity = async () => {
    if (!station || !isSessionActive()) return;
    
    setSubmitting(true);
    
    try {
      // 1. Occuper la station
      const occupied = await occupyStation();
      if (!occupied) {
        throw new Error('Impossible d\'occuper la station');
      }

      // 2. Obtenir l'événement actuel
      const eventId = await getCurrentEvent();

      // 3. Calculer les points avec la fonction Supabase
      const points = await calculatePoints(activityResult);
      
      // 4. Enregistrer la tentative
      const { data: attemptData, error } = await supabase
        .from('attempt')
        .insert({
          activity_id: station.activity!.id,
          centre_id: sessionCentre.centre_id!,
          group_id: null, // TODO: récupérer group_id depuis group_label
          event_id: eventId,
          raw_result: activityResult,
          points: points,
          photo_url: null, // TODO: gérer l'upload photo
          ended_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // 5. Mettre à jour les records si nécessaire
      // TODO: Implémenter la logique de records

      // 6. Libérer la station
      await releaseStation();
      
      toast({
        title: "🎉 Activité terminée !",
        description: `+${points} points pour ${sessionCentre.group_label || 'votre groupe'} !`,
      });
      
      // Reset form
      setActivityResult('');
      setActivityNotes('');
      setPhoto(null);
      
    } catch (error) {
      console.error('Erreur soumission activité:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de soumettre l'activité",
        variant: "destructive",
      });
      
      // Libérer la station en cas d'erreur
      await releaseStation();
    } finally {
      setSubmitting(false);
    }
  };

  const submitRiddle = async () => {
    if (!station?.riddle || !riddleAnswer.trim() || !isSessionActive()) return;
    
    setSubmitting(true);
    
    try {
      // 1. Obtenir l'événement actuel
      const eventId = await getCurrentEvent();

      // 2. Créer une edge function pour vérifier la réponse de manière sécurisée
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-riddle', {
        body: {
          riddle_id: station.riddle.id,
          answer: riddleAnswer.trim(),
          hint_used: hintUsed,
          centre_profile: sessionCentre.profil
        }
      });

      if (verificationError) throw verificationError;

      const { is_correct, points } = verificationData;
      
      // 3. Enregistrer la réponse
      const { error } = await supabase
        .from('riddle_answer')
        .insert({
          riddle_id: station.riddle!.id,
          centre_id: sessionCentre.centre_id!,
          group_id: null, // TODO: récupérer group_id depuis group_label
          event_id: eventId,
          answer_text: riddleAnswer,
          correct: is_correct,
          hint_used: hintUsed,
          points: points,
        });

      if (error) throw error;
      
      setRiddleResult(is_correct ? 'correct' : 'incorrect');
      setRiddleAttempts(prev => prev + 1);
      
      if (is_correct) {
        toast({
          title: "🎉 Bonne réponse !",
          description: `+${points} points pour ${sessionCentre.group_label || 'votre groupe'} !`,
        });
      } else {
        toast({
          title: "Réponse incorrecte",
          description: "Essayez encore !",
          variant: "destructive",
        });
      }
      
      setRiddleAnswer('');
      
    } catch (error) {
      console.error('Erreur soumission énigme:', error);
      toast({
        title: "Erreur",
        description: "Impossible de soumettre la réponse",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (id === 'scan') {
    return <QRScanner />;
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
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-muted-foreground">Station non trouvée</h1>
        </div>
      </BiancottoLayout>
    );
  }

  return (
    <BiancottoLayout>
      <div className="space-y-6">
        {/* Header Station */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-ocean rounded-lg flex items-center justify-center">
            <Waves className="w-6 h-6 text-foam" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ocean-deep">{station.name}</h1>
            <p className="text-muted-foreground">{station.description}</p>
          </div>
        </div>

        {/* Session Check */}
        {!isSessionActive() && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-destructive">
                Vous devez sélectionner un centre et un groupe pour participer aux activités.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Onglets Activité / Énigmes */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activity" className="gap-2">
              <Trophy className="w-4 h-4" />
              Activité
            </TabsTrigger>
            <TabsTrigger value="riddle" className="gap-2">
              <HelpCircle className="w-4 h-4" />
              Énigmes
            </TabsTrigger>
          </TabsList>

          {/* Onglet Activité */}
          <TabsContent value="activity" className="space-y-6">
            {station.activity ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-or" />
                    {station.activity.name}
                  </CardTitle>
                  <CardDescription>
                    Type: {station.activity.type} • {station.activity.default_points} points de base
                  </CardDescription>
                </CardHeader>
                
                 <CardContent className="space-y-4">
                   {/* Règles et conseils pour l'autonomie */}
                   {station.activity && (
                     <div className="p-4 bg-ocean-light/5 rounded-lg border border-ocean-primary/20">
                       <h4 className="font-medium text-ocean-deep mb-2 flex items-center gap-2">
                         <Trophy className="w-4 h-4" />
                         Règles & Conseils
                       </h4>
                       <div className="text-sm text-muted-foreground space-y-1">
                         <p>• {station.activity.description}</p>
                         <p>• Type d'activité: <strong>{station.activity.type}</strong></p>
                         {station.activity.thresholds_elem && (
                           <p>• Seuils de performance: Bronze, Argent, Or selon votre niveau</p>
                         )}
                         <p>• Points de base: <strong>{station.activity.default_points}</strong></p>
                         {station.activity.type === 'supervisee' && (
                           <p className="text-yellow-600">⚠️ Cette activité nécessite la présence d'un facilitateur</p>
                         )}
                       </div>
                     </div>
                   )}

                   <div className="space-y-2">
                     <Label htmlFor="result">Résultat</Label>
                     <Input
                       id="result"
                       placeholder="Entrez le résultat (ex: 15.5)"
                       value={activityResult}
                       onChange={(e) => setActivityResult(e.target.value)}
                       disabled={!isSessionActive()}
                     />
                   </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optionnel)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Commentaires ou observations..."
                      value={activityNotes}
                      onChange={(e) => setActivityNotes(e.target.value)}
                      disabled={!isSessionActive()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Photo</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Cliquez pour ajouter une photo (optionnel)
                      </p>
                    </div>
                  </div>

                   {activityResult && (
                     <div className="p-4 bg-ocean-light/10 rounded-lg">
                       <p className="text-sm text-ocean-primary">
                         Points estimés: Calcul en cours...
                       </p>
                     </div>
                   )}

                  <Button 
                    onClick={submitActivity}
                    disabled={!activityResult || submitting || !isSessionActive()}
                    className="w-full bg-gradient-ocean"
                  >
                    {submitting ? 'Soumission...' : 'Terminer l\'activité'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    Aucune activité configurée pour cette station.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Énigmes */}
          <TabsContent value="riddle" className="space-y-6">
            {station.riddle ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-ocean-primary" />
                    Énigme
                  </CardTitle>
                  <CardDescription>
                    {station.riddle.points_base} points • Tentative #{riddleAttempts + 1}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium text-ocean-deep">
                      {station.riddle.question}
                    </p>
                  </div>

                  {riddleResult !== 'none' && (
                    <div className={`p-4 rounded-lg flex items-center gap-2 ${
                      riddleResult === 'correct' 
                        ? 'bg-status-libre/10 text-status-libre' 
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {riddleResult === 'correct' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      <span className="font-medium">
                        {riddleResult === 'correct' ? 'Bonne réponse !' : 'Réponse incorrecte'}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="answer">Votre réponse</Label>
                    <Input
                      id="answer"
                      placeholder="Tapez votre réponse..."
                      value={riddleAnswer}
                      onChange={(e) => setRiddleAnswer(e.target.value)}
                      disabled={!isSessionActive()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && riddleAnswer.trim()) {
                          submitRiddle();
                        }
                      }}
                    />
                  </div>

                  {riddleAttempts >= 2 && station.riddle.hint_text && !hintUsed && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Indice disponible</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHintUsed(true)}
                        className="text-yellow-700 border-yellow-300"
                      >
                        Afficher l'indice (-{Math.abs(sessionCentre.profil === 'maternelle' 
                          ? station.riddle.hint_malus_mat 
                          : station.riddle.hint_malus_elem)} points)
                      </Button>
                    </div>
                  )}

                  {hintUsed && station.riddle.hint_text && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Indice</span>
                      </div>
                      <p className="text-yellow-700">{station.riddle.hint_text}</p>
                    </div>
                  )}

                  <Button 
                    onClick={submitRiddle}
                    disabled={!riddleAnswer.trim() || submitting || !isSessionActive()}
                    className="w-full"
                  >
                    {submitting ? 'Vérification...' : 'Soumettre la réponse'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    Aucune énigme configurée pour cette station.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </BiancottoLayout>
  );
}