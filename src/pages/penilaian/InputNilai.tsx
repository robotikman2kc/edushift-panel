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

const InputNilai = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [subjects, setSubjects] = useState<MataPelajaran[]>([]);
  const [students, setStudents] = useState<Siswa[]>([]);
  const [categories, setCategories] = useState<JenisPenilaian[]>([]);
  const [existingGrades, setExistingGrades] = useState<NilaiSiswa[]>([]);
  const [grades, setGrades] = useState<{[key: string]: string}>({});
  
  // Dialog states for adding new category
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryBobot, setNewCategoryBobot] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Load students when class changes
  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);

  // Load existing grades when filters change
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedCategory) {
      loadExistingGrades();
    }
  }, [selectedClass, selectedSubject, selectedCategory]);

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
      setStudents(siswaData);
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
        nilai.jenis_penilaian_id === selectedCategory
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

  const handleGradeChange = (studentId: string, value: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedSubject || !selectedCategory) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Silakan pilih kelas, mata pelajaran, dan kategori penilaian",
        variant: "destructive",
      });
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const student of students) {
        const gradeValue = grades[student.id];
        if (gradeValue && gradeValue.trim() !== "") {
          const nilai = parseInt(gradeValue);
          if (nilai >= 0 && nilai <= 100) {
            // Check if grade already exists
            const existingGrade = existingGrades.find(g => g.siswa_id === student.id);
            
            if (existingGrade) {
              // Update existing grade
              const result = await indexedDB.update('nilai_siswa', existingGrade.id, {
                nilai: nilai,
                updated_at: new Date().toISOString()
              });
              if (result.error) {
                errorCount++;
              } else {
                successCount++;
              }
            } else {
              // Insert new grade
              const result = await indexedDB.insert('nilai_siswa', {
                siswa_id: student.id,
                mata_pelajaran_id: selectedSubject,
                jenis_penilaian_id: selectedCategory,
                nilai: nilai,
                tanggal: new Date().toISOString().split('T')[0],
                semester: "1", // Default semester
                tahun_ajaran: "2024/2025" // Default tahun ajaran
              });
              if (result.error) {
                errorCount++;
              } else {
                successCount++;
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
            <div className="space-y-2">
              <Label htmlFor="kelas">Kelas</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
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
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nama_kategori} {category.bobot ? `(${category.bobot}%)` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead className="text-center">Nilai</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        {selectedClass ? "Tidak ada siswa aktif dalam kelas ini" : "Pilih kelas untuk menampilkan daftar siswa"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student) => {
                      const grade = grades[student.id] || "";
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.nis}</TableCell>
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