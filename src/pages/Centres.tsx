import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fish, Users, MapPin, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Centre {
  id: string;
  nom: string;
  profil: 'maternelle' | 'elementaire';
  code_qr: string;
  active: boolean;
  created_at: string;
  groupes?: Array<{
    id: string;
    animal: 'dauphins' | 'tortues' | 'requins';
    nb_participants: number;
  }>;
}

const animalIcons = {
  dauphins: '🐬',
  tortues: '🐢', 
  requins: '🦈'
};

const animalColors = {
  dauphins: 'dauphin',
  tortues: 'tortue',
  requins: 'requin'
};

export default function Centres() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCentres();
  }, []);

  const fetchCentres = async () => {
    try {
      const { data, error } = await supabase
        .from('centres')
        .select(`
          *,
          groupes (
            id,
            animal,
            nb_participants
          )
        `)
        .eq('active', true)
        .order('nom');

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
            Centres Aquatiques
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion des centres et de leurs groupes d'animaux marins
          </p>
        </div>
        
        <Button className="bg-gradient-ocean hover:shadow-medium transition-all">
          <Fish className="w-4 h-4 mr-2" />
          Nouveau Centre
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {centres.map((centre) => (
          <Card key={centre.id} className="shadow-soft hover:shadow-medium transition-all bg-gradient-to-br from-card to-wave/30">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl text-ocean-deep flex items-center gap-2">
                    <Fish className="w-5 h-5 text-ocean-primary" />
                    {centre.nom}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Profil {centre.profil}
                  </CardDescription>
                </div>
                <Badge 
                  variant="secondary" 
                  className={centre.profil === 'maternelle' ? 'bg-coral/20 text-coral' : 'bg-ocean-light/20 text-ocean-primary'}
                >
                  {centre.profil === 'maternelle' ? 'Maternelle' : 'Élémentaire'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Groupes */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Groupes d'animaux</span>
                </div>
                
                <div className="space-y-2">
                  {centre.groupes?.map((groupe) => (
                    <div 
                      key={groupe.id}
                      className={`flex items-center justify-between p-3 rounded-lg bg-${animalColors[groupe.animal]}/10 border border-${animalColors[groupe.animal]}/20`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{animalIcons[groupe.animal]}</span>
                        <span className="font-medium capitalize text-ocean-deep">
                          {groupe.animal}
                        </span>
                      </div>
                      <Badge variant="outline" className="font-normal">
                        {groupe.nb_participants} participants
                      </Badge>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground italic">
                      Aucun groupe configuré
                    </p>
                  )}
                </div>
              </div>

              {/* QR Code */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">QR Code</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Afficher
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {centres.length === 0 && (
        <div className="text-center py-12">
          <Fish className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Aucun centre configuré
          </h3>
          <p className="text-muted-foreground">
            Créez votre premier centre aquatique pour commencer
          </p>
        </div>
      )}
    </div>
  );
}