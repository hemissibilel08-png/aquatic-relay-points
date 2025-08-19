import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";

export function BiancottoHeader() {
  return (
    <header className="h-16 bg-card border-b border-border shadow-soft flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="h-6 w-px bg-border" />
        <div>
          <h2 className="text-lg font-semibold text-ocean-deep">Dashboard Maritime</h2>
          <p className="text-sm text-muted-foreground">Gestion des activités en cours</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-status-libre rounded-full animate-pulse" />
          <span>En ligne</span>
        </div>
        
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Profil</span>
        </Button>
        
        <Button variant="ghost" size="sm" className="gap-2 text-coral hover:text-coral/80">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Déconnexion</span>
        </Button>
      </div>
    </header>
  );
}