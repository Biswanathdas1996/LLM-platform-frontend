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
    <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
          Upload Model
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragActive
              ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <CloudUpload className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
          <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Drop your model file here
          </p>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            or click to browse
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Supports .gguf, .bin files up to 10GB
          </p>
          
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".gguf,.bin"
            onChange={handleFileInput}
          />
        </div>

        {uploadMutation.isPending && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Uploading model...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
