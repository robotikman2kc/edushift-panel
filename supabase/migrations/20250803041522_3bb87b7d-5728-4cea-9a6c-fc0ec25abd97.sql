-- Update jurnal table structure for new requirements
ALTER TABLE public.jurnal 
ADD COLUMN uraian_kegiatan TEXT,
ADD COLUMN volume INTEGER,
ADD COLUMN satuan_hasil TEXT;

-- Remove old keterangan column and jumlah_jp as they're no longer needed
ALTER TABLE public.jurnal 
DROP COLUMN IF EXISTS keterangan,
DROP COLUMN IF EXISTS jumlah_jp;