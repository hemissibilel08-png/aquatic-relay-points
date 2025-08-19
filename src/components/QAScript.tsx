import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  Users,
  MapPin,
  Trophy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QATest {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  result?: string;
}

export function QAScript() {
  const [tests, setTests] = useState<QATest[]>([
    {
      id: 'collision',
      name: 'Test Collision Stations',
      description: 'Vérifier qu\'aucune station n\'a de collision d\'occupation',
      status: 'pending'
    },
    {
      id: 'autorelease',
      name: 'Test Auto-Release 20min',
      description: 'Vérifier que les occupations inactives sont libérées',
      status: 'pending'
    },
    {
      id: 'profiles',
      name: 'Test Profils M/E',
      description: 'Vérifier la cohérence des profils Maternelle/Élémentaire',
      status: 'pending'
    },
    {
      id: 'records',
      name: 'Test Calcul Records',
      description: 'Vérifier le calcul des points et records',
      status: 'pending'
    },
    {
      id: 'facilitators',
      name: 'Test Limite Facilitateurs',
      description: 'Vérifier la limite de 4 stations supervisées',
      status: 'pending'
    },
    {
      id: 'rainmode',
      name: 'Test Mode Pluie',
      description: 'Vérifier le basculement vers fallback_zone',
      status: 'pending'
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const updateTestStatus = (id: string, status: QATest['status'], result?: string) => {
    setTests(prev => prev.map(test => 
      test.id === id ? { ...test, status, result } : test
    ));
  };

  const runSingleTest = async (testId: string) => {
    updateTestStatus(testId, 'running');
    
    try {
      switch (testId) {
        case 'collision':
          await testStationCollisions();
          break;
        case 'autorelease':
          await testAutoRelease();
          break;
        case 'profiles':
          await testProfiles();
          break;
        case 'records':
          await testRecordsCalculation();
          break;
        case 'facilitators':
          await testFacilitatorLimit();
          break;
        case 'rainmode':
          await testRainMode();
          break;
        default:
          throw new Error(`Test inconnu: ${testId}`);
      }
    } catch (error: any) {
      updateTestStatus(testId, 'failed', error.message);
    }
  };

  const testStationCollisions = async () => {
    const { data, error } = await supabase
      .from('occupation')
      .select('station_id, status')
      .eq('status', 'occupee');
      
    if (error) throw error;
    
    const stationIds = data?.map(o => o.station_id) || [];
    const duplicates = stationIds.filter((id, index) => stationIds.indexOf(id) !== index);
    
    if (duplicates.length > 0) {
      throw new Error(`Collision détectée sur ${duplicates.length} station(s)`);
    }
    
    updateTestStatus('collision', 'passed', `✓ Aucune collision sur ${stationIds.length} stations occupées`);
  };

  const testAutoRelease = async () => {
    const { data, error } = await supabase
      .from('occupation')
      .select('id, since')
      .eq('status', 'occupee')
      .lt('since', new Date(Date.now() - 20 * 60 * 1000).toISOString());
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      throw new Error(`${data.length} occupation(s) dépassent 20 minutes`);
    }
    
    updateTestStatus('autorelease', 'passed', '✓ Aucune occupation > 20min détectée');
  };

  const testProfiles = async () => {
    const { data, error } = await supabase
      .from('centre')
      .select('id, name, profile')
      .not('profile', 'in', '(elementaire,maternelle)');
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      throw new Error(`${data.length} centre(s) avec profil invalide`);
    }
    
    updateTestStatus('profiles', 'passed', '✓ Tous les profils sont valides (M/E)');
  };

  const testRecordsCalculation = async () => {
    try {
      const { data, error } = await (supabase as any).rpc('calculate_activity_points', {
        activity_type: 'activite',
        activity_family: 'lance',
        raw_result: '10',
        thresholds_elem: { excellent: 15, bon: 10, passable: 5 },
        thresholds_mat: { excellent: 10, bon: 7, passable: 3 },
        centre_profile: 'elementaire',
        is_co_validated: false,
        hint_used: false,
        attempt_count: 1
      });
      
      if (error) throw error;
      
      if (!data || typeof data !== 'object') {
        throw new Error('Fonction de calcul des points ne répond pas correctement');
      }
      
      updateTestStatus('records', 'passed', '✓ Calcul des points fonctionne');
    } catch (error: any) {
      throw new Error(`Erreur calcul points: ${error.message}`);
    }
  };

  const testFacilitatorLimit = async () => {
    const { data, error } = await supabase
      .from('presence')
      .select('id, staff_id')
      .is('ended_at', null);
      
    if (error) throw error;
    
    const activeCount = data?.length || 0;
    if (activeCount > 4) {
      throw new Error(`${activeCount} facilitateurs actifs (limite: 4)`);
    }
    
    updateTestStatus('facilitators', 'passed', `✓ ${activeCount}/4 facilitateurs actifs`);
  };

  const testRainMode = async () => {
    const { data: zones, error } = await supabase
      .from('zone')
      .select('id, name, fallback_zone_id')
      .not('fallback_zone_id', 'is', null);
      
    if (error) throw error;
    
    if (!zones || zones.length === 0) {
      throw new Error('Aucune zone avec fallback configurée');
    }
    
    updateTestStatus('rainmode', 'passed', `✓ ${zones.length} zone(s) avec fallback configurée(s)`);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      try {
        await runSingleTest(test.id);
        passed++;
      } catch (error) {
        failed++;
      }
      // Petite pause entre les tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
    
    toast({
      title: `Tests QA Terminés`,
      description: `${passed} réussis, ${failed} échués sur ${tests.length} tests`,
      variant: failed > 0 ? "destructive" : "default",
    });
  };

  const getStatusIcon = (status: QATest['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-status-libre" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-coral" />;
      case 'running':
        return <Clock className="w-4 h-4 text-ocean-primary animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: QATest['status']) => {
    switch (status) {
      case 'passed':
        return <Badge variant="outline" className="text-status-libre border-status-libre/30">Réussi</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-coral border-coral/30">Échec</Badge>;
      case 'running':
        return <Badge variant="outline" className="text-ocean-primary border-ocean-primary/30">En cours...</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ocean-deep">Script de Tests QA</h3>
        <Button 
          onClick={runAllTests}
          disabled={isRunning}
          className="gap-2"
        >
          <TestTube className="w-4 h-4" />
          {isRunning ? 'Tests en cours...' : 'Lancer tous les tests'}
        </Button>
      </div>

      <div className="space-y-3">
        {tests.map((test) => (
          <Card key={test.id} className={`transition-all ${
            test.status === 'passed' ? 'border-status-libre/30 bg-status-libre/5' :
            test.status === 'failed' ? 'border-coral/30 bg-coral/5' :
            test.status === 'running' ? 'border-ocean-primary/30 bg-ocean-primary/5' :
            ''
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h4 className="font-medium text-ocean-deep">{test.name}</h4>
                    <p className="text-sm text-muted-foreground">{test.description}</p>
                    {test.result && (
                      <p className="text-xs mt-1 text-muted-foreground">{test.result}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(test.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runSingleTest(test.id)}
                    disabled={isRunning || test.status === 'running'}
                  >
                    Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Résumé */}
      <Card className="bg-wave/10">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-status-libre">
                {tests.filter(t => t.status === 'passed').length}
              </div>
              <div className="text-xs text-muted-foreground">Réussis</div>
            </div>
            <div>
              <div className="text-lg font-bold text-coral">
                {tests.filter(t => t.status === 'failed').length}
              </div>
              <div className="text-xs text-muted-foreground">Échecs</div>
            </div>
            <div>
              <div className="text-lg font-bold text-ocean-primary">
                {tests.filter(t => t.status === 'running').length}
              </div>
              <div className="text-xs text-muted-foreground">En cours</div>
            </div>
            <div>
              <div className="text-lg font-bold text-muted-foreground">
                {tests.filter(t => t.status === 'pending').length}
              </div>
              <div className="text-xs text-muted-foreground">En attente</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}