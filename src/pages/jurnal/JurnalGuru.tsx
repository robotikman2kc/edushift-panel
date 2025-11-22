import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Pencil, Trash2, PartyPopper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isHariLiburKerja, generateHolidayTemplate } from "@/lib/hariLiburUtils";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { indexedDB } from "@/lib/indexedDB";
import { cn } from "@/lib/utils";

const jurnalSchema = z.object({
  tanggal: z.date({
    required_error: "Tanggal harus diisi",
  }),
  jenis_kegiatan_id: z.string().min(1, "Jenis kegiatan harus dipilih"),
  uraian_kegiatan: z.string().min(1, "Uraian kegiatan harus diisi"),
  volume: z.number().min(0, "Volume harus 0 atau lebih"),
  satuan_hasil: z.string().min(1, "Satuan hasil harus diisi"),
});

const jenisKegiatanSchema = z.object({
  nama_kegiatan: z.string().min(1, "Nama kegiatan harus diisi"),
  deskripsi: z.string().optional(),
});

type JurnalFormData = z.infer<typeof jurnalSchema>;
type JenisKegiatanFormData = z.infer<typeof jenisKegiatanSchema>;

interface JurnalEntry {
  id: string;
  tanggal: string;
  jenis_kegiatan: {
    nama_kegiatan: string;
  };
  uraian_kegiatan: string;
  volume: number;
  satuan_hasil: string;
}

interface JenisKegiatan {
  id: string;
  nama_kegiatan: string;
  deskripsi: string;
}

