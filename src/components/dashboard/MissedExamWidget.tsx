import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Calendar, Search } from "lucide-react";
import { indexedDB } from "@/lib/indexedDB";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface MissedExamStudent {
  siswa_id: string;
  nama_siswa: string;
  kelas_id: string;
  nama_kelas: string;
  mata_pelajaran_id: string;
  nama_mata_pelajaran: string;
  tanggal_ulangan: string;
  status_kehadiran: string;
  semester: string;
  tahun_ajaran: string;
}

export function MissedExamWidget() {
  const navigate = useNavigate();
  const [missedExamStudents, setMissedExamStudents] = useState<MissedExamStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelas, setSelectedKelas] = useState<string>("all");
  const [selectedMapel, setSelectedMapel] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    fetchMissedExamStudents();
  }, []);

  const fetchMissedExamStudents = async () => {
    try {
      setLoading(true);

      // Get all agenda mengajar with "Penilaian Harian"
      const allAgenda = await indexedDB.select('agenda_mengajar');
      const examAgendas = allAgenda.filter(
        (agenda: any) => agenda.jenis_pembelajaran === "Penilaian Harian"
      );

      if (examAgendas.length === 0) {
        setMissedExamStudents([]);
        setLoading(false);
        return;
      }

      // Get all related data
      const [allKehadiran, allSiswa, allKelas, allMataPelajaran, allJadwal] = await Promise.all([
        indexedDB.select('kehadiran'),
        indexedDB.select('siswa'),
        indexedDB.select('kelas'),
        indexedDB.select('mata_pelajaran'),
        indexedDB.select('jadwal_pelajaran')
      ]);

      const missedStudents: MissedExamStudent[] = [];

      // For each exam agenda, find students who were absent
      for (const agenda of examAgendas) {
        // Find attendance records for this date, class, and subject
        const attendanceRecords = allKehadiran.filter((kehadiran: any) => {
          return (
            kehadiran.tanggal === agenda.tanggal &&
            kehadiran.kelas_id === agenda.kelas_id &&
            kehadiran.mata_pelajaran_id === agenda.mata_pelajaran_id &&
            ['Sakit', 'Izin', 'Alpha'].includes(kehadiran.status_kehadiran)
          );
        });

        // Get semester from jadwal_pelajaran if available
        const jadwal = allJadwal.find((j: any) => 
          j.kelas_id === agenda.kelas_id && 
          j.mata_pelajaran_id === agenda.mata_pelajaran_id &&
          j.tahun_ajaran === agenda.tahun_ajaran
        );
        const semester = jadwal?.semester || 'Ganjil';

        // For each absent student, add to the list
        for (const kehadiran of attendanceRecords) {
          const siswa = allSiswa.find((s: any) => s.id === kehadiran.siswa_id);
          const kelas = allKelas.find((k: any) => k.id === agenda.kelas_id);
          const mataPelajaran = allMataPelajaran.find((mp: any) => mp.id === agenda.mata_pelajaran_id);

          if (siswa && kelas && mataPelajaran) {
            missedStudents.push({
              siswa_id: siswa.id,
              nama_siswa: siswa.nama_siswa,
              kelas_id: kelas.id,
              nama_kelas: kelas.nama_kelas,
              mata_pelajaran_id: mataPelajaran.id,
              nama_mata_pelajaran: mataPelajaran.nama_mata_pelajaran,
              tanggal_ulangan: agenda.tanggal,
              status_kehadiran: kehadiran.status_kehadiran,
              semester: semester,
              tahun_ajaran: agenda.tahun_ajaran
            });
          }
        }
      }

      // Sort by date (newest first) - no limit anymore
      const sortedStudents = missedStudents
        .sort((a, b) => new Date(b.tanggal_ulangan).getTime() - new Date(a.tanggal_ulangan).getTime());

      setMissedExamStudents(sortedStudents);
    } catch (error) {
      console.error("Error fetching missed exam students:", error);
      setMissedExamStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToInputNilai = async (student: MissedExamStudent) => {
    try {
      // Save selection to settings for the Input Nilai page
      await indexedDB.update('pengaturan', 'selected_kelas', {
        key: 'selected_kelas',
        value: student.kelas_id
      });
      await indexedDB.update('pengaturan', 'selected_mata_pelajaran', {
        key: 'selected_mata_pelajaran',
        value: student.mata_pelajaran_id
      });
      await indexedDB.update('pengaturan', 'selected_semester', {
        key: 'selected_semester',
        value: student.semester
      });
      await indexedDB.update('pengaturan', 'selected_tahun_ajaran', {
        key: 'selected_tahun_ajaran',
        value: student.tahun_ajaran
      });

      // Navigate to input nilai page
      navigate('/penilaian/input-nilai');
    } catch (error) {
      console.error("Error navigating to input nilai:", error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Sakit':
        return 'secondary';
      case 'Izin':
        return 'outline';
      case 'Alpha':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Get unique values for filters
  const uniqueKelas = useMemo(() => {
    const kelasMap = new Map<string, string>();
    missedExamStudents.forEach(s => {
      kelasMap.set(s.kelas_id, s.nama_kelas);
    });
    return Array.from(kelasMap.entries()).map(([id, nama]) => ({ id, nama }));
  }, [missedExamStudents]);

  const uniqueMapel = useMemo(() => {
    const mapelMap = new Map<string, string>();
    missedExamStudents.forEach(s => {
      mapelMap.set(s.mata_pelajaran_id, s.nama_mata_pelajaran);
    });
    return Array.from(mapelMap.entries()).map(([id, nama]) => ({ id, nama }));
  }, [missedExamStudents]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return missedExamStudents.filter(student => {
      const matchSearch = student.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase());
      const matchKelas = selectedKelas === "all" || student.kelas_id === selectedKelas;
      const matchMapel = selectedMapel === "all" || student.mata_pelajaran_id === selectedMapel;
      const matchStatus = selectedStatus === "all" || student.status_kehadiran === selectedStatus;
      
      return matchSearch && matchKelas && matchMapel && matchStatus;
    });
  }, [missedExamStudents, searchQuery, selectedKelas, selectedMapel, selectedStatus]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Siswa Belum Ulangan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (missedExamStudents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Siswa Belum Ulangan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tidak ada siswa yang belum mengikuti ulangan
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsDialogOpen(true)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            Siswa Belum Ulangan
            <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0">
              {missedExamStudents.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Ada {missedExamStudents.length} siswa yang belum mengikuti ulangan
          </p>
          <div className="flex justify-end">
            <Button variant="link" className="text-xs p-0 h-auto">
              Lihat Detail →
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Siswa Belum Ulangan
              <Badge variant="destructive" className="text-xs">
                {filteredStudents.length}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {uniqueKelas.map(k => (
                    <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMapel} onValueChange={setSelectedMapel}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Mapel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Mapel</SelectItem>
                  {uniqueMapel.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Sakit">Sakit</SelectItem>
                  <SelectItem value="Izin">Izin</SelectItem>
                  <SelectItem value="Alpha">Alpha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Student List */}
            <ScrollArea className="h-[400px] pr-4">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Tidak ada data yang sesuai dengan filter</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStudents.map((student, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        handleNavigateToInputNilai(student);
                        setIsDialogOpen(false);
                      }}
                      className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{student.nama_siswa}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <Badge variant={getStatusBadgeVariant(student.status_kehadiran)} className="text-xs">
                              {student.status_kehadiran}
                            </Badge>
                            <span className="font-medium truncate">{student.nama_mata_pelajaran}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span className="whitespace-nowrap">
                              {format(new Date(student.tanggal_ulangan), "dd MMM yyyy", { locale: localeId })}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {student.nama_kelas}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
