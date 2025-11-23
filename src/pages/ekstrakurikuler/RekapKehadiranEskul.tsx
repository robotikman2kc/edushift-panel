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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const RekapKehadiranEskul = () => {
  const [eskul, setEskul] = useState<Ekstrakurikuler | null>(null);
  const currentMonth = new Date().getMonth().toString();
  const [startMonth, setStartMonth] = useState<string>(currentMonth);
  const [endMonth, setEndMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);
  const [isExportDateDialogOpen, setIsExportDateDialogOpen] = useState(false);
  const [emptyMonths, setEmptyMonths] = useState<string[]>([]);
  const [showEmptyMonthsDialog, setShowEmptyMonthsDialog] = useState(false);
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

    // Get unique dates from attendance records and sort them
    const uniqueDates = [...new Set(kehadiran.map((k: any) => k.tanggal))].sort();

    // Calculate summary for each member with date-based attendance
    const summary = anggota.map((member: AnggotaEskul) => {
      const memberAttendance = kehadiran.filter((k: any) => k.anggota_id === member.id);
      
      const hadir = memberAttendance.filter((k: any) => k.status_kehadiran === 'Hadir').length;
      const sakit = memberAttendance.filter((k: any) => k.status_kehadiran === 'Sakit').length;
      const izin = memberAttendance.filter((k: any) => k.status_kehadiran === 'Izin').length;
      const alpha = memberAttendance.filter((k: any) => k.status_kehadiran === 'Alpha').length;
      const total = memberAttendance.length;
      const persentase = total > 0 ? ((hadir / total) * 100).toFixed(1) : "0.0";

      // Create date-based attendance object
      const dateAttendance: any = {};
      uniqueDates.forEach(date => {
        const record = memberAttendance.find((k: any) => k.tanggal === date);
        dateAttendance[date] = record ? record.status_kehadiran : '-';
      });

      return {
        nisn: member.nisn,
        nama_siswa: member.nama_siswa,
        tingkat: member.tingkat,
        nama_kelas: member.nama_kelas,
        ...dateAttendance,
        hadir,
        sakit,
        izin,
        alpha,
        total,
        persentase: `${persentase}%`,
        _dates: uniqueDates // Store dates for reference
      };
    });

    setPreviewData(summary);
  };

  const checkEmptyMonths = () => {
    if (!eskul) return [];

    const year = parseInt(selectedYear);
    const sMonth = parseInt(startMonth);
    const eMonth = parseInt(endMonth);
    const empty: string[] = [];

    for (let monthIndex = sMonth; monthIndex <= eMonth; monthIndex++) {
      const monthStartDate = new Date(year, monthIndex, 1);
      const monthEndDate = new Date(year, monthIndex + 1, 0);
      const monthStartDateStr = monthStartDate.toISOString().split('T')[0];
      const monthEndDateStr = monthEndDate.toISOString().split('T')[0];

      const kehadiran = localDB.select('kehadiran_eskul', (k: any) =>
        k.ekstrakurikuler_id === eskul.id &&
        k.tanggal >= monthStartDateStr &&
        k.tanggal <= monthEndDateStr
      );

      if (kehadiran.length === 0) {
        empty.push(monthOptions[monthIndex].label);
      }
    }

    return empty;
  };

  const handleExportClick = () => {
    const empty = checkEmptyMonths();
    if (empty.length > 0) {
      setEmptyMonths(empty);
      setShowEmptyMonthsDialog(true);
    } else {
      setIsExportDateDialogOpen(true);
    }
  };

  const handleConfirmExport = () => {
    setShowEmptyMonthsDialog(false);
    setIsExportDateDialogOpen(true);
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
      const jsPDF = (await import('jspdf')).jsPDF;
      const autoTable = (await import('jspdf-autotable')).default;
      
      const template = getCustomPDFTemplate('attendance');
      const doc = new jsPDF({
        orientation: template.layout.orientation,
        unit: 'mm',
        format: template.layout.pageSize,
      });

      const year = parseInt(selectedYear);
      const sMonth = parseInt(startMonth);
      const eMonth = parseInt(endMonth);

      // Get all active members
      const anggota = localDB.select('anggota_eskul', (a: AnggotaEskul) => 
        a.ekstrakurikuler_id === eskul.id && a.status === 'aktif'
      );

      let isFirstPage = true;
      let exportedMonths = 0;

      // Loop through each month in the range
      for (let monthIndex = sMonth; monthIndex <= eMonth; monthIndex++) {
        const monthName = monthOptions[monthIndex].label;
        
        // Get attendance for this specific month
        const monthStartDate = new Date(year, monthIndex, 1);
        const monthEndDate = new Date(year, monthIndex + 1, 0);
        const monthStartDateStr = monthStartDate.toISOString().split('T')[0];
        const monthEndDateStr = monthEndDate.toISOString().split('T')[0];

        const kehadiran = localDB.select('kehadiran_eskul', (k: any) =>
          k.ekstrakurikuler_id === eskul.id &&
          k.tanggal >= monthStartDateStr &&
          k.tanggal <= monthEndDateStr
        );

        // Skip this month if no data
        if (kehadiran.length === 0) {
          continue;
        }

        if (!isFirstPage) {
          doc.addPage();
        }
        isFirstPage = false;
        exportedMonths++;


        // Get unique dates for this month
        const uniqueDates = [...new Set(kehadiran.map((k: any) => k.tanggal))].sort();

        // Calculate summary for each member for this month
        const monthData = anggota.map((member: AnggotaEskul) => {
          const memberAttendance = kehadiran.filter((k: any) => k.anggota_id === member.id);
          
          const hadir = memberAttendance.filter((k: any) => k.status_kehadiran === 'Hadir').length;
          const sakit = memberAttendance.filter((k: any) => k.status_kehadiran === 'Sakit').length;
          const izin = memberAttendance.filter((k: any) => k.status_kehadiran === 'Izin').length;
          const alpha = memberAttendance.filter((k: any) => k.status_kehadiran === 'Alpha').length;
          const total = memberAttendance.length;
          const persentase = total > 0 ? ((hadir / total) * 100).toFixed(1) : "0.0";

          // Create date-based attendance object
          const dateAttendance: any = {};
          uniqueDates.forEach(date => {
            const record = memberAttendance.find((k: any) => k.tanggal === date);
            const status = record ? record.status_kehadiran : '-';
            const statusShort = status === 'Hadir' ? 'H' : status === 'Sakit' ? 'S' : status === 'Izin' ? 'I' : status === 'Alpha' ? 'A' : '-';
            dateAttendance[date] = statusShort;
          });

          return {
            nisn: member.nisn,
            nama_siswa: member.nama_siswa,
            tingkat: member.tingkat,
            nama_kelas: member.nama_kelas,
            ...dateAttendance,
            hadir,
            sakit,
            izin,
            alpha,
            total,
            persentase: `${persentase}%`,
          };
        });

        // Create columns for this month
        const columns = [
          { key: "no", label: "No" },
          { key: "nisn", label: "NISN" },
          { key: "nama_siswa", label: "Nama Siswa" },
          { key: "tingkat", label: "Tingkat" },
          { key: "nama_kelas", label: "Kelas" },
          ...uniqueDates.map((date: string) => ({
            key: date,
            label: new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }),
          })),
          { key: "hadir", label: "H" },
          { key: "sakit", label: "S" },
          { key: "izin", label: "I" },
          { key: "alpha", label: "A" },
          { key: "total", label: "Total" },
          { key: "persentase", label: "%" },
        ];

        // Generate PDF content for this month
        let currentY = template.layout.margins.top;
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFont(template.styling.fontFamily);

        // Title
        doc.setFontSize(template.styling.fontSize.title);
        doc.setTextColor(0, 0, 0);
        const reportTitle = `REKAP KEHADIRAN EKSTRAKURIKULER`;
        const titleWidth = doc.getTextWidth(reportTitle);
        doc.text(reportTitle, (pageWidth - titleWidth) / 2, currentY);
        currentY += 6;

        doc.setFontSize(template.styling.fontSize.subtitle);
        const eskulName = eskul.nama_eskul.toUpperCase();
        const eskulWidth = doc.getTextWidth(eskulName);
        doc.text(eskulName, (pageWidth - eskulWidth) / 2, currentY);
        currentY += 6;

        const periodText = `Periode ${monthName} ${selectedYear}`;
        const periodWidth = doc.getTextWidth(periodText);
        doc.text(periodText, (pageWidth - periodWidth) / 2, currentY);
        currentY += 10;

        // Info section
        doc.setFontSize(template.styling.fontSize.header);
        const labelWidth = 30;

        doc.text('Ekstrakurikuler', template.layout.margins.left, currentY);
        doc.text(':', template.layout.margins.left + labelWidth, currentY);
        doc.text(eskul.nama_eskul, template.layout.margins.left + labelWidth + 3, currentY);
        currentY += 5;

        doc.text('Pembimbing', template.layout.margins.left, currentY);
        doc.text(':', template.layout.margins.left + labelWidth, currentY);
        doc.text(eskul.pembimbing, template.layout.margins.left + labelWidth + 3, currentY);
        currentY += 5;

        doc.text('Periode', template.layout.margins.left, currentY);
        doc.text(':', template.layout.margins.left + labelWidth, currentY);
        doc.text(`${monthName} ${selectedYear}`, template.layout.margins.left + labelWidth + 3, currentY);
        currentY += 5;

        doc.text('Total Pertemuan', template.layout.margins.left, currentY);
        doc.text(':', template.layout.margins.left + labelWidth, currentY);
        doc.text(`${uniqueDates.length} kali`, template.layout.margins.left + labelWidth + 3, currentY);
        currentY += 8;

        // Table
        const tableData = monthData.map((row, index) => 
          columns.map(col => col.key === 'no' ? index + 1 : (row[col.key] || '-'))
        );

        autoTable(doc, {
          startY: currentY,
          head: [columns.map(col => col.label)],
          body: tableData,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: template.styling.primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'left' },
            2: { halign: 'left' },
            3: { halign: 'center' },
            4: { halign: 'center' },
          },
          didDrawPage: (data: any) => {
            // Add page numbers
            const pageCount = doc.getNumberOfPages();
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(
              `Halaman ${doc.getCurrentPageInfo().pageNumber} dari ${pageCount}`,
              pageWidth / 2,
              doc.internal.pageSize.getHeight() - 10,
              { align: 'center' }
            );

            // Add signature if it's the last page of this month's report
            if (template.footer?.signatureSection && signatureDate) {
              const finalY = (data as any).cursor.y + 15;
              const signatureX = pageWidth - template.layout.margins.right - 60;
              
              doc.setFontSize(10);
              doc.setTextColor(0, 0, 0);
              
              const location = template.signatureLocation || 'Jakarta';
              const dateStr = signatureDate.toLocaleDateString('id-ID', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              });
              
              doc.text(`${location}, ${dateStr}`, signatureX, finalY);
              doc.text('Pembimbing Ekstrakurikuler', signatureX, finalY + 5);
              doc.text(eskul.pembimbing, signatureX, finalY + 25);
      }

      // Check if any months were actually exported
      if (exportedMonths === 0) {
        toast({
          title: "Tidak ada data",
          description: "Tidak ada data kehadiran untuk periode yang dipilih",
          variant: "destructive",
        });
        return;
      }

          },
        });
      }

      // Save PDF
      const fileName = `rekap_kehadiran_${eskul.nama_eskul.toLowerCase().replace(/\s+/g, '_')}_${monthOptions[sMonth].label.toLowerCase()}_${eMonth !== sMonth ? monthOptions[eMonth].label.toLowerCase() + '_' : ''}${selectedYear}.pdf`;
      doc.save(fileName);

      toast({
        title: "Export Berhasil",
        description: `Rekap kehadiran ${exportedMonths} bulan berhasil diekspor ke PDF${emptyMonths.length > 0 ? ` (${emptyMonths.length} bulan dilewati karena tidak ada data)` : ''}`,
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
              onClick={handleExportClick}
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
              <>
                {/* Info Section */}
                <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Ekstrakurikuler</p>
                      <p className="font-semibold">{eskul.nama_eskul}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pembimbing</p>
                      <p className="font-semibold">{eskul.pembimbing}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Periode</p>
                      <p className="font-semibold">
                        {startMonth === endMonth 
                          ? `${monthOptions[parseInt(startMonth)].label} ${selectedYear}`
                          : `${monthOptions[parseInt(startMonth)].label} - ${monthOptions[parseInt(endMonth)].label} ${selectedYear}`
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Pertemuan</p>
                      <p className="font-semibold">{previewData[0]?._dates?.length || 0} kali</p>
                    </div>
                  </div>
                </div>

                {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 sticky left-0 bg-background">No</th>
                      <th className="text-left p-2 sticky left-12 bg-background">NISN</th>
                      <th className="text-left p-2 sticky left-32 bg-background">Nama</th>
                      <th className="text-left p-2">Kelas</th>
                      {previewData[0]?._dates?.map((date: string) => (
                        <th key={date} className="text-center p-2 whitespace-nowrap">
                          {new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                        </th>
                      ))}
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
                        <td className="p-2 sticky left-0 bg-background">{index + 1}</td>
                        <td className="p-2 sticky left-12 bg-background">{item.nisn}</td>
                        <td className="p-2 sticky left-32 bg-background">{item.nama_siswa}</td>
                        <td className="p-2">{item.tingkat} {item.nama_kelas}</td>
                        {item._dates?.map((date: string) => {
                          const status = item[date];
                          const statusShort = status === 'Hadir' ? 'H' : status === 'Sakit' ? 'S' : status === 'Izin' ? 'I' : status === 'Alpha' ? 'A' : '-';
                          return (
                            <td key={date} className="p-2 text-center">
                              <span className={`font-medium ${
                                status === 'Hadir' ? 'text-green-600' :
                                status === 'Sakit' ? 'text-yellow-600' :
                                status === 'Izin' ? 'text-blue-600' :
                                status === 'Alpha' ? 'text-red-600' :
                                'text-muted-foreground'
                              }`}>
                                {statusShort}
                              </span>
                            </td>
                          );
                        })}
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
              </>
            )}
          </CardContent>
        </Card>
      </div>


      <AlertDialog open={showEmptyMonthsDialog} onOpenChange={setShowEmptyMonthsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Peringatan Data Kosong</AlertDialogTitle>
            <AlertDialogDescription>
              Bulan berikut tidak memiliki data kehadiran dan akan dilewati dalam laporan:
              <ul className="list-disc list-inside mt-2 font-semibold">
                {emptyMonths.map((month, index) => (
                  <li key={index}>{month}</li>
                ))}
              </ul>
              <p className="mt-2">Apakah Anda tetap ingin melanjutkan export?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExport}>
              Lanjutkan Export
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExportDateDialog
        open={isExportDateDialogOpen}
        onOpenChange={setIsExportDateDialogOpen}
        onExport={handleExportPDF}
      />
    </div>
  );
};

export default RekapKehadiranEskul;
