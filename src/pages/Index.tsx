import { BiancottoLayout } from "@/components/BiancottoLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fish, Waves, Users, Trophy, Activity, MapPin, Shield, Settings } from "lucide-react";
import { useUserCentre } from "@/hooks/useUserCentre";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/biancotto-hero.jpg";

const Index = () => {
  const { 
    userCentre, 
    loading, 
    isAdmin, 
    isFacilitateur, 
    isRev, 
    hasStaffAccess, 
    canAccessAdmin 
  } = useUserCentre();
  const navigate = useNavigate();

  if (loading) {
    return (
      <BiancottoLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-primary"></div>
        </div>
      </BiancottoLayout>
    );
  }

  // Contenu personnalisé selon le rôle
  const getRoleSpecificContent = () => {
    if (isAdmin) {
      return {
        title: "Tableau de Bord Administrateur",
        subtitle: "Gestion complète du système Biancotto",
        actions: [
          {
            title: "Gestion des Centres",
            description: "Administrer tous les centres et leurs configurations",
            icon: Fish,
            action: () => navigate('/centres'),
            gradient: "bg-gradient-ocean"
          },
          {
            title: "Configuration Système",
            description: "Paramètres globaux et outils d'administration",
            icon: Settings,
            action: () => navigate('/admin'),
            gradient: "bg-gradient-coral"
          },
          {
            title: "Gestion des Équipes",
            description: "Superviser les facilitateurs et responsables",
            icon: Users,
            action: () => navigate('/facilitateurs'),
            gradient: "bg-gradient-ocean"
          }
        ]
      };
    }

    if (isFacilitateur()) {
      return {
        title: `Tableau de Bord Facilitateur`,
        subtitle: `Centre: ${userCentre.centre_name || 'Non assigné'}`,
        actions: [
          {
            title: "Mon Centre",
            description: "Gérer les groupes et suivre les activités",
            icon: Fish,
            action: () => navigate('/centre'),
            gradient: "bg-gradient-ocean"
          },
          {
            title: "Stations d'Activités",
            description: "Superviser et gérer les stations",
            icon: Waves,
            action: () => navigate('/stations'),
            gradient: "bg-gradient-coral"
          },
          {
            title: "Gestion d'Équipe",
            description: "Coordonner les activités et les facilitateurs",
            icon: Users,
            action: () => navigate('/facilitateurs'),
            gradient: "bg-gradient-ocean"
          }
        ]
      };
    }

    if (isRev()) {
      return {
        title: "Tableau de Bord Responsable",
        subtitle: `Centre: ${userCentre.centre_name || 'Non assigné'}`,
        actions: [
          {
            title: "Mon Centre",
            description: "Suivre les performances et statistiques",
            icon: Fish,
            action: () => navigate('/centre'),
            gradient: "bg-gradient-ocean"
          },
          {
            title: "Hall des Records",
            description: "Consulter les performances et classements",
            icon: Trophy,
            action: () => navigate('/records'),
            gradient: "bg-gradient-coral"
          },
          {
            title: "Vue Responsable",
            description: "Outils et rapports de supervision",
            icon: Shield,
            action: () => navigate('/rev'),
            gradient: "bg-gradient-ocean"
          }
        ]
      };
    }

    // Utilisateur simple ou sans rôle
    return {
      title: "Biancotto - Journées Sportives",
      subtitle: "Découvrez les activités maritimes",
      actions: [
        {
          title: "Voir les Stations",
          description: "Découvrir les activités disponibles",
          icon: Waves,
          action: () => navigate('/stations'),
          gradient: "bg-gradient-ocean"
        },
        {
          title: "Énigmes Marines",
          description: "Résoudre des énigmes pour gagner des points",
          icon: Activity,
          action: () => navigate('/enigmes'),
          gradient: "bg-gradient-coral"
        },
        {
          title: "Hall des Records",
          description: "Voir les meilleures performances",
          icon: Trophy,
          action: () => navigate('/records'),
          gradient: "bg-gradient-ocean"
        }
      ]
    };
  };

  const content = getRoleSpecificContent();
  return (
    <BiancottoLayout>
      {/* Hero Section */}
      <div className="relative mb-8 rounded-xl overflow-hidden shadow-strong">
        <div 
          className="h-64 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-ocean/80 flex items-center justify-center">
            <div className="text-center text-foam">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {content.title}
              </h1>
              <p className="text-xl md:text-2xl text-foam/90">
                {content.subtitle}
              </p>
              {userCentre.centre_name && (
                <Badge 
                  variant="secondary" 
                  className="mt-4 bg-foam/20 text-foam border-foam/30"
                >
                  {userCentre.user_role === 'admin' ? 'Administrateur' : 
                   isFacilitateur() ? 'Facilitateur' : 
                   isRev() ? 'Responsable' : 'Utilisateur'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats rapides - conditionnelles */}
      {hasStaffAccess && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-soft hover:shadow-medium transition-all bg-gradient-to-br from-card to-wave/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Fish className="w-4 h-4 text-ocean-primary" />
                {isAdmin ? 'Centres Actifs' : 'Mon Centre'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ocean-deep">
                {isAdmin ? '2' : '1'}
              </div>
              <p className="text-xs text-muted-foreground">
                {userCentre.centre_name || 'Centre non assigné'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-all bg-gradient-to-br from-card to-wave/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Waves className="w-4 h-4 text-turquoise" />
                Stations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ocean-deep">4</div>
              <p className="text-xs text-muted-foreground">
                3 libres, 1 occupée
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-all bg-gradient-to-br from-card to-wave/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-aqua" />
                Groupes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ocean-deep">
                {userCentre.groups?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Groupes actifs
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-all bg-gradient-to-br from-card to-wave/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4 text-or" />
                Records Aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ocean-deep">0</div>
              <p className="text-xs text-muted-foreground">
                Aucun record établi
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions rapides personnalisées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {content.actions.map((action, index) => (
          <Card key={index} className="shadow-soft hover:shadow-medium transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-ocean-deep">
                <action.icon className="w-5 h-5 text-ocean-primary" />
                {action.title}
              </CardTitle>
              <CardDescription>
                {action.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className={`w-full ${action.gradient} hover:shadow-soft transition-all`}
                onClick={action.action}
              >
                Accéder
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info système */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-muted">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-status-libre" />
            <span className="text-sm font-medium">Système Biancotto</span>
            <Badge variant="outline" className="text-xs">
              v1.0.0 MVP
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Prêt pour les journées sportives maritimes
          </div>
        </div>
      </div>
    </BiancottoLayout>
  );
};

export default Index;
