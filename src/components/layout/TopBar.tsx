import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, Circle, Clock, Calendar, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { localDB } from "@/lib/localDB";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function TopBar() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Berhasil keluar",
        description: "Anda telah berhasil keluar dari sistem.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat keluar",
        variant: "destructive",
      });
    }
  };

  const handleRefreshDatabase = () => {
    try {
      localDB.initializeDefaultData();
      toast({
        title: "Database di-refresh",
        description: "Database berhasil di-refresh dengan data default.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat refresh database",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-8 w-8" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                Online
              </Badge>
            </div>
            <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(currentTime, "EEEE, dd MMMM yyyy", { locale: id })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{format(currentTime, "HH:mm:ss")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">
            Selamat datang, Administrator
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshDatabase}
            className="h-8 w-8 p-0"
            title="Refresh Database"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    AD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    AD
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Pengaturan</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}