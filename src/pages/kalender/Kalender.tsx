import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "@/components/kalender/CalendarGrid";
import { CalendarHeader } from "@/components/kalender/CalendarHeader";
import { DayDetailPanel } from "@/components/kalender/DayDetailPanel";
import { CalendarNoteDialog } from "@/components/kalender/CalendarNoteDialog";
import { PeriodeNonPembelajaranDialog } from "@/components/kalender/PeriodeNonPembelajaranDialog";
import { indexedDB, type JadwalPelajaran, type AgendaMengajar, type Jurnal, type Kehadiran, type JamPelajaran, type Kelas, type MataPelajaran, type CatatanKalender, type HariLibur, type PeriodeNonPembelajaran } from "@/lib/indexedDB";
import { isWeekday } from "@/lib/hariLiburUtils";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, BookOpen, Users, FileText, Plus, RefreshCw, CalendarOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { syncHolidaysForYears } from "@/lib/googleCalendar";
import { getActiveTahunAjaran, getActiveSemester } from "@/lib/academicYearUtils";

interface CalendarData {
  date: string;
  hasAgenda: boolean;
  hasAttendance: boolean;
  hasJournal: boolean;
  hasSchedule: boolean;
  isHoliday: boolean;
  holidayName?: string;
  holidayDescription?: string;
  hasNotes: boolean;
  noteColor?: string;
  noteText?: string;
  isPeriodeNonPembelajaran: boolean;
  periodeNama?: string;
  periodeDescription?: string;
  periodeDateRange?: { start: string; end: string };
}

