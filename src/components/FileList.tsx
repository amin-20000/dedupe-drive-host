import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  Download, 
  Trash2, 
  Eye, 
  FileText, 
  Image, 
  File,
  Music,
  Video,
  Archive
} from 'lucide-react';
import { useFiles, FileItem, SearchFilters } from '@/hooks/useFiles';
import { useToast } from '@/hooks/use-toast';
import { FilePreview } from './FilePreview';

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
  if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
  if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4" />;
  if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="w-4 h-4" />;
  if (mimeType.includes('zip') || mimeType.includes('archive')) return <Archive className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
};

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
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface FileListProps {
  onFileCountChange?: (count: number) => void;
  searchFilters?: SearchFilters | null;
  isSearchActive?: boolean;
}

export const FileList: React.FC<FileListProps> = ({ 
  onFileCountChange, 
  searchFilters, 
  isSearchActive 
}) => {
  const { files, pagination, loading, error, loadFiles, searchFiles, deleteFile, downloadFile } = useFiles();
  const { toast } = useToast();
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const loadFilesData = async (page: number = 1) => {
    if (isSearchActive && searchFilters) {
      await searchFiles(searchFilters, page);
    } else {
      await loadFiles(page);
    }
    onFileCountChange?.(pagination.totalFiles);
  };

  useEffect(() => {
    loadFilesData();
    
    // Listen for file upload events
    const handleFileUploaded = () => {
      if (!isSearchActive) {
        loadFiles();
      }
    };
    
    window.addEventListener('fileUploaded', handleFileUploaded);
    return () => window.removeEventListener('fileUploaded', handleFileUploaded);
  }, [searchFilters, isSearchActive]);

  useEffect(() => {
    onFileCountChange?.(pagination.totalFiles);
  }, [pagination.totalFiles, onFileCountChange]);

  const handleDelete = async (file: FileItem) => {
    if (window.confirm(`Are you sure you want to delete "${file.filename}"?`)) {
      const success = await deleteFile(file.id);
      if (success) {
        toast({
          title: "File deleted",
          description: `${file.filename} has been successfully deleted.`,
        });
      } else {
        toast({
          title: "Delete failed",
          description: error || "Failed to delete file",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownload = (file: FileItem) => {
    downloadFile(file.id, file.filename);
    toast({
      title: "Download started",
      description: `Downloading ${file.filename}...`,
    });
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadFilesData(page);
    }
  };

  if (loading && files.length === 0) {
    return (
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/4 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Files ({pagination.totalFiles})</span>
            {loading && (
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4 text-destructive">
              {error}
            </div>
          )}

          {files.length === 0 ? (
            <div className="text-center py-8">
              <File className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No files yet</h3>
              <p className="text-muted-foreground">
                Upload some files to get started with your secure vault.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="flex items-center gap-3">
                          {getFileIcon(file.mime_type)}
                          <span className="font-medium truncate max-w-xs" title={file.filename}>
                            {file.filename}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {file.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatFileSize(file.size_bytes)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(file.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewFile(file)}
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(file)}
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(file)}
                              title="Delete"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          className={pagination.currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink 
                            onClick={() => handlePageChange(page)}
                            isActive={page === pagination.currentPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          className={pagination.currentPage === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreview 
          file={previewFile} 
          onClose={() => setPreviewFile(null)}
          onDownload={() => handleDownload(previewFile)}
        />
      )}
    </>
  );
};