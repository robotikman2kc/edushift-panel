import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Pencil, Trash2, PartyPopper, Zap, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { isHariLiburKerja, generateHolidayTemplate, isHariLibur } from "@/lib/hariLiburUtils";
import { JurnalDetailStatusWidget } from "@/components/jurnal/JurnalDetailStatusWidget";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  use_highlight: z.boolean().optional(),
});

type JurnalFormData = z.infer<typeof jurnalSchema>;
type JenisKegiatanFormData = z.infer<typeof jenisKegiatanSchema>;

interface JurnalEntry {
  id: string;
  tanggal: string;
  jenis_kegiatan: {
    nama_kegiatan: string;
    use_highlight?: boolean;
  };
  uraian_kegiatan: string;
  volume: number;
  satuan_hasil: string;
}

interface JenisKegiatan {
  id: string;
  nama_kegiatan: string;
  deskripsi: string;
  use_highlight?: boolean;
}

interface CustomTemplate {
  id: string;
  nama: string;
  jenis_kegiatan_id: string;
  uraian: string;
  volume: number;
  satuan: string;
}


const formatDateIndonesia = (date: Date | string): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  return `${day} ${month} ${year}`;
};

const JurnalGuru = () => {
  const [jurnal, setJurnal] = useState<JurnalEntry[]>([]);
  const [jenisKegiatan, setJenisKegiatan] = useState<JenisKegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJurnal, setSelectedJurnal] = useState<JurnalEntry | null>(null);
  const [showJurnalDialog, setShowJurnalDialog] = useState(false);
  const [showKegiatanDialog, setShowKegiatanDialog] = useState(false);
  const [showRapatDialog, setShowRapatDialog] = useState(false);
  const [filterJenisKegiatan, setFilterJenisKegiatan] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>(new Date().getMonth().toString());
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [currentHoliday, setCurrentHoliday] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [mataPelajaran, setMataPelajaran] = useState<any[]>([]);
  const [kelas, setKelas] = useState<any[]>([]);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showTemplateConfirmDialog, setShowTemplateConfirmDialog] = useState(false);
  const [selectedTemplateToApply, setSelectedTemplateToApply] = useState<CustomTemplate | null>(null);
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
    ensureDefaultKegiatanExists();
    autoFillHariLibur(); // Auto-create entries for holidays
    loadCustomTemplates();
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

  const ensureDefaultKegiatanExists = async () => {
    try {
      const kegiatanData = await indexedDB.select("jenis_kegiatan");
      
      // Remove duplicates by keeping only the first occurrence of each unique name (case-insensitive)
      const seen = new Map<string, any>();
      const duplicateIds: string[] = [];
      
      kegiatanData.forEach((k: any) => {
        const normalizedName = k.nama_kegiatan.toLowerCase().trim();
        if (seen.has(normalizedName)) {
          // This is a duplicate, mark for deletion
          duplicateIds.push(k.id);
        } else {
          seen.set(normalizedName, k);
        }
      });
      
      // Delete duplicates
      if (duplicateIds.length > 0) {
        console.log(`Removing ${duplicateIds.length} duplicate jenis kegiatan`);
        for (const id of duplicateIds) {
          await indexedDB.delete("jenis_kegiatan", id);
        }
      }
      
      // Re-fetch after cleanup
      const cleanedData = await indexedDB.select("jenis_kegiatan");
      
      // Migrate existing data to add use_highlight field
      let needsUpdate = false;
      for (const kegiatan of cleanedData) {
        if (kegiatan.use_highlight === undefined) {
          const normalizedName = kegiatan.nama_kegiatan.toLowerCase().trim();
          // Auto-enable highlight for Libur Nasional and Cuti
          const shouldHighlight = normalizedName === "libur nasional" || normalizedName === "cuti";
          await indexedDB.update("jenis_kegiatan", kegiatan.id, {
            ...kegiatan,
            use_highlight: shouldHighlight,
          });
          needsUpdate = true;
        }
      }
      
      // Check for Libur Nasional
      const liburNasionalExists = cleanedData.some(
        (k: any) => k.nama_kegiatan.toLowerCase().trim() === "libur nasional"
      );
      
      if (!liburNasionalExists) {
        await indexedDB.insert("jenis_kegiatan", {
          nama_kegiatan: "Libur Nasional",
          deskripsi: "Hari libur nasional dan cuti bersama",
          use_highlight: true,
        });
      }
      
      // Check for Cuti
      const cutiExists = cleanedData.some(
        (k: any) => k.nama_kegiatan.toLowerCase().trim() === "cuti"
      );
      
      if (!cutiExists) {
        await indexedDB.insert("jenis_kegiatan", {
          nama_kegiatan: "Cuti",
          deskripsi: "Cuti pegawai/guru",
          use_highlight: true,
        });
      }
      
      // Refresh if we made any changes
      if (duplicateIds.length > 0 || needsUpdate || !liburNasionalExists || !cutiExists) {
        await fetchData();
      }
    } catch (error) {
      console.error("Error ensuring default kegiatan exists:", error);
    }
  };

  const autoFillHariLibur = async () => {
    try {
      // Wait for jenis kegiatan to load
      await ensureDefaultKegiatanExists();
      
      const kegiatanData = await indexedDB.select("jenis_kegiatan");
      const liburNasionalKegiatan = kegiatanData.find(
        (k: any) => k.nama_kegiatan.toLowerCase() === "libur nasional"
      );
      
      if (!liburNasionalKegiatan) return;
      
      // Get all existing jurnal entries
      const existingJurnal = await indexedDB.select("jurnal");
      const existingDates = new Set(existingJurnal.map((j: any) => j.tanggal));
      
      // Get current date (without time)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Only check current year and previous year
      const currentYear = new Date().getFullYear();
      const years = [currentYear - 1, currentYear];
      
      let autoCreatedCount = 0;
      
      for (const year of years) {
        for (let month = 0; month < 12; month++) {
          const holidays = await import("@/lib/hariLiburUtils").then(m => 
            m.getHolidaysInMonth(month, year)
          );
          
          for (const holidayDate of holidays) {
            // Only process holidays that are today or in the past
            if (holidayDate > today) continue;
            
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

  const loadCustomTemplates = () => {
    const saved = localStorage.getItem("custom_jurnal_templates");
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading custom templates:", error);
      }
    }
  };

  const saveCustomTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "Error",
        description: "Nama template harus diisi",
        variant: "destructive",
      });
      return;
    }

    const formData = jurnalForm.getValues();
    if (!formData.jenis_kegiatan_id || !formData.uraian_kegiatan) {
      toast({
        title: "Error",
        description: "Lengkapi data jurnal terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const newTemplate: CustomTemplate = {
      id: Date.now().toString(),
      nama: templateName,
      jenis_kegiatan_id: formData.jenis_kegiatan_id,
      uraian: formData.uraian_kegiatan,
      volume: formData.volume,
      satuan: formData.satuan_hasil,
    };

    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    localStorage.setItem("custom_jurnal_templates", JSON.stringify(updated));
    
    toast({
      title: "Berhasil",
      description: "Template berhasil disimpan",
    });
    
    setShowTemplateDialog(false);
    setTemplateName("");
  };

  const deleteCustomTemplate = (id: string) => {
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    localStorage.setItem("custom_jurnal_templates", JSON.stringify(updated));
    
    toast({
      title: "Berhasil",
      description: "Template berhasil dihapus",
    });
  };

  const openTemplateConfirmDialog = (template: CustomTemplate) => {
    setSelectedTemplateToApply(template);
    setShowTemplateConfirmDialog(true);
  };

  const applyCustomTemplate = async () => {
    if (!selectedTemplateToApply) return;
    
    try {
      const jurnalData = {
        tanggal: format(new Date(), "yyyy-MM-dd"),
        jenis_kegiatan_id: selectedTemplateToApply.jenis_kegiatan_id,
        uraian_kegiatan: selectedTemplateToApply.uraian,
        volume: selectedTemplateToApply.volume,
        satuan_hasil: selectedTemplateToApply.satuan,
      };

      const result = await indexedDB.insert("jurnal", jurnalData);
      if (result.error) throw new Error(result.error);
      
      toast({
        title: "Berhasil",
        description: "Jurnal berhasil ditambahkan dari template",
      });

      fetchData();
      setShowTemplateConfirmDialog(false);
      setSelectedTemplateToApply(null);
    } catch (error) {
      console.error("Error applying template:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan jurnal",
        variant: "destructive",
      });
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
              nama_kegiatan: jenisKegiatan?.nama_kegiatan || "",
              use_highlight: jenisKegiatan?.use_highlight || false,
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

      // Fetch mata pelajaran dan kelas untuk template
      const mapelData = await indexedDB.select("mata_pelajaran");
      const kelasData = await indexedDB.select("kelas");

      setJurnal(sortedJurnal);
      setJenisKegiatan(sortedKegiatan);
      setMataPelajaran(mapelData);
      setKelas(kelasData);
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
    setSelectedTemplate("");
    jurnalForm.reset({
      tanggal: new Date(),
      volume: 0,
    });
    setShowJurnalDialog(true);
  };

  const applyTemplate = (template: string, subType?: string, customText?: string) => {
    setSelectedTemplate(template);
    
    // Find or create jenis kegiatan based on template
    let jenisKegiatanId = "";
    let uraian = "";
    let volume = 1;
    let satuan = "kegiatan";

    if (template === "rapat") {
      const rapatKegiatan = jenisKegiatan.find(k => k.nama_kegiatan.toLowerCase().includes("rapat"));
      jenisKegiatanId = rapatKegiatan?.id || jenisKegiatan[0]?.id || "";
      
      if (subType === "pembinaan" && customText) {
        uraian = `Pembinaan Oleh ${customText}`;
      } else if (subType === "biasa" && customText) {
        uraian = `Rapat ${customText}`;
      } else {
        uraian = "Rapat";
      }
      satuan = "kali";
    } else if (template === "upacara") {
      const upacaraKegiatan = jenisKegiatan.find(k => k.nama_kegiatan.toLowerCase().includes("upacara"));
      jenisKegiatanId = upacaraKegiatan?.id || jenisKegiatan[0]?.id || "";
      
      if (subType === "senin") {
        uraian = "Upacara Bendera Hari Senin";
      } else if (subType) {
        uraian = `Upacara Peringatan ${subType}`;
      } else {
        uraian = "Upacara";
      }
      satuan = "kali";
    }

    jurnalForm.setValue("jenis_kegiatan_id", jenisKegiatanId);
    jurnalForm.setValue("uraian_kegiatan", uraian);
    jurnalForm.setValue("volume", volume);
    jurnalForm.setValue("satuan_hasil", satuan);
  };

  const saveKoreksiJurnal = async (mapelId: string, kelasId: string) => {
    try {
      const administrasiKegiatan = jenisKegiatan.find(k => 
        k.nama_kegiatan.toLowerCase().includes("administrasi")
      );
      
      if (!administrasiKegiatan) {
        toast({
          title: "Error",
          description: "Jenis kegiatan 'Administrasi' tidak ditemukan",
          variant: "destructive",
        });
        return;
      }
      
      const mapel = mataPelajaran.find(m => m.id === mapelId);
      const kelasData = kelas.find(k => k.id === kelasId);
      
      if (!mapel || !kelasData) {
        toast({
          title: "Error",
          description: "Mata pelajaran atau kelas tidak valid",
          variant: "destructive",
        });
        return;
      }

      const jurnalData = {
        tanggal: format(new Date(), "yyyy-MM-dd"),
        jenis_kegiatan_id: administrasiKegiatan.id,
        uraian_kegiatan: `Mengkoreksi Tugas/Soal ${mapel.nama_mata_pelajaran} - Kelas ${kelasData.nama_kelas}`,
        volume: 1,
        satuan_hasil: "Paket",
      };

      const result = await indexedDB.insert("jurnal", jurnalData);
      if (result.error) throw new Error(result.error);
      
      toast({
        title: "Berhasil",
        description: "Jurnal koreksi berhasil ditambahkan",
      });

      fetchData();
    } catch (error) {
      console.error("Error saving koreksi jurnal:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan jurnal",
        variant: "destructive",
      });
    }
  };

  const saveQuickJurnal = async (template: string, subType?: string, customText?: string) => {
    try {
      let jenisKegiatanId = "";
      let uraian = "";
      let volume = 1;
      let satuan = "kegiatan";

      if (template === "upacara" && subType === "senin") {
        const upacaraKegiatan = jenisKegiatan.find(k => k.nama_kegiatan.toLowerCase().includes("upacara"));
        jenisKegiatanId = upacaraKegiatan?.id || jenisKegiatan[0]?.id || "";
        uraian = "Upacara Bendera Hari Senin";
        satuan = "kali";
      } else if (template === "rapat") {
        const rapatKegiatan = jenisKegiatan.find(k => k.nama_kegiatan.toLowerCase().includes("rapat"));
        jenisKegiatanId = rapatKegiatan?.id || jenisKegiatan[0]?.id || "";
        
        if (subType === "pembinaan" && customText) {
          uraian = `Pembinaan Oleh ${customText}`;
        } else if (subType === "biasa" && customText) {
          uraian = `Rapat ${customText}`;
        } else {
          uraian = "Rapat";
        }
        satuan = "kali";
      }

      const jurnalData = {
        tanggal: format(new Date(), "yyyy-MM-dd"),
        jenis_kegiatan_id: jenisKegiatanId,
        uraian_kegiatan: uraian,
        volume: volume,
        satuan_hasil: satuan,
      };

      const result = await indexedDB.insert("jurnal", jurnalData);
      if (result.error) throw new Error(result.error);
      
      toast({
        title: "Berhasil",
        description: "Jurnal berhasil ditambahkan",
      });

      fetchData();
    } catch (error) {
      console.error("Error saving quick jurnal:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan jurnal",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Jurnal Widget */}
      <JurnalDetailStatusWidget />
      
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
                  <FormField
                    control={kegiatanForm.control}
                    name="use_highlight"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Beri warna pada jurnal dengan jenis kegiatan ini
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Baris jurnal akan ditampilkan dengan latar kuning di tabel dan PDF
                          </p>
                        </div>
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

      {/* Template Kegiatan Cepat */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Template Kegiatan Cepat
          </CardTitle>
          <CardDescription className="text-xs">
            Template permanen tidak bisa dihapus. Anda dapat menyimpan template kustom Anda sendiri.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Template Permanen</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Dialog open={showRapatDialog} onOpenChange={setShowRapatDialog}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  Rapat
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Rapat</DialogTitle>
                  <DialogDescription>
                    Pilih jenis rapat
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pembinaan</label>
                    <div className="flex gap-2">
                      <Input
                        id="rapat-pembinaan"
                        placeholder="Pembinaan oleh siapa? (contoh: Kepala Sekolah)"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const value = (e.target as HTMLInputElement).value.trim();
                            if (value) {
                              setShowRapatDialog(false);
                              saveQuickJurnal("rapat", "pembinaan", value);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById("rapat-pembinaan") as HTMLInputElement;
                          const value = input?.value.trim();
                          if (value) {
                            setShowRapatDialog(false);
                            saveQuickJurnal("rapat", "pembinaan", value);
                            input.value = "";
                          }
                        }}
                      >
                        Tambah
                      </Button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Atau
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rapat Biasa</label>
                    <div className="flex gap-2">
                      <Input
                        id="rapat-biasa"
                        placeholder="Rapat apa? (contoh: Rapat Kenaikan Kelas)"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const value = (e.target as HTMLInputElement).value.trim();
                            if (value) {
                              setShowRapatDialog(false);
                              saveQuickJurnal("rapat", "biasa", value);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById("rapat-biasa") as HTMLInputElement;
                          const value = input?.value.trim();
                          if (value) {
                            setShowRapatDialog(false);
                            saveQuickJurnal("rapat", "biasa", value);
                            input.value = "";
                          }
                        }}
                      >
                        Tambah
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  Upacara
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upacara</DialogTitle>
                  <DialogDescription>
                    Pilih jenis upacara atau masukkan peringatan khusus
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={async () => {
                      await saveQuickJurnal("upacara", "senin");
                    }}
                  >
                    Upacara Hari Senin
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Atau
                      </span>
                    </div>
                  </div>
                  <Input
                    id="upacara-peringatan"
                    placeholder="Peringatan khusus (contoh: Hari Kemerdekaan)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const value = (e.target as HTMLInputElement).value;
                        if (value) {
                          handleAddNew();
                          setTimeout(() => applyTemplate("upacara", value), 100);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      const input = document.getElementById("upacara-peringatan") as HTMLInputElement;
                      if (input?.value) {
                        handleAddNew();
                        setTimeout(() => applyTemplate("upacara", input.value), 100);
                        input.value = "";
                      }
                    }}
                  >
                    Buat dengan Peringatan
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  Koreksi Tugas/Soal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Mengkoreksi Tugas/Soal</DialogTitle>
                  <DialogDescription>
                    Pilih mata pelajaran dan kelas (Volume: 1 Paket)
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mata Pelajaran</label>
                    <Select onValueChange={(value) => {
                      const mapelSelect = document.getElementById("template-mapel") as any;
                      if (mapelSelect) mapelSelect.dataset.mapelId = value;
                    }}>
                      <SelectTrigger id="template-mapel">
                        <SelectValue placeholder="Pilih Mata Pelajaran" />
                      </SelectTrigger>
                      <SelectContent>
                        {mataPelajaran.map((mapel) => (
                          <SelectItem key={mapel.id} value={mapel.id}>
                            {mapel.nama_mata_pelajaran}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kelas</label>
                    <Select onValueChange={(value) => {
                      const kelasSelect = document.getElementById("template-kelas") as any;
                      if (kelasSelect) kelasSelect.dataset.kelasId = value;
                    }}>
                      <SelectTrigger id="template-kelas">
                        <SelectValue placeholder="Pilih Kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {kelas.map((k) => (
                          <SelectItem key={k.id} value={k.id}>
                            {k.nama_kelas}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => {
                      const mapelSelect = document.getElementById("template-mapel") as any;
                      const kelasSelect = document.getElementById("template-kelas") as any;
                      const mapelId = mapelSelect?.dataset.mapelId;
                      const kelasId = kelasSelect?.dataset.kelasId;
                      
                      if (mapelId && kelasId) {
                        saveKoreksiJurnal(mapelId, kelasId);
                      } else {
                        toast({
                          title: "Error",
                          description: "Pilih mata pelajaran dan kelas terlebih dahulu",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Simpan Jurnal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  Kegiatan Sekolah
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Kegiatan Sekolah</DialogTitle>
                  <DialogDescription>
                    Masukkan nama kegiatan sekolah (Volume otomatis: 1 Kali)
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Input
                      id="kegiatan-sekolah-input"
                      placeholder="Nama kegiatan (contoh: Lomba 17 Agustus)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value) {
                            const kegiatanSekolahKegiatan = jenisKegiatan.find(k => 
                              k.nama_kegiatan.toLowerCase().includes("kegiatan sekolah")
                            );
                            const jurnalData = {
                              tanggal: format(new Date(), "yyyy-MM-dd"),
                              jenis_kegiatan_id: kegiatanSekolahKegiatan?.id || jenisKegiatan[0]?.id || "",
                              uraian_kegiatan: value,
                              volume: 1,
                              satuan_hasil: "kali",
                            };
                            indexedDB.insert("jurnal", jurnalData).then(() => {
                              toast({
                                title: "Berhasil",
                                description: "Jurnal kegiatan sekolah berhasil ditambahkan",
                              });
                              fetchData();
                              (e.target as HTMLInputElement).value = "";
                            }).catch((error) => {
                              console.error("Error:", error);
                              toast({
                                title: "Error",
                                description: "Gagal menyimpan jurnal",
                                variant: "destructive",
                              });
                            });
                          }
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        const input = document.getElementById("kegiatan-sekolah-input") as HTMLInputElement;
                        const value = input?.value.trim();
                        if (value) {
                          const kegiatanSekolahKegiatan = jenisKegiatan.find(k => 
                            k.nama_kegiatan.toLowerCase().includes("kegiatan sekolah")
                          );
                          const jurnalData = {
                            tanggal: format(new Date(), "yyyy-MM-dd"),
                            jenis_kegiatan_id: kegiatanSekolahKegiatan?.id || jenisKegiatan[0]?.id || "",
                            uraian_kegiatan: value,
                            volume: 1,
                            satuan_hasil: "kali",
                          };
                          indexedDB.insert("jurnal", jurnalData).then(() => {
                            toast({
                              title: "Berhasil",
                              description: "Jurnal kegiatan sekolah berhasil ditambahkan",
                            });
                            fetchData();
                            input.value = "";
                          }).catch((error) => {
                            console.error("Error:", error);
                            toast({
                              title: "Error",
                              description: "Gagal menyimpan jurnal",
                              variant: "destructive",
                            });
                          });
                        }
                      }}
                    >
                      Tambah
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
              </div>
            </div>

            {customTemplates.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Template Kustom</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {customTemplates.map((template) => (
                    <div key={template.id} className="relative group">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => openTemplateConfirmDialog(template)}
                      >
                        {template.nama}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteCustomTemplate(template.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                  tanggal: formatDateIndonesia(item.tanggal),
                  jenis_kegiatan: item.jenis_kegiatan.nama_kegiatan,
                  _originalDate: item.tanggal, // Keep original date for holiday check
                  _useHighlight: item.jenis_kegiatan.use_highlight, // Keep highlight flag
                }))}
                columns={columns}
                loading={loading}
                onEdit={(id) => handleEdit(id)}
                onDelete={handleDelete}
                searchPlaceholder="Cari jurnal..."
                title="Jurnal Guru"
                formFields={[]}
                additionalPDFInfo={{
                  bulan: `${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][parseInt(filterMonth)]} ${filterYear}`
                }}
                getRowClassName={(item) => {
                  // Check if this jenis kegiatan should be highlighted
                  if (item._useHighlight) {
                    return 'bg-amber-500/10 hover:bg-amber-500/20';
                  }
                  
                  // Also check if it's a national holiday by date (backwards compatibility)
                  if (item._originalDate) {
                    const date = new Date(item._originalDate);
                    const holiday = isHariLibur(date);
                    if (holiday) {
                      return 'bg-amber-500/10 hover:bg-amber-500/20';
                    }
                  }
                  
                  return '';
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jenis-kegiatan">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                data={jenisKegiatan.map((item) => ({
                  ...item,
                  use_highlight_display: item.use_highlight ? (
                    <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        Warna Aktif
                      </span>
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      Tidak Berwarna
                    </Badge>
                  )
                }))}
                columns={[
                  { key: "nama_kegiatan", label: "Nama Kegiatan", sortable: true },
                  { key: "deskripsi", label: "Deskripsi", sortable: false },
                  { key: "use_highlight_display", label: "Highlight", sortable: true },
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <div className="flex justify-between gap-2">
                <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Simpan sebagai Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Simpan Template</DialogTitle>
                      <DialogDescription>
                        Template yang disimpan dapat digunakan kembali dengan cepat
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Nama Template</label>
                        <Input
                          placeholder="Contoh: Rapat Koordinasi"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveCustomTemplate();
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowTemplateDialog(false);
                            setTemplateName("");
                          }}
                        >
                          Batal
                        </Button>
                        <Button type="button" onClick={saveCustomTemplate}>
                          Simpan Template
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex gap-2">
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
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Template Confirmation Dialog */}
      <AlertDialog open={showTemplateConfirmDialog} onOpenChange={setShowTemplateConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Template</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menambahkan jurnal dengan template "{selectedTemplateToApply?.nama}".
              <div className="mt-4 space-y-2 p-4 bg-muted rounded-md text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Uraian:</span>
                  <span className="text-foreground">{selectedTemplateToApply?.uraian}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Volume:</span>
                  <span className="text-foreground">{selectedTemplateToApply?.volume} {selectedTemplateToApply?.satuan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Tanggal:</span>
                  <span className="text-foreground">{format(new Date(), "dd/MM/yyyy")}</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={applyCustomTemplate}>
              Tambahkan ke Jurnal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JurnalGuru;