import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Pencil, Trash2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
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
  const [filterJenisKegiatan, setFilterJenisKegiatan] = useState<string>("");
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

  // Filter jurnal based on selected jenis kegiatan
  const filteredJurnal = filterJenisKegiatan 
    ? jurnal.filter(item => 
        jenisKegiatan.find(k => k.id === filterJenisKegiatan)?.nama_kegiatan === 
        item.jenis_kegiatan.nama_kegiatan
      )
    : jurnal;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch jurnal entries
      const { data: jurnalData, error: jurnalError } = await supabase
        .from("jurnal")
        .select(`
          id,
          tanggal,
          uraian_kegiatan,
          volume,
          satuan_hasil,
          jenis_kegiatan:jenis_kegiatan_id (
            nama_kegiatan
          )
        `)
        .order("tanggal", { ascending: false });

      if (jurnalError) throw jurnalError;

      // Fetch jenis kegiatan
      const { data: kegiatanData, error: kegiatanError } = await supabase
        .from("jenis_kegiatan")
        .select("*")
        .order("nama_kegiatan");

      if (kegiatanError) throw kegiatanError;

      setJurnal(jurnalData || []);
      setJenisKegiatan(kegiatanData || []);
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
        const { error } = await supabase
          .from("jurnal")
          .update(jurnalData)
          .eq("id", selectedJurnal.id);

        if (error) throw error;
        toast({
          title: "Berhasil",
          description: "Jurnal berhasil diperbarui",
        });
      } else {
        const { error } = await supabase
          .from("jurnal")
          .insert([jurnalData]);

        if (error) throw error;
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
      
      const { error } = await supabase
        .from("jenis_kegiatan")
        .insert([kegiatanData]);

      if (error) throw error;

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
      const { error } = await supabase
        .from("jurnal")
        .delete()
        .eq("id", id);

      if (error) throw error;

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

  const columns = [
    { key: "tanggal", label: "Tanggal", sortable: true },
    { key: "uraian_kegiatan", label: "Uraian Kegiatan", sortable: true },
    { key: "volume", label: "Volume", sortable: true },
    { key: "satuan_hasil", label: "Satuan Hasil", sortable: false },
  ];

  const handleAddNew = () => {
    setSelectedJurnal(null);
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
        <div className="flex gap-2">
          <Select value={filterJenisKegiatan} onValueChange={setFilterJenisKegiatan}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter Jenis Kegiatan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Kegiatan</SelectItem>
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

      <Card>
        <CardHeader>
          <CardTitle>Daftar Jurnal</CardTitle>
          <CardDescription>
            Lihat dan kelola jurnal kegiatan mengajar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredJurnal.map((item, index) => ({
              ...item,
              no: index + 1
            }))}
            columns={[
              { key: "no", label: "No.", sortable: false },
              ...columns
            ]}
            loading={loading}
            onEdit={(id) => handleEdit(id)}
            onDelete={handleDelete}
            searchPlaceholder="Cari jurnal..."
          />
        </CardContent>
      </Card>

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