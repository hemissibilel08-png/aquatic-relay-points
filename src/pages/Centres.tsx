import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fish, Users, MapPin, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BiancottoLayout } from "@/components/BiancottoLayout";

interface Centre {
  id: string;
  name: string;
  profile: 'elementaire' | 'maternelle';
  color: string;
  is_active: boolean;
  created_at: string;
  groups?: Array<{
    id: string;
    label: string;
  }>;
}

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
        .from('centre')
        .select(`
          *,
          groups (
            id,
            label
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
              Centres Aquatiques
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestion des centres et de leurs groupes
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
                      {centre.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Profil {centre.profile}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={centre.profile === 'maternelle' ? 'bg-coral/20 text-coral' : 'bg-ocean-light/20 text-ocean-primary'}
                  >
                    {centre.profile === 'maternelle' ? 'Maternelle' : 'Élémentaire'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Groupes */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Groupes</span>
                  </div>
                  
                  <div className="space-y-2">
                    {centre.groups?.map((groupe) => (
                      <div 
                        key={groupe.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ocean-deep">
                            {groupe.label}
                          </span>
                        </div>
                      </div>
                    )) || (
                      <p className="text-sm text-muted-foreground italic">
                        Aucun groupe configuré
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
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
    </BiancottoLayout>
  );
}