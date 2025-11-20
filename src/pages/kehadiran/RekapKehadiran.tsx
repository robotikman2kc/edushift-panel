import { useState, useEffect } from "react";
import { indexedDB } from "@/lib/indexedDB";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { FileText, Download, Calendar, Users, BookOpen, BarChart3 } from "lucide-react";
import { exportToExcel, getCustomPDFTemplate, generatePDFBlob } from "@/lib/exportUtils";
import { ExportDateDialog } from "@/components/common/ExportDateDialog";

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

interface KehadiranData {
  id: string;
  siswa_id: string;
  tanggal: string;
  status_kehadiran: string;
}

interface KehadiranReport {
  siswa_id: string;
  nama_siswa: string;
  nisn: string;
  jenis_kelamin: string;
  kehadiran_per_tanggal: { [tanggal: string]: string };
  total_hadir: number;
  total_sakit: number;
  total_izin: number;
  total_alpha: number;
  persentase_kehadiran: number;
}

const RekapKehadiran = () => {
  // Load saved state from localStorage
  const getSavedState = (key: string, defaultValue: string) => {
    try {
      const saved = localStorage.getItem(`rekap_kehadiran_${key}`);
      return saved || defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [selectedTingkat, setSelectedTingkat] = useState(() => getSavedState('tingkat', ""));
  const [selectedKelas, setSelectedKelas] = useState(() => getSavedState('kelas', ""));
  const [selectedMataPelajaran, setSelectedMataPelajaran] = useState(() => getSavedState('mata_pelajaran', ""));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  const [allKelas, setAllKelas] = useState<Kelas[]>([]);
  const [filteredKelas, setFilteredKelas] = useState<Kelas[]>([]);
  const [mataPelajaran, setMataPelajaran] = useState<MataPelajaran[]>([]);
  const [reportData, setReportData] = useState<KehadiranReport[]>([]);
  const [uniqueDates, setUniqueDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExportDateDialogOpen, setIsExportDateDialogOpen] = useState(false);

  const tingkatOptions = ["X", "XI", "XII"];

  // Save state to localStorage
  const saveState = (key: string, value: string) => {
    try {
      localStorage.setItem(`rekap_kehadiran_${key}`, value);
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

  // Fetch initial data
  useEffect(() => {
    fetchKelas();
    fetchMataPelajaran();
  }, []);

  // Filter kelas by tingkat (but don't clear selections if we have saved state)
  useEffect(() => {
    if (selectedTingkat && allKelas.length > 0) {
      const filtered = allKelas.filter(kelas => kelas.tingkat === selectedTingkat);
      setFilteredKelas(filtered);
      
      // Only clear selections if no saved state exists
      const savedKelas = getSavedState('kelas', '');
      if (!savedKelas) {
        setSelectedKelas("");
      }
    } else if (allKelas.length > 0) {
      setFilteredKelas([]);
      if (!getSavedState('kelas', '')) {
        setSelectedKelas("");
      }
    }
  }, [selectedTingkat, allKelas]);

  // Generate report when filters change
  useEffect(() => {
    if (selectedKelas && selectedMataPelajaran && allKelas.length > 0) {
      generateReport();
    } else if (!selectedKelas || !selectedMataPelajaran) {
      setReportData([]);
    }
  }, [selectedKelas, selectedMataPelajaran, selectedMonth, selectedYear, allKelas]);

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

  const generateReport = async () => {
    try {
      setLoading(true);
      
      // Get date range for selected month and year
      const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1);
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch students in the selected class
      const studentsData = await indexedDB.select("siswa", student => 
        student.kelas_id === selectedKelas &&
        student.status === "Aktif"
      );
      const students = studentsData.sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

      // Fetch attendance data for the date range
      const attendanceData = await indexedDB.select("kehadiran", record => 
        record.kelas_id === selectedKelas &&
        record.mata_pelajaran_id === selectedMataPelajaran &&
        record.tanggal >= startDateStr &&
        record.tanggal <= endDateStr
      );
      const attendance = attendanceData.sort((a, b) => a.tanggal.localeCompare(b.tanggal));

      // Get unique dates from attendance data
      const dates = [...new Set(attendance.map(a => a.tanggal))].sort();
      setUniqueDates(dates as string[]);

      // Process report data for each student
      const report: KehadiranReport[] = students.map(student => {
        const studentAttendance = attendance.filter(a => a.siswa_id === student.id);
        
        // Determine effective dates based on student's tanggal_masuk
        let effectiveDates = dates;
        if (student.tanggal_masuk) {
          // Only count dates from student's tanggal_masuk onwards
          effectiveDates = dates.filter((date: string) => date >= student.tanggal_masuk!);
        }
        
        // Create attendance map by date
        const kehadiranPerTanggal: { [tanggal: string]: string } = {};
        dates.forEach((date: string) => {
          const attendanceRecord = studentAttendance.find(a => a.tanggal === date);
          // Mark as '-' if before student's tanggal_masuk
          if (student.tanggal_masuk && date < student.tanggal_masuk) {
            kehadiranPerTanggal[date] = '-';
          } else {
            kehadiranPerTanggal[date] = attendanceRecord ? attendanceRecord.status_kehadiran : '-';
          }
        });

        // Calculate totals
        const totalHadir = studentAttendance.filter(a => a.status_kehadiran === 'Hadir').length;
        const totalSakit = studentAttendance.filter(a => a.status_kehadiran === 'Sakit').length;
        const totalIzin = studentAttendance.filter(a => a.status_kehadiran === 'Izin').length;
        const totalAlpha = studentAttendance.filter(a => a.status_kehadiran === 'Alpha').length;
        
        const totalKehadiran = totalHadir; // Hanya status "Hadir" yang dihitung sebagai kehadiran
        // Calculate percentage based on effective dates (from tanggal_masuk onwards)
        const persentaseKehadiran = effectiveDates.length > 0 ? Math.round((totalKehadiran / effectiveDates.length) * 100) : 0;

        return {
          siswa_id: student.id,
          nama_siswa: student.nama_siswa,
          nisn: student.nisn,
          jenis_kelamin: student.jenis_kelamin || '-',
          kehadiran_per_tanggal: kehadiranPerTanggal,
          total_hadir: totalHadir,
          total_sakit: totalSakit,
          total_izin: totalIzin,
          total_alpha: totalAlpha,
          persentase_kehadiran: persentaseKehadiran,
        };
      });

      setReportData(report);
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Gagal membuat laporan kehadiran",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusSymbol = (status: string) => {
    switch (status) {
      case 'Hadir':
        return <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-800 rounded-full text-sm font-bold">H</span>;
      case 'Sakit':
        return <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">S</span>;
      case 'Izin':
        return <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">I</span>;
      case 'Alpha':
        return <span className="inline-flex items-center justify-center w-8 h-8 bg-red-100 text-red-800 rounded-full text-sm font-bold">A</span>;
      default:
        return <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-500 rounded-full text-sm">-</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 90) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Sangat Baik</Badge>;
    } else if (percentage >= 80) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Baik</Badge>;
    } else if (percentage >= 70) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Cukup</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Kurang</Badge>;
    }
  };

  const handleExportPDF = (signatureDate?: Date) => {
    try {
      console.log('Starting PDF export for attendance report'); // Debug log
      
      // Prepare export data with attendance details
      const exportData = reportData.map(student => {
        const baseData = {
          NISN: student.nisn,
          'Nama Siswa': student.nama_siswa,
          'Jenis Kelamin': student.jenis_kelamin,
          'Total Hadir': student.total_hadir,
          'Total Sakit': student.total_sakit,
          'Total Izin': student.total_izin,
          'Total Alpha': student.total_alpha,
          'Persentase': `${student.persentase_kehadiran}%`,
        };
        
        // Add daily attendance
        uniqueDates.forEach(date => {
          baseData[formatDate(date)] = student.kehadiran_per_tanggal[date] || '-';
        });
        
        return baseData;
      });
      
      const exportColumns = [
        { key: 'NISN', label: 'NISN' },
        { key: 'Nama Siswa', label: 'Nama Siswa' },
        { key: 'Jenis Kelamin', label: 'Jenis Kelamin' },
        ...uniqueDates.map(date => ({ key: formatDate(date), label: formatDate(date) })),
        { key: 'Total Hadir', label: 'Hadir' },
        { key: 'Total Sakit', label: 'Sakit' },
        { key: 'Total Izin', label: 'Izin' },
        { key: 'Total Alpha', label: 'Alpha' },
        { key: 'Persentase', label: 'Persentase' },
      ];
      
      const title = `Rekap Kehadiran - ${selectedKelasData?.nama_kelas} - ${selectedMataPelajaranData?.nama_mata_pelajaran} - ${selectedMonthLabel} ${selectedYear}`;
      
      // Use custom template from settings
      let customTemplate = getCustomPDFTemplate('attendance');
      console.log('Using custom template for attendance:', customTemplate); // Debug log
      
      // Add signature date to template
      if (signatureDate) {
        customTemplate = {
          ...customTemplate,
          signatureDate: signatureDate.toISOString().split('T')[0],
        };
      }
      
      const filename = `rekap_kehadiran_${selectedYear}_${selectedMonth}.pdf`;
      
      const blob = generatePDFBlob(
        exportData, 
        exportColumns, 
        title, 
        customTemplate,
        {
          kelas: selectedKelasData?.nama_kelas,
          bulan: `${selectedMonthLabel} ${selectedYear}`
        }
      );
      
      if (blob) {
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
          description: "Rekap kehadiran berhasil diekspor ke PDF",
        });
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      toast({
        title: "Export Gagal",
        description: "Terjadi kesalahan saat mengekspor data",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = () => {
    try {
      // Prepare export data with attendance details
      const exportData = reportData.map(student => {
        const baseData = {
          NISN: student.nisn,
          'Nama Siswa': student.nama_siswa,
          'Jenis Kelamin': student.jenis_kelamin,
          'Total Hadir': student.total_hadir,
          'Total Sakit': student.total_sakit,
          'Total Izin': student.total_izin,
          'Total Alpha': student.total_alpha,
          'Persentase': `${student.persentase_kehadiran}%`,
        };
        
        // Add daily attendance
        uniqueDates.forEach(date => {
          baseData[formatDate(date)] = student.kehadiran_per_tanggal[date] || '-';
        });
        
        return baseData;
      });
      
      const exportColumns = [
        { key: 'NISN', label: 'NISN' },
        { key: 'Nama Siswa', label: 'Nama Siswa' },
        { key: 'Jenis Kelamin', label: 'Jenis Kelamin' },
        ...uniqueDates.map(date => ({ key: formatDate(date), label: formatDate(date) })),
        { key: 'Total Hadir', label: 'Hadir' },
        { key: 'Total Sakit', label: 'Sakit' },
        { key: 'Total Izin', label: 'Izin' },
        { key: 'Total Alpha', label: 'Alpha' },
        { key: 'Persentase', label: 'Persentase' },
      ];
      
      const title = `Rekap Kehadiran - ${selectedKelasData?.nama_kelas} - ${selectedMataPelajaranData?.nama_mata_pelajaran} - ${selectedMonthLabel} ${selectedYear}`;
      
      const success = exportToExcel(exportData, exportColumns, title, `rekap_kehadiran_${selectedYear}_${selectedMonth}.xlsx`);
      
      if (success) {
        toast({
          title: "Export Berhasil",
          description: "Rekap kehadiran berhasil diekspor ke Excel",
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({
        title: "Export Gagal",
        description: "Terjadi kesalahan saat mengekspor data",
        variant: "destructive",
      });
    }
  };

  const selectedKelasData = allKelas.find(k => k.id === selectedKelas);
  const selectedMataPelajaranData = mataPelajaran.find(mp => mp.id === selectedMataPelajaran);
  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label;

  const totalStats = reportData.reduce(
    (acc, curr) => ({
      totalSiswa: acc.totalSiswa + 1,
      totalHadir: acc.totalHadir + curr.total_hadir,
      totalSakit: acc.totalSakit + curr.total_sakit,
      totalIzin: acc.totalIzin + curr.total_izin,
      totalAlpha: acc.totalAlpha + curr.total_alpha,
    }),
    { totalSiswa: 0, totalHadir: 0, totalSakit: 0, totalIzin: 0, totalAlpha: 0 }
  );

  const avgPersentase = reportData.length > 0 
    ? Math.round(reportData.reduce((sum, curr) => sum + curr.persentase_kehadiran, 0) / reportData.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Rekap Kehadiran" 
        description="Laporan kehadiran siswa berdasarkan kelas, mata pelajaran, dan periode"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Filter Laporan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tingkat">Tingkat Kelas</Label>
              <Select value={selectedTingkat} onValueChange={(value) => {
                setSelectedTingkat(value);
                saveState('tingkat', value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tingkat kelas" />
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
              <Label htmlFor="kelas">Nama Kelas</Label>
              <Select value={selectedKelas} onValueChange={(value) => {
                setSelectedKelas(value);
                saveState('kelas', value);
              }} disabled={!selectedTingkat}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih nama kelas" />
                </SelectTrigger>
                <SelectContent>
                  {filteredKelas.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas} {kelas.jurusan ? `- ${kelas.jurusan}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mata-pelajaran">Mata Pelajaran</Label>
              <Select value={selectedMataPelajaran} onValueChange={(value) => {
                setSelectedMataPelajaran(value);
                saveState('mata_pelajaran', value);
              }}>
                <SelectTrigger>
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
              <Label htmlFor="bulan">Bulan</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bulan" />
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
              <Label htmlFor="tahun">Tahun</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
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

            {reportData.length > 0 && (
              <div className="pt-4 border-t space-y-2">
                <h4 className="font-medium text-sm">Export Laporan</h4>
                <div className="space-y-2">
                  <Button size="sm" className="w-full" onClick={() => setIsExportDateDialogOpen(true)} variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button size="sm" className="w-full" onClick={handleExportExcel} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Summary Cards */}
          {reportData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="flex items-center p-6">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Siswa</p>
                    <p className="text-2xl font-bold">{totalStats.totalSiswa}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="flex items-center p-6">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Hadir</p>
                    <p className="text-2xl font-bold text-green-600">{totalStats.totalHadir}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-6">
                  <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-red-600 rounded-full"></div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Alpha</p>
                    <p className="text-2xl font-bold text-red-600">{totalStats.totalAlpha}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-6">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Rata-rata</p>
                    <p className="text-2xl font-bold">{avgPersentase}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Report Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Laporan Kehadiran
              </CardTitle>
              {selectedKelasData && (
                <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">
                    <span className="text-muted-foreground">Kelas:</span>{' '}
                    <span className="font-semibold">{selectedKelasData.nama_kelas}</span>
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!selectedKelas || !selectedMataPelajaran ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Pilih kelas dan mata pelajaran untuk menampilkan laporan</p>
                </div>
              ) : loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Membuat laporan kehadiran...</p>
                </div>
              ) : reportData.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Tidak ada data kehadiran untuk periode yang dipilih</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>NISN</TableHead>
                        <TableHead>Nama Siswa</TableHead>
                        <TableHead>Jenis Kelamin</TableHead>
                        {uniqueDates.map((date) => (
                          <TableHead key={date} className="text-center min-w-[60px]">
                            {formatDate(date)}
                          </TableHead>
                        ))}
                        <TableHead className="text-center">%</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((student, index) => (
                        <TableRow key={student.siswa_id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-medium">{student.nisn}</TableCell>
                          <TableCell>{student.nama_siswa}</TableCell>
                          <TableCell>{student.jenis_kelamin}</TableCell>
                          {uniqueDates.map((date) => (
                            <TableCell key={date} className="text-center">
                              {getStatusSymbol(student.kehadiran_per_tanggal[date])}
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-semibold">
                            {student.persentase_kehadiran}%
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(student.persentase_kehadiran)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {uniqueDates.length > 0 && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Keterangan Status:</h4>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 rounded-full text-xs font-bold">H</span>
                          <span>Hadir</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">S</span>
                          <span>Sakit</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">I</span>
                          <span>Izin</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-800 rounded-full text-xs font-bold">A</span>
                          <span>Alpha</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-500 rounded-full text-xs">-</span>
                          <span>Tidak ada data</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <ExportDateDialog
        open={isExportDateDialogOpen}
        onOpenChange={setIsExportDateDialogOpen}
        onExport={handleExportPDF}
        title="Export Rekap Kehadiran"
        description="Pilih tanggal untuk tanda tangan pada laporan kehadiran"
      />
    </div>
  );
};

export default RekapKehadiran;