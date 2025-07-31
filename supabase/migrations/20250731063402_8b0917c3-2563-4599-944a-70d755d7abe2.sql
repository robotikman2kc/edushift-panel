-- Create mata_pelajaran table
CREATE TABLE public.mata_pelajaran (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_mata_pelajaran TEXT NOT NULL,
  kode_mata_pelajaran TEXT NOT NULL UNIQUE,
  deskripsi TEXT,
  status TEXT NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mata_pelajaran ENABLE ROW LEVEL SECURITY;

-- Create policies for mata_pelajaran access
CREATE POLICY "Mata pelajaran data is viewable by authenticated users" 
ON public.mata_pelajaran 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Mata pelajaran data can be inserted by authenticated users" 
ON public.mata_pelajaran 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Mata pelajaran data can be updated by authenticated users" 
ON public.mata_pelajaran 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Mata pelajaran data can be deleted by authenticated users" 
ON public.mata_pelajaran 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_mata_pelajaran_updated_at
BEFORE UPDATE ON public.mata_pelajaran
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();