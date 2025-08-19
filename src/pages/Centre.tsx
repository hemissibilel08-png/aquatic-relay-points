import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Fish, Waves, Trophy, Camera, Users, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BiancottoLayout } from "@/components/BiancottoLayout";
import { useSessionCentre } from "@/hooks/useSessionCentre";

interface Centre {
  id: string;
  name: string;
  profile: 'elementaire' | 'maternelle';
  color: string;
  groups?: Array<{
    id: string;
    label: string;
    centre_id: string;
  }>;
}

const animalIcons = {
  'Dauphins': '🐬',
  'Tortues': '🐢', 
  'Requins': '🦈'
};

const animalColors = {
  'Dauphins': 'dauphin',
  'Tortues': 'tortue',
  'Requins': 'requin'
};

export default function Centre() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCentre, setSelectedCentre] = useState<Centre | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { sessionCentre, setSessionCentreData, isSessionActive } = useSessionCentre();

  useEffect(() => {
    fetchCentres();
  }, []);

  const fetchCentres = async () => {
    try {
      const { data, error } = await supabase
        .from('centre')
        .select(`
          *,
          groups (
            id,
            label,
            centre_id
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCentres(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des centres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les centres",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCentreSelect = (centre: Centre) => {
    setSelectedCentre(centre);
  };

  const handleGroupSelect = async (groupLabel: string) => {
    if (!selectedCentre) return;

    const { success } = await setSessionCentreData(selectedCentre.id, groupLabel);
    
    if (success) {
      toast({
        title: "Session configurée",
        description: `Vous êtes maintenant connecté au groupe ${groupLabel} du ${selectedCentre.name}`,
      });
    }
  };

  const quickActions = [
    {
      title: "Stations d'Activités",
      description: "Voir les stations disponibles",
      icon: Waves,
      action: () => navigate('/stations'),
      color: 'ocean-primary'
    },
    {
      title: "Mes Points",
      description: "Consulter les scores",
      icon: Trophy,
      action: () => navigate('/records'),
      color: 'or'
    },
    {
      title: "Photos",
      description: "Galerie des moments",
      icon: Camera,
      action: () => navigate('/photos'),
      color: 'coral'
    }
  ];

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
            Mon Centre
          </h1>
          <p className="text-muted-foreground mt-1">
            Sélectionnez votre centre et votre groupe marin
          </p>
        </div>

        {/* Session active */}
        {isSessionActive() && (
          <Card className="bg-gradient-to-r from-ocean-primary/10 to-turquoise/10 border-ocean-primary/20">
            <CardHeader>
              <CardTitle className="text-ocean-primary flex items-center gap-2">
                <Fish className="w-5 h-5" />
                Session Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{sessionCentre.centre_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Groupe: {sessionCentre.group_label} • Profil: {sessionCentre.profil}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.title}
                      onClick={action.action}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <action.icon className="w-4 h-4" />
                      {action.title}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sélection du centre */}
        {!selectedCentre && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-ocean-deep">
              Choisissez votre centre
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {centres.map((centre) => (
                <Card 
                  key={centre.id} 
                  className="cursor-pointer hover:shadow-medium transition-all bg-gradient-to-br from-card to-wave/30"
                  onClick={() => handleCentreSelect(centre)}
                >
                  <CardHeader>
                    <CardTitle className="text-ocean-deep flex items-center gap-2">
                      <Fish className="w-5 h-5 text-ocean-primary" />
                      {centre.name}
                    </CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className={centre.profile === 'maternelle' ? 'text-coral' : 'text-ocean-primary'}>
                        {centre.profile === 'maternelle' ? 'Maternelle' : 'Élémentaire'}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {centre.groups?.length || 0} groupe(s)
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Sélection du groupe */}
        {selectedCentre && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="outline" 
                onClick={() => setSelectedCentre(null)}
                size="sm"
              >
                ← Retour
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-ocean-deep">
                  {selectedCentre.name}
                </h2>
                <p className="text-muted-foreground">Choisissez votre groupe marin</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {selectedCentre.groups?.map((group) => {
                const animalName = group.label;
                const icon = animalIcons[animalName as keyof typeof animalIcons] || '🐟';
                
                return (
                  <Card 
                    key={group.id}
                    className="cursor-pointer hover:shadow-medium transition-all group"
                    onClick={() => handleGroupSelect(group.label)}
                  >
                    <CardContent className="p-8 text-center">
                      <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                        {icon}
                      </div>
                      <h3 className="text-xl font-bold text-ocean-deep mb-2">
                        {group.label}
                      </h3>
                      <Badge 
                        variant="secondary"
                        className={`bg-${animalColors[animalName as keyof typeof animalColors] || 'primary'}/20`}
                      >
                        Sélectionner
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions rapides pour session active */}
        {isSessionActive() && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-ocean-deep">
              Actions Rapides
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action) => (
                <Card 
                  key={action.title}
                  className="cursor-pointer hover:shadow-medium transition-all group"
                  onClick={action.action}
                >
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 bg-${action.color}/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <action.icon className={`w-6 h-6 text-${action.color}`} />
                    </div>
                    <h3 className="font-semibold text-ocean-deep mb-2">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </BiancottoLayout>
  );
}