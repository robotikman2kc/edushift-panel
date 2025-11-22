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
  ChevronDown
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
  
  // Auto-open group when route changes
  useEffect(() => {
    menuItems.forEach((group) => {
      if (group.items.some((item) => currentPath === item.url)) {
        if (!openGroups.includes(group.title)) {
          setOpenGroups((prev) => [...prev, group.title]);
        }
      }
    });
  }, [currentPath]);

  // Load profile from localStorage
  useEffect(() => {
    const loadProfile = async () => {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          
          console.log('AppSidebar loading profile:', parsed);
          
          // Selalu load avatar dari OPFS jika menggunakan opfs://
          if (parsed.avatar_url && parsed.avatar_url.startsWith('opfs://')) {
            console.log('AppSidebar loading avatar from OPFS:', parsed.avatar_url);
            const opfsUrl = await opfsStorage.getFile(parsed.avatar_url);
            if (opfsUrl) {
              console.log('AppSidebar avatar loaded:', opfsUrl);
              setUserProfile({ ...parsed, avatar_url: opfsUrl });
            } else {
              console.error('AppSidebar failed to load avatar from OPFS');
              setUserProfile({ ...parsed, avatar_url: '' });
            }
            return;
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
          <div className="flex items-center gap-3 mt-4 p-3 bg-sidebar-accent/50 rounded-lg">
            <Avatar className="h-8 w-8 border-2 border-primary">
              <AvatarImage src={userProfile?.avatar_url} />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                {userProfile?.nama ? userProfile.nama.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'AD'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">
                {userProfile?.nama || 'Admin'}
              </span>
              <span className="text-xs text-sidebar-foreground/70">Administrator</span>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="p-2 space-y-1">
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
                
                <CollapsibleContent className="transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
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
    </Sidebar>
  );
}