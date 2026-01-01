-- Make the imaging-files bucket private to protect PHI
UPDATE storage.buckets 
SET public = false 
WHERE id = 'imaging-files';