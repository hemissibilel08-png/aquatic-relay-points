import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Waves, ArrowLeft, Save, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BiancottoLayout } from "@/components/BiancottoLayout";
import { useUserCentre } from "@/hooks/useUserCentre";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";

interface Station {
  id: string;
  name: string;
  description: string;
  qr_code: string;
  image_url: string;
  is_active: boolean;
  zone_id: string;
  activity_id: string;
  activity?: {
    id: string;
    name: string;
    type: string;
  };
  zone?: {
    id: string;
    name: string;
  };
}

export default function StationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, canManageStations, canCreateStations } = useUserCentre();
  
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: ''
  });

  const isNewStation = id === 'new';

  useEffect(() => {
    if (isNewStation) {
      // Vérifier les permissions pour créer une station
      if (!canCreateStations()) {
        navigate('/stations');
        return;
      }
      setEditing(true);
      setLoading(false);
    } else {
      fetchStation();
    }
  }, [id, canCreateStations, navigate]);

  const fetchStation = async () => {
    try {
      const { data, error } = await supabase
        .from('station')
        .select(`
          *,
          activity (id, name, type),
          zone (id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setStation(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        image_url: data.image_url || ''
      });
    } catch (error) {
      console.error('Erreur lors du chargement de la station:', error);
      toast({
        title: "Erreur",
        description: "Station non trouvée",
        variant: "destructive",
      });
      navigate('/stations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        image_url: formData.image_url
      };

      if (isNewStation) {
        // Pour créer une station, il faut d'abord avoir une zone et activité
        // Pour l'instant, on utilise des valeurs par défaut
        const { data: zones } = await supabase.from('zone').select('id').limit(1);
        const { data: activities } = await supabase.from('activity').select('id').limit(1);
        
        if (!zones?.length || !activities?.length) {
          toast({
            title: "Erreur",
            description: "Aucune zone ou activité disponible. Contactez un administrateur.",
            variant: "destructive",
          });
          return;
        }
        
        const { error } = await supabase
          .from('station')
          .insert({
            ...updateData,
            qr_code: `station_${Date.now()}`, // QR code temporaire
            zone_id: zones[0].id,
            activity_id: activities[0].id
          });
        
        if (error) throw error;
        
        toast({
          title: "Station créée",
          description: "La station a été créée avec succès",
        });
        navigate('/stations');
      } else {
        const { error } = await supabase
          .from('station')
          .update(updateData)
          .eq('id', id);
        
        if (error) throw error;
        
        toast({
          title: "Station mise à jour",
          description: "Les modifications ont été sauvegardées",
        });
        setEditing(false);
        fetchStation();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications",
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
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/stations')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
                {isNewStation ? 'Nouvelle Station' : station?.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isNewStation ? 'Créer une nouvelle station d\'activité' : 'Détails et gestion de la station'}
              </p>
            </div>
          </div>

          {canManageStations() && !isNewStation && (
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="w-4 h-4" />
                    Sauvegarder
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)}>
                  Modifier
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations principales */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Waves className="w-5 h-5 text-ocean-primary" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nom de la station</Label>
                {editing || isNewStation ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Lancer de précision"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">{station?.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                {editing || isNewStation ? (
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description de l'activité..."
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">{station?.description || 'Aucune description'}</p>
                )}
              </div>

              {!isNewStation && station?.activity && (
                <div>
                  <Label>Activité associée</Label>
                  <Badge variant="outline" className="mt-1">
                    {station.activity.name}
                  </Badge>
                </div>
              )}

              {!isNewStation && (
                <div>
                  <Label>QR Code</Label>
                  <p className="text-sm font-mono text-muted-foreground mt-1">{station?.qr_code}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image de la station */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-ocean-primary" />
                Image de la station
              </CardTitle>
              <CardDescription>
                Ajoutez une image pour illustrer cette station d'activité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing || isNewStation ? (
                <div>
                  <Label htmlFor="image_url">URL de l'image</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Vous pouvez utiliser une URL d'image externe ou uploader une image
                  </p>
                </div>
              ) : null}

              {(formData.image_url || station?.image_url) && (
                <div className="relative">
                  <img
                    src={formData.image_url || station?.image_url}
                    alt={formData.name || station?.name}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {!(formData.image_url || station?.image_url) && (
                <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucune image</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isNewStation && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate('/stations')}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Créer la station
            </Button>
          </div>
        )}
      </div>
    </BiancottoLayout>
  );
}