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
import { localDB } from "@/lib/localDB";

interface TimeSlot {
  id: string;
  jam_ke: number;
  waktu_mulai: string;
  waktu_selesai: string;
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
  const [minutesPerJP, setMinutesPerJP] = useState(45);
  
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
      const schedulesData = localDB.select("jadwal_pelajaran");
      
      // Fetch time slots or create default ones
      let timeSlotsData = localDB.select("jam_pelajaran");
      if (timeSlotsData.length === 0) {
        timeSlotsData = createDefaultTimeSlots();
      }
      
      // Fetch kelas
      const kelasData = localDB.select("kelas");
      
      // Fetch mata pelajaran
      const mataPelajaranData = localDB.select("mata_pelajaran");
      
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
      
      // Get minutes per JP from settings or use default
      const settings = localDB.select("pengaturan");
      const jpSetting = settings.find((s: any) => s.key === "minutes_per_jp");
      if (jpSetting) {
        setMinutesPerJP(Number(jpSetting.value));
      }
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

  const createDefaultTimeSlots = () => {
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
      localDB.insert("jam_pelajaran", slot);
    }
    
    return defaultSlots;
  };

  const handleAddSchedule = () => {
    if (!selectedDay || !selectedJamKe || !selectedKelas || !selectedMataPelajaran) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
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

      localDB.insert("jadwal_pelajaran", newSchedule);
      
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

  const handleDeleteSchedule = (id: string) => {
    try {
      localDB.delete("jadwal_pelajaran", id);
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

  const handleSaveTimeSettings = () => {
    try {
      localDB.insert("pengaturan", {
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

  const resetForm = () => {
    setSelectedDay("");
    setSelectedJamKe("");
    setSelectedKelas("");
    setSelectedMataPelajaran("");
    setJumlahJP(1);
  };

  const getScheduleForDayAndTime = (day: string, jamKe: number) => {
    return schedules.filter(s => s.hari === day && s.jam_ke === jamKe);
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
                {timeSlots.map(slot => (
                  <TableRow key={slot.id}>
                    <TableCell className="font-medium">
                      <div>Jam ke-{slot.jam_ke}</div>
                      <div className="text-xs text-muted-foreground">
                        {slot.waktu_mulai} - {slot.waktu_selesai}
                      </div>
                    </TableCell>
                    {DAYS.map(day => {
                      const daySchedules = getScheduleForDayAndTime(day, slot.jam_ke);
                      return (
                        <TableCell key={day}>
                          <div className="space-y-2">
                            {daySchedules.map(schedule => (
                              <div 
                                key={schedule.id}
                                className="p-2 bg-primary/10 rounded border border-primary/20 text-sm"
                              >
                                <div className="font-medium">{schedule.kelas_nama}</div>
                                <div className="text-xs">{schedule.mata_pelajaran_nama}</div>
                                <div className="text-xs text-muted-foreground">
                                  {schedule.jumlah_jp} JP
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-1 h-6 w-full"
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
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
                  {timeSlots.map(slot => (
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
    </div>
  );
}
