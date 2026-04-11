"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, Wallet } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 border-b bg-background/95 backdrop-blur flex items-center justify-between px-4 z-40">
        <div className="flex items-center min-w-0">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="mr-3 inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 min-w-0">
            <Wallet className="h-5 w-5 shrink-0" />
            <span className="font-semibold tracking-tight truncate">Budget Tracker</span>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <main className="flex-1 min-w-0 p-4 lg:p-8 pt-20 lg:pt-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
