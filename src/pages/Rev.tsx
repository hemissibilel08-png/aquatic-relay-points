import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Camera, TrendingUp, Clock, Target, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BiancottoLayout } from "@/components/BiancottoLayout";
import { useSessionCentre } from "@/hooks/useSessionCentre";

interface CentreStats {
  totalPoints: number;
  totalAttempts: number;
  groupScores: Array<{
    group_label: string;
    points: number;
    attempts: number;
  }>;
  activityBreakdown: Array<{
    activity_name: string;
    points: number;
    attempts: number;
    best_score: number;
  }>;
  recentActivity: Array<{
    activity_name: string;
    group_label: string;
    points: number;
    created_at: string;
  }>;
}

export default function Rev() {
  const [stats, setStats] = useState<CentreStats>({
    totalPoints: 0,
    totalAttempts: 0,
    groupScores: [],
    activityBreakdown: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { sessionCentre, isSessionActive } = useSessionCentre();

  useEffect(() => {
    if (isSessionActive()) {
      fetchStats();
      
      // Actualisation automatique toutes les 30 secondes
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [sessionCentre.centre_id]);

  const fetchStats = async () => {
    if (!sessionCentre.centre_id) return;

    try {
      // Récupérer les tentatives du jour pour ce centre
      const today = new Date().toISOString().split('T')[0];
      
      const { data: attempts, error } = await supabase
        .from('attempt')
        .select(`
          id,
          points,
          started_at,
          activity:activity_id (
            name
          ),
          groups:group_id (
            label
          )
        `)
        .eq('centre_id', sessionCentre.centre_id)
        .gte('started_at', today)
        .order('started_at', { ascending: false });

      if (error) throw error;

      // Calculer les statistiques
      const totalPoints = attempts?.reduce((sum, a) => sum + a.points, 0) || 0;
      const totalAttempts = attempts?.length || 0;

      // Scores par groupe
      const groupScoresMap = new Map();
      attempts?.forEach(attempt => {
        const groupLabel = attempt.groups?.label || 'Sans groupe';
        if (!groupScoresMap.has(groupLabel)) {
          groupScoresMap.set(groupLabel, { points: 0, attempts: 0 });
        }
        const current = groupScoresMap.get(groupLabel);
        current.points += attempt.points;
        current.attempts += 1;
      });

      const groupScores = Array.from(groupScoresMap.entries()).map(([label, data]) => ({
        group_label: label,
        points: data.points,
        attempts: data.attempts,
      }));

      // Répartition par activité
      const activityMap = new Map();
      attempts?.forEach(attempt => {
        const activityName = attempt.activity?.name || 'Activité inconnue';
        if (!activityMap.has(activityName)) {
          activityMap.set(activityName, { points: 0, attempts: 0, best_score: 0 });
        }
        const current = activityMap.get(activityName);
        current.points += attempt.points;
        current.attempts += 1;
        current.best_score = Math.max(current.best_score, attempt.points);
      });

      const activityBreakdown = Array.from(activityMap.entries()).map(([name, data]) => ({
        activity_name: name,
        points: data.points,
        attempts: data.attempts,
        best_score: data.best_score,
      }));

      // Activité récente (dernières 10)
      const recentActivity = attempts?.slice(0, 10).map(attempt => ({
        activity_name: attempt.activity?.name || 'Activité',
        group_label: attempt.groups?.label || 'Sans groupe',
        points: attempt.points,
        created_at: attempt.started_at,
      })) || [];

      setStats({
        totalPoints,
        totalAttempts,
        groupScores,
        activityBreakdown,
        recentActivity,
      });

    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBestGroup = () => {
    return stats.groupScores.reduce((best, current) => 
      current.points > best.points ? current : best,
      { group_label: '', points: 0, attempts: 0 }
    );
  };

  const getMostActiveActivity = () => {
    return stats.activityBreakdown.reduce((most, current) => 
      current.attempts > most.attempts ? current : most,
      { activity_name: '', attempts: 0, points: 0, best_score: 0 }
    );
  };

  if (!isSessionActive()) {
    return (
      <BiancottoLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-muted-foreground mb-4">
            Session requise
          </h1>
          <p className="text-muted-foreground">
            Vous devez sélectionner un centre pour accéder au tableau de bord responsable.
          </p>
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

  const bestGroup = getBestGroup();
  const mostActive = getMostActiveActivity();

  return (
    <BiancottoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
              Tableau de Bord Responsable
            </h1>
            <p className="text-muted-foreground mt-1">
              {sessionCentre.centre_name} • Scores en temps réel
            </p>
          </div>
          
          <Button onClick={fetchStats} variant="outline" className="gap-2">
            <Clock className="w-4 h-4" />
            Actualiser
          </Button>
        </div>

        {/* Vue d'ensemble */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-or/10 to-or/5 border-or/20">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 text-or mx-auto mb-2" />
              <div className="text-2xl font-bold text-or">{stats.totalPoints}</div>
              <div className="text-sm text-muted-foreground">Points totaux</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-ocean-primary/10 to-ocean-primary/5 border-ocean-primary/20">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 text-ocean-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-ocean-primary">{stats.totalAttempts}</div>
              <div className="text-sm text-muted-foreground">Tentatives</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-status-libre/10 to-status-libre/5 border-status-libre/20">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-status-libre mx-auto mb-2" />
              <div className="text-2xl font-bold text-status-libre">{stats.groupScores.length}</div>
              <div className="text-sm text-muted-foreground">Groupes actifs</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-coral/10 to-coral/5 border-coral/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-coral mx-auto mb-2" />
              <div className="text-2xl font-bold text-coral">
                {stats.totalAttempts ? Math.round(stats.totalPoints / stats.totalAttempts) : 0}
              </div>
              <div className="text-sm text-muted-foreground">Points/tentative</div>
            </CardContent>
          </Card>
        </div>

        {/* Highlights */}
        {bestGroup.group_label && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-or/20 bg-or/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-or flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Groupe Leader
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-ocean-deep">{bestGroup.group_label}</div>
                <div className="text-2xl font-bold text-or">{bestGroup.points} points</div>
                <div className="text-sm text-muted-foreground">{bestGroup.attempts} tentatives</div>
              </CardContent>
            </Card>
            
            {mostActive.activity_name && (
              <Card className="border-ocean-primary/20 bg-ocean-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-ocean-primary flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Activité Populaire
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-ocean-deep">{mostActive.activity_name}</div>
                  <div className="text-2xl font-bold text-ocean-primary">{mostActive.attempts} tentatives</div>
                  <div className="text-sm text-muted-foreground">Meilleur score: {mostActive.best_score} pts</div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scores par groupe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-ocean-primary" />
                Scores par Groupe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.groupScores
                .sort((a, b) => b.points - a.points)
                .map((group, index) => (
                <div 
                  key={group.group_label}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-or' : index === 1 ? 'bg-argent' : 'bg-bronze'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-ocean-deep">
                        {group.group_label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {group.attempts} tentatives
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-ocean-primary">
                      {group.points}
                    </div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </div>
                </div>
              ))}
              
              {stats.groupScores.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  Aucune activité enregistrée aujourd'hui
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activité récente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-ocean-primary" />
                Activité Récente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.recentActivity.map((activity, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm text-ocean-deep">
                      {activity.activity_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.group_label} • {new Date(activity.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={activity.points >= 15 ? 'bg-status-libre/20 text-status-libre' : 'bg-muted'}
                  >
                    +{activity.points}
                  </Badge>
                </div>
              ))}
              
              {stats.recentActivity.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  Aucune activité récente
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Répartition par activité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-ocean-primary" />
              Performance par Activité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.activityBreakdown
                .sort((a, b) => b.points - a.points)
                .map((activity) => (
                <div 
                  key={activity.activity_name}
                  className="flex items-center justify-between p-4 rounded-lg border border-muted"
                >
                  <div>
                    <div className="font-medium text-ocean-deep">
                      {activity.activity_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {activity.attempts} tentatives • Meilleur: {activity.best_score} pts
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-ocean-primary">
                      {activity.points}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ~{Math.round(activity.points / activity.attempts)} pts/tentative
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {stats.activityBreakdown.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                Aucune données d'activité disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BiancottoLayout>
  );
}