import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarGrid } from "@/components/kalender/CalendarGrid";
import { CalendarHeader } from "@/components/kalender/CalendarHeader";
import { DayDetailPanel } from "@/components/kalender/DayDetailPanel";
import { indexedDB, type JadwalPelajaran, type AgendaMengajar, type Jurnal, type Kehadiran, type JamPelajaran, type Kelas, type MataPelajaran } from "@/lib/indexedDB";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, BookOpen, Users, FileText } from "lucide-react";

interface CalendarData {
  date: string;
  hasAgenda: boolean;
  hasAttendance: boolean;
  hasJournal: boolean;
  hasSchedule: boolean;
}

export default function Kalender() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarData, setCalendarData] = useState<Map<string, CalendarData>>(new Map());
  
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

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Fetch all data
      const [schedules, agendas, journals, attendance, jamPelajaran, kelasList, mataPelajaranList] = await Promise.all([
        indexedDB.select("jadwal_pelajaran"),
        indexedDB.select("agenda_mengajar"),
        indexedDB.select("jurnal"),
        indexedDB.select("kehadiran"),
        indexedDB.select("jam_pelajaran"),
        indexedDB.select("kelas"),
        indexedDB.select("mata_pelajaran"),
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

      // Enrich schedules dengan nama
      const enrichedSchedules = (schedules as JadwalPelajaran[]).map((schedule) => {
        const kelas = (kelasList as Kelas[]).find((k) => k.id === schedule.kelas_id);
        const mataPelajaran = (mataPelajaranList as MataPelajaran[]).find((m) => m.id === schedule.mata_pelajaran_id);
        const jam = (jamPelajaran as JamPelajaran[]).find((j) => j.jam_ke === schedule.jam_ke);
        
        return {
          ...schedule,
          kelas_name: kelas?.nama_kelas || "Unknown",
          mata_pelajaran_name: mataPelajaran?.nama_mata_pelajaran || "Unknown",
          jam_mulai: jam?.waktu_mulai || "",
          jam_selesai: jam?.waktu_selesai || "",
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
        };
        existing.hasJournal = true;
        dataMap.set(journal.tanggal, existing);
      });

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
        description="Lihat jadwal mengajar, agenda, kehadiran, dan jurnal dalam satu tampilan"
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalTeachingDays}</div>
                <div className="text-xs text-muted-foreground">Hari Mengajar</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalAgendas}</div>
                <div className="text-xs text-muted-foreground">Agenda Dibuat</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalAttendance}</div>
                <div className="text-xs text-muted-foreground">Kehadiran Tercatat</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.completionPercentage}%</div>
                <div className="text-xs text-muted-foreground">Pencapaian</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center text-sm">
            <span className="font-semibold">Indikator:</span>
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
              <span>Jadwal (belum ada aktivitas)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 border-2 border-destructive/20 bg-destructive/5 rounded" />
              <span>Hari kerja tanpa aktivitas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid and Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
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
              <CalendarGrid
                currentDate={currentDate}
                calendarData={calendarData}
                selectedDate={selectedDate}
                onDateClick={handleDateClick}
              />
            </CardContent>
          </Card>
        </div>

        {selectedDate && (
          <div>
            <DayDetailPanel
              selectedDate={selectedDate}
              schedules={selectedDaySchedules}
              agendas={selectedDayAgendas}
              journals={selectedDayJournals}
              attendanceCount={selectedDayAttendanceCount}
              onClose={() => setSelectedDate(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
