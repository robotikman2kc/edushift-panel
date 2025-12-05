import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { eskulDB } from "@/lib/eskulDB";
import { KehadiranEskul, AnggotaEskul, Ekstrakurikuler } from "@/lib/indexedDB";
import { Save, Calendar, CheckCheck, Clock, UserX, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

type SortColumn = 'nisn' | 'nama_siswa' | 'tingkat' | 'nama_kelas' | 'status';
type SortDirection = 'asc' | 'desc';

const FILTER_STORAGE_KEY = 'kehadiran_eskul_filters';

export default function KehadiranEskulPage() {
  const [eskul, setEskul] = useState<Ekstrakurikuler | null>(null);
  const [anggotaEskul, setAnggotaEskul] = useState<AnggotaEskul[]>([]);
  const [filteredAnggota, setFilteredAnggota] = useState<AnggotaEskul[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTingkat, setSelectedTingkat] = useState<string>(() => {
    const saved = localStorage.getItem(FILTER_STORAGE_KEY);
    if (saved) {
      const filters = JSON.parse(saved);
      return filters.tingkat || "all";
    }
    return "all";
  });
  const [selectedKelas, setSelectedKelas] = useState<string>(() => {
    const saved = localStorage.getItem(FILTER_STORAGE_KEY);
    if (saved) {
      const filters = JSON.parse(saved);
      return filters.kelas || "all";
    }
    return "all";
  });
  const [attendance, setAttendance] = useState<{[key: string]: string}>({});
  const [existingAttendance, setExistingAttendance] = useState<{[key: string]: KehadiranEskul}>({});
  const [loading, setLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>('nama_siswa');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const tingkatOptions = ["X", "XI", "XII"];

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
      tingkat: selectedTingkat,
      kelas: selectedKelas
    }));
  }, [selectedTingkat, selectedKelas]);

  useEffect(() => {
    loadEskulData();
  }, []);

  useEffect(() => {
    if (eskul) {
      fetchAnggotaAndAttendance();
    }
  }, [eskul, selectedDate]);

  // Filter anggota berdasarkan tingkat dan kelas
  useEffect(() => {
    let filtered = [...anggotaEskul];
    
    if (selectedTingkat && selectedTingkat !== "all") {
      filtered = filtered.filter(a => a.tingkat === selectedTingkat);
    }
    
    if (selectedKelas && selectedKelas !== "all") {
      filtered = filtered.filter(a => a.nama_kelas === selectedKelas);
    }
    
    setFilteredAnggota(filtered);
  }, [anggotaEskul, selectedTingkat, selectedKelas]);

  // Auto-select first kelas when tingkat changes
  useEffect(() => {
    if (selectedTingkat && selectedTingkat !== "all" && anggotaEskul.length > 0) {
      const kelasForTingkat = [...new Set(anggotaEskul
        .filter(a => a.tingkat === selectedTingkat)
        .map(a => a.nama_kelas))]
        .sort();
      
      if (kelasForTingkat.length > 0) {
        setSelectedKelas(kelasForTingkat[0]);
      }
    }
  }, [selectedTingkat, anggotaEskul]);

  const loadEskulData = async () => {
    const eskuls = await eskulDB.select('ekstrakurikuler');
    if (eskuls.length > 0) {
      setEskul(eskuls[0]);
    } else {
      setEskul(null);
    }
  };

  const fetchAnggotaAndAttendance = async () => {
    if (!eskul) return;

    setLoading(true);
    
    // Load anggota aktif
    const anggota = await eskulDB.select('anggota_eskul', (a: AnggotaEskul) => 
      a.ekstrakurikuler_id === eskul.id && a.status === 'aktif'
    );
    setAnggotaEskul(anggota);

    // Load existing attendance for selected date
    const existingData = await eskulDB.select('kehadiran_eskul', (k: KehadiranEskul) => 
      k.ekstrakurikuler_id === eskul.id && k.tanggal === selectedDate
    );

    // Map existing attendance by anggota_id
    const attendanceMap: {[key: string]: KehadiranEskul} = {};
    const attendanceStatus: {[key: string]: string} = {};

    existingData.forEach(record => {
      attendanceMap[record.anggota_id] = record;
      attendanceStatus[record.anggota_id] = record.status_kehadiran;
    });

    setExistingAttendance(attendanceMap);
    setAttendance(attendanceStatus);
    setLoading(false);
  };

  const handleAttendanceChange = (anggotaId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [anggotaId]: status
    }));
  };

  const handleMarkAllHadir = () => {
    const newAttendance: {[key: string]: string} = {};
    filteredAnggota.forEach(anggota => {
      newAttendance[anggota.id] = 'Hadir';
    });
    setAttendance(prev => ({
      ...prev,
      ...newAttendance
    }));
    toast.success("Semua anggota yang ditampilkan ditandai hadir");
  };

  const handleSave = async () => {
    if (!eskul) {
      toast.error("Pengaturan ekstrakurikuler belum dibuat");
      return;
    }

    try {
      setLoading(true);
      
      const attendanceRecords = anggotaEskul
        .filter(anggota => attendance[anggota.id])
        .map(anggota => {
          const existing = existingAttendance[anggota.id];
          return {
            id: existing?.id,
            anggota_id: anggota.id,
            ekstrakurikuler_id: eskul.id,
            tanggal: selectedDate,
            status_kehadiran: attendance[anggota.id],
            keterangan: existing?.keterangan || null,
          };
        });

      // Separate insert and update operations
      const toInsert = attendanceRecords.filter(record => !record.id);
      const toUpdate = attendanceRecords.filter(record => record.id);

      // Insert new records
      for (const record of toInsert) {
        const result = await eskulDB.insert("kehadiran_eskul", {
          anggota_id: record.anggota_id,
          ekstrakurikuler_id: record.ekstrakurikuler_id,
          tanggal: record.tanggal,
          status_kehadiran: record.status_kehadiran,
          keterangan: record.keterangan,
        });
        if (result.error) throw new Error(result.error);
      }

      // Update existing records
      for (const record of toUpdate) {
        const result = await eskulDB.update("kehadiran_eskul", record.id!, {
          status_kehadiran: record.status_kehadiran,
          keterangan: record.keterangan,
        });
        if (result.error) throw new Error(result.error);
      }

      toast.success("Data kehadiran berhasil disimpan");

      // Refresh data to show updated attendance
      await fetchAnggotaAndAttendance();
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Gagal menyimpan data kehadiran");
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStats = () => {
    const statuses = Object.entries(attendance)
      .filter(([anggotaId]) => filteredAnggota.some(a => a.id === anggotaId))
      .map(([, status]) => status);
    
    return {
      hadir: statuses.filter(s => s === 'Hadir').length,
      sakit: statuses.filter(s => s === 'Sakit').length,
      izin: statuses.filter(s => s === 'Izin').length,
      alpha: statuses.filter(s => s === 'Alpha').length,
      total: filteredAnggota.length,
    };
  };

  const stats = getAttendanceStats();

  // Get unique kelas names from anggota
  const kelasOptions = selectedTingkat && selectedTingkat !== "all"
    ? [...new Set(anggotaEskul
        .filter(a => a.tingkat === selectedTingkat)
        .map(a => a.nama_kelas))]
        .sort()
    : [...new Set(anggotaEskul.map(a => a.nama_kelas))].sort();

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
    return [...filteredAnggota].sort((a, b) => {
      let aVal: string;
      let bVal: string;

      if (sortColumn === 'status') {
        aVal = attendance[a.id] || '';
        bVal = attendance[b.id] || '';
      } else {
        aVal = String(a[sortColumn] || '').toLowerCase();
        bVal = String(b[sortColumn] || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredAnggota, sortColumn, sortDirection, attendance]);

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

  if (!eskul) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Kehadiran Ekstrakurikuler"
          description="Input kehadiran anggota ekstrakurikuler"
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
        title={`Kehadiran - ${eskul.nama_eskul}`}
        description={`Pembimbing: ${eskul.pembimbing} | Jadwal: ${eskul.hari_pertemuan}, ${eskul.jam_pertemuan}`}
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
              <Label htmlFor="tanggal">Tanggal Pertemuan</Label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tingkat">Filter Tingkat</Label>
              <Select value={selectedTingkat} onValueChange={(value) => {
                setSelectedTingkat(value);
                setSelectedKelas("all"); // Reset kelas saat tingkat berubah
              }}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Semua Tingkat" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">Semua Tingkat</SelectItem>
                  {tingkatOptions.map((tingkat) => (
                    <SelectItem key={tingkat} value={tingkat}>
                      {tingkat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kelas">Filter Kelas</Label>
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelasOptions.map((kelas) => (
                    <SelectItem key={kelas} value={kelas}>
                      {kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={handleMarkAllHadir}
                className="w-full" 
                variant="outline"
                disabled={filteredAnggota.length === 0}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Tandai Semua Hadir
              </Button>
              
              <Button 
                onClick={handleSave}
                className="w-full"
                disabled={loading || Object.keys(attendance).length === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                Simpan Kehadiran
              </Button>
            </div>

            {filteredAnggota.length > 0 && (
              <>
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Informasi Eskul</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Anggota:</span>
                      <span className="font-medium">{anggotaEskul.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ditampilkan:</span>
                      <span className="font-medium">{stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={eskul.status === 'aktif' ? 'default' : 'secondary'}>
                        {eskul.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Statistik Kehadiran</h3>
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
              </>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                Daftar Anggota
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  - {eskul.nama_eskul}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">Memuat data anggota...</p>
                </div>
              ) : filteredAnggota.length === 0 ? (
                <div className="text-center py-8">
                  <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {anggotaEskul.length === 0 
                      ? "Belum ada anggota aktif yang terdaftar"
                      : "Tidak ada anggota yang sesuai dengan filter"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort('nisn')}
                      >
                        <div className="flex items-center">
                          NISN {getSortIcon('nisn')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort('nama_siswa')}
                      >
                        <div className="flex items-center">
                          Nama Siswa {getSortIcon('nama_siswa')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort('tingkat')}
                      >
                        <div className="flex items-center">
                          Tingkat {getSortIcon('tingkat')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort('nama_kelas')}
                      >
                        <div className="flex items-center">
                          Kelas {getSortIcon('nama_kelas')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-center cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center justify-center">
                          Status {getSortIcon('status')}
                        </div>
                      </TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAnggota.map((anggota, index) => (
                      <TableRow key={anggota.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">{anggota.nisn}</TableCell>
                        <TableCell>{anggota.nama_siswa}</TableCell>
                        <TableCell>{anggota.tingkat}</TableCell>
                        <TableCell>{anggota.nama_kelas}</TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(attendance[anggota.id])}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              size="sm"
                              variant={attendance[anggota.id] === 'Hadir' ? 'default' : 'outline'}
                              onClick={() => handleAttendanceChange(anggota.id, 'Hadir')}
                              className="h-8 text-xs"
                            >
                              Hadir
                            </Button>
                            <Button
                              size="sm"
                              variant={attendance[anggota.id] === 'Sakit' ? 'default' : 'outline'}
                              onClick={() => handleAttendanceChange(anggota.id, 'Sakit')}
                              className="h-8 text-xs"
                            >
                              Sakit
                            </Button>
                            <Button
                              size="sm"
                              variant={attendance[anggota.id] === 'Izin' ? 'default' : 'outline'}
                              onClick={() => handleAttendanceChange(anggota.id, 'Izin')}
                              className="h-8 text-xs"
                            >
                              Izin
                            </Button>
                            <Button
                              size="sm"
                              variant={attendance[anggota.id] === 'Alpha' ? 'default' : 'outline'}
                              onClick={() => handleAttendanceChange(anggota.id, 'Alpha')}
                              className="h-8 text-xs bg-red-500 hover:bg-red-600 text-white border-red-600"
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
}
