import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
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
  Clock,
  ClipboardList,
  BookMarked,
  CheckCircle2,
  XCircle,
  Info,
  CalendarDays
} from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { useToast } from "@/hooks/use-toast";
import { indexedDB } from "@/lib/indexedDB";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const Dashboard = () => {
  const navigate = useNavigate();
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
  const [calendarNotes, setCalendarNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  useEffect(() => {
    fetchStatistics();
    fetchTodaySchedule();
    fetchCalendarNotes();
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

  const fetchCalendarNotes = async () => {
    try {
      setLoadingNotes(true);
      const today = new Date();
      const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      const todayStr = format(today, "yyyy-MM-dd");
      const oneMonthAgoStr = format(oneMonthAgo, "yyyy-MM-dd");

      const notes = await indexedDB.select("catatan_kalender", (n: any) => 
        n.tanggal >= oneMonthAgoStr && n.tanggal <= todayStr
      );

      setCalendarNotes(notes.sort((a: any, b: any) => 
        new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
      ));
    } catch (error) {
      console.error("Error fetching calendar notes:", error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      setLoadingSchedule(true);
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const today = days[new Date().getDay()];
      const todayDate = format(new Date(), "yyyy-MM-dd");
      
      const schedules = await indexedDB.select("jadwal_pelajaran", (s: any) => s.hari === today);
      const timeSlots = await indexedDB.select("jam_pelajaran");
      const kelasData = await indexedDB.select("kelas");
      const mataPelajaranData = await indexedDB.select("mata_pelajaran");
      const agendaData = await indexedDB.select("agenda_mengajar");
      const kehadiranData = await indexedDB.select("kehadiran");
      
      // Filter today's agenda and attendance
      const todayAgenda = agendaData.filter((a: any) => a.tanggal === todayDate);
      const todayKehadiran = kehadiranData.filter((k: any) => k.tanggal === todayDate);
      
      // Enrich schedule with names and sort by jam_ke
      const enrichedSchedules = schedules
        .map((schedule: any) => {
          const kelas = kelasData.find((k: any) => k.id === schedule.kelas_id);
          const mataPelajaran = mataPelajaranData.find((m: any) => m.id === schedule.mata_pelajaran_id);
          const timeSlot = timeSlots.find((t: any) => t.jam_ke === schedule.jam_ke);
          
          // Check if agenda and attendance exist for today
          const hasAgendaToday = todayAgenda.some((a: any) => 
            a.kelas_id === schedule.kelas_id && 
            a.mata_pelajaran_id === schedule.mata_pelajaran_id
          );
          
          const hasKehadiranToday = todayKehadiran.some((k: any) => 
            k.kelas_id === schedule.kelas_id && 
            k.mata_pelajaran_id === schedule.mata_pelajaran_id
          );
          
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
            tanggal_terakhir: latestAgenda?.tanggal || null,
            hasAgendaToday,
            hasKehadiranToday
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
      {loading ? (
        <LoadingSkeleton type="stats" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <IconComponent className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Today's Schedule & PWA Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Jadwal Hari Ini - {format(new Date(), "EEEE, dd MMMM yyyy", { locale: idLocale })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSchedule ? (
              <LoadingSkeleton type="schedule" count={3} />
            ) : todaySchedule.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Tidak ada jadwal hari ini"
                description="Jadwal pelajaran untuk hari ini kosong. Nikmati waktu luang Anda atau gunakan untuk persiapan."
                variant="minimal"
              />
            ) : (
              <div className="space-y-3">
                {todaySchedule.map((schedule, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-200 hover:shadow-sm"
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
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {schedule.jumlah_jp > 1 && (
                              <div className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-medium">
                                {schedule.jumlah_jp} JP
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Status Indicators */}
                        <div className="flex gap-2 mb-2">
                          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                            schedule.hasAgendaToday 
                              ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800' 
                              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
                          }`}>
                            {schedule.hasAgendaToday ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            <span>{schedule.hasAgendaToday ? 'Agenda ✓' : 'Agenda belum diisi'}</span>
                          </div>
                          
                          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                            schedule.hasKehadiranToday 
                              ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800' 
                              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
                          }`}>
                            {schedule.hasKehadiranToday ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            <span>{schedule.hasKehadiranToday ? 'Presensi ✓' : 'Presensi belum diisi'}</span>
                          </div>
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
                          
                          <div className="flex gap-2 mt-3 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 hover:scale-105 transition-transform"
                              onClick={() => navigate('/kehadiran/input-kehadiran', { 
                                state: { 
                                  fromSchedule: true,
                                  scheduleData: {
                                    kelas_id: schedule.kelas_id,
                                    mata_pelajaran_id: schedule.mata_pelajaran_id,
                                    jam_ke: schedule.jam_ke,
                                    jumlah_jp: schedule.jumlah_jp,
                                    kelas_nama: schedule.kelas_nama,
                                    mata_pelajaran_nama: schedule.mata_pelajaran_nama,
                                    jadwal_id: schedule.id
                                  }
                                } 
                              })}
                            >
                              <ClipboardList className="h-4 w-4 mr-1" />
                              Presensi
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 hover:scale-105 transition-transform"
                              onClick={() => navigate('/jurnal/agenda-mengajar', { 
                                state: { 
                                  fromSchedule: true,
                                  scheduleData: {
                                    kelas_id: schedule.kelas_id,
                                    mata_pelajaran_id: schedule.mata_pelajaran_id,
                                    jam_ke: schedule.jam_ke,
                                    jumlah_jp: schedule.jumlah_jp,
                                    kelas_nama: schedule.kelas_nama,
                                    mata_pelajaran_nama: schedule.mata_pelajaran_nama,
                                    jadwal_id: schedule.id
                                  }
                                } 
                              })}
                            >
                              <BookMarked className="h-4 w-4 mr-1" />
                              Agenda
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar Notes & PWA Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Calendar Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5" />
                Catatan Kegiatan (1 Bulan Terakhir)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingNotes ? (
                <LoadingSkeleton type="list" count={3} />
              ) : calendarNotes.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="Belum ada catatan"
                  description="Tambahkan catatan kegiatan di kalender untuk tracking lebih baik"
                  actionLabel="Buka Kalender"
                  onAction={() => navigate('/kalender')}
                  variant="minimal"
                />
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {calendarNotes.map((note) => (
                    <div 
                      key={note.id}
                      className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm flex-1">{note.catatan}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(note.tanggal), "dd MMM", { locale: idLocale })}
                        </span>
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
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleInstall} 
                  variant={isInstallable && !isInstalled ? "default" : "outline"}
                  disabled={!isInstallable || isInstalled}
                  size="sm"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isInstalled ? "Sudah Terinstall" : "Install Aplikasi"}
                </Button>
                
                <Button 
                  onClick={handleUpdate} 
                  variant={updateAvailable ? "default" : "outline"}
                  disabled={!updateAvailable}
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {updateAvailable ? "Update Tersedia" : "Tidak Ada Update"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Install aplikasi ke perangkat Anda untuk akses lebih cepat dan bisa bekerja offline.
              </p>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-5 w-5" />
                Informasi Aplikasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Versi</span>
                  <span className="text-sm font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Update Terakhir</span>
                  <span className="text-sm font-medium">
                    {format(new Date('2025-01-15'), "dd MMM yyyy", { locale: idLocale })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;