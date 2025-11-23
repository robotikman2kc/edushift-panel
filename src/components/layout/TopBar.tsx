import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AcademicYearSelector } from "@/components/common/AcademicYearSelector";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User, Settings, Circle, Clock, Calendar as CalendarIcon, RotateCcw, AlertTriangle, Moon, Sun, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { indexedDB } from "@/lib/indexedDB";
import { opfsStorage } from "@/lib/opfsStorage";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function TopBar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('selectedDate');
    return saved ? new Date(saved) : new Date();
  });
  const [showBackupWarning, setShowBackupWarning] = useState(false);
  const [daysSinceBackup, setDaysSinceBackup] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [avatarBlobUrl, setAvatarBlobUrl] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  // Track navigation history
  useEffect(() => {
    const checkNavigationState = () => {
      setCanGoBack(window.history.length > 1);
      // We can't reliably check forward history, so we'll track it manually
    };
    
    checkNavigationState();
    
    // Listen for navigation events
    window.addEventListener('popstate', checkNavigationState);
    
    return () => {
      window.removeEventListener('popstate', checkNavigationState);
    };
  }, []);

  const handleBack = () => {
    if (canGoBack) {
      navigate(-1);
    }
  };

  const handleForward = () => {
    navigate(1);
  };

  // Update time only (not date) every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Koneksi Tersambung",
        description: "Anda kembali online",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        variant: "destructive",
        title: "Koneksi Terputus",
        description: "Anda sedang offline. Beberapa fitur mungkin tidak tersedia.",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Load profile from localStorage
  useEffect(() => {
    const loadProfile = async () => {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          
          // IMPORTANT: Clean up invalid blob:// URLs from localStorage
          if (parsed.avatar_url && parsed.avatar_url.startsWith('blob:')) {
            parsed.avatar_url = '';
            localStorage.setItem('userProfile', JSON.stringify(parsed));
            setUserProfile(parsed);
            return;
          }
          
          // Selalu load avatar dari OPFS jika menggunakan opfs://
          if (parsed.avatar_url && parsed.avatar_url.startsWith('opfs://')) {
            const file = await opfsStorage.getFile(parsed.avatar_url);
            if (file && file instanceof Blob) {
              // Cleanup old blob URL
              if (avatarBlobUrl) {
                URL.revokeObjectURL(avatarBlobUrl);
              }
              
              // Create new blob URL
              const newBlobUrl = URL.createObjectURL(file);
              setAvatarBlobUrl(newBlobUrl);
              setUserProfile(parsed);
            } else if (typeof file === 'string') {
              // base64 fallback
              setAvatarBlobUrl(null);
              setUserProfile({ ...parsed, avatar_url: file });
            } else {
              console.error('TopBar failed to load avatar from OPFS');
              setAvatarBlobUrl(null);
              setUserProfile({ ...parsed, avatar_url: '' });
            }
            return;
          }
          
          // Non-OPFS - cleanup blob URL
          if (avatarBlobUrl) {
            URL.revokeObjectURL(avatarBlobUrl);
            setAvatarBlobUrl(null);
          }
          setUserProfile(parsed);
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    };

    loadProfile();

    // Listen for profile updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userProfile') {
        loadProfile();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-window updates
    const handleProfileUpdate = () => {
      loadProfile();
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      // Cleanup blob URL on unmount
      if (avatarBlobUrl) {
        URL.revokeObjectURL(avatarBlobUrl);
      }
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [avatarBlobUrl]);

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

  // Save and broadcast date changes
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    localStorage.setItem('selectedDate', date.toISOString());
    // Broadcast to other components
    window.dispatchEvent(new CustomEvent('dateChanged', { detail: date }));
  };

  const handleResetToToday = () => {
    const today = new Date();
    handleDateChange(today);
  };

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
        <div className="flex h-full items-center justify-between px-2 sm:px-4 gap-2">
          {/* Left Section */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <SidebarTrigger className="h-8 w-8 flex-shrink-0" />
            
            {/* Navigation Back/Forward Buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={!canGoBack}
                className="h-8 w-8 p-0"
                title="Halaman sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleForward}
                className="h-8 w-8 p-0"
                title="Halaman berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Status & Time - Hidden on very small screens */}
            <div className="hidden sm:flex items-center gap-2 lg:gap-4 min-w-0">
              <div className="flex items-center gap-2">
                <Circle 
                  className={`h-2.5 w-2.5 flex-shrink-0 animate-pulse ${
                    isOnline 
                      ? 'fill-emerald-500 text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]' 
                      : 'fill-red-500 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                  }`} 
                />
                <Badge 
                  variant="secondary" 
                  className={`flex-shrink-0 font-medium ${
                    isOnline
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-700'
                      : 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-700'
                  }`}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
              
              {/* Date & Time - Hidden on tablets */}
              <div className="hidden lg:flex items-center gap-4 text-sm text-muted-foreground">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 h-8 px-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="truncate">{format(selectedDate, "EEEE, dd MMMM yyyy", { locale: id })}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3 border-b flex items-center justify-between">
                      <span className="text-sm font-medium">Pilih Tanggal</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleResetToToday}
                        className="h-7 text-xs"
                      >
                        Hari Ini
                      </Button>
                    </div>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && handleDateChange(date)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{format(currentTime, "HH:mm:ss")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
            {/* Academic Year Selector - Always visible but might be compact */}
            <div className="hidden sm:block">
              <AcademicYearSelector />
            </div>
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8 p-0 flex-shrink-0"
              title="Toggle tema"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            {/* Refresh Database - Hidden on mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshDatabase}
              className="h-8 w-8 p-0 hidden md:flex flex-shrink-0"
              title="Refresh Database"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0 flex-shrink-0">
                  <Avatar className="h-8 w-8 border-2 border-primary">
                    <AvatarImage 
                      src={userProfile?.avatar_url?.startsWith('opfs://') ? avatarBlobUrl || '' : userProfile?.avatar_url}
                      onError={(e) => e.currentTarget.src = ''}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userProfile?.nama ? userProfile.nama.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'AD'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border-border z-50">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8 border-2 border-primary">
                    <AvatarImage 
                      src={userProfile?.avatar_url?.startsWith('opfs://') ? avatarBlobUrl || '' : userProfile?.avatar_url}
                      onError={(e) => e.currentTarget.src = ''}
                    />
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
                
                {/* Show Academic Year in dropdown on mobile */}
                <div className="sm:hidden px-2 py-1.5">
                  <AcademicYearSelector />
                </div>
                <DropdownMenuSeparator className="sm:hidden" />
                
                <DropdownMenuItem onClick={() => navigate('/akun/profil')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Pengaturan</span>
                </DropdownMenuItem>
                
                {/* Show Refresh Database in dropdown on mobile */}
                <DropdownMenuSeparator className="md:hidden" />
                <DropdownMenuItem onClick={handleRefreshDatabase} className="md:hidden">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  <span>Refresh Database</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}