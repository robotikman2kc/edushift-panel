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
            <div className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(30deg, transparent 48%, hsl(var(--muted-foreground) / 0.08) 49%, hsl(var(--muted-foreground) / 0.08) 51%, transparent 52%),
                  linear-gradient(150deg, transparent 48%, hsl(var(--muted-foreground) / 0.08) 49%, hsl(var(--muted-foreground) / 0.08) 51%, transparent 52%)
                `,
                backgroundSize: '60px 60px'
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