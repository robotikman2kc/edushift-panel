import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  UserCheck, 
  GraduationCap, 
  BookOpen,
  TrendingUp,
  Calendar,
  FileText,
  BarChart3,
  Download,
  RefreshCw
} from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { isInstallable, isInstalled, updateAvailable, installApp, updateApp } = usePWA();
  const { toast } = useToast();

  const handleInstall = async () => {
    await installApp();
    toast({
      title: "Aplikasi Terinstal",
      description: "EduShift Panel telah ditambahkan ke layar utama Anda.",
    });
  };

  const handleUpdate = () => {
    updateApp();
    toast({
      title: "Memperbarui Aplikasi",
      description: "Aplikasi akan dimuat ulang untuk menerapkan pembaruan...",
    });
  };

  const stats = [
    {
      title: "Total Siswa",
      value: "1,234",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Guru",
      value: "56",
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Jumlah Kelas",
      value: "24",
      icon: GraduationCap,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Mata Pelajaran",
      value: "15",
      icon: BookOpen,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const recentActivities = [
    {
      title: "Input nilai siswa kelas X-A",
      time: "2 jam yang lalu",
      user: "Guru Matematika",
    },
    {
      title: "Update data kehadiran",
      time: "3 jam yang lalu", 
      user: "Wali Kelas XII-B",
    },
    {
      title: "Tambah data siswa baru",
      time: "1 hari yang lalu",
      user: "Admin",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Selamat datang di Sistem Administrasi Sekolah"
      />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* PWA Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-5 w-5" />
            Kontrol Aplikasi PWA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleInstall} 
              variant={isInstallable && !isInstalled ? "default" : "outline"}
              disabled={!isInstallable || isInstalled}
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              {isInstalled ? "Aplikasi Sudah Terinstall" : "Install Aplikasi"}
            </Button>
            
            <Button 
              onClick={handleUpdate} 
              variant={updateAvailable ? "default" : "outline"}
              disabled={!updateAvailable}
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {updateAvailable ? "Update Tersedia - Klik untuk Update" : "Tidak Ada Update"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Install aplikasi ke perangkat Anda untuk akses lebih cepat dan bisa bekerja offline. Update akan otomatis tersedia saat ada versi baru.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Aksi Cepat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Input Kehadiran</p>
                    <p className="text-xs text-muted-foreground">Catat kehadiran hari ini</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Input Nilai</p>
                    <p className="text-xs text-muted-foreground">Masukkan nilai siswa</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="font-medium text-sm">Jurnal Guru</p>
                    <p className="text-xs text-muted-foreground">Tulis jurnal mengajar</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="font-medium text-sm">Data Siswa</p>
                    <p className="text-xs text-muted-foreground">Kelola data siswa</p>
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;