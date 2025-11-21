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
import { PDFDocument } from "pdf-lib";
import { ExportDateDialog } from "@/components/common/ExportDateDialog";
import { hariLiburNasional } from "@/lib/hariLiburData";

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
  // Load saved state from localStorage
  const getSavedState = (key: string, defaultValue: string) => {
    try {
      const saved = localStorage.getItem(`laporan_kehadiran_${key}`);
      return saved || defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [selectedTingkat, setSelectedTingkat] = useState(() => getSavedState('tingkat', ""));
  const [selectedKelas, setSelectedKelas] = useState(() => getSavedState('kelas', ""));
  const [selectedMataPelajaran, setSelectedMataPelajaran] = useState(() => getSavedState('mata_pelajaran', ""));
  const [startMonth, setStartMonth] = useState(() => getSavedState('start_month', "0"));
  const [endMonth, setEndMonth] = useState(() => getSavedState('end_month', "0"));
  const [selectedYear, setSelectedYear] = useState(() => getSavedState('year', new Date().getFullYear().toString()));
  
  const [allKelas, setAllKelas] = useState<Kelas[]>([]);
  const [filteredKelas, setFilteredKelas] = useState<Kelas[]>([]);
  const [mataPelajaran, setMataPelajaran] = useState<MataPelajaran[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExportDateDialogOpen, setIsExportDateDialogOpen] = useState(false);
  const [pendingExport, setPendingExport] = useState(false);

  const tingkatOptions = ["X", "XI", "XII"];

  // Save state to localStorage
  const saveState = (key: string, value: string) => {
    try {
      localStorage.setItem(`laporan_kehadiran_${key}`, value);
    } catch (error) {
      console.warn('Failed to save state:', error);
    }
  };

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

  // Filter kelas by tingkat and auto-select first kelas
  useEffect(() => {
    if (selectedTingkat && allKelas.length > 0) {
      const filtered = allKelas.filter(kelas => kelas.tingkat === selectedTingkat);
      setFilteredKelas(filtered);
      
      // Auto-select first kelas if available
      if (filtered.length > 0) {
        const firstKelasId = filtered[0].id;
        setSelectedKelas(firstKelasId);
        saveState('kelas', firstKelasId);
      }
    } else if (allKelas.length > 0) {
      setFilteredKelas([]);
      setSelectedKelas("");
    }
  }, [selectedTingkat, allKelas]);

  // Auto-select first mata pelajaran when available
  useEffect(() => {
    if (mataPelajaran.length > 0 && !selectedMataPelajaran) {
      const firstMapelId = mataPelajaran[0].id;
      setSelectedMataPelajaran(firstMapelId);
      saveState('mata_pelajaran', firstMapelId);
    }
  }, [mataPelajaran]);

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

  // Function to get last working day of month (Monday-Friday, not national holiday)
  const getLastWorkingDay = (year: number, month: number): Date => {
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from last day and go backwards
    let currentDate = new Date(lastDay);
    
    while (true) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Check if it's a weekday (Monday-Friday)
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      
      // Check if it's not a national holiday
      const isHoliday = hariLiburNasional.some(h => h.tanggal === dateStr);
      
      if (isWeekday && !isHoliday) {
        return currentDate;
      }
      
      // Go to previous day
      currentDate.setDate(currentDate.getDate() - 1);
      
      // Safety check: don't go back more than 10 days
      if (lastDay.getDate() - currentDate.getDate() > 10) {
        return lastDay; // Fallback to last day if no working day found
      }
    }
  };

  const generateMonthReport = async (month: number, year: number, signatureDate?: Date) => {
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

    return { exportData, exportColumns, monthLabel: monthOptions[month].label, signatureDate };
  };

  const handleExportClick = () => {
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

    // Show dialog for last month's signature date
    setPendingExport(true);
    setIsExportDateDialogOpen(true);
  };

  const handleExportMultiMonth = async (lastMonthSignatureDate?: Date) => {
    try {
      setLoading(true);
      setPendingExport(false);

      const selectedKelasData = allKelas.find(k => k.id === selectedKelas);
      const selectedMataPelajaranData = mataPelajaran.find(mp => mp.id === selectedMataPelajaran);

      const start = parseInt(startMonth);
      const end = parseInt(endMonth);

      // Create merged PDF document
      const mergedPdf = await PDFDocument.create();

      // Generate PDF for each month and merge
      for (let month = start; month <= end; month++) {
        // For last month, use user-selected date; for others, use last working day
        let signatureDate: Date | undefined;
        if (month === end && lastMonthSignatureDate) {
          signatureDate = lastMonthSignatureDate;
        } else {
          signatureDate = getLastWorkingDay(parseInt(selectedYear), month);
        }

        const { exportData, exportColumns, monthLabel } = await generateMonthReport(month, parseInt(selectedYear), signatureDate);
        
        const title = `Rekap Kehadiran - ${selectedKelasData?.nama_kelas} - ${selectedMataPelajaranData?.nama_mata_pelajaran} - ${monthLabel} ${selectedYear}`;
        
        // Use custom template from settings
        let customTemplate = getCustomPDFTemplate('attendance');
        
        // Add signature date to template
        if (signatureDate) {
          customTemplate = {
            ...customTemplate,
            signatureDate: signatureDate.toISOString().split('T')[0],
          };
        }
        
        // Generate PDF blob for this month
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
          // Convert blob to array buffer
          const arrayBuffer = await blob.arrayBuffer();
          
          // Load the PDF
          const pdf = await PDFDocument.load(arrayBuffer);
          
          // Copy all pages from this month's PDF to the merged PDF
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
          });
        }
      }

      // Save the merged PDF
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

      const startMonthLabel = monthOptions[start].label;
      const endMonthLabel = monthOptions[end].label;
      const filename = `laporan_kehadiran_${startMonthLabel}-${endMonthLabel}_${selectedYear}.pdf`;
      
      // Download
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
        description: `Laporan kehadiran ${startMonthLabel} - ${endMonthLabel} ${selectedYear} berhasil diekspor`,
      });
    } catch (error) {
      console.error("Error exporting multi-month report:", error);
      toast({
        title: "Export Gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat mengekspor laporan",
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Filter Laporan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tingkat">Tingkat</Label>
                <Select value={selectedTingkat} onValueChange={(val) => { setSelectedTingkat(val); saveState('tingkat', val); }}>
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
                <Select value={selectedKelas} onValueChange={(val) => { setSelectedKelas(val); saveState('kelas', val); }} disabled={!selectedTingkat}>
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
                <Select value={selectedMataPelajaran} onValueChange={(val) => { setSelectedMataPelajaran(val); saveState('mata_pelajaran', val); }}>
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
                <Select value={startMonth} onValueChange={(val) => { setStartMonth(val); saveState('start_month', val); }}>
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
                <Select value={endMonth} onValueChange={(val) => { setEndMonth(val); saveState('end_month', val); }}>
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
                <Select value={selectedYear} onValueChange={(val) => { setSelectedYear(val); saveState('year', val); }}>
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
                onClick={handleExportClick}
                disabled={!selectedKelas || !selectedMataPelajaran || loading}
              >
                <Download className="h-4 w-4 mr-2" />
                {loading ? "Memproses..." : "Download Laporan PDF"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Info Laporan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Kelas</p>
              <p className="font-medium">{selectedKelasData?.nama_kelas || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mata Pelajaran</p>
              <p className="font-medium">{selectedMataPelajaranData?.nama_mata_pelajaran || '-'}</p>
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
          </CardContent>
        </Card>
      </div>

      <ExportDateDialog
        open={isExportDateDialogOpen}
        onOpenChange={setIsExportDateDialogOpen}
        onExport={handleExportMultiMonth}
        title="Pilih Tanggal Tanda Tangan"
        description={`Pilih tanggal tanda tangan untuk bulan ${endMonth ? monthOptions[parseInt(endMonth)].label : ''} (bulan terakhir). Bulan lainnya akan menggunakan hari kerja terakhir di bulan tersebut.`}
      />
    </div>
  );
};

export default LaporanKehadiran;
