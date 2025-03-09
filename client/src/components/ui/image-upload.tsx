import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from "firebase/storage";
import { app } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";

interface ImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  onRemove: (url: string) => void;
}

export function ImageUpload({ value, onChange, onRemove }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  let storage: FirebaseStorage | undefined;
  try {
    storage = getStorage(app);
    console.log("Firebase Storage initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Firebase Storage:", error);
    toast({
      title: "Storage Error",
      description: "Failed to initialize storage. Please check your Firebase configuration.",
      variant: "destructive",
    });
  }

  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Starting upload process for file:', file.name);

    if (!user) {
      console.log('User not authenticated');
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload images",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!supportedTypes.includes(file.type)) {
      console.log('Invalid file type:', file.type);
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, JPEG, PNG, or GIF image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      console.log('File too large:', file.size);
      toast({
        title: "File too large",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!storage) {
        throw new Error("Storage not initialized");
      }

      setIsUploading(true);
      console.log('Starting upload process...');
      console.log('User authenticated:', !!user?.uid);

      // Create a unique file path with timestamp and user ID
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${timestamp}-${user.uid}-${sanitizedFileName}`;
      const storageRef = ref(storage, `property-images/${fileName}`);
      console.log('Created storage reference:', `property-images/${fileName}`);

      // Log Storage bucket info
      console.log('Storage bucket:', storage.app.options.storageBucket);
      console.log('Current origin:', window.location.origin);

      try {
        console.log('Attempting upload...');

        // Convert file to ArrayBuffer
        const fileBuffer = await file.arrayBuffer();

        // Create a new Blob with the correct content type
        const blob = new Blob([fileBuffer], { type: file.type });

        // Add metadata including CORS headers
        const metadata = {
          contentType: file.type,
          customMetadata: {
            'origin': window.location.origin,
            'user-id': user.uid,
            'filename': fileName
          },
          cacheControl: 'public,max-age=3600',
        };

        console.log('Uploading with metadata:', metadata);

        const uploadResult = await uploadBytes(storageRef, blob, metadata);
        console.log('Upload completed:', uploadResult);

        if (!uploadResult) {
          throw new Error("Upload failed - no upload result returned");
        }

        console.log('Getting download URL...');
        const url = await getDownloadURL(uploadResult.ref);
        console.log('Got download URL:', url);

        if (!url) {
          throw new Error("Failed to get download URL");
        }

        onChange([...value, url]);

        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      } catch (uploadError: any) {
        console.error("Upload operation error:", uploadError);
        console.error("Error code:", uploadError.code);
        console.error("Error message:", uploadError.message);
        console.error("Error details:", uploadError.serverResponse);
        console.error("Current origin:", window.location.origin);
        console.error("Storage bucket:", storage.app.options.storageBucket);

        let errorMessage = "Failed to upload image. Please try again.";

        if (uploadError.code === 'storage/unauthorized') {
          errorMessage = "Permission denied. Please check your Firebase Storage rules.";
        } else if (uploadError.code === 'storage/canceled') {
          errorMessage = "Upload was canceled.";
        } else if (uploadError.code === 'storage/unknown') {
          errorMessage = "An unknown error occurred. Please try again.";
        }

        toast({
          title: "Upload failed",
          description: errorMessage,
          variant: "destructive",
        });

        throw uploadError;
      }
    } catch (error: any) {
      console.error("General error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Storage bucket used:", storage?.app.options.storageBucket);
      console.error("Current origin:", window.location.origin);

      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [value, onChange, toast, storage, user]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {value.map((url) => (
          <div key={url} className="relative aspect-square">
            <img
              src={url}
              alt="Property"
              className="object-cover w-full h-full rounded-lg"
            />
            <button
              type="button"
              onClick={() => onRemove(url)}
              className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading || !user}
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              "Upload Image"
            )}
          </Button>
          <input
            id="image-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            className="hidden"
            onChange={handleUpload}
            disabled={isUploading}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {!user ? (
            "Please sign in to upload images."
          ) : (
            "Supported formats: JPG, JPEG, PNG, GIF. Maximum size: 5MB per image. For best quality, use images at least 800x600 pixels."
          )}
        </p>
      </div>
    </div>
  );
}