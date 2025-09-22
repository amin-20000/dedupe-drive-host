import { useState, useEffect } from 'react';
import axios from 'axios';

// Set base URL for axios
axios.defaults.baseURL = 'http://localhost:8080';

export interface FileItem {
  id: number;
  filename: string;
  size_bytes: number;
  mime_type: string;
  created_at: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalFiles: number;
}

export interface FileListResponse {
  files: FileItem[];
  pagination: Pagination;
}

export interface SearchFilters {
  filename?: string;
  mime_type?: string;
  min_size_bytes?: number;
  max_size_bytes?: number;
  start_date?: string;
  end_date?: string;
}

export interface StorageStats {
  total_storage_used_bytes: number;
  original_storage_used_bytes: number;
  storage_savings_bytes: number;
  storage_savings_percentage: number;
  storage_quota_mb: number;
  quota_used_percentage: number;
}

export const useFiles = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalFiles: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = async (page: number = 1, pageSize: number = 20) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<FileListResponse>('/files', {
        params: { page, pageSize }
      });
      setFiles(response.data.files);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const searchFiles = async (
    filters: SearchFilters,
    page: number = 1,
    pageSize: number = 20
  ) => {
    setLoading(true);
    setError(null);
    try {
      // Clean up filters - remove empty values
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      const response = await axios.get<FileListResponse>('/search', {
        params: { ...cleanFilters, page, pageSize }
      });
      setFiles(response.data.files);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: number) => {
    try {
      await axios.delete(`/files/${fileId}/delete`);
      // Reload current page
      await loadFiles(pagination.currentPage);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Delete failed');
      return false;
    }
  };

  const downloadFile = async (fileId: number, filename: string) => {
    try {
      const response = await axios.get(`/files/${fileId}/download`, {
        responseType: 'blob'
      });
      
      // Create blob link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Download failed');
    }
  };

  return {
    files,
    pagination,
    loading,
    error,
    loadFiles,
    searchFiles,
    deleteFile,
    downloadFile
  };
};

export const useStats = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<StorageStats>('/stats');
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return { stats, loading, error, loadStats };
};