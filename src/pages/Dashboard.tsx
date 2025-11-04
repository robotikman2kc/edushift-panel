import { useState, useEffect } from "react";
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
  RefreshCw,
  Clock
} from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { useToast } from "@/hooks/use-toast";
import { indexedDB } from "@/lib/indexedDB";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const Dashboard = () => {
  const { isInstallable, isInstalled, updateAvailable, installApp, updateApp } = usePWA();
  const { toast } = useToast();
  
  // State untuk data statistik
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [totalGuru, setTotalGuru] = useState(0);
  const [totalKelas, setTotalKelas] = useState(0);
  const [totalMataPelajaran, setTotalMataPelajaran] = useState(0);
  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  useEffect(() => {
    fetchStatistics();
    fetchTodaySchedule();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      const siswaData = await indexedDB.select("siswa");
      const guruData = await indexedDB.select("guru");
      const kelasData = await indexedDB.select("kelas");
      const mataPelajaranData = await indexedDB.select("mata_pelajaran");
      
      setTotalSiswa(siswaData.length);
      setTotalGuru(guruData.length);
      setTotalKelas(kelasData.length);
      setTotalMataPelajaran(mataPelajaranData.length);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast({
        title: "Error",
        description: "Gagal memuat statistik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const fetchTodaySchedule = async () => {
    try {
      setLoadingSchedule(true);
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const today = days[new Date().getDay()];
      
      const schedules = await indexedDB.select("jadwal_pelajaran", (s: any) => s.hari === today);
      const timeSlots = await indexedDB.select("jam_pelajaran");
      const kelasData = await indexedDB.select("kelas");
      const mataPelajaranData = await indexedDB.select("mata_pelajaran");
      const agendaData = await indexedDB.select("agenda_mengajar");
      
      // Enrich schedule with names and sort by jam_ke
      const enrichedSchedules = schedules
        .map((schedule: any) => {
          const kelas = kelasData.find((k: any) => k.id === schedule.kelas_id);
          const mataPelajaran = mataPelajaranData.find((m: any) => m.id === schedule.mata_pelajaran_id);
          const timeSlot = timeSlots.find((t: any) => t.jam_ke === schedule.jam_ke);
          
          // Find latest agenda for this kelas and mata pelajaran
          const relatedAgenda = agendaData
            .filter((a: any) => 
              a.kelas_id === schedule.kelas_id && 
              a.mata_pelajaran_id === schedule.mata_pelajaran_id
            )
            .sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
          
          const latestAgenda = relatedAgenda[0];
          
          return {
            ...schedule,
            kelas_nama: kelas?.nama_kelas || "N/A",
            mata_pelajaran_nama: mataPelajaran?.nama_mata_pelajaran || "N/A",
            waktu: timeSlot ? `${timeSlot.waktu_mulai} - ${timeSlot.waktu_selesai}` : "N/A",
            materi_terakhir: latestAgenda?.materi || null,
            keterangan_terakhir: latestAgenda?.keterangan || null,
            tanggal_terakhir: latestAgenda?.tanggal || null
          };
        })
        .sort((a: any, b: any) => a.jam_ke - b.jam_ke);
      
      setTodaySchedule(enrichedSchedules);
    } catch (error) {
      console.error("Error fetching today's schedule:", error);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const stats = [
    {
      title: "Total Siswa",
      value: loading ? "..." : totalSiswa.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Guru",
      value: loading ? "..." : totalGuru.toString(),
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Jumlah Kelas",
      value: loading ? "..." : totalKelas.toString(),
      icon: GraduationCap,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Mata Pelajaran",
      value: loading ? "..." : totalMataPelajaran.toString(),
      icon: BookOpen,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
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

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Jadwal Hari Ini - {format(new Date(), "EEEE, dd MMMM yyyy", { locale: idLocale })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSchedule ? (
            <p className="text-sm text-muted-foreground">Memuat jadwal...</p>
          ) : todaySchedule.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada jadwal untuk hari ini</p>
          ) : (
            <div className="space-y-3">
              {todaySchedule.map((schedule, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-primary/10 flex-shrink-0">
                      <span className="text-xs font-medium text-muted-foreground">Jam ke</span>
                      <span className="text-lg font-bold text-primary">
                        {schedule.jumlah_jp > 1 
                          ? `${schedule.jam_ke}-${schedule.jam_ke + schedule.jumlah_jp - 1}`
                          : schedule.jam_ke
                        }
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold">{schedule.mata_pelajaran_nama}</p>
                        {schedule.jumlah_jp > 1 && (
                          <div className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-medium flex-shrink-0">
                            {schedule.jumlah_jp} JP
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Kelas: {schedule.kelas_nama}</p>
                        <p className="text-sm text-muted-foreground">Waktu: {schedule.waktu}</p>
                        
                        {schedule.materi_terakhir && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Materi Terakhir ({format(new Date(schedule.tanggal_terakhir), "dd MMM yyyy", { locale: idLocale })}):
                            </p>
                            <p className="text-sm text-foreground">{schedule.materi_terakhir}</p>
                            {schedule.keterangan_terakhir && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Ket: {schedule.keterangan_terakhir}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
};

export default Dashboard;