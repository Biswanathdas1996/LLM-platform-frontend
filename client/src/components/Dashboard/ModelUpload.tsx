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
    <Card className="tech-card group relative overflow-hidden">
      <CardHeader className="pb-4 relative z-10">
        <CardTitle className="text-xl font-bold mono text-foreground flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-code group-hover:shadow-glow transition-all duration-300">
            <CloudUpload className="h-5 w-5 text-white drop-shadow-sm" />
          </div>
          MODEL_UPLOAD
        </CardTitle>
        <div className="flex items-center space-x-4 mt-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow" />
            <span className="text-xs mono text-muted-foreground">READY</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <span className="text-xs mono text-muted-foreground">MAX_SIZE: 10GB</span>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer group-hover:shadow-tech relative overflow-hidden ${
            dragActive
              ? 'border-primary bg-primary/10 scale-[1.02] shadow-glow'
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          {dragActive && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-primary/20 animate-pulse" />
          )}
          
          <div className="relative z-10">
            <div className="relative mb-6">
              <CloudUpload className={`mx-auto h-20 w-20 transition-all duration-500 ${
                dragActive 
                  ? 'text-primary scale-125 rotate-6' 
                  : 'text-muted-foreground group-hover:text-primary group-hover:scale-110'
              }`} />
              {dragActive && (
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse" />
              )}
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">+</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-bold mono text-foreground">
                {dragActive ? 'RELEASE_TO_UPLOAD' : 'NEURAL_MODEL_UPLOAD'}
              </h3>
              <p className="text-muted-foreground mono">
                {dragActive ? 'Processing file transfer...' : 'Drag & drop neural model or click to browse'}
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/50 border border-border/50 text-xs mono">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shadow-glow"></span>
                  .GGUF
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/50 border border-border/50 text-xs mono">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shadow-glow"></span>
                  .BIN
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/50 border border-border/50 text-xs mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow"></span>
                  10GB_MAX
                </div>
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
        </div>

        {uploadMutation.isPending && (
          <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-glow" />
                <span className="text-sm font-medium mono text-foreground">UPLOADING_MODEL</span>
              </div>
              <div className="text-sm mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                {uploadProgress.toString().padStart(3, '0')}%
              </div>
            </div>
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full h-3 bg-muted border border-border/50" />
              <div className="flex justify-between text-xs mono text-muted-foreground">
                <span>TRANSFER_RATE: 125MB/s</span>
                <span>ETA: {Math.ceil((100 - uploadProgress) / 10)}s</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Animated background effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500">
        <div className="h-full w-full gradient-code" />
      </div>
    </Card>
  );
}
