import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const InputNilai = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  
  const [students] = useState([
    { id: 1, nis: "001", nama: "Andi Pratama", nilai: "" },
    { id: 2, nis: "002", nama: "Budi Santoso", nilai: "" },
    { id: 3, nis: "003", nama: "Citra Dewi", nilai: "" },
    { id: 4, nis: "004", nama: "Deni Kurniawan", nilai: "" },
    { id: 5, nis: "005", nama: "Eka Putri", nilai: "" },
  ]);

  const [grades, setGrades] = useState<{[key: number]: string}>({});

  const handleGradeChange = (studentId: number, value: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleSave = () => {
    if (!selectedClass || !selectedSubject || !selectedCategory) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Silakan pilih kelas, mata pelajaran, dan kategori penilaian",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Nilai Berhasil Disimpan",
      description: "Data nilai siswa telah berhasil disimpan",
    });
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
                  <SelectItem value="X-A">X-A</SelectItem>
                  <SelectItem value="X-B">X-B</SelectItem>
                  <SelectItem value="XI-A">XI-A</SelectItem>
                  <SelectItem value="XI-B">XI-B</SelectItem>
                  <SelectItem value="XII-A">XII-A</SelectItem>
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
                  <SelectItem value="matematika">Matematika</SelectItem>
                  <SelectItem value="bahasa-indonesia">Bahasa Indonesia</SelectItem>
                  <SelectItem value="bahasa-inggris">Bahasa Inggris</SelectItem>
                  <SelectItem value="fisika">Fisika</SelectItem>
                  <SelectItem value="kimia">Kimia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kategori">Kategori Penilaian</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uts">UTS</SelectItem>
                  <SelectItem value="uas">UAS</SelectItem>
                  <SelectItem value="tugas">Tugas</SelectItem>
                  <SelectItem value="kuis">Kuis</SelectItem>
                  <SelectItem value="praktek">Praktek</SelectItem>
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
                  {students.map((student) => {
                    const grade = grades[student.id] || "";
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.nis}</TableCell>
                        <TableCell>{student.nama}</TableCell>
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
                  })}
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