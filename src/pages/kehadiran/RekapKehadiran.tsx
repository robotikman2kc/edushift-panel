import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { FileText, Download, Calendar, Users, BookOpen, BarChart3 } from "lucide-react";

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
  nis: string;
  nama_siswa: string;
  kelas_id: string;
}

interface KehadiranReport {
  siswa_id: string;
  nama_siswa: string;
  nis: string;
  total_hari: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  persentase_kehadiran: number;
}

const RekapKehadiran = () => {
  const [selectedTingkat, setSelectedTingkat] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedMataPelajaran, setSelectedMataPelajaran] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  const [allKelas, setAllKelas] = useState<Kelas[]>([]);
  const [filteredKelas, setFilteredKelas] = useState<Kelas[]>([]);
  const [mataPelajaran, setMataPelajaran] = useState<MataPelajaran[]>([]);
  const [reportData, setReportData] = useState<KehadiranReport[]>([]);
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

  // Fetch initial data
  useEffect(() => {
    fetchKelas();
    fetchMataPelajaran();
  }, []);

  // Filter kelas by tingkat
  useEffect(() => {
    if (selectedTingkat) {
      const filtered = allKelas.filter(kelas => kelas.tingkat === selectedTingkat);
      setFilteredKelas(filtered);
    } else {
      setFilteredKelas([]);
    }
    setSelectedKelas("");
  }, [selectedTingkat, allKelas]);

  // Generate report when filters change
  useEffect(() => {
    if (selectedKelas && selectedMataPelajaran) {
      generateReport();
    } else {
      setReportData([]);
    }
  }, [selectedKelas, selectedMataPelajaran, selectedMonth, selectedYear]);

  const fetchKelas = async () => {
    try {
      const { data, error } = await supabase
        .from("kelas")
        .select("*")
        .eq("status", "Aktif")
        .order("tingkat", { ascending: true })
        .order("nama_kelas", { ascending: true });

      if (error) throw error;
      setAllKelas(data || []);
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
      const { data, error } = await supabase
        .from("mata_pelajaran")
        .select("*")
        .eq("status", "Aktif")
        .order("nama_mata_pelajaran", { ascending: true });

      if (error) throw error;
      setMataPelajaran(data || []);
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
      const { data: students, error: studentsError } = await supabase
        .from("siswa")
        .select("*")
        .eq("kelas_id", selectedKelas)
        .eq("status", "Aktif")
        .order("nama_siswa", { ascending: true });

      if (studentsError) throw studentsError;

      // Fetch attendance data for the date range
      const { data: attendance, error: attendanceError } = await supabase
        .from("kehadiran")
        .select("*")
        .eq("kelas_id", selectedKelas)
        .gte("tanggal", startDateStr)
        .lte("tanggal", endDateStr);

      if (attendanceError) throw attendanceError;

      // Calculate total working days in the month (excluding weekends)
      const totalDays = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday (0) and Saturday (6)
          totalDays.push(new Date(d));
        }
      }

      // Process report data for each student
      const report: KehadiranReport[] = students?.map(student => {
        const studentAttendance = attendance?.filter(a => a.siswa_id === student.id) || [];
        
        const hadir = studentAttendance.filter(a => a.status_kehadiran === 'Hadir').length;
        const sakit = studentAttendance.filter(a => a.status_kehadiran === 'Sakit').length;
        const izin = studentAttendance.filter(a => a.status_kehadiran === 'Izin').length;
        const alpha = studentAttendance.filter(a => a.status_kehadiran === 'Alpha').length;
        
        const totalKehadiran = hadir + sakit + izin;
        const persentaseKehadiran = totalDays.length > 0 ? Math.round((totalKehadiran / totalDays.length) * 100) : 0;

        return {
          siswa_id: student.id,
          nama_siswa: student.nama_siswa,
          nis: student.nis,
          total_hari: totalDays.length,
          hadir,
          sakit,
          izin,
          alpha,
          persentase_kehadiran: persentaseKehadiran,
        };
      }) || [];

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

  const handleExportPDF = () => {
    toast({
      title: "Export PDF",
      description: "Fitur export PDF akan segera tersedia",
    });
  };

  const handleExportExcel = () => {
    toast({
      title: "Export Excel",
      description: "Fitur export Excel akan segera tersedia",
    });
  };

  const selectedKelasData = allKelas.find(k => k.id === selectedKelas);
  const selectedMataPelajaranData = mataPelajaran.find(mp => mp.id === selectedMataPelajaran);
  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label;

  const totalStats = reportData.reduce(
    (acc, curr) => ({
      totalSiswa: acc.totalSiswa + 1,
      totalHadir: acc.totalHadir + curr.hadir,
      totalSakit: acc.totalSakit + curr.sakit,
      totalIzin: acc.totalIzin + curr.izin,
      totalAlpha: acc.totalAlpha + curr.alpha,
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
              <Select value={selectedTingkat} onValueChange={setSelectedTingkat}>
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
              <Select value={selectedKelas} onValueChange={setSelectedKelas} disabled={!selectedTingkat}>
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
              <Select value={selectedMataPelajaran} onValueChange={setSelectedMataPelajaran}>
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
                  <Button size="sm" className="w-full" onClick={handleExportPDF} variant="outline">
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
                {selectedKelasData && selectedMataPelajaranData && (
                  <span className="text-sm font-normal text-muted-foreground">
                    - {selectedKelasData.nama_kelas} {selectedKelasData.jurusan && `${selectedKelasData.jurusan}`} | {selectedMataPelajaranData.nama_mata_pelajaran} | {selectedMonthLabel} {selectedYear}
                  </span>
                )}
              </CardTitle>
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
                        <TableHead>NIS</TableHead>
                        <TableHead>Nama Siswa</TableHead>
                        <TableHead className="text-center">Total Hari</TableHead>
                        <TableHead className="text-center">Hadir</TableHead>
                        <TableHead className="text-center">Sakit</TableHead>
                        <TableHead className="text-center">Izin</TableHead>
                        <TableHead className="text-center">Alpha</TableHead>
                        <TableHead className="text-center">Persentase</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((student, index) => (
                        <TableRow key={student.siswa_id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-medium">{student.nis}</TableCell>
                          <TableCell>{student.nama_siswa}</TableCell>
                          <TableCell className="text-center">{student.total_hari}</TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                              {student.hadir}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                              {student.sakit}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {student.izin}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                              {student.alpha}
                            </span>
                          </TableCell>
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RekapKehadiran;