import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, RotateCcw, AlertCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSessionCentre } from "@/hooks/useSessionCentre";

interface QrCameraScannerProps {
  onClose?: () => void;
}

export function QrCameraScanner({ onClose }: QrCameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sessionCentre } = useSessionCentre();

  useEffect(() => {
    initializeScanner();
    return () => {
      cleanup();
    };
  }, []);

  const initializeScanner = async () => {
    try {
      // Vérifier le support HTTPS
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        setError('Le scanner QR nécessite HTTPS ou localhost pour accéder à la caméra.');
        return;
      }

      // Vérifier le support getUserMedia
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Votre navigateur ne supporte pas l\'accès à la caméra.');
        return;
      }

      // Obtenir les devices de caméra
      const videoDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      console.log('📷 Caméras trouvées:', videoDevices);
      
      if (videoDevices.length === 0) {
        setError('Aucune caméra trouvée sur cet appareil.');
        return;
      }

      setDevices(videoDevices);
      
      // Préférer la caméra arrière (environment)
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('environment') ||
        device.label.toLowerCase().includes('rear')
      );
      
      const selectedDevice = backCamera || videoDevices[0];
      setSelectedDeviceId(selectedDevice.deviceId);
      
      // Initialiser le reader
      codeReaderRef.current = new BrowserMultiFormatReader();
      
      // Démarrer le scan automatiquement
      await startScanning(selectedDevice.deviceId);
      
    } catch (error) {
      console.error('❌ Erreur initialisation scanner:', error);
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          setError('Permission d\'accès à la caméra refusée. Veuillez autoriser et réessayer.');
          setHasPermission(false);
        } else if (error.name === 'NotFoundError') {
          setError('Aucune caméra trouvée sur cet appareil.');
        } else {
          setError(`Erreur caméra: ${error.message}`);
        }
      } else {
        setError('Impossible d\'initialiser le scanner QR.');
      }
    }
  };

  const startScanning = async (deviceId?: string) => {
    if (!videoRef.current || !codeReaderRef.current) return;

    try {
      setError(null);
      setIsScanning(true);
      setHasPermission(null);

      const selectedDevice = deviceId || selectedDeviceId;
      console.log('🎯 Démarrage scan avec device:', selectedDevice);

      // Contraintes pour la caméra arrière
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          facingMode: selectedDevice ? undefined : { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      // Obtenir le stream vidéo
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      setHasPermission(true);

      // Démarrer la détection continue
      codeReaderRef.current.decodeFromVideoDevice(
        selectedDevice,
        videoRef.current,
        (result, error) => {
          if (result) {
            const qrText = result.getText();
            console.log('🎉 QR détecté:', qrText);
            handleQrDetected(qrText);
          } else if (error) {
            // Ignorer les erreurs de décodage normales
            console.error('⚠️ Erreur décodage:', error);
          }
        }
      );
      
    } catch (error) {
      console.error('❌ Erreur démarrage scan:', error);
      setIsScanning(false);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          setError('Permission d\'accès à la caméra refusée.');
          setHasPermission(false);
        } else if (error.name === 'NotFoundError') {
          setError('Caméra non trouvée ou déjà utilisée.');
        } else {
          setError(`Erreur caméra: ${error.message}`);
        }
      } else {
        setError('Impossible de démarrer la caméra.');
      }
    }
  };

  const handleQrDetected = async (qrText: string) => {
    cleanup();
    
    try {
      // Parse QR biancotto://
      if (qrText.startsWith('biancotto://')) {
        const url = new URL(qrText);
        const type = url.hostname;
        
        switch (type) {
          case 'station':
            const stationId = url.searchParams.get('sid');
            if (stationId) {
              await handleStationScan(stationId);
              return;
            }
            break;
          case 'centre':
            const centreId = url.searchParams.get('cid');
            if (centreId) {
              navigate(`/centre/${centreId}`);
              return;
            }
            break;
          case 'staff':
            const staffId = url.searchParams.get('sid');
            if (staffId) {
              navigate(`/facilitateur/${staffId}`);
              return;
            }
            break;
        }
      }
      
      // QR legacy ou non-Biancotto
      toast({
        title: "QR Code détecté",
        description: `Contenu: ${qrText}`,
        variant: "destructive",
      });
      
    } catch (error) {
      console.error('❌ Erreur parsing QR:', error);
      toast({
        title: "QR Code invalide",
        description: "Format non reconnu",
        variant: "destructive",
      });
    }
  };

  const handleStationScan = async (stationId: string) => {
    if (!sessionCentre.centre_id) {
      toast({
        title: "Session requise",
        description: "Veuillez sélectionner un groupe avant de scanner",
        variant: "destructive",
      });
      navigate(`/station/${stationId}`);
      return;
    }

    try {
      // Démarrer automatiquement l'occupation
      const { data, error } = await supabase.rpc('start_occupation', {
        p_station_id: stationId,
        p_centre_id: sessionCentre.centre_id
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        toast({
          title: "Station occupée ! 🌊",
          description: "Vous avez scanné et occupé la station",
        });
        navigate(`/station/${stationId}`);
      } else if (result?.error === 'collision') {
        toast({
          title: "Station occupée",
          description: `Cette station est déjà occupée par ${result.occupied_by}`,
          variant: "destructive",
        });
        navigate(`/station/${stationId}`);
      } else if (result?.error === 'needs_facilitator') {
        toast({
          title: "Facilitateur requis",
          description: "Cette activité nécessite la présence d'un facilitateur",
          variant: "destructive",
        });
        navigate(`/station/${stationId}`);
      }
    } catch (error) {
      console.error('Erreur occupation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'occuper la station automatiquement",
        variant: "destructive",
      });
      navigate(`/station/${stationId}`);
    }
  };

  const switchCamera = async () => {
    if (devices.length <= 1) return;
    
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    
    setSelectedDeviceId(nextDevice.deviceId);
    
    cleanup();
    await startScanning(nextDevice.deviceId);
  };

  const requestPermission = async () => {
    setError(null);
    await startScanning();
  };

  const cleanup = () => {
    if (codeReaderRef.current) {
      try {
        // Pas de méthode reset, utiliser les streams directement
        codeReaderRef.current = null;
      } catch (error) {
        console.log('Reader cleanup failed');
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-ocean-deep flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-ocean-primary" />
              <h2 className="text-lg font-semibold">Scanner QR</h2>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Zone vidéo */}
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            
            {/* Overlay de visée */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-ocean-primary rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-ocean-primary rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-ocean-primary rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-ocean-primary rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-ocean-primary rounded-br-lg"></div>
                </div>
              </div>
            )}

            {/* Message d'état */}
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/90">
                <div className="text-center">
                  {error ? (
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {error || 'Préparation de la caméra...'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-3">
            {error && hasPermission === false && (
              <Button 
                onClick={requestPermission}
                className="w-full bg-gradient-ocean"
              >
                Réessayer l'accès à la caméra
              </Button>
            )}
            
            {isScanning && devices.length > 1 && (
              <Button 
                variant="outline" 
                onClick={switchCamera}
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Changer de caméra
              </Button>
            )}
            
            {isScanning && (
              <p className="text-xs text-center text-muted-foreground">
                Pointez la caméra vers un QR code Biancotto
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}