-- Create table for classes (kelas)
CREATE TABLE public.kelas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_kelas TEXT NOT NULL,
  tingkat TEXT NOT NULL, -- Example: "10", "11", "12" or "X", "XI", "XII"
  jurusan TEXT, -- Example: "IPA", "IPS", "Bahasa"
  wali_kelas_id UUID REFERENCES public.guru(id),
  tahun_ajaran TEXT NOT NULL, -- Example: "2024/2025"
  kapasitas INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for students (siswa)
CREATE TABLE public.siswa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nis TEXT NOT NULL UNIQUE,
  nama_siswa TEXT NOT NULL,
  kelas_id UUID REFERENCES public.kelas(id) ON DELETE SET NULL,
  jenis_kelamin TEXT CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
  tanggal_lahir DATE,
  tempat_lahir TEXT,
  alamat TEXT,
  nama_orang_tua TEXT,
  telepon_orang_tua TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;

-- Create policies for kelas table
CREATE POLICY "Kelas data is viewable by authenticated users" 
ON public.kelas 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Kelas data can be inserted by authenticated users" 
ON public.kelas 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Kelas data can be updated by authenticated users" 
ON public.kelas 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Kelas data can be deleted by authenticated users" 
ON public.kelas 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Create policies for siswa table
CREATE POLICY "Siswa data is viewable by authenticated users" 
ON public.siswa 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Siswa data can be inserted by authenticated users" 
ON public.siswa 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Siswa data can be updated by authenticated users" 
ON public.siswa 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Siswa data can be deleted by authenticated users" 
ON public.siswa 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_kelas_updated_at
BEFORE UPDATE ON public.kelas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_siswa_updated_at
BEFORE UPDATE ON public.siswa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for kelas
INSERT INTO public.kelas (nama_kelas, tingkat, jurusan, tahun_ajaran, kapasitas) VALUES
  ('X IPA 1', 'X', 'IPA', '2024/2025', 32),
  ('X IPA 2', 'X', 'IPA', '2024/2025', 30),
  ('X IPS 1', 'X', 'IPS', '2024/2025', 28),
  ('XI IPA 1', 'XI', 'IPA', '2024/2025', 30),
  ('XI IPS 1', 'XI', 'IPS', '2024/2025', 25),
  ('XII IPA 1', 'XII', 'IPA', '2024/2025', 28),
  ('XII IPS 1', 'XII', 'IPS', '2024/2025', 26);