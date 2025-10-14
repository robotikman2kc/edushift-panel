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
  CalendarDays
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

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

const menuItems = [
  {
    title: "PENGATURAN",
    icon: Settings,
    items: [
      { title: "Daftar Guru", url: "/pengaturan/guru", icon: UserCheck },
      { title: "Daftar Kelas", url: "/pengaturan/kelas", icon: GraduationCap },
      { title: "Daftar Siswa", url: "/pengaturan/siswa", icon: Users },
      { title: "Mata Pelajaran", url: "/pengaturan/mata-pelajaran", icon: BookOpen },
      { title: "Jadwal Pelajaran", url: "/pengaturan/jadwal-pelajaran", icon: CalendarDays },
      { title: "Bobot Penilaian", url: "/pengaturan/bobot-penilaian", icon: TrendingUp },
      { title: "Format PDF", url: "/pengaturan/format-pdf", icon: FileText },
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
    ],
  },
  {
    title: "DATA",
    icon: Database,
    items: [
      { title: "Manajemen Data", url: "/data/manajemen-data", icon: Database },
      { title: "Backup dan Restore", url: "/data/backup-restore", icon: Download },
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
  const currentPath = location.pathname;
  

  const isActive = (path: string) => currentPath === path;
  const getNavCls = (isActive: boolean) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
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
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                AD
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">Admin</span>
              <span className="text-xs text-sidebar-foreground/70">Administrator</span>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="p-2">
        {menuItems.map((group) => {
          return (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel className="px-2 py-2">
                {!collapsed && (
                  <span className="text-xs font-semibold text-sidebar-foreground/70">
                    {group.title}
                  </span>
                )}
              </SidebarGroupLabel>
              
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={item.url} 
                            className={getNavCls(isActive(item.url))}
                          >
                            <ItemIcon className="h-4 w-4" />
                            {!collapsed && <span className="text-sm">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}