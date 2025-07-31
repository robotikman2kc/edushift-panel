-- Create kehadiran table
CREATE TABLE public.kehadiran (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  siswa_id UUID NOT NULL,
  kelas_id UUID NOT NULL,
  tanggal DATE NOT NULL,
  status_kehadiran TEXT NOT NULL DEFAULT 'Hadir',
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(siswa_id, tanggal)
);

-- Enable Row Level Security
ALTER TABLE public.kehadiran ENABLE ROW LEVEL SECURITY;

-- Create policies for kehadiran access
CREATE POLICY "Kehadiran data is viewable by authenticated users" 
ON public.kehadiran 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Kehadiran data can be inserted by authenticated users" 
ON public.kehadiran 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Kehadiran data can be updated by authenticated users" 
ON public.kehadiran 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Kehadiran data can be deleted by authenticated users" 
ON public.kehadiran 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_kehadiran_updated_at
BEFORE UPDATE ON public.kehadiran
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();