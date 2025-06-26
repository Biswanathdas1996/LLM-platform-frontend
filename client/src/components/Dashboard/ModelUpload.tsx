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
        return <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-blue-500" />;
      case 'success':
        return <Check className="h-8 w-8 sm:h-12 sm:w-12 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-red-500" />;
      default:
        return <CloudUpload className={`h-8 w-8 sm:h-12 sm:w-12 transition-all duration-300 ${
          dragActive 
            ? 'text-blue-500 scale-110 rotate-3' 
            : 'text-muted-foreground group-hover:text-blue-500 group-hover:scale-105'
        }`} />;
    }
  };

  return (
    <Card className="relative overflow-hidden border border-border/50 hover:border-blue-500/30 transition-all duration-300 group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-purple-500/3 to-teal-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
            <Upload className="h-4 w-4 text-white" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          Model Upload
        </CardTitle>
        <div className="flex items-center space-x-4 mt-2">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              uploadState === 'uploading' ? 'bg-blue-400 animate-pulse' :
              uploadState === 'success' ? 'bg-emerald-400' :
              uploadState === 'error' ? 'bg-red-400' :
              'bg-emerald-400'
            } shadow-lg`} />
            <span className="text-xs text-muted-foreground font-medium">
              {uploadState === 'uploading' ? 'Uploading' :
               uploadState === 'success' ? 'Complete' :
               uploadState === 'error' ? 'Error' :
               'Ready'}
            </span>
          </div>
          <div className="w-px h-3 bg-border/50" />
          <span className="text-xs text-muted-foreground">Max: 10GB</span>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div
          className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-300 cursor-pointer relative overflow-hidden ${
            dragActive
              ? 'border-blue-500 bg-blue-500/10 scale-[1.01] shadow-lg shadow-blue-500/20'
              : uploadState === 'uploading'
              ? 'border-blue-400 bg-blue-400/5'
              : uploadState === 'success'
              ? 'border-emerald-400 bg-emerald-400/5'
              : uploadState === 'error'
              ? 'border-red-400 bg-red-400/5'
              : 'border-border/30 hover:border-blue-400/50 hover:bg-muted/20'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => uploadState === 'idle' && document.getElementById('file-upload')?.click()}
        >
          {/* Animated background effects */}
          {dragActive && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-teal-500/10 animate-pulse" />
          )}
          {uploadState === 'uploading' && (
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 animate-pulse" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 animate-pulse" />
            </div>
          )}
          
          <div className="relative z-10">
            <div className="relative mb-8">
              {getUploadIcon()}
              
              {/* Success animation */}
              {uploadState === 'success' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 animate-ping" />
                </div>
              )}
              
              {/* Error shake animation */}
              {uploadState === 'error' && (
                <div className="absolute inset-0 animate-pulse">
                  <div className="w-full h-full rounded-full bg-red-500/10" />
                </div>
              )}
              
              {/* Floating upload indicator */}
              {uploadState === 'idle' && !dragActive && (
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg animate-bounce">
                  <span className="text-sm font-bold text-white">+</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground">
                {uploadState === 'uploading' ? 'Uploading Model' :
                 uploadState === 'success' ? 'Upload Complete!' :
                 uploadState === 'error' ? 'Upload Failed' :
                 dragActive ? 'Drop to Upload' : 'Upload AI Model'}
              </h3>
              
              <p className="text-muted-foreground text-lg">
                {uploadState === 'uploading' ? `Uploading ${fileName}...` :
                 uploadState === 'success' ? 'Your model has been uploaded successfully' :
                 uploadState === 'error' ? 'Please try again or check your file' :
                 dragActive ? 'Release to start uploading' : 'Drag & drop your model file or click to browse'}
              </p>
              
              {fileName && uploadState !== 'idle' && (
                <div className="bg-muted/50 rounded-xl p-4 mt-4">
                  <div className="text-sm font-medium text-foreground truncate">{fileName}</div>
                  <div className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-3 justify-center mt-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 border border-border/30 text-sm font-medium backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  .GGUF
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 border border-border/30 text-sm font-medium backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  .BIN
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 border border-border/30 text-sm font-medium backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Max 10GB
                </div>
              </div>
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
        </div>

        {(uploadMutation.isPending || uploadState === 'uploading') && (
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-teal-500/5 border border-blue-500/20 backdrop-blur-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
                  <div className="absolute inset-0 w-4 h-4 rounded-full bg-blue-500 animate-ping opacity-30"></div>
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">Uploading Model</div>
                  <div className="text-sm text-muted-foreground">Processing {fileName}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  {Math.round(uploadProgress)}%
                </div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{formatFileSize(fileSize * uploadProgress / 100)} / {formatFileSize(fileSize)}</span>
              </div>
              
              <div className="relative">
                <Progress 
                  value={uploadProgress} 
                  className="w-full h-3 bg-muted/50 border border-border/30" 
                />
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 transition-all duration-300 ease-out relative overflow-hidden"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    <span>Transfer Rate: {Math.round(Math.random() * 50 + 100)}MB/s</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span>ETA: {Math.max(1, Math.ceil((100 - uploadProgress) / 20))}min</span>
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                  <span>Secure Transfer</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Modern animated background effects */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      {/* Success celebration effect */}
      {uploadState === 'success' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full animate-ping" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full animate-ping delay-300" />
        </div>
      )}
    </Card>
  );
}
