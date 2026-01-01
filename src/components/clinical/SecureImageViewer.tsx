import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SecureImageViewerProps {
  filePath?: string | null;
  imageUrl?: string | null;
  alt: string;
  className?: string;
}

export const SecureImageViewer = ({ filePath, imageUrl, alt, className = "w-full h-48 object-cover" }: SecureImageViewerProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const getSignedUrl = async () => {
      // If we have a file_path, use signed URL (private bucket)
      if (filePath) {
        setLoading(true);
        try {
          const { data, error: signError } = await supabase.storage
            .from('imaging-files')
            .createSignedUrl(filePath, 3600); // 1 hour expiry
          
          if (signError) {
            console.error('Error creating signed URL:', signError);
            setError(true);
          } else {
            setSignedUrl(data.signedUrl);
          }
        } catch (e) {
          console.error('Failed to get signed URL:', e);
          setError(true);
        } finally {
          setLoading(false);
        }
      } else if (imageUrl) {
        // Legacy: use the stored public URL (will fail if bucket is now private)
        setSignedUrl(imageUrl);
      }
    };

    getSignedUrl();
  }, [filePath, imageUrl]);

  if (!filePath && !imageUrl) {
    return null;
  }

  if (loading) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center`}>
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center`}>
        <span className="text-muted-foreground text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <img 
      src={signedUrl} 
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
};
