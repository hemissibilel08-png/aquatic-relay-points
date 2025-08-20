import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, HelpCircle, Timer, Trophy } from "lucide-react";
import { ScoreEntry } from "./ScoreEntry";
import { RiddleInterface } from "./RiddleInterface";
import { useSessionCentre } from "@/hooks/useSessionCentre";

interface ActivityData {
  id: string;
  name: string;
  description?: string;
  type: string;
  family?: string;
  default_points: number;
  requires_facilitator: boolean;
  thresholds_elem?: any;
  thresholds_mat?: any;
}

interface RiddleData {
  id: string;
  question: string;
  hint_text?: string;
  points_base: number;
  hint_malus_elem: number;
  hint_malus_mat: number;
  station_id: string;
}

interface ActivityManagerProps {
  stationId: string;
  stationName: string;
  activity?: ActivityData;
  riddle?: RiddleData;
  onActivityComplete?: () => void;
}

export function ActivityManager({ 
  stationId, 
  stationName, 
  activity, 
  riddle, 
  onActivityComplete 
}: ActivityManagerProps) {
  const { sessionCentre } = useSessionCentre();
  const [activeTab, setActiveTab] = useState<'activity' | 'riddle'>('activity');

  if (!sessionCentre.centre_id) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Sélectionnez votre groupe
          </h3>
          <p className="text-muted-foreground">
            Vous devez sélectionner un groupe pour participer aux activités
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasActivity = activity && activity.id;
  const hasRiddle = riddle && riddle.id;

  if (!hasActivity && !hasRiddle) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Station en configuration
          </h3>
          <p className="text-muted-foreground">
            Aucune activité ou énigme n'est configurée pour cette station
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Station Info */}
      <Card className="bg-gradient-to-br from-ocean-primary/10 via-turquoise/10 to-foam">
        <CardHeader>
          <CardTitle className="text-2xl text-ocean-deep flex items-center gap-2">
            <Activity className="w-6 h-6 text-ocean-primary" />
            {stationName}
          </CardTitle>
          <CardDescription className="text-base">
            Choisissez votre activité pour commencer à gagner des points
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Activités disponibles */}
      {(hasActivity || hasRiddle) && (
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            {hasActivity && (
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Activité
              </TabsTrigger>
            )}
            {hasRiddle && (
              <TabsTrigger value="riddle" className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Énigme
              </TabsTrigger>
            )}
          </TabsList>

          {hasActivity && (
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-ocean-primary" />
                    {activity.name}
                  </CardTitle>
                  {activity.description && (
                    <CardDescription>{activity.description}</CardDescription>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {activity.family || activity.type}
                    </Badge>
                    <Badge variant="secondary">
                      {activity.default_points} points base
                    </Badge>
                    {activity.requires_facilitator && (
                      <Badge variant="destructive" className="text-xs">
                        Facilitateur requis
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                <ScoreEntry
                  stationId={stationId}
                  activity={{
                    ...activity,
                    thresholds_elem: activity.thresholds_elem || null,
                    thresholds_mat: activity.thresholds_mat || null
                  }}
                  onScoreSubmitted={() => {
                    onActivityComplete?.();
                  }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {hasRiddle && (
            <TabsContent value="riddle" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-coral" />
                    Énigme Marine
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Énigme</Badge>
                    <Badge variant="secondary">
                      {riddle.points_base} points
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <RiddleInterface
                    riddle={riddle}
                    onRiddleComplete={() => {
                      onActivityComplete?.();
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}