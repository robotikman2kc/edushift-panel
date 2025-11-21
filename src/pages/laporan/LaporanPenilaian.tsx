import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Download, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { indexedDB, Kelas, MataPelajaran, JenisPenilaian, NilaiSiswa, Siswa } from "@/lib/indexedDB";
import { generatePDFBlob, getCustomPDFTemplate } from "@/lib/exportUtils";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { getBobotForKelas } from "@/lib/bobotUtils";

interface SemesterData {
  semester: string;
  tahunAjaran: string;
  hasData: boolean;
  studentCount: number;
}

const LaporanPenilaian = () => {
  const [selectedTingkat, setSelectedTingkat] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedMataPelajaran, setSelectedMataPelajaran] = useState("");
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState("");
  
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [filteredKelasList, setFilteredKelasList] = useState<Kelas[]>([]);
  const [mataPelajaranList, setMataPelajaranList] = useState<MataPelajaran[]>([]);
  const [kategoriList, setKategoriList] = useState<JenisPenilaian[]>([]);
  const [semesterData, setSemesterData] = useState<SemesterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [bobotMap, setBobotMap] = useState<{[key: string]: number}>({});

  const tingkatOptions = ["X", "XI", "XII"];
  
  // Generate tahun ajaran options
  const currentYear = new Date().getFullYear();
  const tahunAjaranOptions = [];
  for (let i = -2; i <= 2; i++) {
    const year = currentYear + i;
    tahunAjaranOptions.push(`${year}/${year + 1}`);
  }

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    if (selectedTingkat && kelasList.length > 0) {
      const filtered = kelasList.filter(k => k.tingkat === selectedTingkat && k.status === "Aktif");
      setFilteredKelasList(filtered);
    } else {
      setFilteredKelasList([]);
    }
  }, [selectedTingkat, kelasList]);

  useEffect(() => {
    if (selectedKelas && kategoriList.length > 0) {
      loadBobotForKelas();
    }
  }, [selectedKelas, kategoriList]);

  useEffect(() => {
    if (selectedKelas && selectedMataPelajaran && selectedTahunAjaran && kategoriList.length > 0) {
      loadSemesterData();
    }
  }, [selectedKelas, selectedMataPelajaran, selectedTahunAjaran, kategoriList]);

  const loadMasterData = async () => {
    try {
      const [kelas, mapel, kategori] = await Promise.all([
        indexedDB.select("kelas"),
        indexedDB.select("mata_pelajaran"),
        indexedDB.select("jenis_penilaian")
      ]);
      
      setKelasList(kelas.filter((k: Kelas) => k.status === "Aktif"));
      setMataPelajaranList(mapel.filter((m: MataPelajaran) => m.status === "Aktif"));
      setKategoriList(kategori.filter((k: JenisPenilaian) => k.status === "Aktif"));
    } catch (error) {
      console.error("Error loading master data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data master",
        variant: "destructive"
      });
    }
  };

  const loadBobotForKelas = async () => {
    try {
      const bobot = await getBobotForKelas(selectedKelas, kategoriList);
      setBobotMap(bobot);
    } catch (error) {
      console.error("Error loading bobot:", error);
    }
  };

  const loadSemesterData = async () => {
    setLoading(true);
    try {
      const [siswa, nilai] = await Promise.all([
        indexedDB.select("siswa"),
        indexedDB.select("nilai_siswa")
      ]);

      const filteredSiswa = siswa.filter((s: Siswa) => 
        s.kelas_id === selectedKelas && s.status === "Aktif"
      );

      const semesters: SemesterData[] = [
        {
          semester: "1",
          tahunAjaran: selectedTahunAjaran,
          hasData: false,
          studentCount: 0
        },
        {
          semester: "2",
          tahunAjaran: selectedTahunAjaran,
          hasData: false,
          studentCount: 0
        }
      ];

      semesters.forEach(sem => {
        const semesterNilai = nilai.filter((n: NilaiSiswa) =>
          n.mata_pelajaran_id === selectedMataPelajaran &&
          n.semester === sem.semester &&
          n.tahun_ajaran === sem.tahunAjaran
        );
        
        const uniqueStudents = new Set(semesterNilai.map((n: NilaiSiswa) => n.siswa_id));
        sem.hasData = uniqueStudents.size > 0;
        sem.studentCount = uniqueStudents.size;
      });

      setSemesterData(semesters);
    } catch (error) {
      console.error("Error loading semester data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data semester",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (semester: string) => {
    try {
      const [siswa, nilai] = await Promise.all([
        indexedDB.select("siswa"),
        indexedDB.select("nilai_siswa")
      ]);

      const filteredSiswa = siswa.filter((s: Siswa) => 
        s.kelas_id === selectedKelas && s.status === "Aktif"
      );

      const sortedSiswa = filteredSiswa.sort((a, b) => 
        a.nama_siswa.localeCompare(b.nama_siswa, 'id')
      );

      interface StudentGrade {
        siswa_id: string;
        nisn: string;
        nama_siswa: string;
        grades: { [kategori_id: string]: number };
        rata_rata: number;
      }

      const rekapData: StudentGrade[] = sortedSiswa.map((siswaItem: Siswa) => {
        const studentNilai = nilai.filter((n: NilaiSiswa) => 
          n.siswa_id === siswaItem.id && 
          n.mata_pelajaran_id === selectedMataPelajaran &&
          n.semester === semester &&
          n.tahun_ajaran === selectedTahunAjaran
        );

        const grades: { [kategori_id: string]: number } = {};
        kategoriList.forEach(kategori => {
          const nilaiKategori = studentNilai.filter((n: NilaiSiswa) => 
            n.jenis_penilaian_id === kategori.id
          );
          if (nilaiKategori.length > 0) {
            const totalNilai = nilaiKategori.reduce((sum: number, n: NilaiSiswa) => sum + n.nilai, 0);
            grades[kategori.id] = totalNilai / nilaiKategori.length;
          }
        });

        let totalBobot = 0;
        let totalNilaiBerbobot = 0;
        kategoriList.forEach(kategori => {
          if (grades[kategori.id] !== undefined) {
            const bobot = bobotMap[kategori.id] || 0;
            totalBobot += bobot;
            totalNilaiBerbobot += grades[kategori.id] * bobot;
          }
        });
        const rata_rata = totalBobot > 0 ? totalNilaiBerbobot / totalBobot : 0;

        return {
          siswa_id: siswaItem.id,
          nisn: siswaItem.nisn,
          nama_siswa: siswaItem.nama_siswa,
          grades,
          rata_rata
        };
      });

      if (rekapData.length === 0) {
        toast({
          title: "Tidak Ada Data",
          description: "Tidak ada data untuk diekspor",
          variant: "destructive"
        });
        return;
      }

      const selectedKelasData = kelasList.find(k => k.id === selectedKelas);
      const selectedMapelData = mataPelajaranList.find(m => m.id === selectedMataPelajaran);

      const exportData = rekapData.map((student) => {
        const rowData: any = {
          'NISN': student.nisn,
          'Nama Siswa': student.nama_siswa
        };

        kategoriList.forEach(kategori => {
          rowData[kategori.nama_kategori] = student.grades[kategori.id]?.toFixed(1) || '-';
        });

        rowData['Rata-rata'] = student.rata_rata.toFixed(1);

        return rowData;
      });

      const exportColumns = [
        { key: 'NISN', label: 'NISN' },
        { key: 'Nama Siswa', label: 'Nama Siswa' },
        ...kategoriList.map(k => ({ key: k.nama_kategori, label: k.nama_kategori })),
        { key: 'Rata-rata', label: 'Rata-rata' }
      ];

      const title = `Rekap Nilai - ${selectedKelasData?.nama_kelas} - ${selectedMapelData?.nama_mata_pelajaran} - Semester ${semester} - ${selectedTahunAjaran}`;
      const customTemplate = getCustomPDFTemplate('grade');
      const filename = `rekap_nilai_${selectedKelasData?.nama_kelas}_${selectedMapelData?.nama_mata_pelajaran}_S${semester}_${selectedTahunAjaran.replace('/', '-')}.pdf`;
      
      const blob = generatePDFBlob(
        exportData, 
        exportColumns, 
        title, 
        customTemplate
      );

      if (!blob) {
        throw new Error("Failed to generate PDF");
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Berhasil",
        description: "Laporan nilai berhasil diekspor ke PDF",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Gagal membuat PDF",
        variant: "destructive"
      });
    }
  };

  const selectedKelasData = kelasList.find(k => k.id === selectedKelas);
  const selectedMapelData = mataPelajaranList.find(m => m.id === selectedMataPelajaran);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Penilaian"
        description="Download rekap penilaian per semester"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tingkat</Label>
              <Select value={selectedTingkat} onValueChange={setSelectedTingkat}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tingkat" />
                </SelectTrigger>
                <SelectContent>
                  {tingkatOptions.map(tingkat => (
                    <SelectItem key={tingkat} value={tingkat}>
                      Kelas {tingkat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kelas</Label>
              <Select 
                value={selectedKelas} 
                onValueChange={setSelectedKelas}
                disabled={!selectedTingkat}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {filteredKelasList.map(kelas => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mata Pelajaran</Label>
              <Select 
                value={selectedMataPelajaran} 
                onValueChange={setSelectedMataPelajaran}
                disabled={!selectedKelas}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  {mataPelajaranList.map(mapel => (
                    <SelectItem key={mapel.id} value={mapel.id}>
                      {mapel.nama_mata_pelajaran}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tahun Ajaran</Label>
              <Select 
                value={selectedTahunAjaran} 
                onValueChange={setSelectedTahunAjaran}
                disabled={!selectedMataPelajaran}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahun ajaran" />
                </SelectTrigger>
                <SelectContent>
                  {tahunAjaranOptions.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Semester Cards */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>
              {selectedKelasData && selectedMapelData && selectedTahunAjaran
                ? `${selectedKelasData.nama_kelas} - ${selectedMapelData.nama_mata_pelajaran} - ${selectedTahunAjaran}`
                : "Pilih filter untuk melihat data"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <LoadingSkeleton key={i} />
                ))}
              </div>
            ) : !selectedKelas || !selectedMataPelajaran || !selectedTahunAjaran ? (
              <EmptyState
                title="Pilih Filter"
                description="Silakan pilih tingkat, kelas, mata pelajaran, dan tahun ajaran untuk melihat laporan"
                icon={FileText}
                variant="minimal"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {semesterData.map((semData) => (
                  <div 
                    key={semData.semester} 
                    className="flex flex-col gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className={semData.hasData ? "text-primary" : "text-muted-foreground"} size={20} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">Semester {semData.semester}</h3>
                        <p className="text-xs text-muted-foreground">
                          {semData.hasData 
                            ? `${semData.studentCount} siswa`
                            : "Tidak ada data"
                          }
                        </p>
                      </div>
                    </div>
                    
                    {semData.hasData ? (
                      <Button 
                        onClick={() => handleDownload(semData.semester)}
                        size="sm"
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    ) : (
                      <div className="h-9 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-md">
                        Tidak ada laporan
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LaporanPenilaian;
