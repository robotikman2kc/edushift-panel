import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { PDFTemplate, defaultTemplate } from './pdfTemplates';
import { isHariLibur } from './hariLiburUtils';

export interface ExportColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
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
      schoolName: settings.schoolInfo?.name || 'Sistem Informasi Sekolah',
      header: format?.showHeader !== false ? {
        schoolName: settings.schoolInfo?.name || 'Sistem Informasi Sekolah',
        address: settings.schoolInfo?.address || '',
        logo: settings.schoolInfo?.logo,
      } : undefined,
      reportTitle: templateType === 'attendance' ? 'REKAP KEHADIRAN SISWA'
                : templateType === 'grade' ? 'LAPORAN NILAI SISWA'
                : 'LAPORAN KINERJA BULANAN',
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
      signatureLocation: settings.schoolInfo?.signatureLocation || 'Jakarta',
      signatureDate: format?.signatureDate,
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

const formatDateIndonesia = (date: Date): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};

export const generatePDFBlob = (
  data: any[],
  columns: ExportColumn[],
  title: string = 'Data Export',
  template: PDFTemplate = defaultTemplate,
  additionalInfo?: { kelas?: string; bulan?: string }
): Blob | null => {
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
      
      // School name - always centered
      doc.setFontSize(template.styling.fontSize.title);
      doc.setTextColor(0, 0, 0);
      const schoolNameWidth = doc.getTextWidth(template.header.schoolName);
      doc.text(template.header.schoolName, (pageWidth - schoolNameWidth) / 2, currentY);
      currentY += 6;

      // Address - always centered
      if (template.header.address) {
        doc.setFontSize(template.styling.fontSize.header);
        doc.setTextColor(100, 100, 100);
        const addressWidth = doc.getTextWidth(template.header.address);
        doc.text(template.header.address, (pageWidth - addressWidth) / 2, currentY);
        currentY += 6;
      }

      // Add separator line - always black
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(template.layout.margins.left, currentY, pageWidth - template.layout.margins.right, currentY);
      currentY += 8;
    }
    
    // Report title - below the separator line (or at top if no header), centered
    if (template.reportTitle) {
      doc.setFontSize(template.styling.fontSize.subtitle);
      doc.setTextColor(0, 0, 0);
      const reportTitleWidth = doc.getTextWidth(template.reportTitle);
      doc.text(template.reportTitle, (pageWidth - reportTitleWidth) / 2, currentY);
      currentY += 5;
      
      // Add extra spacing for grade reports
      if (title.includes('Nilai')) {
        currentY += 8;
      }
    }

    // Add month info for journal reports (before teacher info)
    if (title.includes('Jurnal') && additionalInfo?.bulan) {
      doc.setFontSize(template.styling.fontSize.header);
      doc.setTextColor(0, 0, 0);
      const bulanText = `Bulan ${additionalInfo.bulan}`;
      const bulanWidth = doc.getTextWidth(bulanText);
      doc.text(bulanText, (pageWidth - bulanWidth) / 2, currentY);
      currentY += 12;
    }

    // Add teacher/employee info if available
    if (template.teacherInfo) {
      doc.setFontSize(template.styling.fontSize.header);
      doc.setTextColor(0, 0, 0);
      const infoY = currentY;
      
      if (title.includes('Jurnal')) {
        // Journal reports: Show employee info left-aligned above table with aligned colons
        const labelWidth = 25; // Fixed width for labels to align colons
        const schoolName = template.schoolName || template.header?.schoolName || 'Sekolah';
        
        doc.text('Nama', template.layout.margins.left, infoY);
        doc.text(':', template.layout.margins.left + labelWidth, infoY);
        doc.text(template.teacherInfo.name, template.layout.margins.left + labelWidth + 3, infoY);
        
        doc.text('NIP', template.layout.margins.left, infoY + 5);
        doc.text(':', template.layout.margins.left + labelWidth, infoY + 5);
        doc.text(template.teacherInfo.nip, template.layout.margins.left + labelWidth + 3, infoY + 5);
        
        doc.text('Jabatan', template.layout.margins.left, infoY + 10);
        doc.text(':', template.layout.margins.left + labelWidth, infoY + 10);
        doc.text(template.teacherInfo.jabatan || '-', template.layout.margins.left + labelWidth + 3, infoY + 10);
        
        doc.text('Satuan Kerja', template.layout.margins.left, infoY + 15);
        doc.text(':', template.layout.margins.left + labelWidth, infoY + 15);
        doc.text(schoolName, template.layout.margins.left + labelWidth + 3, infoY + 15);
        currentY += 22;
      } else if (title.includes('Nilai')) {
        // Grade reports: Show subject info with aligned colons
        const labelWidth = 35; // Fixed width for labels to align colons
        
        doc.text('Guru', template.layout.margins.left, infoY);
        doc.text(':', template.layout.margins.left + labelWidth, infoY);
        doc.text(template.teacherInfo.name, template.layout.margins.left + labelWidth + 3, infoY);
        
        doc.text('NIP', template.layout.margins.left, infoY + 5);
        doc.text(':', template.layout.margins.left + labelWidth, infoY + 5);
        doc.text(template.teacherInfo.nip, template.layout.margins.left + labelWidth + 3, infoY + 5);
        
        doc.text('Mata Pelajaran', template.layout.margins.left, infoY + 10);
        doc.text(':', template.layout.margins.left + labelWidth, infoY + 10);
        doc.text(template.teacherInfo.subject || '-', template.layout.margins.left + labelWidth + 3, infoY + 10);
        
        // Add Kelas info if available
        if (additionalInfo?.kelas) {
          doc.text('Kelas', template.layout.margins.left, infoY + 15);
          doc.text(':', template.layout.margins.left + labelWidth, infoY + 15);
          doc.text(additionalInfo.kelas, template.layout.margins.left + labelWidth + 3, infoY + 15);
          currentY += 23;
        } else {
          currentY += 18;
        }
      }
    }

    // Add additional info (kelas and bulan for attendance reports) - AFTER separator line
    console.log('Additional info received:', additionalInfo); // Debug log
    if (additionalInfo && (additionalInfo.kelas || additionalInfo.bulan) && !title.includes('Jurnal') && !title.includes('Nilai')) {
      console.log('Adding class and month info to PDF'); // Debug log
      doc.setFontSize(template.styling.fontSize.header);
      doc.setTextColor(0, 0, 0);
      const infoY = currentY;
      if (additionalInfo.kelas) {
        console.log('Adding Kelas:', additionalInfo.kelas); // Debug log
        doc.text(`Kelas: ${additionalInfo.kelas}`, template.layout.margins.left, infoY);
        currentY += 5;
      }
      if (additionalInfo.bulan) {
        console.log('Adding Bulan:', additionalInfo.bulan); // Debug log
        doc.text(`Bulan: ${additionalInfo.bulan}`, template.layout.margins.left, currentY);
        currentY += 5;
      }
      currentY += 6;
    } else {
      console.log('No additional info to add'); // Debug log
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

    // Prepare table data with numbering (unless 'no' column already exists)
    const hasNoColumn = columns.some(col => col.key === 'no' || col.label === 'No' || col.label === 'No.');
    
    // If 'no' column exists, filter it out and add fresh numbering
    const columnsWithoutNo = hasNoColumn 
      ? columns.filter(col => col.key !== 'no' && col.label !== 'No' && col.label !== 'No.')
      : columns;
    
    const tableHeaders = ['No.', ...columnsWithoutNo.map(col => col.label)];
    
    const tableData = data.map((item, index) => {
      const rowData = columnsWithoutNo.map(col => {
        const value = item[col.key];
        return value !== null && value !== undefined ? String(value) : '-';
      });
      return [String(index + 1), ...rowData];
    });

    // Generate table
    let tableEndY = currentY;
    
    // Get row height from template settings
    const rowHeight = (template as any).tableSettings?.rowHeight || 8;
    
    // Create column styles for alignment
    const columnStyles: any = {
      0: { halign: 'center' }, // No. column is always centered
    };
    
    // Apply alignment for other columns
    columnsWithoutNo.forEach((col, index) => {
      const colIndex = index + 1; // +1 because column 0 is the 'No.' column
      if (col.align === 'center') {
        columnStyles[colIndex] = { halign: 'center' };
      } else if (col.align === 'right') {
        columnStyles[colIndex] = { halign: 'right' };
      } else {
        columnStyles[colIndex] = { halign: 'left' };
      }
    });

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: currentY,
      styles: { 
        fontSize: template.styling.fontSize.body,
        cellPadding: 2,
        font: template.styling.fontFamily,
        minCellHeight: rowHeight,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: template.styling.primaryColor,
        textColor: 255,
        fontStyle: 'bold',
        minCellHeight: rowHeight,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        halign: 'center', // Center all headers
      },
      columnStyles: columnStyles,
      alternateRowStyles: {
        fillColor: template.styling.secondaryColor
      },
      margin: template.layout.margins,
      didDrawCell: (cellData) => {
        // Color rows for highlighted kegiatan in journal reports
        if (title.includes('Jurnal') && cellData.section === 'body') {
          const rowIndex = cellData.row.index;
          const originalItem = data[rowIndex]; // Access original data array
          
          // Check if this row should be highlighted
          let shouldHighlight = false;
          
          // Primary check: use_highlight flag from jenis kegiatan
          if (originalItem._useHighlight === true) {
            shouldHighlight = true;
          }
          
          // Backwards compatibility: Check by date - look for _originalDate in the data
          if (!shouldHighlight && originalItem._originalDate) {
            const date = new Date(originalItem._originalDate);
            if (isHariLibur(date)) {
              shouldHighlight = true;
            }
          }
          
          // Apply yellow background to the entire row if it should be highlighted
          if (shouldHighlight) {
            doc.setFillColor(255, 237, 213); // Light amber/yellow color
            doc.rect(cellData.cell.x, cellData.cell.y, cellData.cell.width, cellData.cell.height, 'F');
            
            // Redraw the cell border
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.1);
            doc.rect(cellData.cell.x, cellData.cell.y, cellData.cell.width, cellData.cell.height, 'S');
            
            // Redraw the cell text with proper alignment
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(cellData.cell.styles.fontSize);
            const textLines = cellData.cell.text;
            
            if (textLines && textLines.length > 0) {
              // Get alignment from columnStyles
              const colIndex = cellData.column.index;
              const alignment = columnStyles[colIndex]?.halign || 'left';
              
              let textX = cellData.cell.x + cellData.cell.padding('left');
              
              // Adjust X position based on alignment
              if (alignment === 'center') {
                const textWidth = doc.getTextWidth(textLines.join(' '));
                textX = cellData.cell.x + (cellData.cell.width / 2) - (textWidth / 2);
              } else if (alignment === 'right') {
                const textWidth = doc.getTextWidth(textLines.join(' '));
                textX = cellData.cell.x + cellData.cell.width - textWidth - cellData.cell.padding('right');
              }
              
              doc.text(textLines, textX, cellData.cell.y + cellData.cell.height / 2, {
                baseline: 'middle'
              });
            }
          }
        }
      },
      didDrawPage: (data) => {
        // Track the final Y position after table
        tableEndY = data.cursor?.y || currentY;
        
        // Add footer
        if (template.footer) {
          const pageHeight = doc.internal.pageSize.getHeight();
          const pageWidth = doc.internal.pageSize.getWidth();
          
          // Page numbers for all reports - positioned lower to avoid overlap
          if (template.footer.showPageNumbers) {
            doc.setFontSize(template.styling.fontSize.header);
            doc.setTextColor(0, 0, 0);
            const pageText = `Halaman ${data.pageNumber}`;
            const pageTextWidth = doc.getTextWidth(pageText);
            doc.text(pageText, pageWidth - template.layout.margins.right - pageTextWidth, pageHeight - 10);
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
      const signatureLocation = template.signatureLocation || 'Jakarta';
      
      if (title.includes('Jurnal')) {
        // Journal reports: Two signatures side by side
        const leftColumnX = template.layout.margins.left;
        const rightColumnX = pageWidth - 80;
        
        // Left side: Pejabat Penilai (Principal) - NO DATE
        const principalName = template.teacherInfo?.kepala_sekolah_nama || 'Kepala Sekolah';
        const principalNIP = template.teacherInfo?.kepala_sekolah_nip;
        const schoolName = template.schoolName || template.header?.schoolName || 'Sekolah';
        
        doc.text('Pejabat Penilai,', leftColumnX, signatureStartY + 5);
        doc.text(`Kepala ${schoolName}`, leftColumnX, signatureStartY + 10);
        doc.text('', leftColumnX, signatureStartY + 25); // Space for signature
        doc.text(`(${principalName})`, leftColumnX, signatureStartY + 30);
        if (principalNIP) {
          doc.text(`NIP: ${principalNIP}`, leftColumnX, signatureStartY + 35);
        }
        
        // Right side: Pegawai Yang Dinilai (Teacher) - WITH DATE
        const teacherName = template.teacherInfo?.name || 'Guru';
        const teacherNIP = template.teacherInfo?.nip;
        
        // Use custom signature date if provided, otherwise use current date
        const signatureDate = template.signatureDate 
          ? formatDateIndonesia(new Date(template.signatureDate))
          : formatDateIndonesia(new Date());
        
        doc.text(`${signatureLocation}, ${signatureDate}`, rightColumnX, signatureStartY);
        doc.text('Pegawai Yang Dinilai,', rightColumnX, signatureStartY + 5);
        doc.text('', rightColumnX, signatureStartY + 25); // Space for signature
        doc.text(`(${teacherName})`, rightColumnX, signatureStartY + 30);
        if (teacherNIP) {
          doc.text(`NIP: ${teacherNIP}`, rightColumnX, signatureStartY + 35);
        }
      } else {
        // Attendance and Grade reports: Single signature on the right
        const signerName = template.teacherInfo?.name || 'Guru';
        const signerPosition = template.teacherInfo?.jabatan || 'Guru';
        const signerNIP = template.teacherInfo?.nip;
        
        // Use custom signature date if provided, otherwise use current date
        const signatureDate = template.signatureDate 
          ? formatDateIndonesia(new Date(template.signatureDate))
          : formatDateIndonesia(new Date());
        
        const rightColumnX = pageWidth - 80;
        doc.text(`${signatureLocation}, ${signatureDate}`, rightColumnX, signatureStartY);
        doc.text('Mengetahui,', rightColumnX, signatureStartY + 5);
        doc.text(signerPosition, rightColumnX, signatureStartY + 10);
        doc.text('', rightColumnX, signatureStartY + 25); // Space for signature
        doc.text(`(${signerName})`, rightColumnX, signatureStartY + 30);
        if (signerNIP) {
          doc.text(`NIP: ${signerNIP}`, rightColumnX, signatureStartY + 35);
        }
      }
    }

    // Return PDF as Blob instead of saving
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
};

export const exportToPDF = (
  data: any[],
  columns: ExportColumn[],
  title: string = 'Data Export',
  filename: string = 'export.pdf',
  template: PDFTemplate = defaultTemplate,
  additionalInfo?: { kelas?: string; bulan?: string }
) => {
  try {
    const pdfBlob = generatePDFBlob(data, columns, title, template, additionalInfo);
    
    if (!pdfBlob) {
      return false;
    }

    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
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