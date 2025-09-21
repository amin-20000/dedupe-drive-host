import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';
import { useFiles, SearchFilters } from '@/hooks/useFiles';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const mimeTypes = [
  { value: '', label: 'All Types' },
  { value: 'image/jpeg', label: 'JPEG Images' },
  { value: 'image/png', label: 'PNG Images' },
  { value: 'image/gif', label: 'GIF Images' },
  { value: 'application/pdf', label: 'PDF Documents' },
  { value: 'text/plain', label: 'Text Files' },
  { value: 'application/zip', label: 'ZIP Archives' },
  { value: 'video/mp4', label: 'MP4 Videos' },
  { value: 'audio/mpeg', label: 'MP3 Audio' },
];

const sizePresets = [
  { value: '', label: 'Any Size' },
  { value: '0-1024', label: 'Small (< 1KB)' },
  { value: '1024-102400', label: 'Medium (1KB - 100KB)' },
  { value: '102400-1048576', label: 'Large (100KB - 1MB)' },
  { value: '1048576-', label: 'Very Large (> 1MB)' },
];

interface FileSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClearSearch: () => void;
  isSearchActive: boolean;
}

export const FileSearch: React.FC<FileSearchProps> = ({ 
  onSearch, 
  onClearSearch, 
  isSearchActive 
}) => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleSearch = () => {
    const cleanFilters: SearchFilters = {};
    
    if (filters.filename?.trim()) {
      cleanFilters.filename = filters.filename.trim();
    }
    if (filters.mime_type) {
      cleanFilters.mime_type = filters.mime_type;
    }
    if (filters.min_size_bytes) {
      cleanFilters.min_size_bytes = filters.min_size_bytes;
    }
    if (filters.max_size_bytes) {
      cleanFilters.max_size_bytes = filters.max_size_bytes;
    }
    if (filters.start_date) {
      cleanFilters.start_date = filters.start_date;
    }
    if (filters.end_date) {
      cleanFilters.end_date = filters.end_date;
    }

    onSearch(cleanFilters);
  };

  const handleClear = () => {
    setFilters({});
    onClearSearch();
  };

  const handleSizePresetChange = (preset: string) => {
    if (!preset) {
      setFilters(prev => ({ 
        ...prev, 
        min_size_bytes: undefined, 
        max_size_bytes: undefined 
      }));
      return;
    }

    const [min, max] = preset.split('-');
    setFilters(prev => ({
      ...prev,
      min_size_bytes: min ? parseInt(min) : undefined,
      max_size_bytes: max ? parseInt(max) : undefined
    }));
  };

  const getCurrentSizePreset = () => {
    const { min_size_bytes, max_size_bytes } = filters;
    if (!min_size_bytes && !max_size_bytes) return '';
    
    return sizePresets.find(preset => {
      if (!preset.value) return false;
      const [min, max] = preset.value.split('-');
      return (
        (!min || parseInt(min) === min_size_bytes) &&
        (!max || parseInt(max) === max_size_bytes)
      );
    })?.value || 'custom';
  };

  return (
    <Card className="bg-gradient-card border-border mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Search Files
          {isSearchActive && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleClear}
              className="ml-auto text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4 mr-1" />
              Clear Search
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search by filename..."
              value={filters.filename || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, filename: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File Type */}
              <div className="space-y-2">
                <Label>File Type</Label>
                <Select 
                  value={filters.mime_type || ''} 
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    mime_type: value || undefined 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select file type" />
                  </SelectTrigger>
                  <SelectContent>
                    {mimeTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Size */}
              <div className="space-y-2">
                <Label>File Size</Label>
                <Select 
                  value={getCurrentSizePreset()}
                  onValueChange={handleSizePresetChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size range" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizePresets.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Size Range */}
              {getCurrentSizePreset() === 'custom' && (
                <>
                  <div className="space-y-2">
                    <Label>Min Size (bytes)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.min_size_bytes || ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        min_size_bytes: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Size (bytes)</Label>
                    <Input
                      type="number"
                      placeholder="No limit"
                      value={filters.max_size_bytes || ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        max_size_bytes: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                    />
                  </div>
                </>
              )}

              {/* Date Range */}
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    start_date: e.target.value || undefined 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    end_date: e.target.value || undefined 
                  }))}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};