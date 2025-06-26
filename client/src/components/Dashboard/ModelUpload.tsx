import { useState, useCallback } from 'react';
import { CloudUpload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUploadModel } from '@/hooks/useLocalAPI';
import { useNotifications } from '@/hooks/useNotifications';

export function ModelUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadMutation = useUploadModel();
  const { addNotification } = useNotifications();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const validExtensions = ['.gguf', '.bin'];
    const isValidFile = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValidFile) {
      addNotification({
        type: 'error',
        title: 'Invalid File',
        message: 'Please upload a .gguf or .bin file',
      });
      return;
    }

    try {
      setUploadProgress(0);
      await uploadMutation.mutateAsync(file);
      setUploadProgress(100);
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Model uploaded successfully',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: error instanceof Error ? error.message : 'Failed to upload model',
      });
    }
  };

  return (
    <Card className="modern-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CloudUpload className="h-5 w-5 text-primary" />
          </div>
          Upload Model
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer group ${
            dragActive
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <div className="relative">
            <CloudUpload className={`mx-auto h-16 w-16 mb-6 transition-all duration-300 ${
              dragActive 
                ? 'text-primary scale-110' 
                : 'text-muted-foreground group-hover:text-primary group-hover:scale-110'
            }`} />
            {dragActive && (
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">
              {dragActive ? 'Drop your model file here' : 'Upload Model File'}
            </p>
            <p className="text-muted-foreground">
              {dragActive ? 'Release to upload' : 'Drag & drop or click to browse'}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Supports .gguf, .bin files up to 10GB
            </div>
          </div>
          
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".gguf,.bin"
            onChange={handleFileInput}
          />
        </div>

        {uploadMutation.isPending && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Uploading model...</span>
              <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
