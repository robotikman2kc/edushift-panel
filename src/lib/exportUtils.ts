import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportColumn {
  key: string;
  label: string;
}

export const exportToPDF = (
  data: any[],
  columns: ExportColumn[],
  title: string = 'Data Export',
  filename: string = 'export.pdf'
) => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    // Add timestamp
    doc.setFontSize(10);
    doc.text(`Exported on: ${new Date().toLocaleString('id-ID')}`, 14, 25);
    
    // Prepare table data
    const tableHeaders = columns.map(col => col.label);
    const tableData = data.map(item => 
      columns.map(col => {
        const value = item[col.key];
        return value !== null && value !== undefined ? String(value) : '-';
      })
    );
    
    // Generate table
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 35,
      styles: { 
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Light gray
      },
      margin: { top: 35, right: 14, bottom: 20, left: 14 },
    });
    
    // Save the PDF
    doc.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return false;
  }
};

export const exportToExcel = (
  data: any[],
  columns: ExportColumn[],
  title: string = 'Data Export',
  filename: string = 'export.xlsx'
) => {
  try {
    // Prepare data for Excel
    const excelData = data.map(item => {
      const row: { [key: string]: any } = {};
      columns.forEach(col => {
        row[col.label] = item[col.key] !== null && item[col.key] !== undefined ? item[col.key] : '-';
      });
      return row;
    });
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Add title and timestamp
    const titleRow = [title];
    const timestampRow = [`Exported on: ${new Date().toLocaleString('id-ID')}`];
    const emptyRow = [''];
    
    // Insert title rows at the beginning
    XLSX.utils.sheet_add_aoa(ws, [titleRow, timestampRow, emptyRow], { origin: 'A1' });
    
    // Adjust the data starting position
    const dataRange = XLSX.utils.encode_range({
      s: { c: 0, r: 3 },
      e: { c: columns.length - 1, r: data.length + 3 }
    });
    
    // Auto-size columns
    const colWidths = columns.map(col => ({ wch: Math.max(col.label.length, 15) }));
    ws['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    
    // Save the file
    XLSX.writeFile(wb, filename);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};

export const formatDataForExport = (data: any[], excludeFields: string[] = ['id']) => {
  return data.map(item => {
    const filteredItem: { [key: string]: any } = {};
    Object.keys(item).forEach(key => {
      if (!excludeFields.includes(key)) {
        filteredItem[key] = item[key];
      }
    });
    return filteredItem;
  });
};