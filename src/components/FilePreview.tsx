import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Play, 
  Volume2,
  Archive,
  File,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { FileItem } from '@/hooks/useFiles';

interface FilePreviewProps {
  file: FileItem;
  onClose: () => void;
  onDownload: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const FilePreview: React.FC<FilePreviewProps> = ({ file, onClose, onDownload }) => {
  const [imageError, setImageError] = useState(false);
  
  const getFileUrl = () => {
    return `${axios.defaults.baseURL}/files/${file.id}/download`;
  };

  const renderPreview = () => {
    const mimeType = file.mime_type.toLowerCase();

    // Images
    if (mimeType.startsWith('image/') && !imageError) {
      return (
        <div className="flex-1 flex items-center justify-center bg-muted/20 rounded-lg overflow-hidden">
          <img
            src={getFileUrl()}
            alt={file.filename}
            className="max-w-full max-h-full object-contain"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    // PDFs
    if (mimeType.includes('pdf')) {
      return (
        <div className="flex-1 bg-muted/20 rounded-lg overflow-hidden">
          <iframe
            src={`${getFileUrl()}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
            className="w-full h-full min-h-[500px]"
            title={file.filename}
          />
        </div>
      );
    }

    // Text files
    if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml')) {
      return (
        <div className="flex-1 bg-muted/20 rounded-lg p-6 overflow-auto">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5" />
            <span className="text-sm text-muted-foreground">Text Preview</span>
          </div>
          <iframe
            src={getFileUrl()}
            className="w-full h-64 border border-border rounded"
            title={file.filename}
          />
        </div>
      );
    }

    // Audio files
    if (mimeType.startsWith('audio/')) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 rounded-lg p-6">
          <Volume2 className="w-16 h-16 text-muted-foreground mb-4" />
          <audio controls className="w-full max-w-md">
            <source src={getFileUrl()} type={file.mime_type} />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    // Video files
    if (mimeType.startsWith('video/')) {
      return (
        <div className="flex-1 flex items-center justify-center bg-muted/20 rounded-lg overflow-hidden">
          <video controls className="max-w-full max-h-full">
            <source src={getFileUrl()} type={file.mime_type} />
            Your browser does not support the video element.
          </video>
        </div>
      );
    }

    // Fallback for unsupported file types
    const getFileIcon = () => {
      if (mimeType.includes('zip') || mimeType.includes('archive')) {
        return <Archive className="w-16 h-16 text-muted-foreground" />;
      }
      return <File className="w-16 h-16 text-muted-foreground" />;
    };

    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 rounded-lg p-6">
        {getFileIcon()}
        <h3 className="text-lg font-semibold mt-4 mb-2">Preview not available</h3>
        <p className="text-muted-foreground text-center mb-4">
          This file type cannot be previewed in the browser.
          <br />
          Download the file to view its contents.
        </p>
        <Button onClick={onDownload} className="mt-2">
          <Download className="w-4 h-4 mr-2" />
          Download File
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="truncate text-lg font-semibold">
                {file.filename}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="secondary">
                  {file.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatFileSize(file.size_bytes)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(file.created_at)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(getFileUrl(), '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {renderPreview()}
      </DialogContent>
    </Dialog>
  );
};