import { BiancottoLayout } from "@/components/BiancottoLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fish, Waves, Users, Trophy, Activity, MapPin } from "lucide-react";
import heroImage from "@/assets/biancotto-hero.jpg";

const Index = () => {
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
                Biancotto
              </h1>
              <p className="text-xl md:text-2xl text-foam/90">
                Journées Sportives Maritimes
              </p>
              <p className="text-foam/70 mt-2">
                Gestion complète des centres, stations et records en temps réel
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-soft hover:shadow-medium transition-all bg-gradient-to-br from-card to-wave/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Fish className="w-4 h-4 text-ocean-primary" />
              Centres Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ocean-deep">2</div>
            <p className="text-xs text-muted-foreground">
              Atlantique, Pacifique
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-all bg-gradient-to-br from-card to-wave/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Waves className="w-4 h-4 text-turquoise" />
              Stations Disponibles
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
              Groupes Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ocean-deep">6</div>
            <p className="text-xs text-muted-foreground">
              🐬 2 • 🐢 2 • 🦈 2
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

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-soft hover:shadow-medium transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-ocean-deep">
              <Fish className="w-5 h-5 text-ocean-primary" />
              Gérer les Centres
            </CardTitle>
            <CardDescription>
              Accédez à vos centres aquatiques et leurs groupes d'animaux marins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-gradient-ocean hover:shadow-soft transition-all">
              Voir les Centres
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-ocean-deep">
              <Waves className="w-5 h-5 text-turquoise" />
              Stations d'Activités
            </CardTitle>
            <CardDescription>
              Surveillez l'occupation et la disponibilité des stations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-gradient-coral hover:shadow-soft transition-all">
              Voir les Stations
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-ocean-deep">
              <Trophy className="w-5 h-5 text-or" />
              Hall des Records
            </CardTitle>
            <CardDescription>
              Consultez les meilleures performances et records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-gradient-ocean hover:shadow-soft transition-all">
              Voir les Records
            </Button>
          </CardContent>
        </Card>
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
