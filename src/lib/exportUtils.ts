import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { PDFTemplate, defaultTemplate } from './pdfTemplates';

export interface ExportColumn {
  key: string;
  label: string;
}

export const getCustomPDFTemplate = (templateType: 'attendance' | 'grade' | 'journal'): PDFTemplate => {
  try {
    const savedSettings = localStorage.getItem('pdfFormatSettings');
    console.log('Saved PDF settings:', savedSettings); // Debug log
    
    if (!savedSettings) {
      console.log('No saved settings found, using default template');
      return defaultTemplate;
    }
    
    const settings = JSON.parse(savedSettings);
    console.log('Parsed settings:', settings); // Debug log
    
    // Get format based on type
    const formatKey = templateType === 'attendance' ? 'attendanceFormat' 
                    : templateType === 'grade' ? 'gradeFormat' 
                    : 'journalFormat';
    const format = settings[formatKey];
    console.log(`Using ${formatKey}:`, format); // Debug log
    
    const customTemplate = {
      ...defaultTemplate,
      id: `custom-${templateType}`,
      name: `Custom ${templateType} Template`,
      header: {
        title: settings.schoolInfo?.name || 'Sistem Informasi Sekolah',
        subtitle: templateType === 'attendance' ? 'REKAP KEHADIRAN SISWA'
                : templateType === 'grade' ? 'LAPORAN NILAI SISWA'
                : 'JURNAL GURU',
        address: settings.schoolInfo?.address || '',
        showDate: format?.showDate ?? true,
        logo: settings.schoolInfo?.logo,
      },
      footer: {
        text: '', // Remove footer text to eliminate school name/email in footer
        showPageNumbers: true,
        signatureSection: format?.showSignature ?? true,
      },
      styling: {
        ...defaultTemplate.styling,
        primaryColor: format?.headerColor ? hexToRgb(format.headerColor) : defaultTemplate.styling.primaryColor,
      },
      layout: {
        ...defaultTemplate.layout,
        orientation: format?.orientation || 'portrait',
      },
      teacherInfo: settings.defaultTeacher && settings.defaultTeacher.name ? settings.defaultTeacher : undefined,
    };
    
    console.log('Generated custom template:', customTemplate); // Debug log
    return customTemplate;
  } catch (error) {
    console.error('Error loading PDF settings:', error);
    return defaultTemplate;
  }
};

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [59, 130, 246]; // default blue
};

