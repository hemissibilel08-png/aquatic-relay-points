import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Calendar, 
  Cloud, 
  CloudRain,
  Sun,
  MapPin, 
  Waves, 
  QrCode, 
  Trophy, 
  HelpCircle, 
  Fish, 
  Users,
  Plus,
  Edit,
  Trash2,
  TestTube
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BiancottoLayout } from "@/components/BiancottoLayout";

interface Event {
  id: string;
  name: string;
  date: string;
  is_active: boolean;
  description?: string;
}

interface Zone {
  id: string;
  name: string;
  description?: string;
  event_id: string;
  is_active: boolean;
}

interface Station {
  id: string;
  name: string;
  description?: string;
  qr_code: string;
  zone_id: string;
  is_active: boolean;
  activity?: {
    name: string;
    type: string;
  };
}

interface Activity {
  id: string;
  name: string;
  type: string;
  family: string;
  default_points: number;
  repeatable: boolean;
  requires_facilitator: boolean;
  thresholds_elem: any;
  thresholds_mat: any;
  is_active: boolean;
}

export default function Admin() {
  const [events, setEvents] = useState<Event[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [rainMode, setRainMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [eventsRes, zonesRes, stationsRes, activitiesRes] = await Promise.all([
        supabase.from('event').select('*').order('date', { ascending: false }),
        supabase.from('zone').select('*').order('name'),
        supabase.from('station').select('*, activity(name, type)').order('name'),
        supabase.from('activity').select('*').order('name'),
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (zonesRes.error) throw zonesRes.error;
      if (stationsRes.error) throw stationsRes.error;
      if (activitiesRes.error) throw activitiesRes.error;

      setEvents(eventsRes.data || []);
      setZones(zonesRes.data || []);
      setStations(stationsRes.data || []);
      setActivities(activitiesRes.data || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données d'administration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleEventStatus = async (eventId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('event')
        .update({ is_active: !isActive })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: isActive ? "Événement désactivé" : "Événement activé",
        description: "Statut modifié avec succès",
      });

      fetchAllData();
    } catch (error) {
      console.error('Erreur modification événement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'événement",
        variant: "destructive",
      });
    }
  };

  const toggleRainMode = async () => {
    try {
      if (!rainMode) {
        // Activer le mode pluie : basculer les stations vers fallback_zone
        const { error } = await (supabase as any).rpc('activate_rain_mode');
        if (error) throw error;
        
        toast({
          title: "Mode Pluie Activé ☔",
          description: "Stations basculées vers zones de repli",
        });
      } else {
        // Désactiver le mode pluie : restaurer les zones normales
        const { error } = await (supabase as any).rpc('deactivate_rain_mode');
        if (error) throw error;
        
        toast({
          title: "Mode Normal Restauré ☀️",
          description: "Stations restaurées en zones extérieures",
        });
      }
      
      setRainMode(!rainMode);
      fetchAllData();
    } catch (error) {
      console.error('Erreur mode pluie:', error);
      toast({
        title: "Erreur",
        description: "Fonctionnalité en cours de développement",
        variant: "destructive",
      });
    }
  };

  const createDemoData = async () => {
    try {
      const { data, error } = await (supabase as any).rpc('create_demo_data');
      if (error) throw error;
      
      toast({
        title: "Données de démo créées ✨",
        description: "Centres, groupes, stations et énigmes ajoutés",
      });
      fetchAllData();
    } catch (error) {
      console.error('Erreur création démo:', error);
      toast({
        title: "Erreur",
        description: "Fonctionnalité en cours de développement",
        variant: "destructive",
      });
    }
  };

  const runQATests = async () => {
    try {
      const { data, error } = await (supabase as any).rpc('run_qa_tests');
      if (error) throw error;
      
      const result = data as any;
      toast({
        title: "Tests QA Terminés ✅",
        description: `${result?.tests_passed || 0} tests réussis sur ${result?.total_tests || 0}`,
      });
    } catch (error) {
      console.error('Erreur tests QA:', error);
      toast({
        title: "Erreur Tests QA",
        description: "Fonctionnalité en cours de développement",
        variant: "destructive",
      });
    }
  };

  const generateQRCode = (stationId: string) => {
    // Génération d'un QR code simple (à remplacer par une vraie librairie)
    const qrData = `${window.location.origin}/station/${stationId}`;
    return qrData;
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
        <div>
          <h1 className="text-3xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
            Administration Biancotto
          </h1>
          <p className="text-muted-foreground mt-1">
            Configuration complète du système
          </p>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="events">Événements</TabsTrigger>
            <TabsTrigger value="zones">Zones</TabsTrigger>
            <TabsTrigger value="stations">Stations</TabsTrigger>
            <TabsTrigger value="activities">Activités</TabsTrigger>
            <TabsTrigger value="riddles">Énigmes</TabsTrigger>
            <TabsTrigger value="centres">Centres</TabsTrigger>
            <TabsTrigger value="qa">QA & Tests</TabsTrigger>
          </TabsList>

          {/* Gestion Événements */}
          <TabsContent value="events" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ocean-deep">Événements & Mode Pluie</h2>
              <div className="flex items-center gap-4">
                {/* Toggle Mode Pluie Global */}
                <div className="flex items-center gap-3 p-3 bg-wave/20 rounded-lg border border-wave/30">
                  <div className="flex items-center gap-2">
                    {rainMode ? <CloudRain className="w-5 h-5 text-ocean-primary" /> : <Sun className="w-5 h-5 text-or" />}
                    <span className="text-sm font-medium">Mode Pluie</span>
                  </div>
                  <Switch 
                    checked={rainMode}
                    onCheckedChange={toggleRainMode}
                  />
                </div>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nouvel Événement
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {events.map((event) => (
                <Card key={event.id} className={event.is_active ? 'border-status-libre/30' : 'border-muted'}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-ocean-primary" />
                          <div>
                            <h3 className="font-semibold text-ocean-deep">{event.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        
                        <Badge 
                          variant={event.is_active ? 'default' : 'secondary'}
                          className={event.is_active ? 'bg-status-libre text-white' : ''}
                        >
                          {event.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => toggleEventStatus(event.id, event.is_active)}
                          variant="outline"
                          size="sm"
                        >
                          {event.is_active ? 'Désactiver' : 'Activer'}
                        </Button>
                        
                        <Badge 
                          variant={rainMode ? "default" : "outline"}
                          className={rainMode ? "bg-ocean-primary text-white" : ""}
                        >
                          {rainMode ? "☔ Pluie" : "☀️ Normal"}
                        </Badge>
                        
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Gestion Zones */}
          <TabsContent value="zones" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ocean-deep">Zones d'Activités</h2>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle Zone
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {zones.map((zone) => (
                <Card key={zone.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-ocean-primary" />
                      {zone.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {zone.description || 'Aucune description'}
                    </p>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Gestion Stations */}
          <TabsContent value="stations" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ocean-deep">Stations & QR Codes</h2>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle Station
              </Button>
            </div>

            <div className="space-y-3">
              {stations.map((station) => (
                <Card key={station.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Waves className="w-5 h-5 text-ocean-primary" />
                          <div>
                            <h3 className="font-semibold text-ocean-deep">{station.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {station.activity?.name || 'Aucune activité'} • {station.activity?.type}
                            </p>
                          </div>
                        </div>
                        
                        <Badge variant="outline">
                          {station.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <QrCode className="w-4 h-4" />
                          QR Code
                        </Button>
                        
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Gestion Activités */}
          <TabsContent value="activities" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ocean-deep">Activités & Seuils</h2>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle Activité
              </Button>
            </div>

            <div className="space-y-3">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-or" />
                          <div>
                            <h3 className="font-semibold text-ocean-deep">{activity.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {activity.type}
                              </Badge>
                              <span>•</span>
                              <span>{activity.family}</span>
                              <span>•</span>
                              <span>{activity.default_points} pts</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {activity.repeatable && (
                            <Badge variant="secondary" className="text-xs">Répétable</Badge>
                          )}
                          {activity.requires_facilitator && (
                            <Badge variant="secondary" className="text-xs">Supervisée</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Seuils É/M
                        </Button>
                        
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Gestion Énigmes */}
          <TabsContent value="riddles" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ocean-deep">Énigmes</h2>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle Énigme
              </Button>
            </div>

            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Gestion des Énigmes
              </h3>
              <p className="text-muted-foreground">
                Configuration des questions, réponses et indices pour chaque station
              </p>
            </div>
          </TabsContent>

          {/* Gestion Centres & Groupes */}
          <TabsContent value="centres" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ocean-deep">Centres & Groupes</h2>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={createDemoData}
                  className="gap-2"
                >
                  <Fish className="w-4 h-4" />
                  Créer Données Démo
                </Button>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nouveau Centre
                </Button>
              </div>
            </div>

            <div className="text-center py-12">
              <Fish className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Gestion des Centres
              </h3>
              <p className="text-muted-foreground">
                Configuration des centres aquatiques et de leurs groupes d'animaux
              </p>
            </div>
          </TabsContent>

          {/* QA & Tests */}
          <TabsContent value="qa" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ocean-deep">Quality Assurance & Tests</h2>
              <Button 
                onClick={runQATests}
                className="gap-2"
              >
                <TestTube className="w-4 h-4" />
                Lancer Tests QA
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tests automatiques */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="w-5 h-5 text-ocean-primary" />
                    Tests Automatiques
                  </CardTitle>
                  <CardDescription>
                    Vérifications de fonctionnement du système
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>• Collision stations</span>
                      <Badge variant="outline" className="text-xs">Auto</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>• Auto-release 20 min</span>
                      <Badge variant="outline" className="text-xs">Auto</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>• Profils M/E</span>
                      <Badge variant="outline" className="text-xs">Auto</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>• Calcul des Records</span>
                      <Badge variant="outline" className="text-xs">Auto</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tests manuels */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-coral" />
                    Tests Fonctionnels
                  </CardTitle>
                  <CardDescription>
                    Vérifications manuelles recommandées
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div>• Navigation entre pages</div>
                    <div>• Authentification facilitateurs</div>
                    <div>• Saisie tentatives & énigmes</div>
                    <div>• Co-validation supervisée</div>
                    <div>• Affichage temps réel</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </BiancottoLayout>
  );
}