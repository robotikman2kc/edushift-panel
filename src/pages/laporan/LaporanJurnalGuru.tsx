import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { indexedDB } from "@/lib/indexedDB";
import { useToast } from "@/hooks/use-toast";
import { generatePDFBlob, getCustomPDFTemplate } from "@/lib/exportUtils";
import { EmptyState } from "@/components/common/EmptyState";
import { ExportDateDialog } from "@/components/common/ExportDateDialog";

interface MonthData {
  month: number;
  monthName: string;
  hasData: boolean;
  jurnalCount: number;
}

const LaporanJurnalGuru = () => {
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExportDateDialogOpen, setIsExportDateDialogOpen] = useState(false);
  const [currentExportMonth, setCurrentExportMonth] = useState<{ month: number; monthName: string } | null>(null);
  const { toast } = useToast();

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  useEffect(() => {
    fetchMonthsData();
  }, [selectedYear]);

  const fetchMonthsData = async () => {
    setLoading(true);
    try {
      const allJurnal = await indexedDB.select("jurnal");
      
      // Filter jurnal by selected year and group by month
      const monthsWithData: MonthData[] = monthNames.map((monthName, index) => {
        const jurnalInMonth = allJurnal.filter((jurnal: any) => {
          const jurnalDate = new Date(jurnal.tanggal);
          return jurnalDate.getFullYear() === parseInt(selectedYear) && 
                 jurnalDate.getMonth() === index;
        });

        return {
          month: index,
          monthName,
          hasData: jurnalInMonth.length > 0,
          jurnalCount: jurnalInMonth.length,
        };
      });

      setMonthsData(monthsWithData);
    } catch (error) {
      console.error("Error fetching months data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data jurnal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadClick = (month: number, monthName: string) => {
    setCurrentExportMonth({ month, monthName });
    setIsExportDateDialogOpen(true);
  };

  const handleDownload = async (signatureDate?: Date) => {
    if (!currentExportMonth) return;
    
    const { month, monthName } = currentExportMonth;
    try {
      // Fetch all jurnal for the selected month and year
      const allJurnal = await indexedDB.select("jurnal");
      const filteredJurnal = allJurnal.filter((jurnal: any) => {
        const jurnalDate = new Date(jurnal.tanggal);
        return jurnalDate.getFullYear() === parseInt(selectedYear) && 
               jurnalDate.getMonth() === month;
      });

      if (filteredJurnal.length === 0) {
        toast({
          title: "Tidak Ada Data",
          description: "Tidak ada jurnal untuk periode ini",
          variant: "destructive",
        });
        return;
      }

      // Fetch jenis kegiatan details
      const jurnalWithDetails = await Promise.all(
        filteredJurnal.map(async (jurnal: any) => {
          const jenisKegiatan = await indexedDB.selectById("jenis_kegiatan", jurnal.jenis_kegiatan_id);
          return {
            ...jurnal,
            jenis_kegiatan: jenisKegiatan?.nama_kegiatan || "-",
          };
        })
      );

      // Sort by date
      const sortedJurnal = jurnalWithDetails.sort((a, b) => 
        new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
      );

      // Prepare data for PDF export
      const exportData = sortedJurnal.map((item, index) => ({
        no: index + 1,
        tanggal: new Date(item.tanggal).toLocaleDateString('id-ID'),
        jenis_kegiatan: item.jenis_kegiatan,
        uraian_kegiatan: item.uraian_kegiatan,
        volume: item.volume,
        satuan_hasil: item.satuan_hasil,
      }));

      const columns = [
        { key: "no", label: "No" },
        { key: "tanggal", label: "Tanggal" },
        { key: "jenis_kegiatan", label: "Jenis Kegiatan" },
        { key: "uraian_kegiatan", label: "Uraian Kegiatan" },
        { key: "volume", label: "Volume" },
        { key: "satuan_hasil", label: "Satuan Hasil" },
      ];

      let template = getCustomPDFTemplate('journal');
      
      // Add signature date to template
      if (signatureDate) {
        template = {
          ...template,
          signatureDate: signatureDate.toISOString().split('T')[0],
        };
      }
      
      const blob = generatePDFBlob(
        exportData,
        columns,
        `Laporan Jurnal Guru - ${monthName} ${selectedYear}`,
        template,
        {
          bulan: `${monthName} ${selectedYear}`,
        }
      );

      if (!blob) {
        throw new Error("Failed to generate PDF");
      }

      // Download PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Laporan_Jurnal_${monthName}_${selectedYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: "Laporan berhasil didownload",
      });
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: "Gagal mendownload laporan",
        variant: "destructive",
      });
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i;
    return year.toString();
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Jurnal Guru"
        description="Download rekap jurnal mengajar per bulan"
      >
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Pilih Tahun" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Laporan Bulanan - Tahun {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : monthsData.every(m => !m.hasData) ? (
            <EmptyState
              icon={FileText}
              title="Belum Ada Laporan"
              description={`Belum ada jurnal yang tercatat untuk tahun ${selectedYear}`}
              variant="minimal"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {monthsData.map((monthData) => (
                <div 
                  key={monthData.month} 
                  className="flex flex-col gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className={monthData.hasData ? "text-primary" : "text-muted-foreground"} size={20} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{monthData.monthName}</h3>
                      <p className="text-xs text-muted-foreground">
                        {monthData.hasData 
                          ? `${monthData.jurnalCount} kegiatan`
                          : "Tidak ada data"
                        }
                      </p>
                    </div>
                  </div>
                  {monthData.hasData ? (
                    <Button 
                      onClick={() => handleDownloadClick(monthData.month, monthData.monthName)}
                      size="sm"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
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

      <ExportDateDialog
        open={isExportDateDialogOpen}
        onOpenChange={setIsExportDateDialogOpen}
        onExport={handleDownload}
      />
    </div>
  );
};

export default LaporanJurnalGuru;
