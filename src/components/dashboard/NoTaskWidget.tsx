import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { indexedDB } from "@/lib/indexedDB";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";

interface NoTaskStudent {
  siswa_id: string;
  siswa_nama: string;
  kelas_id: string;
  kelas_nama: string;
  mata_pelajaran_id: string;
  mata_pelajaran_nama: string;
  kategori_id: string;
  kategori_nama: string;
  tanggal: string;
  semester: string;
  tahun_ajaran: string;
}

export const NoTaskWidget = () => {
  const navigate = useNavigate();
  const [noTaskStudents, setNoTaskStudents] = useState<NoTaskStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNoTaskStudents();
  }, []);

  const fetchNoTaskStudents = async () => {
    try {
      setLoading(true);
      
      // Get all nilai_siswa with belum_mengumpulkan = true
      const nilaiData = await indexedDB.select("nilai_siswa", (n: any) => 
        n.belum_mengumpulkan === true
      );

      if (nilaiData.length === 0) {
        setNoTaskStudents([]);
        return;
      }

      // Get related data
      const siswaData = await indexedDB.select("siswa");
      const kelasData = await indexedDB.select("kelas");
      const mataPelajaranData = await indexedDB.select("mata_pelajaran");
      const kategoriData = await indexedDB.select("jenis_penilaian");

      // Map nilai to student details
      const enrichedData = nilaiData.map((nilai: any) => {
        const siswa = siswaData.find((s: any) => s.id === nilai.siswa_id);
        const kelas = kelasData.find((k: any) => k.id === siswa?.kelas_id);
        const mataPelajaran = mataPelajaranData.find((m: any) => m.id === nilai.mata_pelajaran_id);
        const kategori = kategoriData.find((k: any) => k.id === nilai.jenis_penilaian_id);

        return {
          siswa_id: nilai.siswa_id,
          siswa_nama: siswa?.nama_siswa || "N/A",
          kelas_id: siswa?.kelas_id || "",
          kelas_nama: kelas?.nama_kelas || "N/A",
          mata_pelajaran_id: nilai.mata_pelajaran_id,
          mata_pelajaran_nama: mataPelajaran?.nama_mata_pelajaran || "N/A",
          kategori_id: nilai.jenis_penilaian_id,
          kategori_nama: kategori?.nama_kategori || "N/A",
          tanggal: nilai.tanggal || nilai.updated_at || new Date().toISOString(),
          semester: nilai.semester || "",
          tahun_ajaran: nilai.tahun_ajaran || ""
        };
      });

      // Sort by date (newest first) and limit to 10
      const sortedData = enrichedData
        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
        .slice(0, 10);

      setNoTaskStudents(sortedData);
    } catch (error) {
      console.error("Error fetching no task students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToInputNilai = async (student: NoTaskStudent) => {
    // Save filter selections to indexedDB for auto-population
    try {
      const settings = await indexedDB.select("pengaturan");
      
      const updates = [
        { key: "last_selected_kelas_nilai", value: student.kelas_id },
        { key: "last_selected_mapel_nilai", value: student.mata_pelajaran_id },
        { key: "last_selected_category_nilai", value: student.kategori_id },
        { key: "last_selected_semester_nilai", value: student.semester },
        { key: "last_selected_tahun_ajaran_nilai", value: student.tahun_ajaran }
      ];

      for (const update of updates) {
        const existing = settings.find((s: any) => s.key === update.key);
        if (existing) {
          await indexedDB.update("pengaturan", existing.id, { value: update.value });
        } else {
          await indexedDB.insert("pengaturan", update);
        }
      }
    } catch (error) {
      console.error("Error saving filter selections:", error);
    }

    // Navigate to input nilai page
    navigate("/penilaian/input-nilai");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Siswa Belum Mengumpulkan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton type="list" count={3} />
        </CardContent>
      </Card>
    );
  }

  if (noTaskStudents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Siswa Belum Mengumpulkan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Semua siswa sudah mengumpulkan tugas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          Nilai Kosong
          <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0">
            {noTaskStudents.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {noTaskStudents.map((student, index) => (
            <div 
              key={`${student.siswa_id}-${index}`}
              onClick={() => handleNavigateToInputNilai(student)}
              className="flex items-center justify-between gap-2 p-2 rounded border bg-card hover:bg-muted/50 transition-colors text-xs cursor-pointer hover:shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{student.siswa_nama}</p>
                <p className="text-muted-foreground truncate">
                  {student.mata_pelajaran_nama} - {student.kategori_nama}
                </p>
              </div>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {student.kelas_nama}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