export default function Kalender() {
  const { toast } = useToast();
  // Load month view from localStorage or use current date
  const [currentDate, setCurrentDate] = useState(() => {
    const saved = localStorage.getItem('calendar_month_view');
    if (saved) {
      try {
        const { year, month } = JSON.parse(saved);
        localStorage.removeItem('calendar_month_view'); // Clear after reading
        return new Date(year, month, 1);
      } catch (error) {
        console.error('Error parsing calendar_month_view:', error);
      }
    }
    return new Date();
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [calendarData, setCalendarData] = useState<Map<string, CalendarData>>(new Map());
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{ id: string; catatan: string; warna?: string } | null>(null);
  const [calendarNotes, setCalendarNotes] = useState<CatatanKalender[]>([]);
  const [hariLibur, setHariLibur] = useState<HariLibur[]>([]);
  const [isPeriodeDialogOpen, setIsPeriodeDialogOpen] = useState(false);
  const [editingPeriode, setEditingPeriode] = useState<PeriodeNonPembelajaran | null>(null);
  const [periodeNonPembelajaran, setPeriodeNonPembelajaran] = useState<PeriodeNonPembelajaran[]>([]);
  
  const [allSchedules, setAllSchedules] = useState<Array<JadwalPelajaran & { kelas_name?: string; mata_pelajaran_name?: string; jam_mulai?: string; jam_selesai?: string }>>([]);
  const [allAgendas, setAllAgendas] = useState<Array<AgendaMengajar & { kelas_name?: string; mata_pelajaran_name?: string }>>([]);
  const [allJournals, setAllJournals] = useState<Jurnal[]>([]);
  const [allAttendance, setAllAttendance] = useState<Kehadiran[]>([]);
  
  const [stats, setStats] = useState({
    totalTeachingDays: 0,
    totalAgendas: 0,
    totalAttendance: 0,
    completionPercentage: 0,
  });

  const [loading, setLoading] = useState(true);
  const [activeTahunAjaran, setActiveTahunAjaran] = useState("");
  const [activeSemester, setActiveSemester] = useState("");

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Ambil tahun ajaran dan semester aktif
      const tahunAjaran = await getActiveTahunAjaran();
      const semester = await getActiveSemester();
      setActiveTahunAjaran(tahunAjaran);
      setActiveSemester(semester);

      // Fetch all data
      const [schedules, agendas, journals, attendance, jamPelajaran, kelasList, mataPelajaranList, notes, holidays, periode] = await Promise.all([
        indexedDB.select("jadwal_pelajaran", (jadwal: any) => 
          jadwal.tahun_ajaran === tahunAjaran && jadwal.semester === semester
        ),
        indexedDB.select("agenda_mengajar"),
        indexedDB.select("jurnal"),
        indexedDB.select("kehadiran"),
        indexedDB.select("jam_pelajaran"),
        indexedDB.select("kelas"),
        indexedDB.select("mata_pelajaran"),
        indexedDB.select("catatan_kalender"),
        indexedDB.select("hari_libur"),
        indexedDB.select("periode_non_pembelajaran"),
      ]);

      // Filter data untuk bulan ini
      const monthStartStr = format(monthStart, "yyyy-MM-dd");
      const monthEndStr = format(monthEnd, "yyyy-MM-dd");

      const filteredAgendas = (agendas as AgendaMengajar[]).filter(
        (a) => a.tanggal >= monthStartStr && a.tanggal <= monthEndStr
      );
      const filteredJournals = (journals as Jurnal[]).filter(
        (j) => j.tanggal >= monthStartStr && j.tanggal <= monthEndStr
      );
      const filteredAttendance = (attendance as Kehadiran[]).filter(
        (k) => k.tanggal >= monthStartStr && k.tanggal <= monthEndStr
      );
      const filteredNotes = (notes as CatatanKalender[]).filter(
        (n) => n.tanggal >= monthStartStr && n.tanggal <= monthEndStr
      );
      const filteredHolidays = (holidays as HariLibur[]).filter(
        (h) => h.tanggal >= monthStartStr && h.tanggal <= monthEndStr
      );
      
      // Tampilkan semua periode (tidak difilter per bulan karena bisa lintas bulan)
      // Sort by tanggal_mulai
      const sortedPeriode = (periode as PeriodeNonPembelajaran[]).sort((a, b) => 
        new Date(a.tanggal_mulai).getTime() - new Date(b.tanggal_mulai).getTime()
      );

      console.log('Total periode di database:', periode.length);
      console.log('Semua periode (sorted):', sortedPeriode);

      setCalendarNotes(filteredNotes);
      setHariLibur(filteredHolidays);
      setPeriodeNonPembelajaran(sortedPeriode);

      // Enrich schedules dengan nama
      const enrichedSchedules = (schedules as JadwalPelajaran[]).map((schedule) => {
        const kelas = (kelasList as Kelas[]).find((k) => k.id === schedule.kelas_id);
        const mataPelajaran = (mataPelajaranList as MataPelajaran[]).find((m) => m.id === schedule.mata_pelajaran_id);
        const jamMulai = (jamPelajaran as JamPelajaran[]).find((j) => j.jam_ke === schedule.jam_ke);
        
        // Hitung jam selesai berdasarkan jumlah JP
        const jamSelesaiKe = schedule.jam_ke + schedule.jumlah_jp - 1;
        const jamSelesai = (jamPelajaran as JamPelajaran[]).find((j) => j.jam_ke === jamSelesaiKe);
        
        return {
          ...schedule,
          kelas_name: kelas?.nama_kelas || "Unknown",
          mata_pelajaran_name: mataPelajaran?.nama_mata_pelajaran || "Unknown",
          jam_mulai: jamMulai?.waktu_mulai || "",
          jam_selesai: jamSelesai?.waktu_selesai || "",
        };
      });

      // Enrich agendas
      const enrichedAgendas = filteredAgendas.map((agenda) => {
        const kelas = (kelasList as Kelas[]).find((k) => k.id === agenda.kelas_id);
        const mataPelajaran = (mataPelajaranList as MataPelajaran[]).find((m) => m.id === agenda.mata_pelajaran_id);
        
        return {
          ...agenda,
          kelas_name: kelas?.nama_kelas || "Unknown",
          mata_pelajaran_name: mataPelajaran?.nama_mata_pelajaran || "Unknown",
        };
      });

      setAllSchedules(enrichedSchedules);
      setAllAgendas(enrichedAgendas);
      setAllJournals(filteredJournals);
      setAllAttendance(filteredAttendance);

      // Build calendar data
      const dataMap = new Map<string, CalendarData>();

      // Process schedules untuk mendapatkan hari kerja
      const workingDays = new Set<string>();
      enrichedSchedules.forEach((schedule) => {
        const day = schedule.hari;
        // Simulasi: asumsikan semua hari dalam bulan ini yang sesuai dengan jadwal adalah hari kerja
        let date = new Date(monthStart);
        while (date <= monthEnd) {
          const dayOfWeek = date.getDay();
          const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
          if (dayNames[dayOfWeek] === day) {
            const dateKey = format(date, "yyyy-MM-dd");
            workingDays.add(dateKey);
            const existing = dataMap.get(dateKey) || {
              date: dateKey,
              hasAgenda: false,
              hasAttendance: false,
              hasJournal: false,
              hasSchedule: false,
              isHoliday: false,
              hasNotes: false,
              isPeriodeNonPembelajaran: false,
            };
            existing.hasSchedule = true;
            dataMap.set(dateKey, existing);
          }
          date.setDate(date.getDate() + 1);
        }
      });

      // Process agendas
      enrichedAgendas.forEach((agenda) => {
        const existing = dataMap.get(agenda.tanggal) || {
          date: agenda.tanggal,
          hasAgenda: false,
          hasAttendance: false,
          hasJournal: false,
          hasSchedule: false,
          isHoliday: false,
          hasNotes: false,
          isPeriodeNonPembelajaran: false,
        };
        existing.hasAgenda = true;
        dataMap.set(agenda.tanggal, existing);
      });

      // Process attendance
      filteredAttendance.forEach((att) => {
        const existing = dataMap.get(att.tanggal) || {
          date: att.tanggal,
          hasAgenda: false,
          hasAttendance: false,
          hasJournal: false,
          hasSchedule: false,
          isHoliday: false,
          hasNotes: false,
          isPeriodeNonPembelajaran: false,
        };
        existing.hasAttendance = true;
        dataMap.set(att.tanggal, existing);
      });

      // Process journals
      filteredJournals.forEach((journal) => {
        const existing = dataMap.get(journal.tanggal) || {
          date: journal.tanggal,
          hasAgenda: false,
          hasAttendance: false,
          hasJournal: false,
          hasSchedule: false,
          isHoliday: false,
          hasNotes: false,
          isPeriodeNonPembelajaran: false,
        };
        existing.hasJournal = true;
        dataMap.set(journal.tanggal, existing);
      });

      // Process holidays
      filteredHolidays.forEach((holiday) => {
        const existing = dataMap.get(holiday.tanggal) || {
          date: holiday.tanggal,
          hasAgenda: false,
          hasAttendance: false,
          hasJournal: false,
          hasSchedule: false,
          isHoliday: false,
          hasNotes: false,
          isPeriodeNonPembelajaran: false,
        };
        existing.isHoliday = true;
        existing.holidayName = holiday.nama;
        existing.holidayDescription = holiday.keterangan;
        dataMap.set(holiday.tanggal, existing);
      });

      // Process notes
      filteredNotes.forEach((note) => {
        const existing = dataMap.get(note.tanggal) || {
          date: note.tanggal,
          hasAgenda: false,
          hasAttendance: false,
          hasJournal: false,
          hasSchedule: false,
          isHoliday: false,
          hasNotes: false,
          isPeriodeNonPembelajaran: false,
        };
        existing.hasNotes = true;
        existing.noteColor = (note as any).warna || "bg-purple-500";
        existing.noteText = note.catatan;
        dataMap.set(note.tanggal, existing);
      });

      // Process periode non pembelajaran - only on weekdays
      sortedPeriode.forEach((periode) => {
        const startDate = new Date(periode.tanggal_mulai);
        const endDate = new Date(periode.tanggal_selesai);
        
        // Iterate through each day in the periode
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          // Only mark weekdays using the utility function
          if (isWeekday(currentDate)) {
            const dateKey = format(currentDate, "yyyy-MM-dd");
            const existing = dataMap.get(dateKey) || {
              date: dateKey,
              hasAgenda: false,
              hasAttendance: false,
              hasJournal: false,
              hasSchedule: false,
              isHoliday: false,
              hasNotes: false,
              isPeriodeNonPembelajaran: false,
            };
            existing.isPeriodeNonPembelajaran = true;
            existing.periodeNama = periode.nama;
            existing.periodeDescription = periode.keterangan;
            existing.periodeDateRange = {
              start: periode.tanggal_mulai,
              end: periode.tanggal_selesai
            };
            dataMap.set(dateKey, existing);
          }
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });

      // Mark all Sundays as holidays
      let date = new Date(monthStart);
      while (date <= monthEnd) {
        if (date.getDay() === 0) { // Sunday
          const dateKey = format(date, "yyyy-MM-dd");
          const existing = dataMap.get(dateKey) || {
            date: dateKey,
            hasAgenda: false,
            hasAttendance: false,
            hasJournal: false,
            hasSchedule: false,
            isHoliday: false,
            hasNotes: false,
            isPeriodeNonPembelajaran: false,
          };
          existing.isHoliday = true;
          if (!existing.holidayName) {
            existing.holidayName = "Hari Minggu";
          }
          dataMap.set(dateKey, existing);
        }
        date.setDate(date.getDate() + 1);
      }

      setCalendarData(dataMap);

      // Calculate stats
      const daysWithActivity = Array.from(dataMap.values()).filter(
        (d) => d.hasAgenda || d.hasAttendance || d.hasJournal
      ).length;
      const completionPercentage = workingDays.size > 0 ? Math.round((daysWithActivity / workingDays.size) * 100) : 0;

      setStats({
        totalTeachingDays: workingDays.size,
        totalAgendas: filteredAgendas.length,
        totalAttendance: new Set(filteredAttendance.map((a) => a.tanggal)).size,
        completionPercentage,
      });
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleMonthChange = (month: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), month, 1));
    setSelectedDate(null);
  };

  const handleYearChange = (year: number) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
    setSelectedDate(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddNote = () => {
    setEditingNote(null);
    setIsNoteDialogOpen(true);
  };

  const handleEditNote = (note: CatatanKalender) => {
    setEditingNote({ id: note.id, catatan: note.catatan, warna: (note as any).warna });
    setSelectedDate(new Date(note.tanggal));
    setIsNoteDialogOpen(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await indexedDB.delete("catatan_kalender", noteId);
      
      toast({
        variant: "success",
        title: "Catatan Dihapus",
        description: "Catatan kegiatan berhasil dihapus",
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus catatan",
        variant: "destructive",
      });
    }
  };

  const handleSyncHolidays = async () => {
    try {
      toast({
        title: "Sinkronisasi Dimulai",
        description: "Mengambil data hari libur dari Google Calendar...",
      });

      const currentYear = new Date().getFullYear();
      const holidays = await syncHolidaysForYears(currentYear, currentYear + 1);
      
      await indexedDB.syncHolidaysFromGoogle(holidays);
      
      await fetchData();
      
      toast({
        variant: "success",
        title: "Sinkronisasi Berhasil",
        description: `${holidays.length} hari libur berhasil disinkronkan`,
      });
    } catch (error) {
      console.error("Error syncing holidays:", error);
      toast({
        title: "Sinkronisasi Gagal",
        description: "Gagal mengambil data dari Google Calendar. Pastikan Anda terhubung ke internet.",
        variant: "destructive",
      });
    }
  };

  const handleAddPeriode = () => {
    setEditingPeriode(null);
    setIsPeriodeDialogOpen(true);
  };

  const handleEditPeriode = (periode: PeriodeNonPembelajaran) => {
    setEditingPeriode(periode);
    setIsPeriodeDialogOpen(true);
  };

  const handleSavePeriode = async (periodeData: any) => {
    try {
      if (periodeData.id) {
        // Update existing periode
        await indexedDB.update("periode_non_pembelajaran", periodeData.id, periodeData);
        console.log('Periode updated:', periodeData);
        toast({
          variant: "success",
          title: "Periode Diperbarui",
          description: "Periode non-pembelajaran berhasil diperbarui",
        });
      } else {
        // Create new periode
        const result = await indexedDB.insert("periode_non_pembelajaran", periodeData);
        console.log('Periode inserted:', result);
        
        if (result.error) {
          throw new Error(result.error);
        }

        toast({
          variant: "success",
          title: "Periode Ditambahkan",
          description: "Periode non-pembelajaran berhasil ditambahkan",
        });
      }

      setEditingPeriode(null);
      await fetchData(); // Ensure fetchData completes
    } catch (error) {
      console.error('Error saving periode:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan periode",
        variant: "destructive",
      });
    }
  };

  const handleDeletePeriode = async () => {
    if (!editingPeriode) return;

    try {
      await indexedDB.delete("periode_non_pembelajaran", editingPeriode.id);
      
      toast({
        variant: "success",
        title: "Periode Dihapus",
        description: "Periode non-pembelajaran berhasil dihapus",
      });

      setEditingPeriode(null);
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus periode",
        variant: "destructive",
      });
    }
  };

  const handleSaveNote = async (catatan: string, warna: string, noteId?: string) => {
    if (!selectedDate) return;

    try {
      if (noteId) {
        // Update existing note
        await indexedDB.update("catatan_kalender", noteId, { catatan, warna });
      toast({
        variant: "success",
        title: "Catatan Diperbarui",
        description: "Catatan kegiatan berhasil diperbarui",
      });
      } else {
        // Create new note
        const result = await indexedDB.insert("catatan_kalender", {
          tanggal: format(selectedDate, "yyyy-MM-dd"),
          catatan,
          warna,
        });

        if (result.error) {
          throw new Error(result.error);
        }

      toast({
        variant: "success",
        title: "Catatan Ditambahkan",
        description: "Catatan kegiatan berhasil ditambahkan",
      });
      }

      setEditingNote(null);
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: noteId ? "Gagal memperbarui catatan" : "Gagal menambahkan catatan",
        variant: "destructive",
      });
    }
  };

  // Get data for selected date
  const selectedDateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedDaySchedules = selectedDateKey
    ? allSchedules.filter((s) => {
        const dayOfWeek = selectedDate!.getDay();
        const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        return s.hari === dayNames[dayOfWeek];
      })
    : [];
  const selectedDayAgendas = selectedDateKey ? allAgendas.filter((a) => a.tanggal === selectedDateKey) : [];
  const selectedDayJournals = selectedDateKey ? allJournals.filter((j) => j.tanggal === selectedDateKey) : [];
  const selectedDayAttendanceCount = selectedDateKey
    ? allAttendance.filter((a) => a.tanggal === selectedDateKey).length
    : 0;
  const selectedDayNotes = selectedDateKey ? calendarNotes.filter((n) => n.tanggal === selectedDateKey) : [];
  
  // Find all holidays on selected date
  const selectedDayHolidays = selectedDateKey ? hariLibur.filter((h) => h.tanggal === selectedDateKey) : [];
  
  // Find all periodes that include selected date (only for weekdays)
  const selectedDayPeriodes = selectedDate && selectedDateKey ? (() => {
    // Only show for weekdays using utility function
    if (isWeekday(selectedDate)) {
      return periodeNonPembelajaran.filter(p => 
        selectedDateKey >= p.tanggal_mulai && selectedDateKey <= p.tanggal_selesai
      );
    }
    return [];
  })() : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Kalender"
          description="Lihat jadwal mengajar, agenda, kehadiran, dan jurnal dalam satu tampilan"
        />
        <div className="text-center py-8">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kalender"
        description={`Lihat jadwal mengajar, agenda, kehadiran, dan jurnal - Tahun Ajaran ${activeTahunAjaran} Semester ${activeSemester}`}
      >
        <div className="flex gap-2">
          <Button onClick={handleAddPeriode} size="sm" variant="outline">
            <CalendarOff className="h-4 w-4 mr-2" />
            Atur Periode
          </Button>
          <Button onClick={handleSyncHolidays} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sinkron Libur
          </Button>
        </div>
      </PageHeader>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center text-sm">
            <span className="font-semibold">Indikator:</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-500" />
              <span>Hari Libur</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-orange-500" />
              <span>Periode Non-Pembelajaran</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-500" />
              <span>Catatan (Warna bisa dipilih)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Agenda</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Kehadiran</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Jurnal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />
              <span>Jadwal</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid and Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Calendar Grid */}
          <Card>
            <CardContent className="p-6">
              <CalendarHeader
                currentDate={currentDate}
                onPreviousMonth={handlePreviousMonth}
                onNextMonth={handleNextMonth}
                onMonthChange={handleMonthChange}
                onYearChange={handleYearChange}
                onToday={handleToday}
              />
              <div className="flex justify-end mb-4 mt-2">
                <Button onClick={handleAddNote} size="sm" disabled={!selectedDate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Catatan
                </Button>
              </div>
              <CalendarGrid
                currentDate={currentDate}
                calendarData={calendarData}
                selectedDate={selectedDate}
                onDateClick={handleDateClick}
              />
            </CardContent>
          </Card>

          {/* Daftar Periode Non-Pembelajaran */}
          {periodeNonPembelajaran.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarOff className="h-4 w-4" />
                  Periode Non-Pembelajaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {periodeNonPembelajaran.map((periode) => (
                    <div 
                      key={periode.id}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleEditPeriode(periode)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">{periode.nama}</p>
                            <Badge variant="secondary" className="text-[10px]">
                              {periode.jenis}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(periode.tanggal_mulai), "dd MMM yyyy", { locale: idLocale })} - {format(new Date(periode.tanggal_selesai), "dd MMM yyyy", { locale: idLocale })}
                          </p>
                          {periode.keterangan && (
                            <p className="text-xs text-muted-foreground mt-1">{periode.keterangan}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <DayDetailPanel
            selectedDate={selectedDate || new Date()}
            schedules={selectedDaySchedules}
            agendas={selectedDayAgendas}
            journals={selectedDayJournals}
            attendanceCount={selectedDayAttendanceCount}
            notes={selectedDayNotes}
            holidays={selectedDayHolidays}
            periodes={selectedDayPeriodes}
            onClose={() => setSelectedDate(null)}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
          />
        </div>
      </div>

      <CalendarNoteDialog
        open={isNoteDialogOpen}
        onOpenChange={setIsNoteDialogOpen}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        selectedDate={selectedDate}
        editingNote={editingNote}
      />

      <PeriodeNonPembelajaranDialog
        open={isPeriodeDialogOpen}
        onOpenChange={setIsPeriodeDialogOpen}
        onSave={handleSavePeriode}
        onDelete={handleDeletePeriode}
        editingPeriode={editingPeriode}
      />
    </div>
  );
}
