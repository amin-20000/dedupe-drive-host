import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react';
import axios from 'axios';

interface UploadedFile {
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  hash?: string;
  error?: string;
}

export const FileUpload: React.FC<{ onUploadComplete: () => void }> = ({ onUploadComplete }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const uploadFile = async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadedFiles(prev => 
              prev.map(f => 
                f.name === file.name && f.status === 'uploading'
                  ? { ...f, progress }
                  : f
              )
            );
          }
        },
      });

      setUploadedFiles(prev => 
        prev.map(f => 
          f.name === file.name && f.status === 'uploading'
            ? { ...f, status: 'success', progress: 100, hash: response.data.hash }
            : f
        )
      );

      toast({
        title: "File uploaded successfully!",
        description: `${file.name} has been added to your vault.`,
      });

      onUploadComplete();

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Upload failed';
      setUploadedFiles(prev => 
        prev.map(f => 
          f.name === file.name && f.status === 'uploading'
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      );

      toast({
        title: "Upload failed",
        description: `${file.name}: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Add files to upload queue
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      name: file.name,
      size: file.size,
      status: 'uploading' as const,
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload each file
    acceptedFiles.forEach(uploadFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <Card className="bg-gradient-card border-border border-dashed border-2 hover:border-primary transition-colors">
        <CardContent className="p-8">
          <div 
            {...getRootProps()} 
            className={`cursor-pointer text-center transition-all duration-300 ${
              isDragActive ? 'scale-105' : ''
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-full bg-primary/10 transition-colors ${
                isDragActive ? 'bg-primary/20' : ''
              }`}>
                <Upload className={`w-8 h-8 transition-colors ${
                  isDragActive ? 'text-primary-glow' : 'text-primary'
                }`} />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">
                  {isDragActive ? 'Drop files here' : 'Upload files to your vault'}
                </h3>
                <p className="text-muted-foreground mt-1">
                  Drag & drop files here, or click to select files
                </p>
              </div>
              
              <Button variant="outline" type="button">
                Select Files
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadedFiles.length > 0 && (
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <File className="w-4 h-4" />
              Upload Progress
            </h4>
            
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {file.status === 'success' && (
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                      )}
                      {file.status === 'uploading' && (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.name)}
                      className="p-1 h-6 w-6"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="h-2" />
                  )}
                  
                  {file.status === 'error' && file.error && (
                    <p className="text-xs text-destructive">{file.error}</p>
                  )}
                  
                  {file.status === 'success' && file.hash && (
                    <p className="text-xs text-success">
                      Upload complete • Hash: {file.hash.substring(0, 8)}...
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};