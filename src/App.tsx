import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RoleProtectedRoute } from "./components/auth/RoleProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Centre from "./pages/Centre";
import Centres from "./pages/Centres";
import Stations from "./pages/Stations";
import Station from "./pages/Station";
import StationDetail from "./pages/StationDetail";
import Enigmes from "./pages/Enigmes";
import Facilitateurs from "./pages/Facilitateurs";
import Rev from "./pages/Rev";
import Admin from "./pages/Admin";
import Records from "./pages/Records";
import Historique from "./pages/Historique";
import NotFound from "./pages/NotFound";
import Scan from "./pages/Scan";
import { QRScanner } from "./components/QRScanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/centre" element={
              <ProtectedRoute>
                <Centre />
              </ProtectedRoute>
            } />
            <Route
              path="/centres"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requireAdmin>
                    <Centres />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requireAdmin>
                    <Admin />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/facilitateurs"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requireStaff>
                    <Facilitateurs />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rev"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requiredRole="rev">
                    <Rev />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route path="/stations" element={
              <ProtectedRoute>
                <Stations />
              </ProtectedRoute>
            } />
            <Route path="/station/:id" element={
              <ProtectedRoute>
                <Station />
              </ProtectedRoute>
            } />
            <Route path="/enigmes" element={
              <ProtectedRoute>
                <Enigmes />
              </ProtectedRoute>
            } />
            <Route path="/records" element={
              <ProtectedRoute>
                <Records />
              </ProtectedRoute>
            } />
            <Route path="/station-detail/:id" element={
              <ProtectedRoute>
                <RoleProtectedRoute requireAdmin>
                  <StationDetail />
                </RoleProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/historique" element={
              <ProtectedRoute>
                <Historique />
              </ProtectedRoute>
            } />
            <Route path="/scan" element={
              <ProtectedRoute>
                <Scan />
              </ProtectedRoute>
            } />
            <Route path="/scanner" element={
              <ProtectedRoute>
                <QRScanner />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
