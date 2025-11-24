import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 p-6 bg-muted/30 relative overflow-auto">
            <div className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 50%, transparent 20%, hsl(var(--muted-foreground) / 0.06) 21%, hsl(var(--muted-foreground) / 0.06) 22%, transparent 23%),
                  radial-gradient(circle at 80% 50%, transparent 20%, hsl(var(--muted-foreground) / 0.06) 21%, hsl(var(--muted-foreground) / 0.06) 22%, transparent 23%),
                  radial-gradient(circle at 50% 20%, transparent 15%, hsl(var(--muted-foreground) / 0.04) 16%, transparent 17%),
                  radial-gradient(circle at 50% 80%, transparent 15%, hsl(var(--muted-foreground) / 0.04) 16%, transparent 17%),
                  linear-gradient(135deg, transparent 48%, hsl(var(--muted-foreground) / 0.03) 49%, transparent 51%),
                  linear-gradient(45deg, transparent 48%, hsl(var(--muted-foreground) / 0.03) 49%, transparent 51%),
                  repeating-linear-gradient(60deg, transparent, transparent 10px, hsl(var(--muted-foreground) / 0.02) 10px, hsl(var(--muted-foreground) / 0.02) 11px),
                  repeating-linear-gradient(120deg, transparent, transparent 10px, hsl(var(--muted-foreground) / 0.02) 10px, hsl(var(--muted-foreground) / 0.02) 11px)
                `,
                backgroundSize: '100px 100px, 100px 100px, 80px 80px, 80px 80px, 40px 40px, 40px 40px, 60px 60px, 60px 60px',
                backgroundPosition: '0 0, 50px 50px, 25px 25px, 75px 75px, 0 0, 20px 20px, 0 0, 30px 30px'
              }}
            />
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}