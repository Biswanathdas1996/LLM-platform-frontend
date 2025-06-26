import { useState, useCallback, useEffect } from 'react';
import { CloudUpload, Upload, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUploadModel } from '@/hooks/useLocalAPI';
import { useNotifications } from '@/hooks/useNotifications';

export function ModelUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const uploadMutation = useUploadModel();
  const { addNotification } = useNotifications();

  // Simulate upload progress
  useEffect(() => {
    if (uploadMutation.isPending && uploadProgress < 100) {
      const timer = setInterval(() => {
        setUploadProgress(prev => {
          const increment = Math.random() * 15 + 5;
          return Math.min(prev + increment, 95);
        });
      }, 500);
      return () => clearInterval(timer);
    }
  }, [uploadMutation.isPending, uploadProgress]);

  // Reset state when upload completes
  useEffect(() => {
    if (uploadMutation.isSuccess) {
      setUploadProgress(100);
      setUploadState('success');
      setTimeout(() => {
        setUploadState('idle');
        setUploadProgress(0);
        setFileName('');
        setFileSize(0);
      }, 3000);
    }
    if (uploadMutation.isError) {
      setUploadState('error');
      setTimeout(() => {
        setUploadState('idle');
        setUploadProgress(0);
        setFileName('');
        setFileSize(0);
      }, 3000);
    }
  }, [uploadMutation.isSuccess, uploadMutation.isError]);

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
      setUploadState('error');
      addNotification({
        type: 'error',
        title: 'Invalid File',
        message: 'Please upload a .gguf or .bin file',
      });
      return;
    }

    try {
      setUploadProgress(0);
      setUploadState('uploading');
      setFileName(file.name);
      setFileSize(file.size);
      
      await uploadMutation.mutateAsync(file);
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Model uploaded successfully',
      });
    } catch (error) {
      setUploadState('error');
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: error instanceof Error ? error.message : 'Failed to upload model',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUploadIcon = () => {
    switch (uploadState) {
      case 'uploading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case 'success':
        return <Check className="h-8 w-8 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <CloudUpload className={`h-8 w-8 transition-colors ${
          dragActive 
            ? 'text-primary' 
            : 'text-muted-foreground hover:text-primary'
        }`} />;
    }
  };

  return (
    <Card className="modern-card overflow-hidden border-2 border-blue-200/60 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 backdrop-blur-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group">
      <CardHeader className="relative">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
            <Upload className="h-5 w-5 text-white drop-shadow-sm" />
          </div>
          Model Upload
        </CardTitle>
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-5 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-bl-full"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            dragActive
              ? 'border-primary bg-primary/5'
              : uploadState === 'uploading'
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : uploadState === 'success'
              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
              : uploadState === 'error'
              ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
              : 'border-muted-foreground/25 hover:border-primary hover:bg-muted/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => uploadState === 'idle' && document.getElementById('file-upload')?.click()}
        >
          <div className="flex flex-col items-center space-y-4">
            {getUploadIcon()}
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground">
                {uploadState === 'uploading' ? 'Uploading...' :
                 uploadState === 'success' ? 'Upload Complete' :
                 uploadState === 'error' ? 'Upload Failed' :
                 dragActive ? 'Drop to Upload' : 'Upload Model'}
              </h3>
              
              <p className="text-sm text-muted-foreground">
                {uploadState === 'uploading' ? fileName :
                 uploadState === 'success' ? 'Model uploaded successfully' :
                 uploadState === 'error' ? 'Please try again' :
                 'Drag & drop or click to browse (.gguf, .bin files)'}
              </p>
            </div>
            
            {fileName && uploadState !== 'idle' && (
              <div className="text-xs text-muted-foreground">
                {formatFileSize(fileSize)}
              </div>
            )}
          </div>
          
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".gguf,.bin"
            onChange={handleFileInput}
            disabled={uploadState !== 'idle'}
          />
        </div>

        {(uploadMutation.isPending || uploadState === 'uploading') && (
          <div className="mt-4 space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Uploading...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
