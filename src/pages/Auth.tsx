import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Anchor, Mail, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithMagicLink, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    await signInWithMagicLink(email);
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    if (!error) {
      navigate('/');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    await signUp(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-wave flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-4">
            <Anchor className="w-8 h-8 text-foam" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
            Biancotto
          </h1>
          <p className="text-muted-foreground mt-2">
            Journées Sportives Maritimes
          </p>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-center text-ocean-deep">Authentification</CardTitle>
            <CardDescription className="text-center">
              Accès animateurs et responsables
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="magic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="magic">Magic Link</TabsTrigger>
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
              
              <TabsContent value="magic" className="mt-6">
                <div className="text-center mb-4">
                  <Sparkles className="w-8 h-8 text-ocean-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Recevez un lien de connexion par email
                  </p>
                </div>
                
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="magic-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="magic-email"
                        type="email"
                        placeholder="animateur@centre.fr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-gradient-ocean hover:opacity-90 transition-opacity"
                    disabled={loading}
                  >
                    {loading ? 'Envoi en cours...' : 'Envoyer le Magic Link'}
                  </Button>
                </form>
                
                <div className="mt-4 p-3 bg-ocean-light/10 rounded-lg">
                  <p className="text-xs text-muted-foreground text-center">
                    💡 Idéal pour les équipes : 4 animateurs + 1 responsable par centre
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-gradient-ocean hover:opacity-90 transition-opacity"
                    disabled={loading}
                  >
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum 6 caractères
                    </p>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-gradient-coral hover:opacity-90 transition-opacity"
                    disabled={loading}
                  >
                    {loading ? 'Inscription...' : "S'inscrire"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <p className="text-center text-sm text-muted-foreground mt-6">
          🌊 Système d'authentification sécurisé pour les équipes d'animation
        </p>
      </div>
    </div>
  );
}