export const exportToPDF = (
  data: any[],
  columns: ExportColumn[],
  title: string = 'Data Export',
  filename: string = 'export.pdf',
  template: PDFTemplate = defaultTemplate
) => {
  try {
    console.log('Exporting PDF with template:', template); // Debug log
    
    const doc = new jsPDF({
      orientation: template.layout.orientation,
      unit: 'mm',
      format: template.layout.pageSize,
    });

    // Set font
    doc.setFont(template.styling.fontFamily);
    
    let currentY = template.layout.margins.top;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add header section
    if (template.header) {
      console.log('Adding header:', template.header); // Debug log
      
      // Add logo if available
      if (template.header.logo) {
        try {
          console.log('Adding logo to PDF'); // Debug log
          // Add logo on the left side
          doc.addImage(template.header.logo, 'JPEG', template.layout.margins.left, currentY - 5, 20, 20);
        } catch (error) {
          console.error('Error adding logo to PDF:', error);
        }
      }
      
      // Main title - always centered
      doc.setFontSize(template.styling.fontSize.title);
      doc.setTextColor(0, 0, 0);
      const titleWidth = doc.getTextWidth(template.header.title);
      doc.text(template.header.title, (pageWidth - titleWidth) / 2, currentY);
      currentY += 8;

      // Subtitle - always centered
      if (template.header.subtitle) {
        doc.setFontSize(template.styling.fontSize.subtitle);
        doc.setTextColor(0, 0, 0);
        const subtitleWidth = doc.getTextWidth(template.header.subtitle);
        doc.text(template.header.subtitle, (pageWidth - subtitleWidth) / 2, currentY);
        currentY += 6;
      }

      // Address - always centered
      if (template.header.address) {
        doc.setFontSize(template.styling.fontSize.header);
        doc.setTextColor(100, 100, 100);
        const addressWidth = doc.getTextWidth(template.header.address);
        doc.text(template.header.address, (pageWidth - addressWidth) / 2, currentY);
        currentY += 6;
      }

      // Remove date section - commented out
      // if (template.header.showDate) {
      //   doc.setFontSize(template.styling.fontSize.header);
      //   doc.setTextColor(0, 0, 0);
      //   const dateText = `Tanggal: ${new Date().toLocaleDateString('id-ID')}`;
      //   doc.text(dateText, template.layout.margins.left, currentY);
      //   currentY += 6;
      // }

      // Add teacher info if available (for grade and journal reports)
      if (template.teacherInfo && (title.includes('Nilai') || title.includes('Jurnal'))) {
        doc.setFontSize(template.styling.fontSize.header);
        doc.setTextColor(0, 0, 0);
        const teacherY = currentY;
        doc.text(`Guru: ${template.teacherInfo.name}`, template.layout.margins.left, teacherY);
        doc.text(`NIP: ${template.teacherInfo.nip}`, template.layout.margins.left, teacherY + 4);
        doc.text(`Mata Pelajaran: ${template.teacherInfo.subject}`, template.layout.margins.left, teacherY + 8);
        currentY += 16;
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

    // Prepare table data with numbering
    const tableHeaders = ['No.', ...columns.map(col => col.label)];
    const tableData = data.map((item, index) => [
      String(index + 1), // Add row number
      ...columns.map(col => {
        const value = item[col.key];
        return value !== null && value !== undefined ? String(value) : '-';
      })
    ]);

    // Generate table
    let tableEndY = currentY;
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
        // Track the final Y position after table
        tableEndY = data.cursor?.y || currentY;
        
        // Add footer
        if (template.footer) {
          const pageHeight = doc.internal.pageSize.getHeight();
          const pageWidth = doc.internal.pageSize.getWidth();
          
          // Page numbers only - remove footer text
          if (template.footer.showPageNumbers) {
            doc.setFontSize(template.styling.fontSize.header);
            doc.setTextColor(0, 0, 0);
            const pageText = `Halaman ${data.pageNumber}`;
            const pageTextWidth = doc.getTextWidth(pageText);
            doc.text(pageText, pageWidth - template.layout.margins.right - pageTextWidth, pageHeight - 25);
          }
        }
      },
    });

    // Add signature section right after the table
    if (template.footer?.signatureSection) {
      doc.setFontSize(template.styling.fontSize.header);
      doc.setTextColor(0, 0, 0);
      
      // Position signature section right below the table with some spacing
      const signatureStartY = tableEndY + 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Determine signer based on report type
      let signerName, signerPosition, signerNIP;
      
      if (title.includes('Jurnal')) {
        // Journal reports are signed by Principal
        signerName = template.teacherInfo?.kepala_sekolah_nama || 'Kepala Sekolah';
        signerPosition = 'Kepala Sekolah';
        signerNIP = template.teacherInfo?.kepala_sekolah_nip;
      } else {
        // Attendance and Grade reports are signed by Teacher
        signerName = template.teacherInfo?.name || 'Guru';
        signerPosition = template.teacherInfo?.jabatan || 'Guru';
        signerNIP = template.teacherInfo?.nip;
      }
      
      // Remove left side date - commented out
      // doc.text(`Jakarta, ${new Date().toLocaleDateString('id-ID')}`, template.layout.margins.left, signatureStartY);
      
      // Right side: Signature section
      const rightColumnX = pageWidth - 80;
      doc.text(`Jakarta, ${new Date().toLocaleDateString('id-ID')}`, rightColumnX, signatureStartY);
      doc.text('Mengetahui,', rightColumnX, signatureStartY + 5);
      doc.text(signerPosition, rightColumnX, signatureStartY + 10);
      doc.text('', rightColumnX, signatureStartY + 25); // Space for signature
      doc.text(`(${signerName})`, rightColumnX, signatureStartY + 30);
      if (signerNIP) {
        doc.text(`NIP: ${signerNIP}`, rightColumnX, signatureStartY + 35);
      }
    }

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