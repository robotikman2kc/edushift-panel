import { useState, useEffect } from "react";
import { indexedDB } from "@/lib/indexedDB";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { FileText, Download } from "lucide-react";
import { getCustomPDFTemplate, generatePDFBlob } from "@/lib/exportUtils";
import jsPDF from "jspdf";

interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat: string;
  jurusan: string;
  tahun_ajaran: string;
}

interface MataPelajaran {
  id: string;
  nama_mata_pelajaran: string;
  kode_mata_pelajaran: string;
}

interface Siswa {
  id: string;
  nisn: string;
  nama_siswa: string;
  kelas_id: string;
  status: string;
  jenis_kelamin?: string;
  tanggal_masuk?: string;
}

const LaporanKehadiran = () => {
  const [selectedTingkat, setSelectedTingkat] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedMataPelajaran, setSelectedMataPelajaran] = useState("");
  const [startMonth, setStartMonth] = useState("0");
  const [endMonth, setEndMonth] = useState("0");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  const [allKelas, setAllKelas] = useState<Kelas[]>([]);
  const [filteredKelas, setFilteredKelas] = useState<Kelas[]>([]);
  const [mataPelajaran, setMataPelajaran] = useState<MataPelajaran[]>([]);
  const [loading, setLoading] = useState(false);

  const tingkatOptions = ["X", "XI", "XII"];

  const monthOptions = [
    { value: "0", label: "Januari" },
    { value: "1", label: "Februari" },
    { value: "2", label: "Maret" },
    { value: "3", label: "April" },
    { value: "4", label: "Mei" },
    { value: "5", label: "Juni" },
    { value: "6", label: "Juli" },
    { value: "7", label: "Agustus" },
    { value: "8", label: "September" },
    { value: "9", label: "Oktober" },
    { value: "10", label: "November" },
    { value: "11", label: "Desember" },
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: (currentYear - 2 + i).toString(),
    label: (currentYear - 2 + i).toString(),
  }));

  useEffect(() => {
    fetchKelas();
    fetchMataPelajaran();
  }, []);

  useEffect(() => {
    if (selectedTingkat && allKelas.length > 0) {
      const filtered = allKelas.filter(kelas => kelas.tingkat === selectedTingkat);
      setFilteredKelas(filtered);
      setSelectedKelas("");
    } else {
      setFilteredKelas([]);
      setSelectedKelas("");
    }
  }, [selectedTingkat, allKelas]);

  const fetchKelas = async () => {
    try {
      const data = await indexedDB.select("kelas", kelas => kelas.status === "Aktif");
      const sortedData = data.sort((a, b) => {
        if (a.tingkat !== b.tingkat) {
          return a.tingkat.localeCompare(b.tingkat);
        }
        return a.nama_kelas.localeCompare(b.nama_kelas);
      });
      setAllKelas(sortedData);
    } catch (error) {
      console.error("Error fetching kelas:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data kelas",
        variant: "destructive",
      });
    }
  };

  const fetchMataPelajaran = async () => {
    try {
      const data = await indexedDB.select("mata_pelajaran", mp => mp.status === "Aktif");
      const sortedData = data.sort((a, b) => a.nama_mata_pelajaran.localeCompare(b.nama_mata_pelajaran));
      setMataPelajaran(sortedData);
    } catch (error) {
      console.error("Error fetching mata pelajaran:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data mata pelajaran",
        variant: "destructive",
      });
    }
  };

  const generateMonthReport = async (month: number, year: number) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const studentsData = await indexedDB.select("siswa", student => 
      student.kelas_id === selectedKelas &&
      student.status === "Aktif"
    );
    const students = studentsData.sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

    const attendanceData = await indexedDB.select("kehadiran", record => 
      record.kelas_id === selectedKelas &&
      record.mata_pelajaran_id === selectedMataPelajaran &&
      record.tanggal >= startDateStr &&
      record.tanggal <= endDateStr
    );
    const attendance = attendanceData.sort((a, b) => a.tanggal.localeCompare(b.tanggal));

    const dates = [...new Set(attendance.map(a => a.tanggal))].sort();

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    const reportData = students.map(student => {
      const studentAttendance = attendance.filter(a => a.siswa_id === student.id);
      
      let effectiveDates = dates;
      if (student.tanggal_masuk) {
        effectiveDates = dates.filter((date: string) => date >= student.tanggal_masuk!);
      }
      
      const kehadiranPerTanggal: { [tanggal: string]: string } = {};
      dates.forEach((date: string) => {
        const attendanceRecord = studentAttendance.find(a => a.tanggal === date);
        if (student.tanggal_masuk && date < student.tanggal_masuk) {
          kehadiranPerTanggal[date] = '-';
        } else {
          kehadiranPerTanggal[date] = attendanceRecord ? attendanceRecord.status_kehadiran : '-';
        }
      });

      const totalHadir = studentAttendance.filter(a => a.status_kehadiran === 'Hadir').length;
      const totalSakit = studentAttendance.filter(a => a.status_kehadiran === 'Sakit').length;
      const totalDispen = studentAttendance.filter(a => a.status_kehadiran === 'Dispen').length;
      const totalIzin = studentAttendance.filter(a => a.status_kehadiran === 'Izin').length;
      const totalAlpha = studentAttendance.filter(a => a.status_kehadiran === 'Alpha').length;
      
      const persentaseKehadiran = effectiveDates.length > 0 ? Math.round((totalHadir / effectiveDates.length) * 100) : 0;

      return {
        siswa_id: student.id,
        nama_siswa: student.nama_siswa,
        nisn: student.nisn,
        jenis_kelamin: student.jenis_kelamin || '-',
        kehadiran_per_tanggal: kehadiranPerTanggal,
        total_hadir: totalHadir,
        total_sakit: totalSakit,
        total_dispen: totalDispen,
        total_izin: totalIzin,
        total_alpha: totalAlpha,
        persentase_kehadiran: persentaseKehadiran,
      };
    });

    const exportData = reportData.map(student => {
      const baseData = {
        NISN: student.nisn,
        'Nama Siswa': student.nama_siswa,
        'Jenis Kelamin': student.jenis_kelamin,
        'Total Hadir': student.total_hadir,
        'Total Sakit': student.total_sakit,
        'Total Dispen': student.total_dispen,
        'Total Izin': student.total_izin,
        'Total Alpha': student.total_alpha,
        'Persentase': `${student.persentase_kehadiran}%`,
      };
      
      dates.forEach(date => {
        baseData[formatDate(date)] = student.kehadiran_per_tanggal[date] || '-';
      });
      
      return baseData;
    });
    
    const exportColumns = [
      { key: 'NISN', label: 'NISN' },
      { key: 'Nama Siswa', label: 'Nama Siswa' },
      { key: 'Jenis Kelamin', label: 'Jenis Kelamin' },
      ...dates.map(date => ({ key: formatDate(date), label: formatDate(date) })),
      { key: 'Total Hadir', label: 'Hadir' },
      { key: 'Total Sakit', label: 'Sakit' },
      { key: 'Total Dispen', label: 'Dispen' },
      { key: 'Total Izin', label: 'Izin' },
      { key: 'Total Alpha', label: 'Alpha' },
      { key: 'Persentase', label: 'Persentase' },
    ];

    return { exportData, exportColumns, monthLabel: monthOptions[month].label };
  };

  const handleExportMultiMonth = async () => {
    if (!selectedKelas || !selectedMataPelajaran) {
      toast({
        title: "Validasi Gagal",
        description: "Pilih kelas dan mata pelajaran terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const start = parseInt(startMonth);
    const end = parseInt(endMonth);

    if (start > end) {
      toast({
        title: "Validasi Gagal",
        description: "Bulan awal harus lebih kecil atau sama dengan bulan akhir",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const selectedKelasData = allKelas.find(k => k.id === selectedKelas);
      const selectedMataPelajaranData = mataPelajaran.find(mp => mp.id === selectedMataPelajaran);

      // Generate individual month PDFs and combine them
      const mergedPDF = new jsPDF('landscape', 'mm', 'a4');
      let isFirstPage = true;

      for (let month = start; month <= end; month++) {
        const { exportData, exportColumns, monthLabel } = await generateMonthReport(month, parseInt(selectedYear));
        
        const title = `Rekap Kehadiran - ${selectedKelasData?.nama_kelas} - ${selectedMataPelajaranData?.nama_mata_pelajaran} - ${monthLabel} ${selectedYear}`;
        
        const customTemplate = getCustomPDFTemplate('attendance');
        
        const blob = generatePDFBlob(
          exportData, 
          exportColumns, 
          title, 
          customTemplate,
          {
            kelas: selectedKelasData?.nama_kelas,
            bulan: `${monthLabel} ${selectedYear}`
          }
        );

        if (blob) {
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const tempPDF = new jsPDF('landscape', 'mm', 'a4');
          
          // Load the generated PDF
          const loadedPDF = await (window as any).pdfjsLib.getDocument({ data: uint8Array }).promise;
          
          for (let pageNum = 1; pageNum <= loadedPDF.numPages; pageNum++) {
            if (!isFirstPage) {
              mergedPDF.addPage();
            }
            isFirstPage = false;

            const page = await loadedPDF.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;
            
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            mergedPDF.addImage(imgData, 'JPEG', 0, 0, 297, 210);
          }
        }
      }

      // Download merged PDF
      const startMonthLabel = monthOptions[start].label;
      const endMonthLabel = monthOptions[end].label;
      const filename = `laporan_kehadiran_${startMonthLabel}-${endMonthLabel}_${selectedYear}.pdf`;
      
      mergedPDF.save(filename);

      toast({
        title: "Export Berhasil",
        description: `Laporan kehadiran ${startMonthLabel} - ${endMonthLabel} ${selectedYear} berhasil diekspor`,
      });
    } catch (error) {
      console.error("Error exporting multi-month report:", error);
      toast({
        title: "Export Gagal",
        description: "Terjadi kesalahan saat mengekspor laporan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedKelasData = allKelas.find(k => k.id === selectedKelas);
  const selectedMataPelajaranData = mataPelajaran.find(mp => mp.id === selectedMataPelajaran);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Kehadiran"
        description="Download rekap kehadiran berdasarkan rentang bulan"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tingkat">Tingkat</Label>
              <Select value={selectedTingkat} onValueChange={setSelectedTingkat}>
                <SelectTrigger id="tingkat">
                  <SelectValue placeholder="Pilih tingkat" />
                </SelectTrigger>
                <SelectContent>
                  {tingkatOptions.map((tingkat) => (
                    <SelectItem key={tingkat} value={tingkat}>
                      Kelas {tingkat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kelas">Kelas</Label>
              <Select value={selectedKelas} onValueChange={setSelectedKelas} disabled={!selectedTingkat}>
                <SelectTrigger id="kelas">
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {filteredKelas.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mapel">Mata Pelajaran</Label>
              <Select value={selectedMataPelajaran} onValueChange={setSelectedMataPelajaran}>
                <SelectTrigger id="mapel">
                  <SelectValue placeholder="Pilih mata pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  {mataPelajaran.map((mp) => (
                    <SelectItem key={mp.id} value={mp.id}>
                      {mp.nama_mata_pelajaran}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-month">Dari Bulan</Label>
              <Select value={startMonth} onValueChange={setStartMonth}>
                <SelectTrigger id="start-month">
                  <SelectValue placeholder="Pilih bulan awal" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-month">Sampai Bulan</Label>
              <Select value={endMonth} onValueChange={setEndMonth}>
                <SelectTrigger id="end-month">
                  <SelectValue placeholder="Pilih bulan akhir" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Tahun</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button 
              onClick={handleExportMultiMonth}
              disabled={!selectedKelas || !selectedMataPelajaran || loading}
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? "Memproses..." : "Download Laporan PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedKelasData && selectedMataPelajaranData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Info Laporan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Kelas</p>
                <p className="font-medium">{selectedKelasData.nama_kelas}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mata Pelajaran</p>
                <p className="font-medium">{selectedMataPelajaranData.nama_mata_pelajaran}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Periode</p>
                <p className="font-medium">
                  {monthOptions[parseInt(startMonth)].label} - {monthOptions[parseInt(endMonth)].label} {selectedYear}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jumlah Bulan</p>
                <p className="font-medium">{parseInt(endMonth) - parseInt(startMonth) + 1} bulan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LaporanKehadiran;
