import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  HardDrive, 
  TrendingDown, 
  Database, 
  Archive,
  BarChart3
} from 'lucide-react';
import { useStats } from '@/hooks/useFiles';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

interface StorageStatsProps {
  fileCount?: number;
}

export const StorageStats: React.FC<StorageStatsProps> = ({ fileCount = 0 }) => {
  const { stats, loading, error } = useStats();

  if (loading) {
    return (
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Storage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Storage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              {error || 'Unable to load statistics'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const quotaUsedPercentage = Math.min(stats.quota_used_percentage || 0, 100);
  const savingsPercentage = stats.storage_savings_percentage || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Quota Usage */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <HardDrive className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Storage Quota</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Used</span>
              <span className="font-mono">
                {formatFileSize(stats.original_storage_used_bytes || 0)} / {stats.storage_quota_mb || 0}MB
              </span>
            </div>
            <Progress 
              value={quotaUsedPercentage} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {(quotaUsedPercentage || 0).toFixed(1)}% of quota used
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actual Storage Used */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Actual Storage</h3>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-mono">
              {formatFileSize(stats.total_storage_used_bytes || 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              Physical space used
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Deduplication Savings */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold">Space Saved</h3>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-mono text-green-400">
              {formatFileSize(stats.storage_savings_bytes || 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              {(savingsPercentage || 0).toFixed(1)}% savings
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File Count */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Archive className="w-5 h-5 text-orange-400" />
            <h3 className="font-semibold">Files</h3>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-mono">
              {fileCount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Total files stored
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};