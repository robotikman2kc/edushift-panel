import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, Star, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { indexedDB, Kelas, MataPelajaran, Siswa, JenisPenilaian, NilaiSiswa, Kehadiran } from "@/lib/indexedDB";
import { exportToExcel, generatePDFBlob, getCustomPDFTemplate } from "@/lib/exportUtils";
import { ExportDateDialog } from "@/components/common/ExportDateDialog";
import { getBobotForKelas } from "@/lib/bobotUtils";
import { SemesterSelector } from "@/components/common/SemesterSelector";

interface StudentGrade {
  siswa_id: string;
  nisn: string;
  nama_siswa: string;
  grades: { [kategori_id: string]: number };
  rata_rata: number;
  total_keaktifan: number;
  persentase_keaktifan: number;
}

type SortField = 'nisn' | 'nama_siswa' | 'rata_rata' | 'keaktifan' | string;
type SortOrder = 'asc' | 'desc' | null;

const RekapNilai = () => {
  // Load saved state from localStorage
  const getSavedState = (key: string, defaultValue: string) => {
    try {
      const saved = localStorage.getItem(`rekap_nilai_${key}`);
      return saved || defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [selectedTingkat, setSelectedTingkat] = useState(() => getSavedState('tingkat', ''));
  const [selectedKelas, setSelectedKelas] = useState(() => getSavedState('kelas', ''));
  const [selectedMataPelajaran, setSelectedMataPelajaran] = useState(() => getSavedState('mapel', ''));
  const [selectedSemester, setSelectedSemester] = useState(() => getSavedState('semester', ''));
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(() => getSavedState('tahun_ajaran', ''));
  
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [filteredKelasList, setFilteredKelasList] = useState<Kelas[]>([]);
  const [mataPelajaranList, setMataPelajaranList] = useState<MataPelajaran[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kategoriList, setKategoriList] = useState<JenisPenilaian[]>([]);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [bobotMap, setBobotMap] = useState<{[key: string]: number}>({});
  const [isExportDateDialogOpen, setIsExportDateDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const tingkatOptions = ["X", "XI", "XII"];

  // Save state to localStorage
  const saveState = (key: string, value: string) => {
    try {
      localStorage.setItem(`rekap_nilai_${key}`, value);
    } catch (error) {
      console.warn('Failed to save state:', error);
    }
  };

  useEffect(() => {
    loadMasterData();
    loadActiveSemester();
  }, []);

  const loadActiveSemester = async () => {
    try {
      const settings = await indexedDB.select("pengaturan");
      const semesterSetting = settings.find((s: any) => s.key === "semester_aktif");
      const tahunSetting = settings.find((s: any) => s.key === "tahun_ajaran_aktif");
      
      if (semesterSetting && !selectedSemester) {
        setSelectedSemester(semesterSetting.value);
        saveState('semester', semesterSetting.value);
      }
      if (tahunSetting && !selectedTahunAjaran) {
        setSelectedTahunAjaran(tahunSetting.value);
        saveState('tahun_ajaran', tahunSetting.value);
      }
    } catch (error) {
      console.error("Error loading active semester:", error);
    }
  };

  useEffect(() => {
    if (selectedTingkat && kelasList.length > 0) {
      const filtered = kelasList.filter(k => k.tingkat === selectedTingkat && k.status === "Aktif");
      setFilteredKelasList(filtered);
    } else if (kelasList.length > 0) {
      setFilteredKelasList([]);
    }
  }, [selectedTingkat, kelasList]);

  useEffect(() => {
    if (selectedKelas && kategoriList.length > 0) {
      loadBobotForKelas();
    }
  }, [selectedKelas, kategoriList]);

  useEffect(() => {
    if (selectedKelas && selectedMataPelajaran && kategoriList.length > 0 && Object.keys(bobotMap).length > 0 && selectedSemester && selectedTahunAjaran) {
      loadRekapNilai();
    }
  }, [selectedKelas, selectedMataPelajaran, kategoriList, bobotMap, selectedSemester, selectedTahunAjaran]);

  const loadMasterData = async () => {
    try {
      const [kelas, mapel, kategori] = await Promise.all([
        indexedDB.select("kelas"),
        indexedDB.select("mata_pelajaran"),
        indexedDB.select("jenis_penilaian")
      ]);
      
      console.log("=== LOAD MASTER DATA ===");
      console.log("Raw kategori data:", kategori);
      const filteredKategori = kategori.filter((k: JenisPenilaian) => k.status === "Aktif");
      console.log("Filtered kategori (Aktif only):", filteredKategori);
      
      setKelasList(kelas.filter((k: Kelas) => k.status === "Aktif"));
      setMataPelajaranList(mapel.filter((m: MataPelajaran) => m.status === "Aktif"));
      setKategoriList(filteredKategori);
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
      console.log("=== LOADED BOBOT FOR KELAS ===");
      console.log("Kelas ID:", selectedKelas);
      console.log("Bobot Map:", bobot);
      setBobotMap(bobot);
    } catch (error) {
      console.error("Error loading bobot:", error);
    }
  };

  const loadRekapNilai = async () => {
    setLoading(true);
    try {
      console.log("=== LOADING REKAP NILAI ===");
      console.log("Selected Kelas:", selectedKelas);
      console.log("Selected Mata Pelajaran:", selectedMataPelajaran);

      const [siswa, nilai, kehadiran] = await Promise.all([
        indexedDB.select("siswa"),
        indexedDB.select("nilai_siswa"),
        indexedDB.select("kehadiran")
      ]);

      console.log("All nilai data:", nilai);
      console.log("Total nilai records:", nilai.length);

      const filteredSiswa = siswa.filter((s: Siswa) => 
        s.kelas_id === selectedKelas && s.status === "Aktif"
      );

      // Sort siswa by nama
      const sortedSiswa = filteredSiswa.sort((a, b) => 
        a.nama_siswa.localeCompare(b.nama_siswa, 'id')
      );

      console.log("Filtered students:", sortedSiswa.length);

      const rekapData: StudentGrade[] = sortedSiswa.map((siswa: Siswa) => {
        // Get all grades for this student, subject, semester, and tahun ajaran
        const studentNilai = nilai.filter((n: NilaiSiswa) => 
          n.siswa_id === siswa.id && 
          n.mata_pelajaran_id === selectedMataPelajaran &&
          n.semester === selectedSemester &&
          n.tahun_ajaran === selectedTahunAjaran
        );

        console.log(`Student ${siswa.nama_siswa} (${siswa.id}) grades:`, studentNilai);

        // Calculate grades by category
        const grades: { [kategori_id: string]: number } = {};
        console.log(`Processing kategori for ${siswa.nama_siswa}:`, kategoriList.map(k => ({id: k.id, nama: k.nama_kategori})));
        kategoriList.forEach(kategori => {
          const nilaiKategori = studentNilai.filter((n: NilaiSiswa) => 
            n.jenis_penilaian_id === kategori.id
          );
          console.log(`Kategori ${kategori.nama_kategori} (${kategori.id}):`, nilaiKategori);
          if (nilaiKategori.length > 0) {
            const totalNilai = nilaiKategori.reduce((sum: number, n: NilaiSiswa) => sum + n.nilai, 0);
            grades[kategori.id] = totalNilai / nilaiKategori.length;
            console.log(`Set grades[${kategori.id}] = ${grades[kategori.id]}`);
          }
        });
        console.log(`Final grades object for ${siswa.nama_siswa}:`, grades);

        // Calculate weighted average using bobot from pengaturan
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
        console.log(`Rata-rata for ${siswa.nama_siswa}: ${rata_rata.toFixed(2)} (total bobot: ${totalBobot})`);

        // Calculate keaktifan statistics
        const studentKehadiran = kehadiran.filter((k: Kehadiran) => 
          k.siswa_id === siswa.id && 
          k.kelas_id === selectedKelas && 
          k.mata_pelajaran_id === selectedMataPelajaran
        );

        const total_keaktifan = studentKehadiran.filter((k: Kehadiran) => 
          k.keaktifan === 'Aktif'
        ).length;

        const total_pertemuan = studentKehadiran.length;
        const persentase_keaktifan = total_pertemuan > 0 
          ? (total_keaktifan / total_pertemuan) * 100 
          : 0;

        return {
          siswa_id: siswa.id,
          nisn: siswa.nisn,
          nama_siswa: siswa.nama_siswa,
          grades,
          rata_rata,
          total_keaktifan,
          persentase_keaktifan
        };
      });

      setStudentGrades(rekapData);
      setSiswaList(sortedSiswa);
    } catch (error) {
      console.error("Error loading rekap nilai:", error);
      toast({
        title: "Error",
        description: "Gagal memuat rekap nilai",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = (signatureDate?: Date) => {
    if (studentGrades.length === 0) {
      toast({
        title: "Tidak Ada Data",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedKelasData = kelasList.find(k => k.id === selectedKelas);
      const selectedMapelData = mataPelajaranList.find(m => m.id === selectedMataPelajaran);

      const exportData = studentGrades.map((student) => {
        const rowData: any = {
          'NISN': student.nisn,
          'Nama Siswa': student.nama_siswa
        };

        kategoriList.forEach(kategori => {
          rowData[kategori.nama_kategori] = student.grades[kategori.id]?.toFixed(1) || '-';
        });

        rowData['Rata-rata'] = student.rata_rata.toFixed(1);
        rowData['Keaktifan'] = `${student.total_keaktifan}x`;

        return rowData;
      });

      const exportColumns = [
        { key: 'NISN', label: 'NISN' },
        { key: 'Nama Siswa', label: 'Nama Siswa' },
        ...kategoriList.map(k => ({ key: k.nama_kategori, label: k.nama_kategori })),
        { key: 'Rata-rata', label: 'Rata-rata' },
        { key: 'Keaktifan', label: 'Keaktifan' }
      ];

      const title = `Rekap Nilai - ${selectedKelasData?.nama_kelas} - ${selectedMapelData?.nama_mata_pelajaran} - Semester ${selectedSemester} - ${selectedTahunAjaran}`;
      let customTemplate = getCustomPDFTemplate('grade');
      
      // Add signature date to template
      if (signatureDate) {
        customTemplate = {
          ...customTemplate,
          signatureDate: signatureDate.toISOString().split('T')[0],
        };
      }
      
      const filename = `rekap_nilai_${selectedKelasData?.nama_kelas}_${selectedMapelData?.nama_mata_pelajaran}_S${selectedSemester}_${selectedTahunAjaran.replace('/', '-')}.pdf`;
      
      const blob = generatePDFBlob(
        exportData, 
        exportColumns, 
        title, 
        customTemplate
      );

      // Download PDF directly
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
        description: "Rekap nilai berhasil diekspor ke PDF",
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

  const handleExportExcel = () => {
    if (studentGrades.length === 0) {
      toast({
        title: "Tidak Ada Data",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedKelasData = kelasList.find(k => k.id === selectedKelas);
      const selectedMapelData = mataPelajaranList.find(m => m.id === selectedMataPelajaran);

      const exportData = studentGrades.map((student, index) => {
        const rowData: any = {
          'No': index + 1,
          'NISN': student.nisn,
          'Nama Siswa': student.nama_siswa
        };

        kategoriList.forEach(kategori => {
          rowData[kategori.nama_kategori] = student.grades[kategori.id]?.toFixed(1) || '-';
        });

        rowData['Rata-rata'] = student.rata_rata.toFixed(1);
        rowData['Keaktifan'] = `${student.total_keaktifan}x`;

        return rowData;
      });

      const exportColumns = [
        { key: 'No', label: 'No' },
        { key: 'NISN', label: 'NISN' },
        { key: 'Nama Siswa', label: 'Nama Siswa' },
        ...kategoriList.map(k => ({ key: k.nama_kategori, label: k.nama_kategori })),
        { key: 'Rata-rata', label: 'Rata-rata' },
        { key: 'Keaktifan', label: 'Keaktifan' }
      ];

      const title = `Rekap Nilai - ${selectedKelasData?.nama_kelas} - ${selectedMapelData?.nama_mata_pelajaran} - Semester ${selectedSemester} - ${selectedTahunAjaran}`;
      const filename = `rekap_nilai_${selectedKelasData?.nama_kelas}_${selectedMapelData?.nama_mata_pelajaran}_S${selectedSemester}_${selectedTahunAjaran.replace('/', '-')}.xlsx`;

      const success = exportToExcel(exportData, exportColumns, title, filename);

      if (success) {
        toast({
          title: "Export Berhasil",
          description: "Rekap nilai berhasil diekspor ke Excel",
        });
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Error",
        description: "Gagal export ke Excel",
        variant: "destructive"
      });
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortOrder(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortedGrades = () => {
    if (!sortField || !sortOrder) return studentGrades;

    return [...studentGrades].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'nisn') {
        aValue = a.nisn;
        bValue = b.nisn;
      } else if (sortField === 'nama_siswa') {
        aValue = a.nama_siswa;
        bValue = b.nama_siswa;
      } else if (sortField === 'rata_rata') {
        aValue = a.rata_rata;
        bValue = b.rata_rata;
      } else if (sortField === 'keaktifan') {
        aValue = a.total_keaktifan;
        bValue = b.total_keaktifan;
      } else {
        // Sort by kategori
        aValue = a.grades[sortField] || 0;
        bValue = b.grades[sortField] || 0;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue, 'id')
          : bValue.localeCompare(aValue, 'id');
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-50" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1 inline" />
      : <ArrowDown className="h-3 w-3 ml-1 inline" />;
  };

  const selectedKelasData = kelasList.find(k => k.id === selectedKelas);
  const selectedMapelData = mataPelajaranList.find(m => m.id === selectedMataPelajaran);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Rekap Nilai" 
        description="Rekapitulasi nilai dan keaktifan siswa per kelas dan mata pelajaran"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SemesterSelector
              semester={selectedSemester}
              tahunAjaran={selectedTahunAjaran}
              onSemesterChange={(value) => {
                setSelectedSemester(value);
                saveState('semester', value);
              }}
              onTahunAjaranChange={(value) => {
                setSelectedTahunAjaran(value);
                saveState('tahun_ajaran', value);
              }}
            />
            
            <div className="space-y-2">
              <Label>Tingkat</Label>
              <Select 
                value={selectedTingkat} 
                onValueChange={(value) => {
                  setSelectedTingkat(value);
                  saveState('tingkat', value);
                }}
              >
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
                onValueChange={(value) => {
                  setSelectedKelas(value);
                  saveState('kelas', value);
                }}
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
                onValueChange={(value) => {
                  setSelectedMataPelajaran(value);
                  saveState('mapel', value);
                }}
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
          </CardContent>
        </Card>

        {/* Data Panel */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Rekap Nilai</CardTitle>
              {selectedKelasData && selectedMapelData && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedKelasData.nama_kelas} - {selectedMapelData.nama_mata_pelajaran}
                </p>
              )}
            </div>
            {studentGrades.length > 0 && (
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsExportDateDialogOpen(true)}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button 
                  onClick={handleExportExcel}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedKelas || !selectedMataPelajaran ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Pilih tingkat, kelas, dan mata pelajaran untuk melihat rekap nilai
                </p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Memuat data...</p>
              </div>
            ) : studentGrades.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Belum ada data nilai</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('nisn')}
                      >
                        NISN
                        <SortIcon field="nisn" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('nama_siswa')}
                      >
                        Nama Siswa
                        <SortIcon field="nama_siswa" />
                      </TableHead>
                      {kategoriList.map(kategori => {
                        const bobot = bobotMap[kategori.id] || 0;
                        return (
                          <TableHead 
                            key={kategori.id} 
                            className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleSort(kategori.id)}
                          >
                            {kategori.nama_kategori}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({bobot}%)
                            </span>
                            <SortIcon field={kategori.id} />
                          </TableHead>
                        );
                      })}
                      <TableHead 
                        className="text-center font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('rata_rata')}
                      >
                        Rata-rata
                        <SortIcon field="rata_rata" />
                      </TableHead>
                      <TableHead 
                        className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('keaktifan')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          Keaktifan
                          <SortIcon field="keaktifan" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getSortedGrades().map((student, index) => (
                      <TableRow key={student.siswa_id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{student.nisn}</TableCell>
                        <TableCell>{student.nama_siswa}</TableCell>
                        {kategoriList.map(kategori => (
                          <TableCell key={kategori.id} className="text-center">
                            {student.grades[kategori.id]?.toFixed(1) || '-'}
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-semibold">
                          <Badge variant={student.rata_rata >= 75 ? "default" : "destructive"}>
                            {student.rata_rata.toFixed(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="outline"
                            className="bg-yellow-100 text-yellow-900 border-yellow-300"
                          >
                            <Star className="h-3 w-3 mr-1" />
                            {student.total_keaktifan}x
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <ExportDateDialog
        open={isExportDateDialogOpen}
        onOpenChange={setIsExportDateDialogOpen}
        onExport={handleExportPDF}
        title="Export Rekap Nilai"
        description="Pilih tanggal untuk tanda tangan pada laporan nilai"
      />
    </div>
  );
};

export default RekapNilai;
