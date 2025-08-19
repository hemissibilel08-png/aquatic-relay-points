import { ReactNode } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BiancottoSidebar } from "./BiancottoSidebar";
import { BiancottoHeader } from "./BiancottoHeader";

interface BiancottoLayoutProps {
  children: ReactNode;
}

export function BiancottoLayout({ children }: BiancottoLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-wave">
        <BiancottoSidebar />
        
        <div className="flex-1 flex flex-col">
          <BiancottoHeader />
          
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      
      <Toaster />
      <Sonner />
    </SidebarProvider>
  );
}