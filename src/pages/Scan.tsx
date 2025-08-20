import { QrCameraScanner } from "@/components/QrCameraScanner";

export default function Scan() {
  return (
    <div className="min-h-screen bg-background">
      <QrCameraScanner />
    </div>
  );
}