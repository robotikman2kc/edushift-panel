-- Create table for jenis_kegiatan (activity types)
CREATE TABLE public.jenis_kegiatan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_kegiatan TEXT NOT NULL,
  deskripsi TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jenis_kegiatan ENABLE ROW LEVEL SECURITY;

-- Create policies for jenis_kegiatan
CREATE POLICY "Jenis kegiatan data is viewable by authenticated users" 
ON public.jenis_kegiatan 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Jenis kegiatan data can be inserted by authenticated users" 
ON public.jenis_kegiatan 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Jenis kegiatan data can be updated by authenticated users" 
ON public.jenis_kegiatan 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Jenis kegiatan data can be deleted by authenticated users" 
ON public.jenis_kegiatan 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Create table for jurnal entries
CREATE TABLE public.jurnal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal DATE NOT NULL,
  jenis_kegiatan_id UUID NOT NULL REFERENCES public.jenis_kegiatan(id),
  jumlah_jp INTEGER DEFAULT 0,
  keterangan TEXT,
  guru_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jurnal ENABLE ROW LEVEL SECURITY;

-- Create policies for jurnal
CREATE POLICY "Jurnal data is viewable by authenticated users" 
ON public.jurnal 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Jurnal data can be inserted by authenticated users" 
ON public.jurnal 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Jurnal data can be updated by authenticated users" 
ON public.jurnal 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Jurnal data can be deleted by authenticated users" 
ON public.jurnal 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Add trigger for automatic timestamp updates on jenis_kegiatan
CREATE TRIGGER update_jenis_kegiatan_updated_at
BEFORE UPDATE ON public.jenis_kegiatan
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for automatic timestamp updates on jurnal
CREATE TRIGGER update_jurnal_updated_at
BEFORE UPDATE ON public.jurnal
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default activity types
INSERT INTO public.jenis_kegiatan (nama_kegiatan, deskripsi) VALUES
('Kegiatan Belajar Mengajar', 'Kegiatan mengajar di kelas'),
('Rapat', 'Rapat guru dan staff'),
('Ekstrakurikuler', 'Kegiatan ekstrakurikuler'),
('Administrasi', 'Kegiatan administrasi sekolah'),
('Pengawasan Ujian', 'Mengawas ujian atau ulangan');