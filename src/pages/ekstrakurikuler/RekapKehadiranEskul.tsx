import { useState, useEffect } from "react";
import { localDB, Ekstrakurikuler, AnggotaEskul } from "@/lib/localDB";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { FileText, AlertCircle } from "lucide-react";
import { generatePDFBlob, getCustomPDFTemplate } from "@/lib/exportUtils";
import { ExportDateDialog } from "@/components/common/ExportDateDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const RekapKehadiranEskul = () => {
  const [eskul, setEskul] = useState<Ekstrakurikuler | null>(null);
  const [startMonth, setStartMonth] = useState<string>("0");
  const [endMonth, setEndMonth] = useState<string>("0");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);
  const [isExportDateDialogOpen, setIsExportDateDialogOpen] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);

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

  useEffect(() => {
    loadData();
    loadAvailableYears();
  }, []);

  useEffect(() => {
    if (eskul) {
      loadPreviewData();
    }
  }, [startMonth, endMonth, selectedYear, eskul]);

  const loadData = () => {
    const eskuls = localDB.select('ekstrakurikuler');
    if (eskuls.length > 0) {
      setEskul(eskuls[0]);
    }
  };

  const loadAvailableYears = () => {
    const allKehadiran = localDB.select("kehadiran_eskul");
    const years = [...new Set(allKehadiran.map((k: any) => new Date(k.tanggal).getFullYear()))];
    
    const currentYear = new Date().getFullYear();
    for (let i = 0; i <= 3; i++) {
      const year = currentYear + i;
      if (!years.includes(year)) {
        years.push(year);
      }
    }
    
    setAvailableYears(years.sort((a, b) => a - b));
  };

  const loadPreviewData = () => {
    if (!eskul) return;

    const year = parseInt(selectedYear);
    const sMonth = parseInt(startMonth);
    const eMonth = parseInt(endMonth);

    // Get all active members
    const anggota = localDB.select('anggota_eskul', (a: AnggotaEskul) => 
      a.ekstrakurikuler_id === eskul.id && a.status === 'aktif'
    );

    // Get all attendance records in date range
    const startDate = new Date(year, sMonth, 1);
    const endDate = new Date(year, eMonth + 1, 0);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const kehadiran = localDB.select('kehadiran_eskul', (k: any) =>
      k.ekstrakurikuler_id === eskul.id &&
      k.tanggal >= startDateStr &&
      k.tanggal <= endDateStr
    );

    // Calculate summary for each member
    const summary = anggota.map((member: AnggotaEskul) => {
      const memberAttendance = kehadiran.filter((k: any) => k.anggota_id === member.id);
      
      const hadir = memberAttendance.filter((k: any) => k.status_kehadiran === 'Hadir').length;
      const sakit = memberAttendance.filter((k: any) => k.status_kehadiran === 'Sakit').length;
      const izin = memberAttendance.filter((k: any) => k.status_kehadiran === 'Izin').length;
      const alpha = memberAttendance.filter((k: any) => k.status_kehadiran === 'Alpha').length;
      const total = memberAttendance.length;
      const persentase = total > 0 ? ((hadir / total) * 100).toFixed(1) : "0.0";

      return {
        nisn: member.nisn,
        nama_siswa: member.nama_siswa,
        tingkat: member.tingkat,
        nama_kelas: member.nama_kelas,
        hadir,
        sakit,
        izin,
        alpha,
        total,
        persentase: `${persentase}%`
      };
    });

    setPreviewData(summary);
  };

  const handleExportPDF = async (signatureDate?: Date) => {
    if (!eskul) {
      toast({
        title: "Error",
        description: "Data ekstrakurikuler tidak ditemukan",
        variant: "destructive",
      });
      return;
    }

    if (previewData.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data kehadiran untuk periode yang dipilih",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const startMonthName = monthOptions[parseInt(startMonth)].label;
      const endMonthName = monthOptions[parseInt(endMonth)].label;
      const periodText = startMonth === endMonth 
        ? `${startMonthName} ${selectedYear}`
        : `${startMonthName} - ${endMonthName} ${selectedYear}`;

      const columns = [
        { key: "nisn", label: "NISN" },
        { key: "nama_siswa", label: "Nama Siswa" },
        { key: "tingkat", label: "Tingkat" },
        { key: "nama_kelas", label: "Kelas" },
        { key: "hadir", label: "Hadir", align: 'center' as const },
        { key: "sakit", label: "Sakit", align: 'center' as const },
        { key: "izin", label: "Izin", align: 'center' as const },
        { key: "alpha", label: "Alpha", align: 'center' as const },
        { key: "total", label: "Total", align: 'center' as const },
        { key: "persentase", label: "%", align: 'center' as const },
      ];

      const template = getCustomPDFTemplate('attendance');
      
      // Update template with signature info
      const updatedTemplate = {
        ...template,
        teacherInfo: {
          name: eskul.pembimbing,
          nip: "",
          subject: eskul.nama_eskul,
          jabatan: "Pembimbing Ekstrakurikuler",
        },
        signatureDate: signatureDate?.toISOString().split('T')[0],
      };

      const pdfBlob = await generatePDFBlob(
        previewData,
        columns,
        `REKAP KEHADIRAN EKSTRAKURIKULER\n${eskul.nama_eskul.toUpperCase()}\nPeriode ${periodText}`,
        updatedTemplate,
        {}
      );

      if (!pdfBlob) {
        throw new Error('Failed to generate PDF');
      }

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rekap_kehadiran_${eskul.nama_eskul.toLowerCase().replace(/\s+/g, '_')}_${startMonthName.toLowerCase()}_${selectedYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Berhasil",
        description: "Rekap kehadiran berhasil diekspor ke PDF",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export Gagal",
        description: "Terjadi kesalahan saat mengekspor PDF",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsExportDateDialogOpen(false);
    }
  };

  if (!eskul) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Rekap Kehadiran Ekstrakurikuler"
          description="Lihat dan cetak rekap kehadiran anggota ekstrakurikuler"
        />
        <Card className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Silakan buat pengaturan ekstrakurikuler terlebih dahulu di menu "Kelola Ekstrakurikuler"
            </AlertDescription>
          </Alert>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Rekap Kehadiran - ${eskul.nama_eskul}`}
        description={`Pembimbing: ${eskul.pembimbing}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filter Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Periode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tahun</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bulan Awal</Label>
              <Select value={startMonth} onValueChange={setStartMonth}>
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
              <Label>Bulan Akhir</Label>
              <Select value={endMonth} onValueChange={setEndMonth}>
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

            <Button
              className="w-full"
              onClick={() => setIsExportDateDialogOpen(true)}
              disabled={loading || previewData.length === 0}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Preview Rekap Kehadiran</CardTitle>
          </CardHeader>
          <CardContent>
            {previewData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data kehadiran untuk periode yang dipilih
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">No</th>
                      <th className="text-left p-2">NISN</th>
                      <th className="text-left p-2">Nama</th>
                      <th className="text-left p-2">Kelas</th>
                      <th className="text-center p-2">H</th>
                      <th className="text-center p-2">S</th>
                      <th className="text-center p-2">I</th>
                      <th className="text-center p-2">A</th>
                      <th className="text-center p-2">Total</th>
                      <th className="text-center p-2">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">{item.nisn}</td>
                        <td className="p-2">{item.nama_siswa}</td>
                        <td className="p-2">{item.tingkat} {item.nama_kelas}</td>
                        <td className="p-2 text-center">{item.hadir}</td>
                        <td className="p-2 text-center">{item.sakit}</td>
                        <td className="p-2 text-center">{item.izin}</td>
                        <td className="p-2 text-center">{item.alpha}</td>
                        <td className="p-2 text-center font-medium">{item.total}</td>
                        <td className="p-2 text-center font-medium">{item.persentase}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ExportDateDialog
        open={isExportDateDialogOpen}
        onOpenChange={setIsExportDateDialogOpen}
        onExport={handleExportPDF}
      />
    </div>
  );
};

export default RekapKehadiranEskul;
