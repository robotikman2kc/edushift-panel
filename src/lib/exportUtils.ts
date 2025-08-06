import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { PDFTemplate, defaultTemplate } from './pdfTemplates';

export interface ExportColumn {
  key: string;
  label: string;
}

export const exportToPDF = (
  data: any[],
  columns: ExportColumn[],
  title: string = 'Data Export',
  filename: string = 'export.pdf',
  template: PDFTemplate = defaultTemplate
) => {
  try {
    const doc = new jsPDF({
      orientation: template.layout.orientation,
      unit: 'mm',
      format: template.layout.pageSize,
    });

    // Set font
    doc.setFont(template.styling.fontFamily);
    
    let currentY = template.layout.margins.top;

    // Add header section
    if (template.header) {
      // Main title
      doc.setFontSize(template.styling.fontSize.title);
      doc.setTextColor(...template.styling.primaryColor);
      const titleWidth = doc.getTextWidth(template.header.title);
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.text(template.header.title, (pageWidth - titleWidth) / 2, currentY);
      currentY += 8;

      // Subtitle
      if (template.header.subtitle) {
        doc.setFontSize(template.styling.fontSize.subtitle);
        doc.setTextColor(0, 0, 0);
        const subtitleWidth = doc.getTextWidth(template.header.subtitle);
        doc.text(template.header.subtitle, (pageWidth - subtitleWidth) / 2, currentY);
        currentY += 6;
      }

      // Address
      if (template.header.address) {
        doc.setFontSize(template.styling.fontSize.header);
        doc.setTextColor(100, 100, 100);
        const addressWidth = doc.getTextWidth(template.header.address);
        doc.text(template.header.address, (pageWidth - addressWidth) / 2, currentY);
        currentY += 6;
      }

      // Date
      if (template.header.showDate) {
        doc.setFontSize(template.styling.fontSize.header);
        doc.setTextColor(0, 0, 0);
        const dateText = `Tanggal: ${new Date().toLocaleDateString('id-ID')}`;
        doc.text(dateText, template.layout.margins.left, currentY);
        currentY += 6;
      }

      // Add separator line
      doc.setDrawColor(...template.styling.primaryColor);
      doc.setLineWidth(0.5);
      doc.line(template.layout.margins.left, currentY, pageWidth - template.layout.margins.right, currentY);
      currentY += 8;
    }

    // Add watermark if specified
    if (template.watermark) {
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(50);
      doc.text(template.watermark.text, pageWidth / 2, doc.internal.pageSize.getHeight() / 2, {
        align: 'center',
        angle: 45,
        renderingMode: 'stroke'
      });
      doc.setTextColor(0, 0, 0); // Reset text color
    }

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
      startY: currentY,
      styles: { 
        fontSize: template.styling.fontSize.body,
        cellPadding: 2,
        font: template.styling.fontFamily,
      },
      headStyles: {
        fillColor: template.styling.primaryColor,
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: template.styling.secondaryColor
      },
      margin: template.layout.margins,
      didDrawPage: (data) => {
        // Add footer
        if (template.footer) {
          const pageHeight = doc.internal.pageSize.getHeight();
          const pageWidth = doc.internal.pageSize.getWidth();
          
          // Footer text
          if (template.footer.text) {
            doc.setFontSize(template.styling.fontSize.header);
            doc.setTextColor(100, 100, 100);
            doc.text(template.footer.text, template.layout.margins.left, pageHeight - 25);
          }

          // Page numbers
          if (template.footer.showPageNumbers) {
            doc.setFontSize(template.styling.fontSize.header);
            doc.setTextColor(0, 0, 0);
            const pageText = `Halaman ${data.pageNumber}`;
            const pageTextWidth = doc.getTextWidth(pageText);
            doc.text(pageText, pageWidth - template.layout.margins.right - pageTextWidth, pageHeight - 25);
          }

          // Signature section
          if (template.footer.signatureSection) {
            doc.setFontSize(template.styling.fontSize.header);
            doc.setTextColor(0, 0, 0);
            const signatureY = pageHeight - 40;
            doc.text('Mengetahui,', pageWidth - 60, signatureY);
            doc.text('Kepala Sekolah', pageWidth - 60, signatureY + 5);
            doc.text('(_________________)', pageWidth - 60, signatureY + 20);
          }
        }
      },
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