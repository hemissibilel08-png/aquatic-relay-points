import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Centre from "./pages/Centre";
import Centres from "./pages/Centres";
import Stations from "./pages/Stations";
import Station from "./pages/Station";
import Facilitateurs from "./pages/Facilitateurs";
import Rev from "./pages/Rev";
import Admin from "./pages/Admin";
import Records from "./pages/Records";
import NotFound from "./pages/NotFound";

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
            <Route path="/centres" element={
              <ProtectedRoute>
                <Centres />
              </ProtectedRoute>
            } />
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
            <Route path="/facilitateurs" element={
              <ProtectedRoute>
                <Facilitateurs />
              </ProtectedRoute>
            } />
            <Route path="/rev" element={
              <ProtectedRoute>
                <Rev />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/records" element={
              <ProtectedRoute>
                <Records />
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
