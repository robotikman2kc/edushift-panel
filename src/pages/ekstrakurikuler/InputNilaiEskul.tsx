import { useState, useEffect } from "react";
import { localDB, Ekstrakurikuler, AnggotaEskul } from "@/lib/localDB";
import { getActiveTahunAjaran } from "@/lib/academicYearUtils";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Save, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExportDateDialog } from "@/components/common/ExportDateDialog";

const GRADE_OPTIONS = ["A", "B", "C", "D", "E"];

interface NilaiEskul {
  id?: string;
  anggota_id: string;
  ekstrakurikuler_id: string;
  tahun_ajaran_id: string;
  semester: string;
  nilai: string;
  created_at?: string;
  updated_at?: string;
}

const InputNilaiEskul = () => {
  const [eskul, setEskul] = useState<Ekstrakurikuler | null>(null);
  const [activeTahunAjaran, setActiveTahunAjaran] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("1");
  const [selectedKelas, setSelectedKelas] = useState<string>("all");
  const [anggotaList, setAnggotaList] = useState<any[]>([]);
  const [grades, setGrades] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [isExportDateDialogOpen, setIsExportDateDialogOpen] = useState(false);

  useEffect(() => {
    loadEskulData();
    loadActiveTahunAjaran();
  }, []);

  useEffect(() => {
    if (eskul && activeTahunAjaran && selectedSemester) {
      loadAnggotaAndGrades();
    }
  }, [eskul, activeTahunAjaran, selectedSemester, selectedKelas]);

  const loadEskulData = () => {
    const eskuls = localDB.select('ekstrakurikuler');
    if (eskuls.length > 0) {
      setEskul(eskuls[0]);
    }
  };

  const loadActiveTahunAjaran = async () => {
    try {
      const tahunAjaran = await getActiveTahunAjaran();
      setActiveTahunAjaran(tahunAjaran);
    } catch (error) {
      console.error('Error loading active tahun ajaran:', error);
      // Fallback to current year if error
      const currentYear = new Date().getFullYear();
      setActiveTahunAjaran(`${currentYear}/${currentYear + 1}`);
    }
  };

  const loadAnggotaAndGrades = () => {
    if (!eskul) return;

    let anggota = localDB.select('anggota_eskul', (a: AnggotaEskul) => 
      a.ekstrakurikuler_id === eskul.id && a.status === 'aktif'
    );

    // Filter by class if not "all"
    if (selectedKelas !== 'all') {
      anggota = anggota.filter((a: AnggotaEskul) => 
        `${a.tingkat} ${a.nama_kelas}` === selectedKelas
      );
    }

    // Load existing grades
    const nilaiData = localDB.select('nilai_eskul', (n: NilaiEskul) =>
      n.ekstrakurikuler_id === eskul.id &&
      n.tahun_ajaran_id === activeTahunAjaran &&
      n.semester === selectedSemester
    );

    // Map grades to state
    const gradeMap: { [key: string]: string } = {};
    nilaiData.forEach((nilai: NilaiEskul) => {
      gradeMap[nilai.anggota_id] = nilai.nilai;
    });

    setAnggotaList(anggota);
    setGrades(gradeMap);
  };

  const handleGradeChange = (anggotaId: string, grade: string) => {
    setGrades(prev => ({
      ...prev,
      [anggotaId]: grade
    }));
  };

  const handleSave = () => {
    if (!eskul || !activeTahunAjaran) {
      toast({
        title: "Error",
        description: "Data tidak lengkap",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      anggotaList.forEach((anggota) => {
        const grade = grades[anggota.id];
        if (!grade) return; // Skip if no grade entered

        // Check if grade already exists
        const existingGrade = localDB.select('nilai_eskul', (n: NilaiEskul) =>
          n.anggota_id === anggota.id &&
          n.ekstrakurikuler_id === eskul.id &&
          n.tahun_ajaran_id === activeTahunAjaran &&
          n.semester === selectedSemester
        );

        const nilaiData: Partial<NilaiEskul> = {
          anggota_id: anggota.id,
          ekstrakurikuler_id: eskul.id,
          tahun_ajaran_id: activeTahunAjaran,
          semester: selectedSemester,
          nilai: grade,
        };

        if (existingGrade.length > 0) {
          // Update existing grade
          const result = localDB.update('nilai_eskul', existingGrade[0].id, nilaiData);
          if (result.error) {
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          // Insert new grade
          const result = localDB.insert('nilai_eskul', nilaiData);
          if (result.error) {
            errorCount++;
          } else {
            successCount++;
          }
        }
      });

      if (errorCount > 0) {
        toast({
          title: "Sebagian gagal disimpan",
          description: `${successCount} nilai berhasil disimpan, ${errorCount} gagal`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Berhasil",
          description: `${successCount} nilai berhasil disimpan`,
        });
      }

      loadAnggotaAndGrades();
    } catch (error) {
      console.error("Error saving grades:", error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan nilai",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (signatureDate?: Date) => {
    if (!eskul || anggotaList.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data nilai untuk diekspor",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const jsPDF = (await import('jspdf')).jsPDF;
      const autoTable = (await import('jspdf-autotable')).default;
      
      const { getCustomPDFTemplate } = await import('@/lib/exportUtils');
      const template = getCustomPDFTemplate('grade');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let currentY = template.layout.margins.top;
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFont(template.styling.fontFamily);

      // Title
      doc.setFontSize(template.styling.fontSize.title);
      doc.setTextColor(0, 0, 0);
      const reportTitle = `DAFTAR NILAI EKSTRAKURIKULER`;
      const titleWidth = doc.getTextWidth(reportTitle);
      doc.text(reportTitle, (pageWidth - titleWidth) / 2, currentY);
      currentY += 6;

      doc.setFontSize(template.styling.fontSize.subtitle);
      const eskulName = eskul.nama_eskul.toUpperCase();
      const eskulWidth = doc.getTextWidth(eskulName);
      doc.text(eskulName, (pageWidth - eskulWidth) / 2, currentY);
      currentY += 10;

      // Info section
      doc.setFontSize(template.styling.fontSize.header);
      const labelWidth = 30;

      doc.text('Tahun Ajaran', template.layout.margins.left, currentY);
      doc.text(':', template.layout.margins.left + labelWidth, currentY);
      doc.text(activeTahunAjaran || '-', template.layout.margins.left + labelWidth + 3, currentY);
      currentY += 5;

      doc.text('Semester', template.layout.margins.left, currentY);
      doc.text(':', template.layout.margins.left + labelWidth, currentY);
      doc.text(selectedSemester, template.layout.margins.left + labelWidth + 3, currentY);
      currentY += 5;

      doc.text('Pembimbing', template.layout.margins.left, currentY);
      doc.text(':', template.layout.margins.left + labelWidth, currentY);
      doc.text(eskul.pembimbing, template.layout.margins.left + labelWidth + 3, currentY);
      currentY += 8;

      // Table data
      const tableData = anggotaList.map((anggota, index) => [
        index + 1,
        anggota.nisn,
        anggota.nama_siswa,
        `${anggota.tingkat} ${anggota.nama_kelas}`,
        grades[anggota.id] || '-'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['No', 'NISN', 'Nama Siswa', 'Kelas', 'Nilai']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 3,
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
          0: { halign: 'center', cellWidth: 12 },
          1: { halign: 'left', cellWidth: 30 },
          2: { halign: 'left' },
          3: { halign: 'center', cellWidth: 25 },
          4: { halign: 'center', cellWidth: 20 },
        },
        didDrawPage: (data: any) => {
          // Add signature
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
        },
      });

      const fileName = `nilai_${eskul.nama_eskul.toLowerCase().replace(/\s+/g, '_')}_semester_${selectedSemester}_${activeTahunAjaran?.replace(/\//g, '_')}.pdf`;
      doc.save(fileName);

      toast({
        title: "Export Berhasil",
        description: "Daftar nilai berhasil diekspor ke PDF",
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

  const getUniqueClasses = () => {
    if (!eskul) return [];
    const allAnggota = localDB.select('anggota_eskul', (a: AnggotaEskul) => 
      a.ekstrakurikuler_id === eskul.id && a.status === 'aktif'
    );
    const classes = [...new Set(allAnggota.map((a: AnggotaEskul) => `${a.tingkat} ${a.nama_kelas}`))];
    return classes.sort();
  };

  if (!eskul) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Input Nilai Ekstrakurikuler"
          description="Input nilai ekstrakurikuler untuk siswa"
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
        title={`Input Nilai - ${eskul.nama_eskul}`}
        description={`Pembimbing: ${eskul.pembimbing}`}
      />

      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tahun Ajaran</Label>
              <div className="p-2 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  {activeTahunAjaran || 'Memuat...'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kelas</Label>
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {getUniqueClasses().map((kelas) => (
                    <SelectItem key={kelas} value={kelas}>
                      {kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4">
            <Button
              className="w-full md:w-auto"
              onClick={() => setIsExportDateDialogOpen(true)}
              disabled={loading || anggotaList.length === 0}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grades Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Input Nilai</CardTitle>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            Simpan Semua
          </Button>
        </CardHeader>
        <CardContent>
          {anggotaList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada anggota untuk kelas yang dipilih
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">No</th>
                    <th className="text-left p-3">NISN</th>
                    <th className="text-left p-3">Nama Siswa</th>
                    <th className="text-left p-3">Kelas</th>
                    <th className="text-center p-3">Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {anggotaList.map((anggota, index) => (
                    <tr key={anggota.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{anggota.nisn}</td>
                      <td className="p-3">{anggota.nama_siswa}</td>
                      <td className="p-3">{anggota.tingkat} {anggota.nama_kelas}</td>
                      <td className="p-3">
                        <Select
                          value={grades[anggota.id] || ""}
                          onValueChange={(value) => handleGradeChange(anggota.id, value)}
                        >
                          <SelectTrigger className="w-24 mx-auto">
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADE_OPTIONS.map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                {grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ExportDateDialog
        open={isExportDateDialogOpen}
        onOpenChange={setIsExportDateDialogOpen}
        onExport={handleExportPDF}
      />
    </div>
  );
};

export default InputNilaiEskul;
