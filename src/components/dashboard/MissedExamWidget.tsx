import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar } from "lucide-react";
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

      // Sort by date (newest first) and limit to 10
      const sortedStudents = missedStudents
        .sort((a, b) => new Date(b.tanggal_ulangan).getTime() - new Date(a.tanggal_ulangan).getTime())
        .slice(0, 10);

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
    <Card>
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
        {missedExamStudents.map((student, index) => (
          <div
            key={index}
            onClick={() => handleNavigateToInputNilai(student)}
            className="p-2 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-xs truncate">{student.nama_siswa}</p>
                  <Badge variant={getStatusBadgeVariant(student.status_kehadiran)} className="text-[10px] px-1 py-0">
                    {student.status_kehadiran}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground flex-wrap">
                  <span className="font-medium truncate">{student.nama_mata_pelajaran}</span>
                  <span>•</span>
                  <Calendar className="h-2.5 w-2.5" />
                  <span className="whitespace-nowrap">
                    {format(new Date(student.tanggal_ulangan), "dd MMM yyyy", { locale: localeId })}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                {student.nama_kelas}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
