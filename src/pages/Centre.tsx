import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Fish, Waves, Trophy, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BiancottoLayout } from "@/components/BiancottoLayout";
import { useSessionCentre } from "@/hooks/useSessionCentre";
import { useUserCentre } from "@/hooks/useUserCentre";

const animalIcons = {
  'Dauphins': '🐬',
  'Tortues': '🐢', 
  'Requins': '🦈'
};

export default function Centre() {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { sessionCentre, setSessionCentreData, isSessionActive } = useSessionCentre();
  const { userCentre, loading, isAdmin } = useUserCentre();

  const handleGroupSelect = async (groupLabel: string) => {
    if (!userCentre.centre_id) return;

    const { success } = await setSessionCentreData(userCentre.centre_id, groupLabel);
    
    if (success) {
      toast({
        title: "Session configurée 🌊",
        description: `Groupe ${groupLabel} sélectionné`,
      });
      setSelectedGroup(groupLabel);
    }
  };

  const quickActions = [
    {
      title: "Stations",
      description: "Voir les stations disponibles",
      icon: Waves,
      action: () => navigate('/stations'),
      color: 'bg-ocean-primary/10 text-ocean-primary hover:bg-ocean-primary/20',
      iconColor: 'text-ocean-primary'
    },
    {
      title: "Records",
      description: "Consulter les scores",
      icon: Trophy,
      action: () => navigate('/records'),
      color: 'bg-or/10 text-or hover:bg-or/20',
      iconColor: 'text-or'
    }
  ];

  if (loading) {
    return (
      <BiancottoLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-primary"></div>
        </div>
      </BiancottoLayout>
    );
  }

  // Utilisateur non configuré
  if (!userCentre.centre_id) {
    return (
      <BiancottoLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
          <Fish className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-muted-foreground">
            Compte non configuré
          </h2>
          <p className="text-muted-foreground max-w-md">
            Votre compte n'est pas encore associé à un centre. Contactez l'administrateur.
          </p>
        </div>
      </BiancottoLayout>
    );
  }

  return (
    <BiancottoLayout>
      <div className="space-y-6 px-4 md:px-0">
        {/* Header Mobile-First */}
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
            {userCentre.centre_name}
          </h1>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
            <Badge variant="outline" className={
              userCentre.centre_profile === 'maternelle' 
                ? 'text-coral border-coral/30' 
                : 'text-ocean-primary border-ocean-primary/30'
            }>
              {userCentre.centre_profile === 'maternelle' ? 'Maternelle' : 'Élémentaire'}
            </Badge>
            {isAdmin && (
              <Badge variant="secondary" className="bg-or/20 text-or">
                Admin
              </Badge>
            )}
          </div>
        </div>

        {/* Session Active - Mobile Optimized */}
        {isSessionActive() && (
          <Card className="bg-gradient-to-r from-ocean-primary/10 to-turquoise/10 border-ocean-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <Fish className="w-5 h-5 text-ocean-primary" />
                    <span className="font-semibold text-ocean-primary">Session Active</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Groupe: <span className="font-medium">{sessionCentre.group_label}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 md:flex md:gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.title}
                      onClick={action.action}
                      variant="outline"
                      size="sm"
                      className="gap-2 h-auto py-3 md:py-2"
                    >
                      <action.icon className="w-4 h-4" />
                      <span className="text-xs md:text-sm">{action.title}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sélection du groupe - Mobile First */}
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-4 text-ocean-deep text-center md:text-left">
            Choisissez votre groupe marin
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userCentre.groups.map((group) => {
              const animalName = group.label;
              const icon = animalIcons[animalName as keyof typeof animalIcons] || '🐟';
              const isSelected = sessionCentre.group_label === group.label;
              
              return (
                <Card 
                  key={group.id}
                  className={`cursor-pointer transition-all group hover:shadow-medium ${
                    isSelected ? 'ring-2 ring-ocean-primary shadow-medium' : ''
                  }`}
                  onClick={() => handleGroupSelect(group.label)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl md:text-6xl mb-4 group-hover:scale-110 transition-transform">
                      {icon}
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-ocean-deep mb-2">
                      {group.label}
                    </h3>
                    <Button 
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={isSelected ? "bg-ocean-primary" : ""}
                    >
                      {isSelected ? 'Sélectionné' : 'Sélectionner'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Actions rapides - Mobile Optimized */}
        {isSessionActive() && (
          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-ocean-deep text-center md:text-left">
              Actions Rapides
            </h2>
            
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Card 
                  key={action.title}
                  className="cursor-pointer hover:shadow-medium transition-all group"
                  onClick={action.action}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${action.color}`}>
                        <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-ocean-deep mb-1">
                          {action.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-ocean-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Bouton admin si applicable */}
        {isAdmin && (
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <Button 
                onClick={() => navigate('/admin')}
                variant="outline"
                className="gap-2"
              >
                <Fish className="w-4 h-4" />
                Administration
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </BiancottoLayout>
  );
}