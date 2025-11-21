import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Save, Plus } from "lucide-react";
import { indexedDB, Kelas, MataPelajaran, Siswa, JenisPenilaian, NilaiSiswa } from "@/lib/indexedDB";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getBobotForKelas } from "@/lib/bobotUtils";
import { SemesterSelector } from "@/components/common/SemesterSelector";
import { Badge } from "@/components/ui/badge";

const InputNilai = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState("");
  
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [subjects, setSubjects] = useState<MataPelajaran[]>([]);
  const [students, setStudents] = useState<Siswa[]>([]);
  const [categories, setCategories] = useState<JenisPenilaian[]>([]);
  const [existingGrades, setExistingGrades] = useState<NilaiSiswa[]>([]);
  const [grades, setGrades] = useState<{[key: string]: string}>({});
  const [bobotMap, setBobotMap] = useState<{[key: string]: number}>({});
  const [bulkGrade, setBulkGrade] = useState("");
  
  // Dialog states for adding new category
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryBobot, setNewCategoryBobot] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");

  // Load data
  useEffect(() => {
    loadData();
    loadLastSelectedFilters();
    loadActiveSemester();
  }, []);

  const loadActiveSemester = async () => {
    try {
      const settings = await indexedDB.select("pengaturan");
      const semesterSetting = settings.find((s: any) => s.key === "semester_aktif");
      const tahunSetting = settings.find((s: any) => s.key === "tahun_ajaran_aktif");
      
      if (semesterSetting) setSelectedSemester(semesterSetting.value);
      if (tahunSetting) setSelectedTahunAjaran(tahunSetting.value);
    } catch (error) {
      console.error("Error loading active semester:", error);
    }
  };

  const loadLastSelectedFilters = async () => {
    try {
      const settings = await indexedDB.select("pengaturan");
      const lastKelas = settings.find((s: any) => s.key === "last_selected_kelas_nilai");
      const lastMapel = settings.find((s: any) => s.key === "last_selected_mapel_nilai");
      const lastCategory = settings.find((s: any) => s.key === "last_selected_category_nilai");
      const lastSemester = settings.find((s: any) => s.key === "last_selected_semester_nilai");
      const lastTahunAjaran = settings.find((s: any) => s.key === "last_selected_tahun_ajaran_nilai");
      
      if (lastKelas) setSelectedClass(lastKelas.value);
      if (lastMapel) setSelectedSubject(lastMapel.value);
      if (lastCategory) setSelectedCategory(lastCategory.value);
      if (lastSemester) setSelectedSemester(lastSemester.value);
      if (lastTahunAjaran) setSelectedTahunAjaran(lastTahunAjaran.value);
    } catch (error) {
      console.error("Error loading last selected filters:", error);
    }
  };

  const saveLastSelectedClass = async (kelasId: string) => {
    try {
      const settings = await indexedDB.select("pengaturan");
      const existing = settings.find((s: any) => s.key === "last_selected_kelas_nilai");
      
      if (existing) {
        await indexedDB.update("pengaturan", existing.id, { value: kelasId });
      } else {
        await indexedDB.insert("pengaturan", {
          key: "last_selected_kelas_nilai",
          value: kelasId,
        });
      }
    } catch (error) {
      console.error("Error saving kelas:", error);
    }
  };

  const saveLastSelectedSubject = async (mapelId: string) => {
    try {
      const settings = await indexedDB.select("pengaturan");
      const existing = settings.find((s: any) => s.key === "last_selected_mapel_nilai");
      
      if (existing) {
        await indexedDB.update("pengaturan", existing.id, { value: mapelId });
      } else {
        await indexedDB.insert("pengaturan", {
          key: "last_selected_mapel_nilai",
          value: mapelId,
        });
      }
    } catch (error) {
      console.error("Error saving mapel:", error);
    }
  };

  const saveLastSelectedSemester = async (semester: string) => {
    try {
      const settings = await indexedDB.select("pengaturan");
      const existing = settings.find((s: any) => s.key === "last_selected_semester_nilai");
      
      if (existing) {
        await indexedDB.update("pengaturan", existing.id, { value: semester });
      } else {
        await indexedDB.insert("pengaturan", {
          key: "last_selected_semester_nilai",
          value: semester,
        });
      }
    } catch (error) {
      console.error("Error saving semester:", error);
    }
  };

  const saveLastSelectedTahunAjaran = async (tahunAjaran: string) => {
    try {
      const settings = await indexedDB.select("pengaturan");
      const existing = settings.find((s: any) => s.key === "last_selected_tahun_ajaran_nilai");
      
      if (existing) {
        await indexedDB.update("pengaturan", existing.id, { value: tahunAjaran });
      } else {
        await indexedDB.insert("pengaturan", {
          key: "last_selected_tahun_ajaran_nilai",
          value: tahunAjaran,
        });
      }
    } catch (error) {
      console.error("Error saving tahun ajaran:", error);
    }
  };

  const saveLastSelectedCategory = async (categoryId: string) => {
    try {
      const settings = await indexedDB.select("pengaturan");
      const existing = settings.find((s: any) => s.key === "last_selected_category_nilai");
      
      if (existing) {
        await indexedDB.update("pengaturan", existing.id, { value: categoryId });
      } else {
        await indexedDB.insert("pengaturan", {
          key: "last_selected_category_nilai",
          value: categoryId,
        });
      }
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  // Load students when class changes
  useEffect(() => {
    if (selectedClass) {
      loadStudents();
      loadBobotForClass();
    }
  }, [selectedClass, categories]);

  // Load existing grades when filters change
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedCategory && selectedSemester && selectedTahunAjaran) {
      loadExistingGrades();
    }
  }, [selectedClass, selectedSubject, selectedCategory, selectedSemester, selectedTahunAjaran]);

  const loadData = async () => {
    try {
      const [kelasData, mataPelajaranData, jenisPenilaianData] = await Promise.all([
        indexedDB.select('kelas', (kelas: Kelas) => kelas.status === 'Aktif'),
        indexedDB.select('mata_pelajaran', (mapel: MataPelajaran) => mapel.status === 'Aktif'),
        indexedDB.select('jenis_penilaian', (jenis: JenisPenilaian) => jenis.status === 'Aktif')
      ]);
      
      setClasses(kelasData);
      setSubjects(mataPelajaranData);
      setCategories(jenisPenilaianData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
    }
  };

  const loadStudents = async () => {
    try {
      const siswaData = await indexedDB.select('siswa', (siswa: Siswa) => 
        siswa.kelas_id === selectedClass && siswa.status === 'Aktif'
      );
      // Sort by nama_siswa
      const sortedSiswa = siswaData.sort((a, b) => 
        a.nama_siswa.localeCompare(b.nama_siswa, 'id')
      );
      setStudents(sortedSiswa);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive",
      });
    }
  };

  const loadExistingGrades = async () => {
    try {
      const nilaiData = await indexedDB.select('nilai_siswa', (nilai: NilaiSiswa) => 
        nilai.mata_pelajaran_id === selectedSubject && 
        nilai.jenis_penilaian_id === selectedCategory &&
        nilai.semester === selectedSemester &&
        nilai.tahun_ajaran === selectedTahunAjaran
      );
      setExistingGrades(nilaiData);
      
      // Set existing grades to form
      const gradesMap: {[key: string]: string} = {};
      nilaiData.forEach((nilai: NilaiSiswa) => {
        gradesMap[nilai.siswa_id] = nilai.nilai.toString();
      });
      setGrades(gradesMap);
    } catch (error) {
      toast({
        title: "Error", 
        description: "Gagal memuat nilai yang sudah ada",
        variant: "destructive",
      });
    }
  };

  const loadBobotForClass = async () => {
    if (!selectedClass || categories.length === 0) return;
    
    try {
      const bobot = await getBobotForKelas(selectedClass, categories);
      setBobotMap(bobot);
    } catch (error) {
      console.error("Error loading bobot:", error);
    }
  };

  const handleGradeChange = (studentId: string, value: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleApplyBulkGrade = () => {
    if (!bulkGrade || bulkGrade.trim() === "") {
      toast({
        title: "Peringatan",
        description: "Silakan masukkan nilai terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const nilai = parseInt(bulkGrade);
    if (nilai < 0 || nilai > 100) {
      toast({
        title: "Peringatan",
        description: "Nilai harus antara 0-100",
        variant: "destructive",
      });
      return;
    }

    if (!selectedClass) {
      toast({
        title: "Peringatan",
        description: "Silakan pilih kelas terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    // Apply the bulk grade to all students
    const newGrades: {[key: string]: string} = {};
    students.forEach((student) => {
      newGrades[student.id] = bulkGrade;
    });
    setGrades(newGrades);
    
    toast({
      title: "Berhasil",
      description: `Nilai ${bulkGrade} telah diisi untuk semua siswa`,
    });
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedSubject || !selectedCategory || !selectedSemester || !selectedTahunAjaran) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Silakan pilih kelas, mata pelajaran, kategori penilaian, semester, dan tahun ajaran",
        variant: "destructive",
      });
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      console.log("=== SAVING GRADES ===");
      console.log("Selected Class:", selectedClass);
      console.log("Selected Subject:", selectedSubject);
      console.log("Selected Category:", selectedCategory);

      for (const student of students) {
        const gradeValue = grades[student.id];
        if (gradeValue && gradeValue.trim() !== "") {
          const nilai = parseInt(gradeValue);
          if (nilai >= 0 && nilai <= 100) {
            // Check if grade already exists
            const existingGrade = existingGrades.find(g => g.siswa_id === student.id);
            
            if (existingGrade) {
              // Update existing grade
              console.log("Updating grade for student:", student.nama_siswa, "ID:", student.id);
              const result = await indexedDB.update('nilai_siswa', existingGrade.id, {
                nilai: nilai,
                updated_at: new Date().toISOString()
              });
              if (result.error) {
                errorCount++;
                console.error("Error updating grade:", result.error);
              } else {
                successCount++;
                console.log("Grade updated successfully");
              }
            } else {
              // Insert new grade
              const gradeData = {
                siswa_id: student.id,
                mata_pelajaran_id: selectedSubject,
                jenis_penilaian_id: selectedCategory,
                nilai: nilai,
                tanggal: new Date().toISOString().split('T')[0],
                semester: selectedSemester,
                tahun_ajaran: selectedTahunAjaran
              };
              console.log("Inserting new grade for student:", student.nama_siswa, gradeData);
              const result = await indexedDB.insert('nilai_siswa', gradeData);
              if (result.error) {
                errorCount++;
                console.error("Error inserting grade:", result.error);
              } else {
                successCount++;
                console.log("Grade inserted successfully");
              }
            }
          }
        }
      }

      if (successCount > 0) {
        toast({
          title: "Berhasil",
          description: `${successCount} nilai berhasil disimpan${errorCount > 0 ? `, ${errorCount} nilai gagal disimpan` : ''}`,
        });
        // Reload existing grades
        loadExistingGrades();
      } else {
        toast({
          title: "Peringatan",
          description: "Tidak ada nilai yang valid untuk disimpan",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan nilai",
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Nama kategori wajib diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await indexedDB.insert('jenis_penilaian', {
        nama_kategori: newCategoryName,
        bobot: newCategoryBobot ? parseInt(newCategoryBobot) : 0,
        deskripsi: newCategoryDesc,
        status: 'Aktif'
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Berhasil",
          description: "Kategori penilaian berhasil ditambahkan",
        });
        setIsDialogOpen(false);
        setNewCategoryName("");
        setNewCategoryBobot("");
        setNewCategoryDesc("");
        loadData(); // Reload categories
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan kategori",
        variant: "destructive",
      });
    }
  };

  const getGradeColor = (grade: string) => {
    const numGrade = parseInt(grade);
    if (numGrade >= 90) return "text-green-600 bg-green-50";
    if (numGrade >= 80) return "text-blue-600 bg-blue-50";
    if (numGrade >= 70) return "text-yellow-600 bg-yellow-50";
    if (numGrade >= 60) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Input Nilai" 
        description="Input nilai siswa berdasarkan mata pelajaran dan kategori penilaian"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Filter Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SemesterSelector
              semester={selectedSemester}
              tahunAjaran={selectedTahunAjaran}
              onSemesterChange={(value) => {
                setSelectedSemester(value);
                saveLastSelectedSemester(value);
              }}
              onTahunAjaranChange={(value) => {
                setSelectedTahunAjaran(value);
                saveLastSelectedTahunAjaran(value);
              }}
            />
            
            <div className="space-y-2">
              <Label htmlFor="kelas">Kelas</Label>
              <Select value={selectedClass} onValueChange={(value) => {
                setSelectedClass(value);
                saveLastSelectedClass(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mata-pelajaran">Mata Pelajaran</Label>
              <Select value={selectedSubject} onValueChange={(value) => {
                setSelectedSubject(value);
                saveLastSelectedSubject(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.nama_mata_pelajaran}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="kategori">Kategori Penilaian</Label>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Kategori Penilaian</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nama-kategori">Nama Kategori</Label>
                        <Input
                          id="nama-kategori"
                          placeholder="Contoh: PH3, UH1, dll."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bobot">Bobot (%)</Label>
                        <Input
                          id="bobot"
                          type="number"
                          min="0"
                          max="100"
                          placeholder="20"
                          value={newCategoryBobot}
                          onChange={(e) => setNewCategoryBobot(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deskripsi">Deskripsi (Opsional)</Label>
                        <Input
                          id="deskripsi"
                          placeholder="Deskripsi kategori"
                          value={newCategoryDesc}
                          onChange={(e) => setNewCategoryDesc(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleAddCategory} className="w-full">
                        Tambah Kategori
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Select value={selectedCategory} onValueChange={(value) => {
                setSelectedCategory(value);
                saveLastSelectedCategory(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => {
                    const bobot = bobotMap[category.id] || category.bobot || 0;
                    return (
                      <SelectItem key={category.id} value={category.id}>
                        {category.nama_kategori} ({bobot}%)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="bulk-grade">Input Nilai Sekaligus</Label>
              <div className="flex gap-2">
                <Input
                  id="bulk-grade"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0-100"
                  value={bulkGrade}
                  onChange={(e) => setBulkGrade(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleApplyBulkGrade}
                  variant="outline"
                  disabled={!selectedClass}
                >
                  Terapkan
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Isi nilai yang sama untuk semua siswa
              </p>
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full"
              disabled={!selectedClass || !selectedSubject || !selectedCategory}
            >
              <Save className="mr-2 h-4 w-4" />
              Simpan Semua Nilai
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Siswa</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">No</TableHead>
                    <TableHead>NISN</TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead className="text-center">Nilai</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {selectedClass ? "Tidak ada siswa aktif dalam kelas ini" : "Pilih kelas untuk menampilkan daftar siswa"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student, index) => {
                      const grade = grades[student.id] || "";
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-medium">{student.nisn}</TableCell>
                          <TableCell>{student.nama_siswa}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0-100"
                              value={grade}
                              onChange={(e) => handleGradeChange(student.id, e.target.value)}
                              className="text-center"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {grade && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(grade)}`}>
                                {parseInt(grade) >= 90 ? 'A' :
                                 parseInt(grade) >= 80 ? 'B' :
                                 parseInt(grade) >= 70 ? 'C' :
                                 parseInt(grade) >= 60 ? 'D' : 'E'}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InputNilai;