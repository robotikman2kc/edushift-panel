import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  Upload, 
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  FileDown,
  Settings2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { exportToPDF, exportToExcel, getCustomPDFTemplate } from "@/lib/exportUtils";
import * as XLSX from 'xlsx';
import { PDFTemplateSelector } from "@/components/common/PDFTemplateSelector";
import { ExportDateDialog } from "@/components/common/ExportDateDialog";
import { defaultTemplate, PDFTemplate } from "@/lib/pdfTemplates";
import { cn } from "@/lib/utils";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
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
  onDeleteBulk?: (ids: string[]) => void | Promise<void>;
  onImport?: (data: Record<string, string>[]) => void | Promise<void>;
  loading?: boolean;
  formFields?: FormField[];
  searchPlaceholder?: string;
  title?: string;
  enableCheckbox?: boolean;
  tableId?: string; // ID unik untuk menyimpan preferences
  additionalPDFInfo?: { kelas?: string; bulan?: string }; // For passing additional info to PDF
  getRowClassName?: (item: any) => string; // Function to add custom row styling
}

export function DataTable({
  data,
  columns,
  onAdd,
  onEdit,
  onDelete,
  onDeleteBulk,
  onImport,
  loading = false,
  formFields = [],
  additionalPDFInfo,
  searchPlaceholder = "Cari data...",
  title,
  enableCheckbox = false,
  tableId = 'default', // Default ID jika tidak dispesifikkan
  getRowClassName,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [rowHeight, setRowHeight] = useState<'compact' | 'normal' | 'comfortable'>('normal');
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDateDialogOpen, setIsExportDateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Load saved sorting preferences
  useEffect(() => {
    const savedSort = localStorage.getItem(`table_sort_${tableId}`);
    if (savedSort) {
      try {
        const { column, direction } = JSON.parse(savedSort);
        setSortColumn(column);
        setSortDirection(direction);
      } catch (error) {
        console.error('Error loading sort preferences:', error);
      }
    }
  }, [tableId]);

  // Save sorting preferences
  useEffect(() => {
    if (sortColumn) {
      localStorage.setItem(`table_sort_${tableId}`, JSON.stringify({
        column: sortColumn,
        direction: sortDirection
      }));
    }
  }, [sortColumn, sortDirection, tableId]);

  const getRowHeightClass = () => {
    switch (rowHeight) {
      case 'compact':
        return 'h-8 text-xs';
      case 'comfortable':
        return 'h-14 text-base';
      default:
        return 'h-10 text-sm';
    }
  };

  const getCellPaddingClass = () => {
    switch (rowHeight) {
      case 'compact':
        return 'py-1';
      case 'comfortable':
        return 'py-3';
      default:
        return 'py-2';
    }
  };

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

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const openAddDialog = () => {
    // Auto-fill tanggal dengan hari ini
    const todayFields: Record<string, string> = {};
    formFields.forEach(field => {
      if (field.type === 'date') {
        todayFields[field.key] = new Date().toISOString().split('T')[0];
      }
    });
    setFormData(todayFields);
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (item: any) => {
    // If no formFields defined, call onEdit directly without opening dialog
    if (formFields.length === 0 && onEdit) {
      onEdit(item.id, item);
      return;
    }
    
    setSelectedItem(item);
    const initialData: Record<string, string> = {};
    formFields.forEach((field) => {
      const value = item[field.key];
      // Convert to string, handle various types
      initialData[field.key] = value !== null && value !== undefined ? String(value) : "";
    });
    setFormData(initialData);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item: any) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleAddSubmit = async () => {
    // Validate required fields
    const missingFields = formFields
      .filter(field => {
        if (!field.required) return false;
        const value = formData[field.key];
        // Check if value exists and is not empty (handle both strings and other types)
        if (value === null || value === undefined) return true;
        if (typeof value === 'string' && value.trim() === '') return true;
        return false;
      })
      .map(field => field.label);
    
    if (missingFields.length > 0) {
      toast({
        title: "Validasi Gagal",
        description: `Field berikut wajib diisi: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
    if (onAdd) {
      await onAdd(formData);
      setIsAddDialogOpen(false);
      setFormData({});
    }
  };

  const handleEditSubmit = async () => {
    // Validate required fields
    const missingFields = formFields
      .filter(field => {
        if (!field.required) return false;
        const value = formData[field.key];
        // Check if value exists and is not empty (handle both strings and other types)
        if (value === null || value === undefined) return true;
        if (typeof value === 'string' && value.trim() === '') return true;
        return false;
      })
      .map(field => field.label);
    
    if (missingFields.length > 0) {
      toast({
        title: "Validasi Gagal",
        description: `Field berikut wajib diisi: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
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

  const handleToggleAll = () => {
    if (selectedIds.size === sortedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedData.map(item => item.id)));
    }
  };

  const handleToggleItem = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (onDeleteBulk && selectedIds.size > 0) {
      await onDeleteBulk(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleCellEdit = (rowId: string, columnKey: string, currentValue: string) => {
    setEditingCell({ rowId, columnKey });
    setEditValue(currentValue);
  };

  const handleCellSave = async (rowId: string, columnKey: string) => {
    if (onEdit && editValue !== null) {
      const item = sortedData.find(d => d.id === rowId);
      if (item) {
        const updatedData = { ...item, [columnKey]: editValue };
        await onEdit(rowId, updatedData);
      }
    }
    setEditingCell(null);
    setEditValue("");
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleExportPDF = (signatureDate?: Date) => {
    try {
      const exportColumns = columns.map(col => ({ key: col.key, label: col.label }));
      
      // Use custom template for jurnal data
      let template = defaultTemplate;
      if (title?.toLowerCase().includes('jurnal')) {
        template = getCustomPDFTemplate('journal');
      }
      
      // Add signature date to template
      if (signatureDate) {
        template = {
          ...template,
          signatureDate: signatureDate.toISOString().split('T')[0],
        };
      }
      
      const success = exportToPDF(
        sortedData,
        exportColumns,
        title || 'Data Export',
        `${title || 'data'}_${new Date().toISOString().split('T')[0]}.pdf`,
        template,
        additionalPDFInfo
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
      // Create template data with column headers and instructions
      const templateData: any[] = [];
      
      // Row 1: Headers
      const headerRow: any = {};
      formFields.forEach(field => {
        headerRow[field.label] = field.label;
      });
      templateData.push(headerRow);
      
      // Row 2: Instructions/Format info
      const instructionRow: any = {};
      formFields.forEach(field => {
        if (field.type === 'date') {
          instructionRow[field.label] = 'Format: DD/MM/YYYY (contoh: 31/12/2025)';
        } else if (field.key === 'jenis_kelamin') {
          instructionRow[field.label] = 'Isi dengan: L (Laki-laki) atau P (Perempuan)';
        } else {
          instructionRow[field.label] = '';
        }
      });
      templateData.push(instructionRow);
      
      // Row 3: Empty data row
      const dataRow: any = {};
      formFields.forEach(field => {
        dataRow[field.label] = '';
      });
      templateData.push(dataRow);

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData, { skipHeader: true });
      
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
          const parsedData: Record<string, string>[] = jsonData.map((row: any, index: number) => {
            // Skip instruction row (row index 0 in the data)
            if (index === 0) {
              const firstValue = Object.values(row)[0] as string;
              if (firstValue && firstValue.includes('Format:')) {
                return null;
              }
            }
            
            const mappedRow: Record<string, string> = {};
            formFields.forEach(field => {
              // Try to find the value using both label and key
              const value = row[field.label] || row[field.key] || '';
              mappedRow[field.key] = String(value).trim();
            });
            return mappedRow;
          }).filter(row => row !== null) as Record<string, string>[];

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
        {field.required && <span className="text-destructive ml-1">*</span>}
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
        />
      )}
      {field.required && !formData[field.key] && (
        <p className="text-xs text-muted-foreground">Field ini wajib diisi</p>
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
            <div className="flex items-center gap-4">
              {title && <h2 className="text-xl font-semibold">{title}</h2>}
              {enableCheckbox && selectedIds.size > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus {selectedIds.size} data
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onImport && (
                <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              )}

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
            <Select value={rowHeight} onValueChange={(value: any) => setRowHeight(value)}>
              <SelectTrigger className="w-[140px]">
                <Settings2 className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="comfortable">Comfortable</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsExportDateDialogOpen(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg max-h-[600px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {enableCheckbox && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.size === paginatedData.length && paginatedData.length > 0}
                        onCheckedChange={handleToggleAll}
                      />
                    </TableHead>
                  )}
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={cn(
                        column.sortable ? "cursor-pointer hover:bg-muted/50" : "",
                        column.align === 'center' ? "text-center" : column.align === 'right' ? "text-right" : "text-left"
                      )}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className={cn(
                        "flex items-center",
                        column.align === 'center' ? "justify-center" : column.align === 'right' ? "justify-end" : "justify-start"
                      )}>
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
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + (enableCheckbox ? 2 : 1)}
                      className="text-center text-muted-foreground py-8"
                    >
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, index) => {
                    const customRowClassName = getRowClassName ? getRowClassName(item) : '';
                    return (
                      <TableRow 
                        key={item.id || index} 
                        className={`${getRowHeightClass()} ${customRowClassName}`}
                      >
                        {enableCheckbox && (
                        <TableCell className={getCellPaddingClass()}>
                          <Checkbox
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={() => handleToggleItem(item.id)}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => {
                        const isEditing = editingCell?.rowId === item.id && editingCell?.columnKey === column.key;
                        const cellValue = column.key === 'no' ? startIndex + index + 1 : (item[column.key] || "-");
                        
                        return (
                          <TableCell 
                            key={column.key}
                            onDoubleClick={() => column.key !== 'no' && onEdit && handleCellEdit(item.id, column.key, item[column.key] || "")}
                            className={cn(
                              `cursor-pointer hover:bg-muted/30 transition-colors ${getCellPaddingClass()}`,
                              column.align === 'center' ? "text-center" : column.align === 'right' ? "text-right" : "text-left"
                            )}
                          >
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCellSave(item.id, column.key);
                                    if (e.key === 'Escape') handleCellCancel();
                                  }}
                                  className="h-8 text-sm"
                                  autoFocus
                                />
                                <Button size="sm" variant="ghost" onClick={() => handleCellSave(item.id, column.key)} className="h-8 px-2">
                                  ✓
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleCellCancel} className="h-8 px-2">
                                  ✗
                                </Button>
                              </div>
                            ) : (
                              cellValue
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className={getCellPaddingClass()}>
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
                  );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination controls */}
          {sortedData.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tampilkan</span>
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={(value) => {
                    setRowsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  dari {sortedData.length} data
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
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
      
      <ExportDateDialog
        open={isExportDateDialogOpen}
        onOpenChange={setIsExportDateDialogOpen}
        onExport={handleExportPDF}
        title="Export PDF"
        description="Pilih tanggal untuk tanda tangan pada laporan"
      />
    </>
  );
}