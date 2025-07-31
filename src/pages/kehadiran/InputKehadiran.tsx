import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

interface Siswa {
  id: string;
  nis: string;
  nama_siswa: string;
  kelas_id: string;
}

interface Kehadiran {
  id?: string;
  siswa_id: string;
  kelas_id: string;
  tanggal: string;
  status_kehadiran: string;
  keterangan?: string;
}

const InputKehadiran = () => {
  const [selectedTingkat, setSelectedTingkat] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [allKelas, setAllKelas] = useState<Kelas[]>([]);
  const [filteredKelas, setFilteredKelas] = useState<Kelas[]>([]);
  const [students, setStudents] = useState<Siswa[]>([]);
  const [attendance, setAttendance] = useState<{[key: string]: string}>({});
  const [existingAttendance, setExistingAttendance] = useState<{[key: string]: Kehadiran}>({});
  const [loading, setLoading] = useState(false);

  const tingkatOptions = ["X", "XI", "XII"];

  // Fetch all kelas
  useEffect(() => {
    fetchKelas();
  }, []);

  // Filter kelas by tingkat
  useEffect(() => {
    if (selectedTingkat) {
      const filtered = allKelas.filter(kelas => kelas.tingkat === selectedTingkat);
      setFilteredKelas(filtered);
    } else {
      setFilteredKelas([]);
    }
    setSelectedKelas("");
    setStudents([]);
    setAttendance({});
  }, [selectedTingkat, allKelas]);

  // Fetch students when kelas is selected
  useEffect(() => {
    if (selectedKelas) {
      fetchStudents();
      fetchExistingAttendance();
    } else {
      setStudents([]);
      setAttendance({});
      setExistingAttendance({});
    }
  }, [selectedKelas, selectedDate]);

  const fetchKelas = async () => {
    try {
      const { data, error } = await supabase
        .from("kelas")
        .select("*")
        .eq("status", "Aktif")
        .order("tingkat", { ascending: true })
        .order("nama_kelas", { ascending: true });

      if (error) throw error;
      setAllKelas(data || []);
    } catch (error) {
      console.error("Error fetching kelas:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data kelas",
        variant: "destructive",
      });
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("siswa")
        .select("*")
        .eq("kelas_id", selectedKelas)
        .eq("status", "Aktif")
        .order("nama_siswa", { ascending: true });

      if (error) throw error;
      setStudents(data || []);
      
      // Initialize attendance for new students
      const initialAttendance: {[key: string]: string} = {};
      data?.forEach(student => {
        initialAttendance[student.id] = existingAttendance[student.id]?.status_kehadiran || "";
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from("kehadiran")
        .select("*")
        .eq("kelas_id", selectedKelas)
        .eq("tanggal", selectedDate);

      if (error) throw error;
      
      const attendanceMap: {[key: string]: Kehadiran} = {};
      data?.forEach(record => {
        attendanceMap[record.siswa_id] = record;
      });
      setExistingAttendance(attendanceMap);
    } catch (error) {
      console.error("Error fetching existing attendance:", error);
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
      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("kehadiran")
          .insert(toInsert.map(record => ({
            siswa_id: record.siswa_id,
            kelas_id: record.kelas_id,
            tanggal: record.tanggal,
            status_kehadiran: record.status_kehadiran,
            keterangan: record.keterangan,
          })));

        if (insertError) throw insertError;
      }

      // Update existing records
      for (const record of toUpdate) {
        const { error: updateError } = await supabase
          .from("kehadiran")
          .update({
            status_kehadiran: record.status_kehadiran,
            keterangan: record.keterangan,
          })
          .eq("id", record.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Berhasil",
        description: "Data kehadiran berhasil disimpan",
      });

      // Refresh existing attendance
      fetchExistingAttendance();
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
        description="Catat kehadiran siswa berdasarkan kelas dan tanggal"
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
              <Select value={selectedTingkat} onValueChange={setSelectedTingkat}>
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
              <Select value={selectedKelas} onValueChange={setSelectedKelas} disabled={!selectedTingkat}>
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

            {selectedKelas && (
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
                  disabled={loading || !selectedKelas}
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
              {!selectedKelas ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Pilih tingkat dan nama kelas untuk menampilkan daftar siswa</p>
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