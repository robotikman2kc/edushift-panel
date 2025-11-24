import {
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  TrendingUp,
  FileInput,
  BarChart3,
  Calendar,
  CalendarCheck,
  FileText,
  Database,
  Download,
  User,
  HelpCircle,
  Settings,
  ClipboardList,
  UserCog,
  CalendarDays,
  LayoutDashboard,
  Bell,
  Cloud,
  HardDrive,
  FileBarChart,
  BookText,
  CalendarClock,
  ChevronDown,
  Star,
  Sparkles,
  Tags,
  Trash2,
  Trophy,
  UserPlus,
  ClipboardCheck,
  ChevronsDown,
  ChevronsUp
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { opfsStorage } from "@/lib/opfsStorage";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QuickMenuManager } from "./QuickMenuManager";
import { useState, useEffect } from "react";

const menuItems = [
  {
    title: "PENGATURAN",
    icon: Settings,
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Kalender", url: "/kalender", icon: CalendarDays },
      { title: "Daftar Guru", url: "/pengaturan/guru", icon: UserCheck },
      { title: "Daftar Kelas", url: "/pengaturan/kelas", icon: GraduationCap },
      { title: "Daftar Siswa", url: "/pengaturan/siswa", icon: Users },
      { title: "Mata Pelajaran", url: "/pengaturan/mata-pelajaran", icon: BookOpen },
      { title: "Jadwal Pelajaran", url: "/pengaturan/jadwal-pelajaran", icon: CalendarDays },
      { title: "Bobot Penilaian", url: "/pengaturan/bobot-penilaian", icon: TrendingUp },
      { title: "Tahun Ajaran", url: "/pengaturan/tahun-ajaran", icon: CalendarClock },
      { title: "Format PDF", url: "/pengaturan/format-pdf", icon: FileText },
      { title: "Notifikasi", url: "/pengaturan/notifikasi", icon: Bell },
    ],
  },
  {
    title: "PENILAIAN",
    icon: ClipboardList,
    items: [
      { title: "Input Nilai", url: "/penilaian/input-nilai", icon: FileInput },
      { title: "Rekap Nilai", url: "/penilaian/rekap-nilai", icon: BarChart3 },
    ],
  },
  {
    title: "KEHADIRAN",
    icon: Calendar,
    items: [
      { title: "Input Kehadiran", url: "/kehadiran/input-kehadiran", icon: CalendarCheck },
      { title: "Rekap Kehadiran", url: "/kehadiran/rekap-kehadiran", icon: Calendar },
    ],
  },
  {
    title: "JURNAL",
    icon: FileText,
    items: [
      { title: "Jurnal Guru", url: "/jurnal/jurnal-guru", icon: FileText },
      { title: "Agenda Mengajar", url: "/jurnal/agenda-mengajar", icon: ClipboardList },
    ],
  },
  {
    title: "EKSTRAKURIKULER",
    icon: Trophy,
    items: [
      { title: "Kelola Ekstrakurikuler", url: "/ekstrakurikuler/kelola", icon: Trophy },
      { title: "Kelola Anggota", url: "/ekstrakurikuler/anggota", icon: UserPlus },
      { title: "Kehadiran Eskul", url: "/ekstrakurikuler/kehadiran", icon: ClipboardCheck },
      { title: "Input Nilai Eskul", url: "/ekstrakurikuler/input-nilai", icon: FileInput },
      { title: "Rekap Kehadiran Eskul", url: "/ekstrakurikuler/rekap-kehadiran", icon: FileBarChart },
    ],
  },
  {
    title: "LAPORAN",
    icon: FileBarChart,
    items: [
      { title: "Laporan Kehadiran", url: "/laporan/kehadiran", icon: FileText },
      { title: "Laporan Penilaian", url: "/laporan/penilaian", icon: BarChart3 },
      { title: "Laporan Jurnal Guru", url: "/laporan/jurnal-guru", icon: BookText },
    ],
  },
  {
    title: "DATA",
    icon: Database,
    items: [
      { title: "Manajemen Data", url: "/data/manajemen-data", icon: Database },
      { title: "Backup dan Restore", url: "/data/backup-restore", icon: Download },
      { title: "Backup Google Drive", url: "/data/backup-google-drive", icon: Cloud },
      { title: "Storage Monitor", url: "/data/storage-monitor", icon: HardDrive },
      { title: "Cleanup Storage", url: "/data/cleanup-storage", icon: Trash2 },
    ],
  },
  {
    title: "AKUN",
    icon: UserCog,
    items: [
      { title: "Profil", url: "/akun/profil", icon: User },
      { title: "Bantuan", url: "/akun/bantuan", icon: HelpCircle },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [userProfile, setUserProfile] = useState<any>(null);
  const [avatarBlobUrl, setAvatarBlobUrl] = useState<string | null>(null);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  
  // Icon mapping for localStorage restoration
  const iconMap: Record<string, any> = {
    LayoutDashboard, CalendarDays, UserCheck, GraduationCap, Users, BookOpen,
    TrendingUp, CalendarClock, FileText, Bell, FileInput, BarChart3, CalendarCheck,
    Calendar, ClipboardList, FileBarChart, BookText, Database, Download, Cloud,
    HardDrive, User, HelpCircle, Tags, Trophy, UserPlus, ClipboardCheck
  };
  
  // Get all available menu items for quick menu
  const getAllMenuItems = () => {
    const allItems: any[] = [];
    menuItems.forEach((group) => {
      allItems.push(...group.items);
    });
    return allItems;
  };
  
  // Load quick menu from localStorage
  const [quickMenuItems, setQuickMenuItems] = useState<any[]>(() => {
    const saved = localStorage.getItem('quickMenuItems');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Restore icon components from iconMap using iconName
        return parsed.map((item: any) => ({
          ...item,
          icon: iconMap[item.iconName] || LayoutDashboard
        }));
      } catch (error) {
        return [];
      }
    }
    return [];
  });
  
  // Get icon name from component
  const getIconName = (IconComponent: any): string => {
    // Create reverse mapping to find icon name
    for (const [name, component] of Object.entries(iconMap)) {
      if (component === IconComponent) {
        return name;
      }
    }
    return 'LayoutDashboard'; // fallback
  };
  
  // Save quick menu to localStorage
  const updateQuickMenu = (items: any[]) => {
    setQuickMenuItems(items);
    // Save with icon names instead of component references
    const itemsToSave = items.map(item => ({
      title: item.title,
      url: item.url,
      iconName: getIconName(item.icon)
    }));
    localStorage.setItem('quickMenuItems', JSON.stringify(itemsToSave));
  };
  
  // Track which groups are open - initialize with group containing active route
  const getInitialOpenGroups = () => {
    const openGroups: string[] = [];
    menuItems.forEach((group) => {
      if (group.items.some((item) => currentPath === item.url)) {
        openGroups.push(group.title);
      }
    });
    return openGroups;
  };
  
  const [openGroups, setOpenGroups] = useState<string[]>(getInitialOpenGroups);
  
  const toggleGroup = (title: string) => {
    setOpenGroups((prev) =>
      prev.includes(title)
        ? prev.filter((g) => g !== title)
        : [...prev, title]
    );
  };

  const collapseAll = () => {
    setOpenGroups([]);
  };

  const expandAll = () => {
    setOpenGroups(menuItems.map(g => g.title));
  };
  
  // Auto-open group when route changes - but only if not in quick menu
  useEffect(() => {
    // Check if current path is in quick menu
    const isInQuickMenu = quickMenuItems.some((item) => item.url === currentPath);
    
    // Only auto-open if the current route is NOT in quick menu
    if (!isInQuickMenu) {
      menuItems.forEach((group) => {
        if (group.items.some((item) => currentPath === item.url)) {
          if (!openGroups.includes(group.title)) {
            setOpenGroups((prev) => [...prev, group.title]);
          }
        }
      });
    }
  }, [currentPath, quickMenuItems]);

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
              // Create new blob URL and store in state
              const newBlobUrl = URL.createObjectURL(file);
              setAvatarBlobUrl(newBlobUrl);
              setUserProfile(parsed); // Keep original opfs:// path in profile
            } else if (typeof file === 'string') {
              // base64 fallback
              setAvatarBlobUrl(null);
              setUserProfile({ ...parsed, avatar_url: file });
            } else {
              console.error('AppSidebar failed to load avatar from OPFS');
              setAvatarBlobUrl(null);
              setUserProfile({ ...parsed, avatar_url: '' });
            }
            return;
          }
          
          // Non-OPFS URL - no blob URL needed
          setAvatarBlobUrl(null);
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
      // Cleanup blob URL saat component unmount
      if (avatarBlobUrl) {
        URL.revokeObjectURL(avatarBlobUrl);
      }
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const isActive = (path: string) => currentPath === path;
  const getNavCls = (isActive: boolean) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/dashboard')}
        >
          <div className="p-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg">
            <GraduationCap className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <h1 className="font-bold text-lg text-sidebar-foreground">SIAKAD</h1>
              <p className="text-xs text-sidebar-foreground/70">Sistem Administrasi Sekolah</p>
            </div>
          )}
        </div>
        
        {!collapsed && (
          <>
            <div className="flex items-center gap-3 mt-4 p-3 bg-sidebar-accent/50 rounded-lg">
              <Avatar className="h-8 w-8 border-2 border-primary">
                <AvatarImage 
                  src={userProfile?.avatar_url?.startsWith('opfs://') ? avatarBlobUrl || '' : userProfile?.avatar_url}
                  onError={(e) => e.currentTarget.src = ''}
                />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {userProfile?.nama ? userProfile.nama.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'AD'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium text-sidebar-foreground">
                  {userProfile?.nama || 'Admin'}
                </span>
                <span className="text-xs text-sidebar-foreground/70">Administrator</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-sidebar-accent"
                  onClick={collapseAll}
                  title="Tutup semua menu"
                >
                  <ChevronsUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-sidebar-accent"
                  onClick={expandAll}
                  title="Buka semua menu"
                >
                  <ChevronsDown className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </SidebarHeader>

      <SidebarContent className="p-2 space-y-1">
        {/* Quick Menu Section */}
        {quickMenuItems.length > 0 && (
          <>
            <SidebarGroup className="py-0">
              <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {!collapsed && (
                    <span className="text-xs font-semibold text-muted-foreground">
                      QUICK MENU
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setQuickMenuOpen(true)}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <SidebarGroupContent>
                <SidebarMenu>
                  {quickMenuItems.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className="h-9">
                          <NavLink 
                            to={item.url} 
                            className={getNavCls(isActive(item.url))}
                          >
                            <ItemIcon className="h-4 w-4" />
                            {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <Separator className="my-2" />
          </>
        )}

        {/* Empty State for Quick Menu */}
        {quickMenuItems.length === 0 && (
          <>
            <SidebarGroup className="py-0">
              <div className="px-2 py-3 text-center">
                {!collapsed && (
                  <div className="space-y-2">
                    <Sparkles className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      Belum ada Quick Menu
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setQuickMenuOpen(true)}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Atur Quick Menu
                    </Button>
                  </div>
                )}
              </div>
            </SidebarGroup>
            <Separator className="my-2" />
          </>
        )}

        {/* Grouped Menu Items */}
        {menuItems.map((group) => {
          const GroupIcon = group.icon;
          const isGroupOpen = openGroups.includes(group.title);
          
          return (
            <Collapsible
              key={group.title}
              open={isGroupOpen}
              onOpenChange={() => toggleGroup(group.title)}
            >
              <SidebarGroup className="py-0">
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="px-3 py-2 cursor-pointer hover:bg-sidebar-accent/70 rounded-md transition-colors group mb-0.5 bg-sidebar-accent/30">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <GroupIcon className="h-4 w-4 text-primary" />
                        {!collapsed && (
                          <span className="text-sm font-semibold text-sidebar-foreground">
                            {group.title}
                          </span>
                        )}
                      </div>
                      {!collapsed && (
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-sidebar-foreground/60 transition-transform duration-200 ${
                            isGroupOpen ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </div>
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <SidebarGroupContent className="ml-6 mt-1">
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild className="h-9">
                              <NavLink 
                                to={item.url} 
                                className={getNavCls(isActive(item.url))}
                              >
                                <ItemIcon className="h-3.5 w-3.5 opacity-70" />
                                {!collapsed && <span className="text-sm font-normal">{item.title}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
      
      {/* Quick Menu Manager Dialog */}
      <QuickMenuManager
        open={quickMenuOpen}
        onOpenChange={setQuickMenuOpen}
        quickMenuItems={quickMenuItems}
        onUpdate={updateQuickMenu}
        allMenuItems={getAllMenuItems()}
      />
    </Sidebar>
  );
}