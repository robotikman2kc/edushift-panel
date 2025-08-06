import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { availableTemplates, PDFTemplate } from "@/lib/pdfTemplates";

interface PDFTemplateSelectorProps {
  selectedTemplate: PDFTemplate;
  onTemplateChange: (template: PDFTemplate) => void;
}

export const PDFTemplateSelector: React.FC<PDFTemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateChange,
}) => {
  const handleTemplateChange = (templateId: string) => {
    const template = availableTemplates.find(t => t.id === templateId);
    if (template) {
      onTemplateChange(template);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="pdf-template">Template PDF</Label>
      <Select value={selectedTemplate.id} onValueChange={handleTemplateChange}>
        <SelectTrigger id="pdf-template">
          <SelectValue placeholder="Pilih template PDF" />
        </SelectTrigger>
        <SelectContent>
          {availableTemplates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};