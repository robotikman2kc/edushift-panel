import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, Star } from "lucide-react";
import { indexedDB, Kelas, MataPelajaran, Siswa, JenisPenilaian, NilaiSiswa, Kehadiran } from "@/lib/indexedDB";
import { exportToExcel, generatePDFBlob, getCustomPDFTemplate } from "@/lib/exportUtils";

interface StudentGrade {
  siswa_id: string;
  nis: string;
  nama_siswa: string;
  grades: { [kategori_id: string]: number };
  rata_rata: number;
  total_keaktifan: number;
  persentase_keaktifan: number;
}

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
  
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [filteredKelasList, setFilteredKelasList] = useState<Kelas[]>([]);
  const [mataPelajaranList, setMataPelajaranList] = useState<MataPelajaran[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kategoriList, setKategoriList] = useState<JenisPenilaian[]>([]);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(false);

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
  }, []);

  useEffect(() => {
    if (selectedTingkat && kelasList.length > 0) {
      const filtered = kelasList.filter(k => k.tingkat === selectedTingkat && k.status === "Aktif");
      setFilteredKelasList(filtered);
    } else if (kelasList.length > 0) {
      setFilteredKelasList([]);
    }
  }, [selectedTingkat, kelasList]);

  useEffect(() => {
    if (selectedKelas && selectedMataPelajaran) {
      loadRekapNilai();
    }
  }, [selectedKelas, selectedMataPelajaran]);

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

  const loadRekapNilai = async () => {
    setLoading(true);
    try {
      const [siswa, nilai, kehadiran] = await Promise.all([
        indexedDB.select("siswa"),
        indexedDB.select("nilai_siswa"),
        indexedDB.select("kehadiran")
      ]);

      const filteredSiswa = siswa.filter((s: Siswa) => 
        s.kelas_id === selectedKelas && s.status === "Aktif"
      );

      const rekapData: StudentGrade[] = filteredSiswa.map((siswa: Siswa) => {
        // Get all grades for this student and subject
        const studentNilai = nilai.filter((n: NilaiSiswa) => 
          n.siswa_id === siswa.id && n.mata_pelajaran_id === selectedMataPelajaran
        );

        // Calculate grades by category
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

        // Calculate weighted average
        let totalBobot = 0;
        let totalNilaiBerbobot = 0;
        kategoriList.forEach(kategori => {
          if (grades[kategori.id] !== undefined) {
            const bobot = kategori.bobot || 0;
            totalBobot += bobot;
            totalNilaiBerbobot += grades[kategori.id] * bobot;
          }
        });
        const rata_rata = totalBobot > 0 ? totalNilaiBerbobot / totalBobot : 0;

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
          nis: siswa.nis,
          nama_siswa: siswa.nama_siswa,
          grades,
          rata_rata,
          total_keaktifan,
          persentase_keaktifan
        };
      });

      setStudentGrades(rekapData);
      setSiswaList(filteredSiswa);
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

  const handleExportPDF = () => {
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
          'NIS': student.nis,
          'Nama Siswa': student.nama_siswa
        };

        kategoriList.forEach(kategori => {
          rowData[kategori.nama_kategori] = student.grades[kategori.id]?.toFixed(1) || '-';
        });

        rowData['Rata-rata'] = student.rata_rata.toFixed(1);
        rowData['Keaktifan'] = `${student.total_keaktifan} (${student.persentase_keaktifan.toFixed(0)}%)`;

        return rowData;
      });

      const exportColumns = [
        { key: 'No', label: 'No' },
        { key: 'NIS', label: 'NIS' },
        { key: 'Nama Siswa', label: 'Nama Siswa' },
        ...kategoriList.map(k => ({ key: k.nama_kategori, label: k.nama_kategori })),
        { key: 'Rata-rata', label: 'Rata-rata' },
        { key: 'Keaktifan', label: 'Keaktifan' }
      ];

      const title = `Rekap Nilai - ${selectedKelasData?.nama_kelas} - ${selectedMapelData?.nama_mata_pelajaran}`;
      const customTemplate = getCustomPDFTemplate('grade');
      const filename = `rekap_nilai_${selectedKelasData?.nama_kelas}_${selectedMapelData?.nama_mata_pelajaran}.pdf`;
      
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
          'NIS': student.nis,
          'Nama Siswa': student.nama_siswa
        };

        kategoriList.forEach(kategori => {
          rowData[kategori.nama_kategori] = student.grades[kategori.id]?.toFixed(1) || '-';
        });

        rowData['Rata-rata'] = student.rata_rata.toFixed(1);
        rowData['Total Keaktifan'] = student.total_keaktifan;
        rowData['Persentase Keaktifan'] = `${student.persentase_keaktifan.toFixed(1)}%`;

        return rowData;
      });

      const exportColumns = [
        { key: 'No', label: 'No' },
        { key: 'NIS', label: 'NIS' },
        { key: 'Nama Siswa', label: 'Nama Siswa' },
        ...kategoriList.map(k => ({ key: k.nama_kategori, label: k.nama_kategori })),
        { key: 'Rata-rata', label: 'Rata-rata' },
        { key: 'Total Keaktifan', label: 'Total Keaktifan' },
        { key: 'Persentase Keaktifan', label: 'Persentase Keaktifan' }
      ];

      const title = `Rekap Nilai - ${selectedKelasData?.nama_kelas} - ${selectedMapelData?.nama_mata_pelajaran}`;
      const filename = `rekap_nilai_${selectedKelasData?.nama_kelas}_${selectedMapelData?.nama_mata_pelajaran}.xlsx`;

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
                  onClick={handleExportPDF}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button 
                  onClick={handleExportExcel}
                  variant="outline"
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
                      <TableHead>NIS</TableHead>
                      <TableHead>Nama Siswa</TableHead>
                      {kategoriList.map(kategori => (
                        <TableHead key={kategori.id} className="text-center">
                          {kategori.nama_kategori}
                          {kategori.bobot && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({kategori.bobot}%)
                            </span>
                          )}
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-semibold">Rata-rata</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          Keaktifan
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentGrades.map((student, index) => (
                      <TableRow key={student.siswa_id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{student.nis}</TableCell>
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
                          <div className="flex flex-col items-center gap-1">
                            <Badge 
                              variant="outline"
                              className={student.persentase_keaktifan >= 70 ? "bg-yellow-100 text-yellow-900 border-yellow-300" : ""}
                            >
                              {student.total_keaktifan}x
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {student.persentase_keaktifan.toFixed(0)}%
                            </span>
                          </div>
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
    </div>
  );
};

export default RekapNilai;