const JurnalGuru = () => {
  const [jurnal, setJurnal] = useState<JurnalEntry[]>([]);
  const [jenisKegiatan, setJenisKegiatan] = useState<JenisKegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJurnal, setSelectedJurnal] = useState<JurnalEntry | null>(null);
  const [showJurnalDialog, setShowJurnalDialog] = useState(false);
  const [showKegiatanDialog, setShowKegiatanDialog] = useState(false);
  const [filterJenisKegiatan, setFilterJenisKegiatan] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>(new Date().getMonth().toString());
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [currentHoliday, setCurrentHoliday] = useState<any>(null);
  const { toast } = useToast();

  const jurnalForm = useForm<JurnalFormData>({
    resolver: zodResolver(jurnalSchema),
    defaultValues: {
      tanggal: new Date(),
      volume: 0,
    },
  });

  const kegiatanForm = useForm<JenisKegiatanFormData>({
    resolver: zodResolver(jenisKegiatanSchema),
  });

  // Filter jurnal based on selected filters
  const filteredJurnal = jurnal.filter(item => {
    const itemDate = new Date(item.tanggal);
    const itemMonth = itemDate.getMonth();
    const itemYear = itemDate.getFullYear();
    
    // Filter by month and year
    const monthMatch = parseInt(filterMonth) === itemMonth;
    const yearMatch = parseInt(filterYear) === itemYear;
    
    // Filter by jenis kegiatan
    const jenisKegiatanMatch = filterJenisKegiatan === "all" || 
      jenisKegiatan.find(k => k.id === filterJenisKegiatan)?.nama_kegiatan === 
      item.jenis_kegiatan.nama_kegiatan;
    
    return monthMatch && yearMatch && jenisKegiatanMatch;
  });

  useEffect(() => {
    fetchData();
    loadAvailableYears();
    ensureLiburNasionalExists();
    autoFillHariLibur(); // Auto-create entries for holidays
  }, []);

  // Watch for tanggal changes and auto-fill if holiday (weekdays only)
  useEffect(() => {
    const subscription = jurnalForm.watch((value, { name }) => {
      if (name === "tanggal" && value.tanggal) {
        const holiday = isHariLiburKerja(value.tanggal); // Only weekday holidays
        setCurrentHoliday(holiday);
        
        if (holiday && !selectedJurnal) {
          // Only auto-fill for new entries on weekday holidays
          const template = generateHolidayTemplate(holiday);
          
          // Find "Libur Nasional" jenis kegiatan
          const liburNasionalKegiatan = jenisKegiatan.find(
            k => k.nama_kegiatan.toLowerCase() === "libur nasional"
          );
          
          if (liburNasionalKegiatan) {
            jurnalForm.setValue("jenis_kegiatan_id", liburNasionalKegiatan.id);
          }
          
          jurnalForm.setValue("uraian_kegiatan", template.uraian);
          jurnalForm.setValue("volume", template.volume);
          jurnalForm.setValue("satuan_hasil", template.satuan);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [jurnalForm, jenisKegiatan, selectedJurnal]);

  const ensureLiburNasionalExists = async () => {
    try {
      const kegiatanData = await indexedDB.select("jenis_kegiatan");
      const liburNasionalExists = kegiatanData.some(
        (k: any) => k.nama_kegiatan.toLowerCase() === "libur nasional"
      );
      
      if (!liburNasionalExists) {
        await indexedDB.insert("jenis_kegiatan", {
          nama_kegiatan: "Libur Nasional",
          deskripsi: "Hari libur nasional dan cuti bersama",
        });
        await fetchData(); // Refresh data to include the new jenis kegiatan
      }
    } catch (error) {
      console.error("Error ensuring Libur Nasional exists:", error);
    }
  };

  const autoFillHariLibur = async () => {
    try {
      // Wait for jenis kegiatan to load
      await ensureLiburNasionalExists();
      
      const kegiatanData = await indexedDB.select("jenis_kegiatan");
      const liburNasionalKegiatan = kegiatanData.find(
        (k: any) => k.nama_kegiatan.toLowerCase() === "libur nasional"
      );
      
      if (!liburNasionalKegiatan) return;
      
      // Get all existing jurnal entries
      const existingJurnal = await indexedDB.select("jurnal");
      const existingDates = new Set(existingJurnal.map((j: any) => j.tanggal));
      
      // Get current year and next year
      const currentYear = new Date().getFullYear();
      const years = [currentYear, currentYear + 1];
      
      let autoCreatedCount = 0;
      
      for (const year of years) {
        for (let month = 0; month < 12; month++) {
          const holidays = await import("@/lib/hariLiburUtils").then(m => 
            m.getHolidaysInMonth(month, year)
          );
          
          for (const holidayDate of holidays) {
            const { isHariLiburKerja, generateHolidayTemplate } = await import("@/lib/hariLiburUtils");
            const holiday = isHariLiburKerja(holidayDate);
            
            if (holiday) {
              const dateStr = format(holidayDate, "yyyy-MM-dd");
              
              // Only create if doesn't exist yet
              if (!existingDates.has(dateStr)) {
                const template = generateHolidayTemplate(holiday);
                
                await indexedDB.insert("jurnal", {
                  tanggal: dateStr,
                  jenis_kegiatan_id: liburNasionalKegiatan.id,
                  uraian_kegiatan: template.uraian,
                  volume: template.volume,
                  satuan_hasil: template.satuan,
                });
                
                autoCreatedCount++;
              }
            }
          }
        }
      }
      
      if (autoCreatedCount > 0) {
        toast({
          title: "Jurnal Otomatis Dibuat",
          description: `${autoCreatedCount} entri jurnal untuk hari libur nasional berhasil dibuat otomatis`,
        });
        await fetchData(); // Refresh to show new entries
      }
    } catch (error) {
      console.error("Error auto-filling hari libur:", error);
    }
  };

  const loadAvailableYears = async () => {
    try {
      // Get all unique years from jurnal entries
      const allJurnal = await indexedDB.select("jurnal");
      const years = [...new Set(allJurnal.map((j: any) => new Date(j.tanggal).getFullYear()))];
      
      // Add current year and next 3 years if not already included
      const currentYear = new Date().getFullYear();
      for (let i = 0; i <= 3; i++) {
        const year = currentYear + i;
        if (!years.includes(year)) {
          years.push(year);
        }
      }
      
      setAvailableYears(years.sort((a, b) => a - b));
    } catch (error) {
      console.error("Error loading available years:", error);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch jurnal entries
      const jurnalDataRaw = await indexedDB.select("jurnal");
      const jurnalData = await Promise.all(
        jurnalDataRaw.map(async jurnal => {
          const jenisKegiatan = await indexedDB.selectById("jenis_kegiatan", jurnal.jenis_kegiatan_id);
          return {
            ...jurnal,
            jenis_kegiatan: {
              nama_kegiatan: jenisKegiatan?.nama_kegiatan || ""
            }
          };
        })
      );
      const sortedJurnal = jurnalData.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

      // Fetch jenis kegiatan
      const kegiatanData = await indexedDB.select("jenis_kegiatan");
      const sortedKegiatan = kegiatanData.sort((a, b) => 
        a.nama_kegiatan.localeCompare(b.nama_kegiatan)
      );

      setJurnal(sortedJurnal);
      setJenisKegiatan(sortedKegiatan);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJurnalSubmit = async (data: JurnalFormData) => {
    try {
      const jurnalData = {
        tanggal: format(data.tanggal, "yyyy-MM-dd"),
        jenis_kegiatan_id: data.jenis_kegiatan_id,
        uraian_kegiatan: data.uraian_kegiatan,
        volume: data.volume,
        satuan_hasil: data.satuan_hasil,
      };

      if (selectedJurnal) {
        const result = await indexedDB.update("jurnal", selectedJurnal.id, jurnalData);
        if (result.error) throw new Error(result.error);
        
        toast({
          title: "Berhasil",
          description: "Jurnal berhasil diperbarui",
        });
      } else {
        const result = await indexedDB.insert("jurnal", jurnalData);
        if (result.error) throw new Error(result.error);
        
        toast({
          title: "Berhasil",
          description: "Jurnal berhasil ditambahkan",
        });
      }

      setShowJurnalDialog(false);
      setSelectedJurnal(null);
      jurnalForm.reset();
      fetchData();
    } catch (error) {
      console.error("Error saving jurnal:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan jurnal",
        variant: "destructive",
      });
    }
  };

  const handleKegiatanSubmit = async (data: JenisKegiatanFormData) => {
    try {
      const kegiatanData = {
        nama_kegiatan: data.nama_kegiatan,
        deskripsi: data.deskripsi || "",
      };
      
      const result = await indexedDB.insert("jenis_kegiatan", kegiatanData);
      if (result.error) throw new Error(result.error);

      toast({
        title: "Berhasil",
        description: "Jenis kegiatan berhasil ditambahkan",
      });

      setShowKegiatanDialog(false);
      kegiatanForm.reset();
      fetchData();
    } catch (error) {
      console.error("Error saving jenis kegiatan:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan jenis kegiatan",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (id: string) => {
    const jurnalEntry = jurnal.find(item => item.id === id);
    if (!jurnalEntry) return;
    setSelectedJurnal(jurnalEntry);
    jurnalForm.reset({
      tanggal: new Date(jurnalEntry.tanggal),
      jenis_kegiatan_id: jenisKegiatan.find(
        (k) => k.nama_kegiatan === jurnalEntry.jenis_kegiatan.nama_kegiatan
      )?.id || "",
      uraian_kegiatan: jurnalEntry.uraian_kegiatan,
      volume: jurnalEntry.volume,
      satuan_hasil: jurnalEntry.satuan_hasil,
    });
    setShowJurnalDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await indexedDB.delete("jurnal", id);
      if (result.error) throw new Error(result.error);

      toast({
        title: "Berhasil",
        description: "Jurnal berhasil dihapus",
      });
      fetchData();
    } catch (error) {
      console.error("Error deleting jurnal:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus jurnal",
        variant: "destructive",
      });
    }
  };

  const handleDeleteKegiatan = async (id: string) => {
    try {
      // Check if jenis kegiatan is being used in any jurnal
      const allJurnal = await indexedDB.select("jurnal");
      const jurnalUsingKegiatan = allJurnal.filter(
        (j: any) => j.jenis_kegiatan_id === id
      );

      if (jurnalUsingKegiatan.length > 0) {
        toast({
          title: "Tidak Bisa Dihapus",
          description: `Jenis kegiatan ini digunakan di ${jurnalUsingKegiatan.length} jurnal`,
          variant: "destructive",
        });
        return;
      }

      const result = await indexedDB.delete("jenis_kegiatan", id);
      if (result.error) throw new Error(result.error);

      toast({
        title: "Berhasil",
        description: "Jenis kegiatan berhasil dihapus",
      });
      fetchData();
    } catch (error) {
      console.error("Error deleting jenis kegiatan:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus jenis kegiatan",
        variant: "destructive",
      });
    }
  };

  const columns = [
    { key: "no", label: "No", sortable: false },
    { key: "tanggal", label: "Tanggal", sortable: true },
    { key: "uraian_kegiatan", label: "Uraian Kegiatan", sortable: true },
    { key: "volume", label: "Volume", sortable: true },
    { key: "satuan_hasil", label: "Satuan Hasil", sortable: false },
  ];

  const handleAddNew = () => {
    setSelectedJurnal(null);
    setCurrentHoliday(null);
    jurnalForm.reset({
      tanggal: new Date(),
      volume: 0,
    });
    setShowJurnalDialog(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Jurnal Guru" 
        description="Kelola jurnal kegiatan mengajar"
      >
        <div className="flex gap-2 flex-wrap">
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Bulan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Januari</SelectItem>
              <SelectItem value="1">Februari</SelectItem>
              <SelectItem value="2">Maret</SelectItem>
              <SelectItem value="3">April</SelectItem>
              <SelectItem value="4">Mei</SelectItem>
              <SelectItem value="5">Juni</SelectItem>
              <SelectItem value="6">Juli</SelectItem>
              <SelectItem value="7">Agustus</SelectItem>
              <SelectItem value="8">September</SelectItem>
              <SelectItem value="9">Oktober</SelectItem>
              <SelectItem value="10">November</SelectItem>
              <SelectItem value="11">Desember</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Tahun" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterJenisKegiatan} onValueChange={setFilterJenisKegiatan}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter Jenis Kegiatan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kegiatan</SelectItem>
              {jenisKegiatan.map((kegiatan) => (
                <SelectItem key={kegiatan.id} value={kegiatan.id}>
                  {kegiatan.nama_kegiatan}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showKegiatanDialog} onOpenChange={setShowKegiatanDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Jenis Kegiatan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Jenis Kegiatan</DialogTitle>
                <DialogDescription>
                  Tambahkan jenis kegiatan baru untuk jurnal
                </DialogDescription>
              </DialogHeader>
              <Form {...kegiatanForm}>
                <form onSubmit={kegiatanForm.handleSubmit(handleKegiatanSubmit)} className="space-y-4">
                  <FormField
                    control={kegiatanForm.control}
                    name="nama_kegiatan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Kegiatan</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan nama kegiatan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={kegiatanForm.control}
                    name="deskripsi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deskripsi</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Masukkan deskripsi kegiatan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowKegiatanDialog(false)}>
                      Batal
                    </Button>
                    <Button type="submit">Simpan</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Jurnal
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="jurnal" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="jurnal">Daftar Jurnal</TabsTrigger>
          <TabsTrigger value="jenis-kegiatan">Daftar Jenis Kegiatan</TabsTrigger>
        </TabsList>

        <TabsContent value="jurnal">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                data={filteredJurnal.map((item, index) => ({
                  ...item,
                  no: index + 1,
                  tanggal: new Date(item.tanggal).toLocaleDateString('id-ID'),
                  jenis_kegiatan: item.jenis_kegiatan.nama_kegiatan,
                }))}
                columns={columns}
                loading={loading}
                onEdit={(id) => handleEdit(id)}
                onDelete={handleDelete}
                searchPlaceholder="Cari jurnal..."
                title="Jurnal Guru"
                additionalPDFInfo={{
                  bulan: `${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][parseInt(filterMonth)]} ${filterYear}`
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jenis-kegiatan">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                data={jenisKegiatan}
                columns={[
                  { key: "nama_kegiatan", label: "Nama Kegiatan", sortable: true },
                  { key: "deskripsi", label: "Deskripsi", sortable: false },
                ]}
                loading={loading}
                onDelete={handleDeleteKegiatan}
                searchPlaceholder="Cari jenis kegiatan..."
                title="Jenis Kegiatan"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showJurnalDialog} onOpenChange={setShowJurnalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedJurnal ? "Edit Jurnal" : "Tambah Jurnal"}
            </DialogTitle>
            <DialogDescription>
              Isi form untuk {selectedJurnal ? "mengedit" : "menambahkan"} jurnal kegiatan
            </DialogDescription>
          </DialogHeader>
          <Form {...jurnalForm}>
            <form onSubmit={jurnalForm.handleSubmit(handleJurnalSubmit)} className="space-y-4">
              <FormField
                control={jurnalForm.control}
                name="tanggal"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    {currentHoliday && (
                      <Badge variant="secondary" className="mt-2 w-fit">
                        <PartyPopper className="h-3 w-3 mr-1" />
                        Hari Libur: {currentHoliday.nama}
                      </Badge>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={jurnalForm.control}
                name="jenis_kegiatan_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kegiatan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis kegiatan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jenisKegiatan.map((kegiatan) => (
                          <SelectItem key={kegiatan.id} value={kegiatan.id}>
                            {kegiatan.nama_kegiatan}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={jurnalForm.control}
                name="uraian_kegiatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uraian Kegiatan</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Masukkan uraian kegiatan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={jurnalForm.control}
                name="volume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volume</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Masukkan volume"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={jurnalForm.control}
                name="satuan_hasil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Satuan Hasil</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan satuan hasil" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowJurnalDialog(false);
                    setSelectedJurnal(null);
                    jurnalForm.reset();
                  }}
                >
                  Batal
                </Button>
                <Button type="submit">
                  {selectedJurnal ? "Perbarui" : "Simpan"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JurnalGuru;