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
import { Plus, Settings as SettingsIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { indexedDB } from "@/lib/indexedDB";

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
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTimeSettingsDialog, setShowTimeSettingsDialog] = useState(false);
  const [showBreakSettingsDialog, setShowBreakSettingsDialog] = useState(false);
  const [minutesPerJP, setMinutesPerJP] = useState(45);
  
  // Break settings per day
  const [breakSettings, setBreakSettings] = useState<Record<string, {
    break1Start: string;
    break1End: string;
    break2Start: string;
    break2End: string;
  }>>({
    "Senin": { break1Start: "09:30", break1End: "09:45", break2Start: "12:00", break2End: "12:30" },
    "Selasa": { break1Start: "09:30", break1End: "09:45", break2Start: "12:00", break2End: "12:30" },
    "Rabu": { break1Start: "09:30", break1End: "09:45", break2Start: "12:00", break2End: "12:30" },
    "Kamis": { break1Start: "09:30", break1End: "09:45", break2Start: "12:00", break2End: "12:30" },
    "Jumat": { break1Start: "09:30", break1End: "09:45", break2Start: "11:30", break2End: "13:00" },
  });
  const [selectedBreakDay, setSelectedBreakDay] = useState("Senin");
  
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedJamKe, setSelectedJamKe] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedMataPelajaran, setSelectedMataPelajaran] = useState("");
  const [jumlahJP, setJumlahJP] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch schedules
      const schedulesData = await indexedDB.select("jadwal_pelajaran");
      
      // Fetch time slots or create default ones
      let timeSlotsData = await indexedDB.select("jam_pelajaran");
      if (timeSlotsData.length === 0) {
        timeSlotsData = await createDefaultTimeSlots();
      }
      
      // Fetch kelas
      const kelasData = await indexedDB.select("kelas");
      
      // Fetch mata pelajaran
      const mataPelajaranData = await indexedDB.select("mata_pelajaran");
      
      // Get settings
      const settings = await indexedDB.select("pengaturan");
      const jpSetting = settings.find((s: any) => s.key === "minutes_per_jp");
      if (jpSetting) {
        setMinutesPerJP(Number(jpSetting.value));
      }
      
      // Get break times from settings for each day
      const loadedBreakSettings: any = {};
      DAYS.forEach(day => {
        const dayKey = day.toLowerCase();
        const break1StartSetting = settings.find((s: any) => s.key === `break1_start_${dayKey}`);
        const break1EndSetting = settings.find((s: any) => s.key === `break1_end_${dayKey}`);
        const break2StartSetting = settings.find((s: any) => s.key === `break2_start_${dayKey}`);
        const break2EndSetting = settings.find((s: any) => s.key === `break2_end_${dayKey}`);
        
        if (break1StartSetting) {
          loadedBreakSettings[day] = {
            break1Start: break1StartSetting.value,
            break1End: break1EndSetting.value,
            break2Start: break2StartSetting.value,
            break2End: break2EndSetting.value,
          };
        }
      });
      
      if (Object.keys(loadedBreakSettings).length > 0) {
        setBreakSettings(loadedBreakSettings);
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
      setTimeSlots(timeSlotsData);
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
    
    const hasConflict = schedules.some(schedule => {
      if (schedule.hari !== selectedDay || schedule.kelas_id !== selectedKelas) {
        return false;
      }
      
      const existingStart = schedule.jam_ke;
      const existingEnd = schedule.jam_ke + schedule.jumlah_jp;
      
      // Check if ranges overlap
      return (startJam < existingEnd && endJam > existingStart);
    });
    
    if (hasConflict) {
      toast({
        title: "Error",
        description: "Jadwal bentrok dengan jadwal yang sudah ada untuk kelas ini",
        variant: "destructive",
      });
      return;
    }

    try {
      const newSchedule = {
        hari: selectedDay,
        jam_ke: Number(selectedJamKe),
        kelas_id: selectedKelas,
        mata_pelajaran_id: selectedMataPelajaran,
        jumlah_jp: jumlahJP,
      };

      await indexedDB.insert("jadwal_pelajaran", newSchedule);
      
      toast({
        title: "Berhasil",
        description: "Jadwal berhasil ditambahkan",
      });
      
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error adding schedule:", error);
      toast({
        title: "Error",
        description: "Gagal menambahkan jadwal",
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
      // Save break settings for all days
      for (const day of DAYS) {
        const dayKey = day.toLowerCase();
        const settings = breakSettings[day];
        
        await indexedDB.insert("pengaturan", { 
          key: `break1_start_${dayKey}`, 
          value: settings.break1Start 
        });
        await indexedDB.insert("pengaturan", { 
          key: `break1_end_${dayKey}`, 
          value: settings.break1End 
        });
        await indexedDB.insert("pengaturan", { 
          key: `break2_start_${dayKey}`, 
          value: settings.break2Start 
        });
        await indexedDB.insert("pengaturan", { 
          key: `break2_end_${dayKey}`, 
          value: settings.break2End 
        });
      }
      
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
        description="Kelola jadwal mengajar per kelas"
      />

      <div className="flex gap-2">
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
      </div>

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
                      <div>Jam ke-{slot.jam_ke}</div>
                      <div className="text-xs text-muted-foreground">
                        {slot.waktu_mulai} - {slot.waktu_selesai}
                      </div>
                    </TableCell>
                    {DAYS.map(day => {
                      // Check if this time slot is a break time for this day
                      const dayBreak = breakSettings[day];
                      const isBreak1 = dayBreak && 
                        slot.waktu_mulai === dayBreak.break1Start && 
                        slot.waktu_selesai === dayBreak.break1End;
                      const isBreak2 = dayBreak && 
                        slot.waktu_mulai === dayBreak.break2Start && 
                        slot.waktu_selesai === dayBreak.break2End;
                      
                      if (isBreak1 || isBreak2) {
                        return (
                          <TableCell key={day} className="bg-orange-50 dark:bg-orange-950/20">
                            <div className="text-center text-sm text-muted-foreground">
                              {isBreak1 ? "Istirahat 1" : "Istirahat 2"}
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
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pengaturan Jam Istirahat</DialogTitle>
            <DialogDescription>
              Atur waktu istirahat per hari (2 sesi untuk setiap hari)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Pilih Hari</Label>
              <Select value={selectedBreakDay} onValueChange={setSelectedBreakDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map(day => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 p-3 border rounded-lg">
              <h4 className="font-medium text-sm">Istirahat Sesi 1 - {selectedBreakDay}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mulai</Label>
                  <Input
                    type="time"
                    value={breakSettings[selectedBreakDay]?.break1Start || "09:30"}
                    onChange={(e) => setBreakSettings(prev => ({
                      ...prev,
                      [selectedBreakDay]: {
                        ...prev[selectedBreakDay],
                        break1Start: e.target.value
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label>Selesai</Label>
                  <Input
                    type="time"
                    value={breakSettings[selectedBreakDay]?.break1End || "09:45"}
                    onChange={(e) => setBreakSettings(prev => ({
                      ...prev,
                      [selectedBreakDay]: {
                        ...prev[selectedBreakDay],
                        break1End: e.target.value
                      }
                    }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 p-3 border rounded-lg">
              <h4 className="font-medium text-sm">Istirahat Sesi 2 - {selectedBreakDay}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mulai</Label>
                  <Input
                    type="time"
                    value={breakSettings[selectedBreakDay]?.break2Start || "12:00"}
                    onChange={(e) => setBreakSettings(prev => ({
                      ...prev,
                      [selectedBreakDay]: {
                        ...prev[selectedBreakDay],
                        break2Start: e.target.value
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label>Selesai</Label>
                  <Input
                    type="time"
                    value={breakSettings[selectedBreakDay]?.break2End || "12:30"}
                    onChange={(e) => setBreakSettings(prev => ({
                      ...prev,
                      [selectedBreakDay]: {
                        ...prev[selectedBreakDay],
                        break2End: e.target.value
                      }
                    }))}
                  />
                </div>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Jam istirahat akan ditampilkan otomatis di jadwal untuk hari yang dipilih
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBreakSettingsDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveBreakSettings}>Simpan Semua Hari</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
