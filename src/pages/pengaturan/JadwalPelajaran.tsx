import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings as SettingsIcon, Trash2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { indexedDB } from "@/lib/indexedDB";
import { getActiveTahunAjaran, getActiveSemester, setActiveSemester as setActiveAcademicSemester } from "@/lib/academicYearUtils";

interface TimeSlot {
  id: string;
  jam_ke: number;
  waktu_mulai: string;
  waktu_selesai: string;
  is_break?: boolean;
  break_label?: string;
}

interface Schedule {
  id: string;
  hari: string;
  jam_ke: number;
  kelas_id: string;
  kelas_nama: string;
  mata_pelajaran_id: string;
  mata_pelajaran_nama: string;
  jumlah_jp: number;
}

interface Kelas {
  id: string;
  nama_kelas: string;
}

interface MataPelajaran {
  id: string;
  nama_mata_pelajaran: string;
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

export default function JadwalPelajaran() {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mataPelajaranList, setMataPelajaranList] = useState<MataPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTahunAjaran, setActiveTahunAjaran] = useState("");
  const [activeSemester, setActiveSemester] = useState("");
  const [calendarActiveSemester, setCalendarActiveSemester] = useState("");
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTimeSettingsDialog, setShowTimeSettingsDialog] = useState(false);
  const [showBreakSettingsDialog, setShowBreakSettingsDialog] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [conflictingSchedules, setConflictingSchedules] = useState<Schedule[]>([]);
  const [minutesPerJP, setMinutesPerJP] = useState(45);
  
  // Break settings
  const [break1Start, setBreak1Start] = useState("09:30");
  const [break1End, setBreak1End] = useState("09:45");
  const [break2Start, setBreak2Start] = useState("12:00");
  const [break2End, setBreak2End] = useState("12:30");
  
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedJamKe, setSelectedJamKe] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedMataPelajaran, setSelectedMataPelajaran] = useState("");
  const [jumlahJP, setJumlahJP] = useState(1);

  useEffect(() => {
    const initData = async () => {
      const year = await getActiveTahunAjaran();
      const semester = await getActiveSemester();
      setActiveTahunAjaran(year);
      setActiveSemester(semester);
      setCalendarActiveSemester(semester);
      fetchData(year, semester);
    };
    initData();
  }, []);

  const fetchData = async (year?: string, semester?: string) => {
    try {
      setLoading(true);
      
      const currentYear = year || activeTahunAjaran || await getActiveTahunAjaran();
      const currentSemester = semester || activeSemester || await getActiveSemester();
      
      // Fetch schedules - filter by tahun_ajaran AND semester
      const schedulesData = await indexedDB.select("jadwal_pelajaran", (jadwal: any) => 
        jadwal.tahun_ajaran === currentYear && jadwal.semester === currentSemester
      );
      
      // Fetch time slots or create default ones
      let timeSlotsData = await indexedDB.select("jam_pelajaran");
      if (timeSlotsData.length === 0) {
        timeSlotsData = await createDefaultTimeSlots();
      } else {
        // Check if we need to add jam 9-12 (for existing databases)
        const hasJam9 = timeSlotsData.some((slot: TimeSlot) => slot.jam_ke === 9);
        if (!hasJam9) {
          const additionalSlots: TimeSlot[] = [
            { id: "9", jam_ke: 9, waktu_mulai: "13:15", waktu_selesai: "14:00" },
            { id: "10", jam_ke: 10, waktu_mulai: "14:00", waktu_selesai: "14:45" },
            { id: "11", jam_ke: 11, waktu_mulai: "14:45", waktu_selesai: "15:30" },
            { id: "12", jam_ke: 12, waktu_mulai: "15:30", waktu_selesai: "16:15" },
          ];
          for (const slot of additionalSlots) {
            await indexedDB.insert("jam_pelajaran", slot);
          }
          timeSlotsData = await indexedDB.select("jam_pelajaran");
        }
      }
      
      // Fetch kelas - filter by tahun_ajaran
      const kelasData = await indexedDB.select("kelas", (kelas: any) => 
        kelas.tahun_ajaran === currentYear
      );
      
      // Fetch mata pelajaran
      const mataPelajaranData = await indexedDB.select("mata_pelajaran");
      
      // Get settings
      const settings = await indexedDB.select("pengaturan");
      const jpSetting = settings.find((s: any) => s.key === "minutes_per_jp");
      if (jpSetting) {
        setMinutesPerJP(Number(jpSetting.value));
      }
      
      // Get break times from settings
      const break1StartSetting = settings.find((s: any) => s.key === "break1_start");
      const break1EndSetting = settings.find((s: any) => s.key === "break1_end");
      const break2StartSetting = settings.find((s: any) => s.key === "break2_start");
      const break2EndSetting = settings.find((s: any) => s.key === "break2_end");
      
      if (break1StartSetting) setBreak1Start(break1StartSetting.value);
      if (break1EndSetting) setBreak1End(break1EndSetting.value);
      if (break2StartSetting) setBreak2Start(break2StartSetting.value);
      if (break2EndSetting) setBreak2End(break2EndSetting.value);
      
      // Add break slots to time slots
      const allSlots = [...timeSlotsData];
      
      if (break1StartSetting && break1EndSetting) {
        allSlots.push({
          id: 'break1',
          jam_ke: 4.5, // Between jam 4 and 5
          waktu_mulai: break1StartSetting.value,
          waktu_selesai: break1EndSetting.value,
          is_break: true,
          break_label: 'Istirahat 1'
        });
      }
      
      if (break2StartSetting && break2EndSetting) {
        allSlots.push({
          id: 'break2',
          jam_ke: 7.5, // Between jam 7 and 8
          waktu_mulai: break2StartSetting.value,
          waktu_selesai: break2EndSetting.value,
          is_break: true,
          break_label: 'Istirahat 2'
        });
      }
      
      // Enrich schedules with names
      const enrichedSchedules = schedulesData.map((schedule: any) => {
        const kelas = kelasData.find((k: any) => k.id === schedule.kelas_id);
        const mataPelajaran = mataPelajaranData.find((mp: any) => mp.id === schedule.mata_pelajaran_id);
        return {
          ...schedule,
          kelas_nama: kelas?.nama_kelas || "-",
          mata_pelajaran_nama: mataPelajaran?.nama_mata_pelajaran || "-",
        };
      });
      
      setSchedules(enrichedSchedules);
      setTimeSlots(allSlots);
      setKelasList(kelasData);
      setMataPelajaranList(mataPelajaranData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTimeSlots = async () => {
    const defaultSlots: TimeSlot[] = [
      { id: "1", jam_ke: 1, waktu_mulai: "06:30", waktu_selesai: "07:15" },
      { id: "2", jam_ke: 2, waktu_mulai: "07:15", waktu_selesai: "08:00" },
      { id: "3", jam_ke: 3, waktu_mulai: "08:00", waktu_selesai: "08:45" },
      { id: "4", jam_ke: 4, waktu_mulai: "08:45", waktu_selesai: "09:30" },
      { id: "5", jam_ke: 5, waktu_mulai: "09:45", waktu_selesai: "10:30" },
      { id: "6", jam_ke: 6, waktu_mulai: "10:30", waktu_selesai: "11:15" },
      { id: "7", jam_ke: 7, waktu_mulai: "11:15", waktu_selesai: "12:00" },
      { id: "8", jam_ke: 8, waktu_mulai: "12:30", waktu_selesai: "13:15" },
      { id: "9", jam_ke: 9, waktu_mulai: "13:15", waktu_selesai: "14:00" },
      { id: "10", jam_ke: 10, waktu_mulai: "14:00", waktu_selesai: "14:45" },
      { id: "11", jam_ke: 11, waktu_mulai: "14:45", waktu_selesai: "15:30" },
      { id: "12", jam_ke: 12, waktu_mulai: "15:30", waktu_selesai: "16:15" },
    ];
    
    for (const slot of defaultSlots) {
      await indexedDB.insert("jam_pelajaran", slot);
    }
    
    return defaultSlots;
  };

  const handleAddSchedule = async () => {
    if (!selectedDay || !selectedJamKe || !selectedKelas || !selectedMataPelajaran) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }

    // Check for conflicts with existing schedules
    const startJam = Number(selectedJamKe);
    const endJam = startJam + jumlahJP;
    
    // Find all schedules that overlap in time on the same day (regardless of class)
    const conflicts = schedules.filter(schedule => {
      if (schedule.hari !== selectedDay) {
        return false;
      }
      
      const existingStart = schedule.jam_ke;
      const existingEnd = schedule.jam_ke + schedule.jumlah_jp;
      
      // Check if ranges overlap
      return (startJam < existingEnd && endJam > existingStart);
    });
    
    if (conflicts.length > 0) {
      // Check if there are conflicts with different class OR different subject
      const differentConflicts = conflicts.filter(
        c => c.kelas_id !== selectedKelas || c.mata_pelajaran_id !== selectedMataPelajaran
      );
      
      if (differentConflicts.length > 0) {
        // There are conflicts with different class or subject, show confirmation
        setConflictingSchedules(differentConflicts);
        setShowConflictDialog(true);
        return;
      } else {
        // All conflicts are same class AND same subject, delete them silently
        setConflictingSchedules(conflicts);
      }
    }

    await saveSchedule();
  };

  const saveSchedule = async () => {

    try {
      const year = activeTahunAjaran || await getActiveTahunAjaran();
      const semester = activeSemester || await getActiveSemester();
      
      // Delete conflicting schedules if any
      if (conflictingSchedules.length > 0) {
        for (const conflict of conflictingSchedules) {
          await indexedDB.delete("jadwal_pelajaran", conflict.id);
        }
      }
      
      const newSchedule = {
        hari: selectedDay,
        jam_ke: Number(selectedJamKe),
        kelas_id: selectedKelas,
        mata_pelajaran_id: selectedMataPelajaran,
        jumlah_jp: jumlahJP,
        semester: semester,
        tahun_ajaran: year,
      };

      await indexedDB.insert("jadwal_pelajaran", newSchedule);
      
      toast({
        title: "Berhasil",
        description: conflictingSchedules.length > 0 
          ? `Jadwal berhasil ditambahkan (${conflictingSchedules.length} jadwal lama dihapus)`
          : "Jadwal berhasil ditambahkan",
      });
      
      setShowAddDialog(false);
      setShowConflictDialog(false);
      setConflictingSchedules([]);
      resetForm();
      fetchData(year, semester);
    } catch (error) {
      console.error("Error adding schedule:", error);
      toast({
        title: "Error",
        description: "Gagal menambahkan jadwal",
        variant: "destructive",
      });
    }
  };

  
  const handleDeleteAllSchedules = async () => {
    try {
      // Delete all schedules for current semester and year
      const schedulesToDelete = schedules.map(s => s.id);
      
      for (const id of schedulesToDelete) {
        await indexedDB.delete("jadwal_pelajaran", id);
      }
      
      toast({
        title: "Berhasil",
        description: `${schedulesToDelete.length} jadwal berhasil dihapus`,
      });
      
      setShowDeleteAllDialog(false);
      fetchData();
    } catch (error) {
      console.error("Error deleting all schedules:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus jadwal",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await indexedDB.delete("jadwal_pelajaran", id);
      toast({
        title: "Berhasil",
        description: "Jadwal berhasil dihapus",
      });
      fetchData();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus jadwal",
        variant: "destructive",
      });
    }
  };

  const handleSaveTimeSettings = async () => {
    try {
      await indexedDB.insert("pengaturan", {
        key: "minutes_per_jp",
        value: minutesPerJP.toString(),
      });
      
      toast({
        title: "Berhasil",
        description: "Pengaturan waktu berhasil disimpan",
      });
      
      setShowTimeSettingsDialog(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan",
        variant: "destructive",
      });
    }
  };

  const handleSaveBreakSettings = async () => {
    try {
      await indexedDB.insert("pengaturan", { key: "break1_start", value: break1Start });
      await indexedDB.insert("pengaturan", { key: "break1_end", value: break1End });
      await indexedDB.insert("pengaturan", { key: "break2_start", value: break2Start });
      await indexedDB.insert("pengaturan", { key: "break2_end", value: break2End });
      
      toast({
        title: "Berhasil",
        description: "Pengaturan jam istirahat berhasil disimpan",
      });
      
      setShowBreakSettingsDialog(false);
      fetchData();
    } catch (error) {
      console.error("Error saving break settings:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan jam istirahat",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedDay("");
    setSelectedJamKe("");
    setSelectedKelas("");
    setSelectedMataPelajaran("");
    setJumlahJP(1);
  };

  const getScheduleForDayAndTime = (day: string, jamKe: number) => {
    // Check if this slot is occupied by a schedule that started earlier but spans multiple JPs
    const occupyingSchedule = schedules.find(s => {
      if (s.hari !== day) return false;
      // Check if this time slot falls within the range of this schedule
      return s.jam_ke <= jamKe && jamKe < (s.jam_ke + s.jumlah_jp);
    });
    
    if (occupyingSchedule) {
      // Return the schedule if this is the starting slot, otherwise return continuation marker
      if (occupyingSchedule.jam_ke === jamKe) {
        return [occupyingSchedule];
      } else {
        // This is a continuation slot
        return [{
          ...occupyingSchedule,
          isContinuation: true,
          continuationNumber: jamKe - occupyingSchedule.jam_ke + 1
        }];
      }
    }
    
    return [];
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Pelajaran"
        description={`Kelola jadwal mengajar per semester - Tahun Ajaran ${activeTahunAjaran}`}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex gap-4 items-end">
            <div className="flex-1 max-w-xs space-y-2">
              <Label className="block">Semester</Label>
              <Select value={activeSemester} onValueChange={async (value) => {
                setActiveSemester(value);
                await fetchData(activeTahunAjaran, value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">
                    <div className="flex items-center justify-between w-full gap-3">
                      <span>Semester 1</span>
                      {calendarActiveSemester === "1" && (
                        <Badge className="text-xs ml-auto bg-green-500 hover:bg-green-600 text-white">Aktif</Badge>
                      )}
                    </div>
                  </SelectItem>
                  <SelectItem value="2">
                    <div className="flex items-center justify-between w-full gap-3">
                      <span>Semester 2</span>
                      {calendarActiveSemester === "2" && (
                        <Badge className="text-xs ml-auto bg-green-500 hover:bg-green-600 text-white">Aktif</Badge>
                      )}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline"
              onClick={async () => {
                try {
                  await setActiveAcademicSemester(activeSemester);
                  setCalendarActiveSemester(activeSemester);
                  toast({
                    title: "Berhasil",
                    description: `Semester ${activeSemester} berhasil diaktifkan untuk kalender`,
                  });
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Gagal mengaktifkan semester",
                    variant: "destructive",
                  });
                }
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Aktifkan Semester
            </Button>
          </div>

          <div className="flex gap-2 mb-6">
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Jadwal
            </Button>
            <Button variant="outline" onClick={() => setShowTimeSettingsDialog(true)}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Pengaturan Waktu ({minutesPerJP} menit/JP)
            </Button>
            <Button variant="outline" onClick={() => setShowBreakSettingsDialog(true)}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Jam Istirahat
            </Button>
            {schedules.length > 0 && (
              <Button 
                onClick={() => setShowDeleteAllDialog(true)}
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Semua
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jadwal Mengajar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Jam</TableHead>
                  {DAYS.map(day => (
                    <TableHead key={day} className="min-w-[200px]">{day}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeSlots
                  .sort((a, b) => a.jam_ke - b.jam_ke)
                  .map(slot => (
                  <TableRow key={slot.id}>
                    <TableCell className="font-medium">
                      {slot.is_break ? (
                        <>
                          <div className="font-semibold text-orange-600">{slot.break_label}</div>
                          <div className="text-xs text-muted-foreground">
                            {slot.waktu_mulai} - {slot.waktu_selesai}
                          </div>
                        </>
                      ) : (
                        <>
                          <div>Jam ke-{slot.jam_ke}</div>
                          <div className="text-xs text-muted-foreground">
                            {slot.waktu_mulai} - {slot.waktu_selesai}
                          </div>
                        </>
                      )}
                    </TableCell>
                    {DAYS.map(day => {
                      if (slot.is_break) {
                        return (
                          <TableCell key={day} className="bg-orange-50 dark:bg-orange-950/20">
                            <div className="text-center text-sm text-muted-foreground">
                              Istirahat
                            </div>
                          </TableCell>
                        );
                      }
                      
                      const daySchedules = getScheduleForDayAndTime(day, slot.jam_ke);
                      return (
                        <TableCell key={day}>
                          <div className="space-y-2">
                            {daySchedules.map((schedule: any) => (
                              <div 
                                key={schedule.id}
                                className={`p-2 rounded border text-sm ${
                                  schedule.isContinuation 
                                    ? 'bg-primary/5 border-primary/10' 
                                    : 'bg-primary/10 border-primary/20'
                                }`}
                              >
                                <div className="font-medium">{schedule.kelas_nama}</div>
                                <div className="text-xs">{schedule.mata_pelajaran_nama}</div>
                                {schedule.isContinuation ? (
                                  <div className="text-xs text-muted-foreground italic">
                                    (Lanjutan - JP {schedule.continuationNumber}/{schedule.jumlah_jp})
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">
                                    {schedule.jumlah_jp} JP
                                  </div>
                                )}
                                {!schedule.isContinuation && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-1 h-6 w-full"
                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Schedule Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Jadwal</DialogTitle>
            <DialogDescription>
              Tambahkan jadwal mengajar baru
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Hari</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih hari" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map(day => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Jam Ke</Label>
              <Select value={selectedJamKe} onValueChange={setSelectedJamKe}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jam" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.filter(slot => !slot.is_break).map(slot => (
                    <SelectItem key={slot.id} value={slot.jam_ke.toString()}>
                      Jam ke-{slot.jam_ke} ({slot.waktu_mulai} - {slot.waktu_selesai})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Kelas</Label>
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {kelasList.map(kelas => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mata Pelajaran</Label>
              <Select value={selectedMataPelajaran} onValueChange={setSelectedMataPelajaran}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  {mataPelajaranList.map(mp => (
                    <SelectItem key={mp.id} value={mp.id}>
                      {mp.nama_mata_pelajaran}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Jumlah JP</Label>
              <Input
                type="number"
                min="1"
                value={jumlahJP}
                onChange={(e) => setJumlahJP(Number(e.target.value))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleAddSchedule}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Semua Jadwal</DialogTitle>
            <DialogDescription>
              Anda akan menghapus semua jadwal untuk Semester {activeSemester}, Tahun Ajaran {activeTahunAjaran}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm font-medium text-destructive mb-2">
              ⚠️ Peringatan: Tindakan ini tidak dapat dibatalkan!
            </p>
            <p className="text-sm text-muted-foreground">
              Total {schedules.length} jadwal akan dihapus secara permanen.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAllDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleDeleteAllSchedules} variant="destructive">
              Ya, Hapus Semua
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflict Confirmation Dialog */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Jadwal Bentrok</DialogTitle>
            <DialogDescription>
              Jadwal baru akan menimpa jadwal yang sudah ada. Yakin ingin melanjutkan?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm font-medium mb-2">Jadwal yang akan dihapus:</p>
              {conflictingSchedules.map((schedule, idx) => (
                <div key={idx} className="text-sm text-muted-foreground mb-1">
                  • Jam {schedule.jam_ke}{schedule.jumlah_jp > 1 && `-${schedule.jam_ke + schedule.jumlah_jp - 1}`} - {schedule.mata_pelajaran_nama} ({schedule.jumlah_jp} JP)
                </div>
              ))}
            </div>
            
            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-medium mb-2">Jadwal baru:</p>
              <div className="text-sm text-muted-foreground">
                • Jam {selectedJamKe}{jumlahJP > 1 && `-${Number(selectedJamKe) + jumlahJP - 1}`} - {mataPelajaranList.find(mp => mp.id === selectedMataPelajaran)?.nama_mata_pelajaran} ({jumlahJP} JP)
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConflictDialog(false)}>
              Batal
            </Button>
            <Button onClick={saveSchedule} variant="destructive">
              Ya, Timpa Jadwal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time Settings Dialog */}
      <Dialog open={showTimeSettingsDialog} onOpenChange={setShowTimeSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pengaturan Waktu</DialogTitle>
            <DialogDescription>
              Sesuaikan durasi per jam pelajaran
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Menit per JP</Label>
              <Input
                type="number"
                min="15"
                max="60"
                value={minutesPerJP}
                onChange={(e) => setMinutesPerJP(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Durasi setiap jam pelajaran dalam menit (15-60 menit)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTimeSettingsDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveTimeSettings}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Break Settings Dialog */}
      <Dialog open={showBreakSettingsDialog} onOpenChange={setShowBreakSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pengaturan Jam Istirahat</DialogTitle>
            <DialogDescription>
              Atur waktu istirahat (2 sesi)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-3 p-3 border rounded-lg">
              <h4 className="font-medium text-sm">Istirahat Sesi 1</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mulai</Label>
                  <Input
                    type="time"
                    value={break1Start}
                    onChange={(e) => setBreak1Start(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Selesai</Label>
                  <Input
                    type="time"
                    value={break1End}
                    onChange={(e) => setBreak1End(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 p-3 border rounded-lg">
              <h4 className="font-medium text-sm">Istirahat Sesi 2</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mulai</Label>
                  <Input
                    type="time"
                    value={break2Start}
                    onChange={(e) => setBreak2Start(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Selesai</Label>
                  <Input
                    type="time"
                    value={break2End}
                    onChange={(e) => setBreak2End(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Jam istirahat akan ditampilkan di tabel jadwal mengajar
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBreakSettingsDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveBreakSettings}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
