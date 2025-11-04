import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
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
import { User, Settings, Circle, Clock, Calendar, RotateCcw, AlertTriangle, Moon, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { indexedDB } from "@/lib/indexedDB";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function TopBar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showBackupWarning, setShowBackupWarning] = useState(false);
  const [daysSinceBackup, setDaysSinceBackup] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const profile = await indexedDB.selectById('users' as any, user.id);
        setUserProfile(profile);
      }
    };
    fetchUserProfile();
  }, [user]);

  // Check last backup date
  useEffect(() => {
    const checkBackupDate = () => {
      const lastBackupDate = localStorage.getItem('lastBackupDate');
      
      if (!lastBackupDate) {
        // No backup yet, show warning
        setShowBackupWarning(true);
        setDaysSinceBackup(0);
        return;
      }

      const lastBackup = new Date(lastBackupDate);
      const today = new Date();
      const daysDiff = differenceInDays(today, lastBackup);
      
      setDaysSinceBackup(daysDiff);
      
      // Show warning if more than 14 days (2 weeks)
      if (daysDiff >= 14) {
        setShowBackupWarning(true);
      } else {
        setShowBackupWarning(false);
      }
    };

    checkBackupDate();
    
    // Check daily
    const interval = setInterval(checkBackupDate, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefreshDatabase = async () => {
    try {
      await indexedDB.initializeDefaultData();
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
    <>
      {showBackupWarning && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-800 dark:text-amber-200">
              {daysSinceBackup === 0 
                ? "Anda belum pernah melakukan backup data." 
                : `Sudah ${daysSinceBackup} hari sejak backup terakhir.`} 
              {" "}Segera lakukan backup untuk mengamankan data Anda.
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/data/backup-restore')}
              className="ml-4 border-amber-600 text-amber-700 hover:bg-amber-100 dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-950"
            >
              Backup Sekarang
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
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
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8 p-0"
              title="Toggle tema"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
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
                    <AvatarImage src={userProfile?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userProfile?.nama ? userProfile.nama.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'AD'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border-border z-50">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userProfile?.nama ? userProfile.nama.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'AD'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{userProfile?.nama || 'Administrator'}</span>
                    <span className="text-xs text-muted-foreground">{userProfile?.email || 'admin@sekolah.com'}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/akun/profil')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Pengaturan</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}