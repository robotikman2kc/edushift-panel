import { useState, useEffect } from "react";
import { localDB } from "@/lib/localDB";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Save, Calendar, CheckCheck, X, Clock, UserX } from "lucide-react";

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
  status: string;
}

interface Siswa {
  id: string;
  nis: string;
  nama_siswa: string;
  kelas_id: string;
  status: string;
}

interface Kehadiran {
  id?: string;
  siswa_id: string;
  kelas_id: string;
  mata_pelajaran_id?: string;
  tanggal: string;
  status_kehadiran: string;
  keterangan?: string;
}

const InputKehadiran = () => {
  // Load saved state from localStorage
  const getSavedState = (key: string, defaultValue: string) => {
    try {
      const saved = localStorage.getItem(`input_kehadiran_${key}`);
      return saved || defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [selectedTingkat, setSelectedTingkat] = useState(() => getSavedState('tingkat', ""));
  const [selectedKelas, setSelectedKelas] = useState(() => getSavedState('kelas', ""));
  const [selectedMataPelajaran, setSelectedMataPelajaran] = useState(() => getSavedState('mata_pelajaran', ""));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [allKelas, setAllKelas] = useState<Kelas[]>([]);
  const [filteredKelas, setFilteredKelas] = useState<Kelas[]>([]);
  const [mataPelajaran, setMataPelajaran] = useState<MataPelajaran[]>([]);
  const [students, setStudents] = useState<Siswa[]>([]);
  const [attendance, setAttendance] = useState<{[key: string]: string}>({});
  const [existingAttendance, setExistingAttendance] = useState<{[key: string]: Kehadiran}>({});
  const [loading, setLoading] = useState(false);

  const tingkatOptions = ["X", "XI", "XII"];

  // Save state to localStorage
  const saveState = (key: string, value: string) => {
    try {
      localStorage.setItem(`input_kehadiran_${key}`, value);
    } catch (error) {
      console.warn('Failed to save state:', error);
    }
  };

  // Fetch all kelas and mata pelajaran
  useEffect(() => {
    fetchKelas();
    fetchMataPelajaran();
  }, []);

  // Initialize filtered kelas when allKelas is loaded and we have saved tingkat
  useEffect(() => {
    if (allKelas.length > 0 && selectedTingkat) {
      const filtered = allKelas.filter(kelas => kelas.tingkat === selectedTingkat);
      setFilteredKelas(filtered);
    } else if (allKelas.length > 0) {
      setFilteredKelas([]);
    }
  }, [allKelas, selectedTingkat]);

  // Filter kelas by tingkat (but don't clear students if we have saved state)
  useEffect(() => {
    if (selectedTingkat && allKelas.length > 0) {
      const filtered = allKelas.filter(kelas => kelas.tingkat === selectedTingkat);
      setFilteredKelas(filtered);
      
      // Only clear selections if no saved state exists
      const savedKelas = getSavedState('kelas', '');
      if (!savedKelas) {
        setSelectedKelas("");
        setStudents([]);
        setAttendance({});
      }
    } else {
      setFilteredKelas([]);
      if (!getSavedState('kelas', '')) {
        setSelectedKelas("");
        setStudents([]);
        setAttendance({});
      }
    }
  }, [selectedTingkat, allKelas]);

  // Fetch students when kelas and mata pelajaran are selected
  useEffect(() => {
    if (selectedKelas && selectedMataPelajaran && allKelas.length > 0) {
      fetchStudentsAndAttendance();
    } else if (!selectedKelas || !selectedMataPelajaran) {
      setStudents([]);
      setAttendance({});
      setExistingAttendance({});
    }
  }, [selectedKelas, selectedMataPelajaran, selectedDate]);

  const fetchKelas = async () => {
    try {
      const data = localDB.select("kelas")
        .filter(kelas => kelas.status === "Aktif")
        .sort((a, b) => {
          if (a.tingkat !== b.tingkat) {
            return a.tingkat.localeCompare(b.tingkat);
          }
          return a.nama_kelas.localeCompare(b.nama_kelas);
        });

      setAllKelas(data);
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
      const data = localDB.select("mata_pelajaran")
        .filter(mp => mp.status === "Aktif")
        .sort((a, b) => a.nama_mata_pelajaran.localeCompare(b.nama_mata_pelajaran));

      setMataPelajaran(data);
    } catch (error) {
      console.error("Error fetching mata pelajaran:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data mata pelajaran",
        variant: "destructive",
      });
    }
  };

  const fetchStudentsAndAttendance = async () => {
    try {
      setLoading(true);
      
      // First fetch existing attendance
      const attendanceData = localDB.select("kehadiran")
        .filter(record => 
          record.kelas_id === selectedKelas &&
          record.mata_pelajaran_id === selectedMataPelajaran &&
          record.tanggal === selectedDate
        );
      
      const attendanceMap: {[key: string]: Kehadiran} = {};
      attendanceData.forEach(record => {
        attendanceMap[record.siswa_id] = record;
      });
      setExistingAttendance(attendanceMap);

      // Then fetch students
      const studentsData = localDB.select("siswa")
        .filter(student => 
          student.kelas_id === selectedKelas &&
          student.status === "Aktif"
        )
        .sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

      setStudents(studentsData);
      
      // Initialize attendance with existing data
      const initialAttendance: {[key: string]: string} = {};
      studentsData.forEach(student => {
        initialAttendance[student.id] = attendanceMap[student.id]?.status_kehadiran || "";
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa dan kehadiran",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleBulkAttendance = (status: string) => {
    const bulkAttendance: {[key: string]: string} = {};
    students.forEach(student => {
      bulkAttendance[student.id] = status;
    });
    setAttendance(bulkAttendance);
  };

  const handleSave = async () => {
    if (!selectedKelas) {
      toast({
        title: "Pilih Kelas",
        description: "Silakan pilih kelas terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMataPelajaran) {
      toast({
        title: "Pilih Mata Pelajaran",
        description: "Silakan pilih mata pelajaran terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const attendanceRecords = students
        .filter(student => attendance[student.id])
        .map(student => {
          const existing = existingAttendance[student.id];
          return {
            id: existing?.id,
            siswa_id: student.id,
            kelas_id: selectedKelas,
            tanggal: selectedDate,
            status_kehadiran: attendance[student.id],
            keterangan: existing?.keterangan || null,
          };
        });

      // Separate insert and update operations
      const toInsert = attendanceRecords.filter(record => !record.id);
      const toUpdate = attendanceRecords.filter(record => record.id);

      // Insert new records
      for (const record of toInsert) {
        const result = localDB.insert("kehadiran", {
          siswa_id: record.siswa_id,
          kelas_id: record.kelas_id,
          mata_pelajaran_id: selectedMataPelajaran,
          tanggal: record.tanggal,
          status_kehadiran: record.status_kehadiran,
          keterangan: record.keterangan,
        });
        if (result.error) throw new Error(result.error);
      }

      // Update existing records
      for (const record of toUpdate) {
        const result = localDB.update("kehadiran", record.id!, {
          status_kehadiran: record.status_kehadiran,
          keterangan: record.keterangan,
        });
        if (result.error) throw new Error(result.error);
      }

      toast({
        title: "Berhasil",
        description: "Data kehadiran berhasil disimpan",
      });

      // Refresh data to show updated attendance
      await fetchStudentsAndAttendance();
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data kehadiran",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStats = () => {
    const statuses = Object.values(attendance);
    return {
      hadir: statuses.filter(s => s === 'Hadir').length,
      sakit: statuses.filter(s => s === 'Sakit').length,
      izin: statuses.filter(s => s === 'Izin').length,
      alpha: statuses.filter(s => s === 'Alpha').length,
      total: students.length,
    };
  };

  const stats = getAttendanceStats();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Hadir':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Hadir</Badge>;
      case 'Sakit':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Sakit</Badge>;
      case 'Izin':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Izin</Badge>;
      case 'Alpha':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Alpha</Badge>;
      default:
        return <Badge variant="outline">Belum diisi</Badge>;
    }
  };

  const selectedKelasData = allKelas.find(k => k.id === selectedKelas);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Input Kehadiran" 
        description="Catat kehadiran siswa berdasarkan kelas, mata pelajaran, dan tanggal"
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
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tingkat">Tingkat Kelas</Label>
              <Select value={selectedTingkat} onValueChange={(value) => {
                setSelectedTingkat(value);
                saveState('tingkat', value);
              }}>
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
              <Select value={selectedKelas} onValueChange={(value) => {
                setSelectedKelas(value);
                saveState('kelas', value);
              }} disabled={!selectedTingkat}>
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
              <Select value={selectedMataPelajaran} onValueChange={(value) => {
                setSelectedMataPelajaran(value);
                saveState('mata_pelajaran', value);
              }} disabled={!selectedKelas}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  {mataPelajaran.map((mapel) => (
                    <SelectItem key={mapel.id} value={mapel.id}>
                      {mapel.nama_mata_pelajaran} ({mapel.kode_mata_pelajaran})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedKelas && selectedMataPelajaran && (
              <>
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-2">Aksi Massal</h4>
                  <div className="space-y-2">
                    <Button 
                      size="sm" 
                      className="w-full" 
                      onClick={() => handleBulkAttendance('Hadir')}
                      variant="outline"
                    >
                      <CheckCheck className="mr-2 h-4 w-4" />
                      Semua Hadir
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleSave} 
                  className="w-full"
                  disabled={loading || !selectedKelas || !selectedMataPelajaran}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Menyimpan..." : "Simpan Kehadiran"}
                </Button>

                <div className="pt-4 border-t space-y-2">
                  <h4 className="font-medium text-sm">Statistik Hari Ini</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Siswa:</span>
                      <span className="font-medium">{stats.total}</span>
                    </div>
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
              </>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                Daftar Siswa
                {selectedKelasData && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    - {selectedKelasData.nama_kelas} {selectedKelasData.jurusan && `- ${selectedKelasData.jurusan}`}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedKelas || !selectedMataPelajaran ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Pilih tingkat, nama kelas, dan mata pelajaran untuk menampilkan daftar siswa</p>
                </div>
              ) : loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Memuat data siswa...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Tidak ada siswa dalam kelas ini</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>NIS</TableHead>
                      <TableHead>Nama Siswa</TableHead>
                      <TableHead className="text-center">Status Kehadiran</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, index) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">{student.nis}</TableCell>
                        <TableCell>{student.nama_siswa}</TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(attendance[student.id])}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              size="sm"
                              variant={attendance[student.id] === 'Hadir' ? 'default' : 'outline'}
                              onClick={() => handleAttendanceChange(student.id, 'Hadir')}
                              className="h-8 text-xs"
                            >
                              Hadir
                            </Button>
                            <Button
                              size="sm"
                              variant={attendance[student.id] === 'Sakit' ? 'default' : 'outline'}
                              onClick={() => handleAttendanceChange(student.id, 'Sakit')}
                              className="h-8 text-xs"
                            >
                              Sakit
                            </Button>
                            <Button
                              size="sm"
                              variant={attendance[student.id] === 'Izin' ? 'default' : 'outline'}
                              onClick={() => handleAttendanceChange(student.id, 'Izin')}
                              className="h-8 text-xs"
                            >
                              Izin
                            </Button>
                            <Button
                              size="sm"
                              variant={attendance[student.id] === 'Alpha' ? 'destructive' : 'outline'}
                              onClick={() => handleAttendanceChange(student.id, 'Alpha')}
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InputKehadiran;