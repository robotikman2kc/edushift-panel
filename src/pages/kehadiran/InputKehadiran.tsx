import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Save, Calendar } from "lucide-react";

const InputKehadiran = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [students] = useState([
    { id: 1, nis: "001", nama: "Andi Pratama" },
    { id: 2, nis: "002", nama: "Budi Santoso" },
    { id: 3, nis: "003", nama: "Citra Dewi" },
    { id: 4, nis: "004", nama: "Deni Kurniawan" },
    { id: 5, nis: "005", nama: "Eka Putri" },
  ]);

  const [attendance, setAttendance] = useState<{[key: number]: string}>({});

  const handleAttendanceChange = (studentId: number, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSave = () => {
    if (!selectedClass) {
      toast({
        title: "Pilih Kelas",
        description: "Silakan pilih kelas terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Kehadiran Berhasil Disimpan",
      description: "Data kehadiran siswa telah berhasil disimpan",
    });
  };

  const getAttendanceStats = () => {
    const statuses = Object.values(attendance);
    return {
      hadir: statuses.filter(s => s === 'hadir').length,
      sakit: statuses.filter(s => s === 'sakit').length,
      izin: statuses.filter(s => s === 'izin').length,
      alpha: statuses.filter(s => s === 'alpha').length,
    };
  };

  const stats = getAttendanceStats();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hadir':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Hadir</Badge>;
      case 'sakit':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Sakit</Badge>;
      case 'izin':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Izin</Badge>;
      case 'alpha':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Alpha</Badge>;
      default:
        return <Badge variant="outline">Belum diisi</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Input Kehadiran" 
        description="Catat kehadiran siswa untuk hari ini"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filter & Aksi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal</Label>
              <input
                type="date"
                value={selectedDate}
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
                readOnly
              />
            </div>

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

            <Button 
              onClick={handleSave} 
              className="w-full"
              disabled={!selectedClass}
            >
              <Save className="mr-2 h-4 w-4" />
              Simpan Kehadiran
            </Button>

            {/* Stats */}
            <div className="pt-4 border-t space-y-2">
              <h4 className="font-medium text-sm">Statistik Hari Ini</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Hadir:</span>
                  <span className="font-medium text-green-600">{stats.hadir}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sakit:</span>
                  <span className="font-medium text-yellow-600">{stats.sakit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Izin:</span>
                  <span className="font-medium text-blue-600">{stats.izin}</span>
                </div>
                <div className="flex justify-between">
                  <span>Alpha:</span>
                  <span className="font-medium text-red-600">{stats.alpha}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
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
                    <TableHead className="text-center">Status Kehadiran</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.nis}</TableCell>
                      <TableCell>{student.nama}</TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(attendance[student.id])}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            size="sm"
                            variant={attendance[student.id] === 'hadir' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceChange(student.id, 'hadir')}
                            className="h-8 text-xs"
                          >
                            Hadir
                          </Button>
                          <Button
                            size="sm"
                            variant={attendance[student.id] === 'sakit' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceChange(student.id, 'sakit')}
                            className="h-8 text-xs"
                          >
                            Sakit
                          </Button>
                          <Button
                            size="sm"
                            variant={attendance[student.id] === 'izin' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceChange(student.id, 'izin')}
                            className="h-8 text-xs"
                          >
                            Izin
                          </Button>
                          <Button
                            size="sm"
                            variant={attendance[student.id] === 'alpha' ? 'destructive' : 'outline'}
                            onClick={() => handleAttendanceChange(student.id, 'alpha')}
                            className="h-8 text-xs"
                          >
                            Alpha
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InputKehadiran;