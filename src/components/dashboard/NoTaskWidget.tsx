import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Search } from "lucide-react";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelas, setSelectedKelas] = useState<string>("all");
  const [selectedMapel, setSelectedMapel] = useState<string>("all");
  const [selectedKategori, setSelectedKategori] = useState<string>("all");

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

      // Sort by date (newest first) - no limit anymore
      const sortedData = enrichedData
        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

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

  // Get unique values for filters
  const uniqueKelas = useMemo(() => {
    const kelasMap = new Map<string, string>();
    noTaskStudents.forEach(s => {
      kelasMap.set(s.kelas_id, s.kelas_nama);
    });
    return Array.from(kelasMap.entries()).map(([id, nama]) => ({ id, nama }));
  }, [noTaskStudents]);

  const uniqueMapel = useMemo(() => {
    const mapelMap = new Map<string, string>();
    noTaskStudents.forEach(s => {
      mapelMap.set(s.mata_pelajaran_id, s.mata_pelajaran_nama);
    });
    return Array.from(mapelMap.entries()).map(([id, nama]) => ({ id, nama }));
  }, [noTaskStudents]);

  const uniqueKategori = useMemo(() => {
    const kategoriMap = new Map<string, string>();
    noTaskStudents.forEach(s => {
      kategoriMap.set(s.kategori_id, s.kategori_nama);
    });
    return Array.from(kategoriMap.entries()).map(([id, nama]) => ({ id, nama }));
  }, [noTaskStudents]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return noTaskStudents.filter(student => {
      const matchSearch = student.siswa_nama.toLowerCase().includes(searchQuery.toLowerCase());
      const matchKelas = selectedKelas === "all" || student.kelas_id === selectedKelas;
      const matchMapel = selectedMapel === "all" || student.mata_pelajaran_id === selectedMapel;
      const matchKategori = selectedKategori === "all" || student.kategori_id === selectedKategori;
      
      return matchSearch && matchKelas && matchMapel && matchKategori;
    });
  }, [noTaskStudents, searchQuery, selectedKelas, selectedMapel, selectedKategori]);

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
    <>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsDialogOpen(true)}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            Nilai Kosong
            <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0">
              {noTaskStudents.length}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Siswa Belum Mengumpulkan
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

              <Select value={selectedKategori} onValueChange={setSelectedKategori}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {uniqueKategori.map(k => (
                    <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                  ))}
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
                      key={`${student.siswa_id}-${index}`}
                      onClick={() => {
                        handleNavigateToInputNilai(student);
                        setIsDialogOpen(false);
                      }}
                      className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{student.siswa_nama}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {student.mata_pelajaran_nama} - {student.kategori_nama}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {student.kelas_nama}
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
};
