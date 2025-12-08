import { useState, useEffect, useMemo } from "react";
import { eskulDB } from "@/lib/eskulDB";
import { getActiveTahunAjaran } from "@/lib/academicYearUtils";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Save, FileText, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExportDateDialog } from "@/components/common/ExportDateDialog";

const GRADE_OPTIONS = ["A", "B", "C", "D", "E"];
const FILTER_STORAGE_KEY = 'input_nilai_eskul_filters';

type SortColumn = 'nisn' | 'nama_siswa' | 'nama_kelas' | 'nilai';
type SortDirection = 'asc' | 'desc';

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
  const [eskul, setEskul] = useState<any>(null);
  const [activeTahunAjaran, setActiveTahunAjaran] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>(() => {
    const saved = localStorage.getItem(FILTER_STORAGE_KEY);
    if (saved) {
      const filters = JSON.parse(saved);
      return filters.semester || "1";
    }
    return "1";
  });
  const [selectedKelas, setSelectedKelas] = useState<string>(() => {
    const saved = localStorage.getItem(FILTER_STORAGE_KEY);
    if (saved) {
      const filters = JSON.parse(saved);
      return filters.kelas || "all";
    }
    return "all";
  });
  const [anggotaList, setAnggotaList] = useState<any[]>([]);
  const [grades, setGrades] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [isExportDateDialogOpen, setIsExportDateDialogOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>('nama_siswa');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
      semester: selectedSemester,
      kelas: selectedKelas
    }));
  }, [selectedSemester, selectedKelas]);

  useEffect(() => {
    loadEskulData();
    loadActiveTahunAjaran();
  }, []);

  useEffect(() => {
    if (eskul && activeTahunAjaran && selectedSemester) {
      loadAnggotaAndGrades();
    }
  }, [eskul, activeTahunAjaran, selectedSemester, selectedKelas]);

  const loadEskulData = async () => {
    const eskuls = await eskulDB.select('ekstrakurikuler');
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

  const loadAnggotaAndGrades = async () => {
    if (!eskul) return;

    let anggota = await eskulDB.select('anggota_eskul', (a: any) => 
      a.ekstrakurikuler_id === eskul.id && a.status === 'aktif'
    );

    // Filter by class if not "all"
    if (selectedKelas !== 'all') {
      anggota = anggota.filter((a: any) => 
        a.nama_kelas === selectedKelas
      );
    }

    // Load existing grades
    const nilaiData = await eskulDB.select('nilai_eskul', (n: any) =>
      n.ekstrakurikuler_id === eskul.id &&
      n.tahun_ajaran_id === activeTahunAjaran &&
      n.semester === selectedSemester
    );

    // Map grades to state
    const gradeMap: { [key: string]: string } = {};
    nilaiData.forEach((nilai: any) => {
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

  const handleSetAllGrades = (grade: string) => {
    const newGrades: { [key: string]: string } = {};
    anggotaList.forEach((anggota) => {
      newGrades[anggota.id] = grade;
    });
    setGrades(prev => ({ ...prev, ...newGrades }));
    toast({
      title: "Nilai Diset",
      description: `Semua anggota yang ditampilkan diset nilai ${grade}`,
    });
  };

  const handleSave = async () => {
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

      for (const anggota of anggotaList) {
        const grade = grades[anggota.id];
        if (!grade) continue; // Skip if no grade entered

        // Check if grade already exists
        const existingGrade = await eskulDB.select('nilai_eskul', (n: any) =>
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
          const result = await eskulDB.update('nilai_eskul', existingGrade[0].id, nilaiData);
          if (result.error) {
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          // Insert new grade
          const result = await eskulDB.insert('nilai_eskul', nilaiData);
          if (result.error) {
            errorCount++;
          } else {
            successCount++;
          }
        }
      }

      if (errorCount > 0) {
        toast({
          title: "Sebagian gagal disimpan",
          description: `${successCount} nilai berhasil disimpan, ${errorCount} gagal`,
          variant: "destructive",
        });
      } else {
        toast({
          variant: "success",
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
        anggota.nama_kelas,
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
        variant: "success",
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

  const getUniqueClasses = async () => {
    if (!eskul) return [];
    const allAnggota = await eskulDB.select('anggota_eskul', (a: any) => 
      a.ekstrakurikuler_id === eskul.id && a.status === 'aktif'
    );
    const classes = [...new Set(allAnggota.map((a: any) => a.nama_kelas))];
    return classes.sort();
  };

  // Load classes for select
  const [kelasOptions, setKelasOptions] = useState<string[]>([]);
  
  useEffect(() => {
    const loadKelas = async () => {
      const classes = await getUniqueClasses();
      setKelasOptions(classes);
    };
    if (eskul) {
      loadKelas();
    }
  }, [eskul]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const sortedAnggota = useMemo(() => {
    return [...anggotaList].sort((a, b) => {
      let aVal: string;
      let bVal: string;

      if (sortColumn === 'nilai') {
        aVal = grades[a.id] || '';
        bVal = grades[b.id] || '';
      } else {
        aVal = String(a[sortColumn] || '').toLowerCase();
        bVal = String(b[sortColumn] || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [anggotaList, sortColumn, sortDirection, grades]);

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Filter Card - Left Side */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                      {kelasOptions.map((kelas) => (
                        <SelectItem key={kelas} value={kelas}>
                          {kelas}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2">
                  <Button
                    className="w-full"
                    onClick={() => setIsExportDateDialogOpen(true)}
                    disabled={loading || anggotaList.length === 0}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grades Table - Right Side */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Input Nilai</CardTitle>
              <div className="flex gap-2">
                <Select onValueChange={handleSetAllGrades}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Set Semua Nilai..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_OPTIONS.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        Set Semua {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Semua
                </Button>
              </div>
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
                        <th 
                          className="text-left p-3 cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => handleSort('nisn')}
                        >
                          <div className="flex items-center">
                            NISN {getSortIcon('nisn')}
                          </div>
                        </th>
                        <th 
                          className="text-left p-3 cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => handleSort('nama_siswa')}
                        >
                          <div className="flex items-center">
                            Nama Siswa {getSortIcon('nama_siswa')}
                          </div>
                        </th>
                        <th 
                          className="text-left p-3 cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => handleSort('nama_kelas')}
                        >
                          <div className="flex items-center">
                            Kelas {getSortIcon('nama_kelas')}
                          </div>
                        </th>
                        <th 
                          className="text-center p-3 cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => handleSort('nilai')}
                        >
                          <div className="flex items-center justify-center">
                            Nilai {getSortIcon('nilai')}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAnggota.map((anggota, index) => (
                        <tr key={anggota.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3">{anggota.nisn}</td>
                          <td className="p-3">{anggota.nama_siswa}</td>
                          <td className="p-3">{anggota.nama_kelas}</td>
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
        </div>
      </div>

      <ExportDateDialog
        open={isExportDateDialogOpen}
        onOpenChange={setIsExportDateDialogOpen}
        onExport={handleExportPDF}
      />
    </div>
  );
};

export default InputNilaiEskul;
