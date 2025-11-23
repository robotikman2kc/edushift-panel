import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { JurnalStatusWidget } from "@/components/dashboard/JurnalStatusWidget";
import { NoTaskWidget } from "@/components/dashboard/NoTaskWidget";
import { MissedExamWidget } from "@/components/dashboard/MissedExamWidget";
import { EskulScheduleWidget } from "@/components/dashboard/EskulScheduleWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  CalendarDays,
  CalendarOff
} from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { useToast } from "@/hooks/use-toast";
import { indexedDB } from "@/lib/indexedDB";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getActiveTahunAjaran, getActiveSemester } from "@/lib/academicYearUtils";
import { useStaticDataCache } from "@/hooks/useDataCache";
import { isWorkday } from "@/lib/workdaySettings";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, updateAvailable, installApp, updateApp } = usePWA();
  const { toast } = useToast();
  
  // Load selected date from localStorage
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const saved = localStorage.getItem('selectedDate');
    return saved ? new Date(saved) : new Date();
  });
  
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
  const [currentPeriode, setCurrentPeriode] = useState<any>(null);

  // Use cached data for static entities
  const { data: siswaData, loading: loadingSiswa } = useStaticDataCache('siswa', 'siswa');
  const { data: guruData, loading: loadingGuru } = useStaticDataCache('guru', 'guru');
  const { data: kelasData, loading: loadingKelas } = useStaticDataCache('kelas', 'kelas');
  const { data: mataPelajaranData, loading: loadingMapel } = useStaticDataCache('mata_pelajaran', 'mata_pelajaran');

  // Update stats when cached data changes
  useEffect(() => {
    setTotalSiswa(siswaData.length);
    setTotalGuru(guruData.length);
    setTotalKelas(kelasData.length);
    setTotalMataPelajaran(mataPelajaranData.length);
    setLoading(loadingSiswa || loadingGuru || loadingKelas || loadingMapel);
  }, [siswaData, guruData, kelasData, mataPelajaranData, loadingSiswa, loadingGuru, loadingKelas, loadingMapel]);

  // Listen for date changes from TopBar
  useEffect(() => {
    const handleDateChange = (event: CustomEvent) => {
      setSelectedDate(new Date(event.detail));
    };

    window.addEventListener('dateChanged', handleDateChange as EventListener);
    
    return () => {
      window.removeEventListener('dateChanged', handleDateChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (kelasData.length > 0 && mataPelajaranData.length > 0) {
      fetchTodaySchedule();
    }
    fetchCalendarNotes();
    checkPeriodeNonPembelajaran();
  }, [selectedDate, kelasData, mataPelajaranData]);

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
      const currentMonth = selectedDate.getMonth();
      const currentYear = selectedDate.getFullYear();
      
      // Get first and last day of current month
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      
      const firstDayStr = format(firstDay, "yyyy-MM-dd");
      const lastDayStr = format(lastDay, "yyyy-MM-dd");

      // Get calendar notes for current month
      const notes = await indexedDB.select("catatan_kalender", (n: any) => 
        n.tanggal >= firstDayStr && n.tanggal <= lastDayStr
      );

      // Get holidays for current month
      const holidays = await indexedDB.select("hari_libur", (h: any) => 
        h.tanggal >= firstDayStr && h.tanggal <= lastDayStr
      );

      // Combine notes and holidays with type indicator
      const combined = [
        ...notes.map((n: any) => ({ ...n, type: 'note' })),
        ...holidays.map((h: any) => ({ ...h, type: 'holiday', catatan: h.nama }))
      ];

      // Sort by date (earliest first)
      setCalendarNotes(combined.sort((a: any, b: any) => 
        new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
      ));
    } catch (error) {
      console.error("Error fetching calendar notes:", error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const checkPeriodeNonPembelajaran = async () => {
    try {
      const todayDate = format(selectedDate, "yyyy-MM-dd");
      
      // Check if today falls within any non-teaching period
      const allPeriode = await indexedDB.select("periode_non_pembelajaran");
      const activePeriode = allPeriode.find((p: any) => 
        todayDate >= p.tanggal_mulai && todayDate <= p.tanggal_selesai
      );
      
      setCurrentPeriode(activePeriode || null);
    } catch (error) {
      console.error("Error checking periode non pembelajaran:", error);
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      setLoadingSchedule(true);
      
      // Get active semester and academic year from academicYearUtils
      const activeSemester = await getActiveSemester();
      const activeTahunAjaran = await getActiveTahunAjaran();
      
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const today = days[selectedDate.getDay()];
      const todayDate = format(selectedDate, "yyyy-MM-dd");
      
      // Get schedules for today with strict filtering (same as Jadwal Pelajaran page)
      const schedules = await indexedDB.select("jadwal_pelajaran", (jadwal: any) => 
        jadwal.hari === today &&
        jadwal.tahun_ajaran === activeTahunAjaran && 
        jadwal.semester === activeSemester
      );
      const timeSlots = await indexedDB.select("jam_pelajaran");
      const agendaData = await indexedDB.select("agenda_mengajar");
      const kehadiranData = await indexedDB.select("kehadiran");
      
      // Filter today's agenda and attendance
      const todayAgenda = agendaData.filter((a: any) => a.tanggal === todayDate);
      const todayKehadiran = kehadiranData.filter((k: any) => k.tanggal === todayDate);
      
      // Enrich schedule with names and sort by jam_ke - use cached data
      const enrichedSchedules = schedules
        .map((schedule: any) => {
          const kelas = kelasData.find((k: any) => k.id === schedule.kelas_id);
          const mataPelajaran = mataPelajaranData.find((m: any) => m.id === schedule.mata_pelajaran_id);
          
          // Calculate time based on jam_ke and jumlah_jp
          let waktu = "N/A";
          const startJam = schedule.jam_ke;
          const jumlahJP = schedule.jumlah_jp || 1;
          const endJam = startJam + jumlahJP - 1;
          
          const startTimeSlot = timeSlots.find((t: any) => t.jam_ke === startJam);
          const endTimeSlot = timeSlots.find((t: any) => t.jam_ke === endJam);
          
          if (startTimeSlot && endTimeSlot) {
            waktu = `${startTimeSlot.waktu_mulai} - ${endTimeSlot.waktu_selesai}`;
          } else if (startTimeSlot) {
            waktu = `${startTimeSlot.waktu_mulai} - ${startTimeSlot.waktu_selesai}`;
          }
          
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
            waktu,
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

  const stats = useMemo(() => [
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
  ], [loading, totalSiswa, totalGuru, totalKelas, totalMataPelajaran]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Dashboard" 
          description="Selamat datang di Sistem Administrasi Sekolah"
        />
        <div className="flex items-center gap-2">
          {/* Stats Popover Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Statistik
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Card className="border-0 shadow-none">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 min-w-[300px]">
                    {stats.map((stat, index) => {
                      const IconComponent = stat.icon;
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${stat.bgColor} flex-shrink-0`}>
                            <IconComponent className={`h-4 w-4 ${stat.color}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground truncate">
                              {stat.title}
                            </p>
                            <p className="text-lg font-bold text-foreground">
                              {stat.value}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </PopoverContent>
          </Popover>
          
          <Button 
            onClick={() => navigate('/jurnal/jurnal-guru')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <BookMarked className="h-4 w-4" />
            Jurnal Guru
          </Button>
        </div>
      </div>

      {/* Today's Schedule & PWA Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2 text-base">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Jadwal hari ini - {format(selectedDate, "EEEE, dd MMM yyyy", { locale: idLocale })}
              </div>
              <JurnalStatusWidget />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSchedule ? (
              <LoadingSkeleton type="schedule" count={3} />
            ) : currentPeriode ? (
              <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <CalendarOff className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-yellow-900 dark:text-yellow-100 mb-1">
                      {currentPeriode.nama}
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                      {format(new Date(currentPeriode.tanggal_mulai), "dd MMM yyyy", { locale: idLocale })} - {format(new Date(currentPeriode.tanggal_selesai), "dd MMM yyyy", { locale: idLocale })}
                    </p>
                    {currentPeriode.keterangan && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        {currentPeriode.keterangan}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : todaySchedule.length === 0 ? (
              // Check if it's weekend (not a workday)
              !isWorkday(selectedDate) ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">Akhir Pekan</p>
                    <p className="text-xs mt-1">Selamat beristirahat!</p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  title="Tidak ada jadwal hari ini"
                  description="Jadwal pelajaran untuk hari ini kosong. Nikmati waktu luang Anda atau gunakan untuk persiapan."
                  variant="minimal"
                />
              )
            ) : (
              <div className="space-y-2">
                {todaySchedule.map((schedule, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors duration-200 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 flex-shrink-0">
                        <span className="text-[10px] font-medium text-muted-foreground">Jam</span>
                        <span className="text-sm font-bold text-primary">
                          {schedule.jumlah_jp > 1 
                            ? `${schedule.jam_ke}-${schedule.jam_ke + schedule.jumlah_jp - 1}`
                            : schedule.jam_ke
                          }
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-semibold text-sm">{schedule.mata_pelajaran_nama}</p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {schedule.jumlah_jp > 1 && (
                              <div className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-medium">
                                {schedule.jumlah_jp} JP
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Status Indicators */}
                        <div className="flex gap-1.5 mb-1.5">
                          <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                            schedule.hasAgendaToday 
                              ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800' 
                              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
                          }`}>
                            {schedule.hasAgendaToday ? (
                              <CheckCircle2 className="h-2.5 w-2.5" />
                            ) : (
                              <XCircle className="h-2.5 w-2.5" />
                            )}
                            <span>{schedule.hasAgendaToday ? 'Agenda' : 'Agenda'}</span>
                          </div>
                          
                          <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                            schedule.hasKehadiranToday 
                              ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800' 
                              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
                          }`}>
                            {schedule.hasKehadiranToday ? (
                              <CheckCircle2 className="h-2.5 w-2.5" />
                            ) : (
                              <XCircle className="h-2.5 w-2.5" />
                            )}
                            <span>{schedule.hasKehadiranToday ? 'Presensi' : 'Presensi'}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">{schedule.kelas_nama} • {schedule.waktu}</p>
                          
                          {schedule.materi_terakhir && (
                            <div className="mt-1.5 pt-1.5 border-t">
                              <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                                Materi Terakhir ({format(new Date(schedule.tanggal_terakhir), "dd MMM", { locale: idLocale })}):
                              </p>
                              <p className="text-xs text-foreground line-clamp-1">{schedule.materi_terakhir}</p>
                            </div>
                          )}
                          
                          <div className="flex gap-1.5 mt-2 pt-1.5 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-7 text-xs"
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
                              <ClipboardList className="h-3 w-3 mr-1" />
                              Presensi
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-7 text-xs"
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
                              <BookMarked className="h-3 w-3 mr-1" />
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

        {/* No Task Widget & Calendar Notes & PWA Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Missed Exam Widget */}
          <MissedExamWidget />
          
          {/* Ekstrakurikuler Schedule Widget */}
          <EskulScheduleWidget selectedDate={selectedDate} />
          
          {/* No Task Widget */}
          <NoTaskWidget />

          {/* Calendar Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Catatan {format(new Date(), "MMM yyyy", { locale: idLocale })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingNotes ? (
                <LoadingSkeleton type="list" count={3} />
              ) : calendarNotes.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="Belum ada catatan"
                  description="Tambahkan catatan kegiatan di kalender"
                  actionLabel="Buka Kalender"
                  onAction={() => navigate('/kalender')}
                  variant="minimal"
                />
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {calendarNotes.map((note) => (
                    <div 
                      key={note.id}
                      className={`p-2 border rounded-lg hover:shadow-sm transition-shadow ${
                        note.type === 'holiday' 
                          ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' 
                          : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-medium line-clamp-2">{note.catatan}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {note.type === 'holiday' ? (
                            <CalendarDays className="h-3 w-3 text-red-600 dark:text-red-400" />
                          ) : note.warna ? (
                            <div 
                              className="w-3 h-3 rounded border border-gray-300"
                              style={{ backgroundColor: note.warna }}
                            />
                          ) : null}
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {format(new Date(note.tanggal), "dd MMM", { locale: idLocale })}
                          </span>
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
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Download className="h-4 w-4" />
                Aplikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isInstallable && !isInstalled && (
                <Button
                  onClick={handleInstall}
                  variant="default"
                  size="sm"
                  className="w-full"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Install Aplikasi
                </Button>
              )}
              {updateAvailable && (
                <Button
                  onClick={handleUpdate}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Update Tersedia
                </Button>
              )}
              <div className="pt-2 border-t space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Versi</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Update</span>
                  <span className="font-medium">{format(new Date(), "dd MMM yyyy", { locale: idLocale })}</span>
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