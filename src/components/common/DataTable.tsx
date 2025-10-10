import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  MoreHorizontal,
  Edit,
  Trash2,
  FileSpreadsheet,
  FileText,
  FileDown
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { exportToPDF, exportToExcel, getCustomPDFTemplate } from "@/lib/exportUtils";
import * as XLSX from 'xlsx';
import { PDFTemplateSelector } from "@/components/common/PDFTemplateSelector";
import { defaultTemplate, PDFTemplate } from "@/lib/pdfTemplates";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface FormField {
  key: string;
  label: string;
  type: "text" | "email" | "number" | "tel" | "select" | "date";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string; }[];
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  onAdd?: (formData: Record<string, string>) => void | Promise<void>;
  onEdit?: (id: string, formData: Record<string, string>) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onImport?: (data: Record<string, string>[]) => void | Promise<void>;
  loading?: boolean;
  formFields?: FormField[];
  searchPlaceholder?: string;
  title?: string;
}

export function DataTable({
  data,
  columns,
  onAdd,
  onEdit,
  onDelete,
  onImport,
  loading = false,
  formFields = [],
  searchPlaceholder = "Cari data...",
  title,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const openAddDialog = () => {
    setFormData({});
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (item: any) => {
    setSelectedItem(item);
    const initialData: Record<string, string> = {};
    formFields.forEach((field) => {
      initialData[field.key] = item[field.key] || "";
    });
    setFormData(initialData);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item: any) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleAddSubmit = async () => {
    if (onAdd) {
      await onAdd(formData);
      setIsAddDialogOpen(false);
      setFormData({});
    }
  };

  const handleEditSubmit = async () => {
    if (onEdit && selectedItem) {
      await onEdit(selectedItem.id, formData);
      setIsEditDialogOpen(false);
      setFormData({});
      setSelectedItem(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (onDelete && selectedItem) {
      await onDelete(selectedItem.id);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    }
  };

  const handleExportPDF = () => {
    try {
      const exportColumns = columns.map(col => ({ key: col.key, label: col.label }));
      
      // Use custom template for jurnal data
      let template = defaultTemplate;
      if (title?.toLowerCase().includes('jurnal')) {
        template = getCustomPDFTemplate('journal');
      }
      
      const success = exportToPDF(
        sortedData,
        exportColumns,
        title || 'Data Export',
        `${title || 'data'}_${new Date().toISOString().split('T')[0]}.pdf`,
        template
      );
      
      if (success) {
        toast({
          title: "Export Berhasil",
          description: "Data berhasil diekspor ke PDF",
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({
        title: "Export Gagal",
        description: "Terjadi kesalahan saat mengekspor data ke PDF",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = () => {
    try {
      const exportColumns = columns.map(col => ({ key: col.key, label: col.label }));
      const success = exportToExcel(
        sortedData,
        exportColumns,
        title || 'Data Export',
        `${title || 'data'}_${new Date().toISOString().split('T')[0]}.xlsx`
      );
      
      if (success) {
        toast({
          title: "Export Berhasil",
          description: "Data berhasil diekspor ke Excel",
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({
        title: "Export Gagal",
        description: "Terjadi kesalahan saat mengekspor data ke Excel",
        variant: "destructive",
      });
    }
  };

  const handleDownloadTemplate = () => {
    try {
      // Create template data with column headers
      const templateData = [{}];
      formFields.forEach(field => {
        templateData[0][field.label] = '';
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);
      
      // Add the worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      
      // Generate file name
      const fileName = `template_${title?.toLowerCase().replace(/\s+/g, '_') || 'data'}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Template Downloaded",
        description: `Template Excel berhasil diunduh: ${fileName}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal membuat template Excel",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = () => {
    if (!onImport) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first worksheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length === 0) {
            toast({
              title: "Error",
              description: "File Excel tidak mengandung data",
              variant: "destructive",
            });
            return;
          }

          // Convert to the expected format (map field labels to field keys)
          const parsedData: Record<string, string>[] = jsonData.map((row: any) => {
            const mappedRow: Record<string, string> = {};
            formFields.forEach(field => {
              // Try to find the value using both label and key
              const value = row[field.label] || row[field.key] || '';
              mappedRow[field.key] = String(value).trim();
            });
            return mappedRow;
          });

          onImport(parsedData);
          setIsImportDialogOpen(false);
          
          toast({
            title: "Import Berhasil",
            description: `${parsedData.length} data berhasil diimpor dari Excel`,
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Gagal membaca file Excel. Pastikan format file benar",
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(file);
    };
    input.click();
  };

  const renderFormField = (field: FormField) => (
    <div key={field.key} className="space-y-2">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.type === "select" ? (
        <Select
          value={formData[field.key] || ""}
          onValueChange={(value) => setFormData({ ...formData, [field.key]: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={field.key}
          type={field.type}
          placeholder={field.placeholder}
          value={formData[field.key] || ""}
          onChange={(e) =>
            setFormData({ ...formData, [field.key]: e.target.value })
          }
          required={field.required}
        />
      )}
    </div>
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Memuat data...</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          {/* Header with actions */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {title && <h2 className="text-xl font-semibold">{title}</h2>}
            <div className="flex items-center gap-2">
              {onImport && (
                <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {onAdd && (
                <Button size="sm" onClick={openAddDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Data
                </Button>
              )}
            </div>
          </div>

          {/* Search and filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={column.sortable ? "cursor-pointer hover:bg-muted/50" : ""}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center">
                        {column.label}
                        {column.sortable && sortColumn === column.key && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      className="text-center text-muted-foreground py-8"
                    >
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedData.map((item, index) => (
                    <TableRow key={item.id || index}>
                      {columns.map((column) => (
                        <TableCell key={column.key}>
                          {column.key === 'no' ? index + 1 : (item[column.key] || "-")}
                        </TableCell>
                      ))}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onEdit && (
                              <DropdownMenuItem onClick={() => openEditDialog(item)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(item)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination info */}
          <div className="text-sm text-muted-foreground">
            Menampilkan {sortedData.length} dari {data.length} data
          </div>
        </div>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Tambah Data</DialogTitle>
            <DialogDescription>
              Lengkapi form berikut untuk menambah data baru.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="grid gap-4 px-1">
              {formFields?.map(renderFormField)}
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Batal
            </Button>
            <Button type="button" onClick={handleAddSubmit}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Data</DialogTitle>
            <DialogDescription>
              Ubah informasi sesuai kebutuhan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="grid gap-4 px-1">
              {formFields?.map(renderFormField)}
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Batal
            </Button>
            <Button type="button" onClick={handleEditSubmit}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import Data dari Excel</DialogTitle>
            <DialogDescription>
              Unduh template Excel terlebih dahulu, isi data, lalu upload file yang sudah diisi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Langkah 1: Unduh Template</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Unduh template Excel yang sudah berisi kolom-kolom yang diperlukan.
                </p>
                <Button onClick={handleDownloadTemplate} variant="outline" className="w-full">
                  <FileDown className="mr-2 h-4 w-4" />
                  Unduh Template Excel
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Langkah 2: Upload File</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload file Excel (.xlsx) yang sudah diisi dengan data.
                </p>
                <Button onClick={handleFileUpload} className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File Excel
                </Button>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-medium mb-1">Petunjuk:</h5>
              <ul className="list-disc list-inside space-y-1">
                <li>Pastikan menggunakan template yang sudah diunduh</li>
                <li>Jangan mengubah nama kolom di baris pertama</li>
                <li>Isi data mulai dari baris kedua</li>
                <li>Format file harus .xlsx atau .xls</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}