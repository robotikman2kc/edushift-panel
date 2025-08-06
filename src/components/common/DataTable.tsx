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
  FileText
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { exportToPDF, exportToExcel, getCustomPDFTemplate } from "@/lib/exportUtils";
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

  const handleImport = () => {
    // Implementation for import
    console.log("Import functionality");
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
              <Button variant="outline" size="sm" onClick={handleImport}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              
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
                          {item[column.key] || "-"}
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
    </>
  );
}