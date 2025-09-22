import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { FileUpload } from './FileUpload';
import { FileList } from './FileList';
import { FileSearch } from './FileSearch';
import { StorageStats } from './StorageStats';
import { LogOut, Shield, Upload as UploadIcon, Search, BarChart3 } from 'lucide-react';
import { SearchFilters, useFiles } from '@/hooks/useFiles';
import vaultLogo from '@/assets/vault-logo.png';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'files' | 'stats'>('upload');
  const [fileCount, setFileCount] = useState(0);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null);
  const { searchFiles, loadFiles } = useFiles();

  const handleUploadComplete = () => {
    // Refresh file list when upload completes
    window.dispatchEvent(new CustomEvent('fileUploaded'));
  };

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    setIsSearchActive(true);
  };

  const handleClearSearch = () => {
    setSearchFilters(null);
    setIsSearchActive(false);
  };

  return (
    <div className="min-h-screen bg-gradient-vault">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={vaultLogo} alt="SecureVault" className="w-8 h-8" />
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                SecureVault
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Welcome, {user?.username}</span>
              </div>
              
              <Button variant="ghost" onClick={logout} size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8">
            <Button
              variant={activeTab === 'upload' ? 'default' : 'vault'}
              onClick={() => setActiveTab('upload')}
              className="flex items-center gap-2"
            >
              <UploadIcon className="w-4 h-4" />
              Upload Files
            </Button>
            <Button
              variant={activeTab === 'files' ? 'default' : 'vault'}
              onClick={() => setActiveTab('files')}
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              My Files ({fileCount})
            </Button>
            <Button
              variant={activeTab === 'stats' ? 'default' : 'vault'}
              onClick={() => setActiveTab('stats')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Statistics
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'upload' && (
            <div className="animate-slide-up">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Upload Files</h2>
                <p className="text-muted-foreground">
                  Securely store your files with automatic deduplication and encryption.
                </p>
              </div>
              
              <FileUpload onUploadComplete={handleUploadComplete} />
            </div>
          )}

          {activeTab === 'files' && (
            <div className="animate-slide-up">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">My Files</h2>
                <p className="text-muted-foreground">
                  Manage and access your secure file vault.
                </p>
              </div>
              
              <FileSearch 
                onSearch={handleSearch}
                onClearSearch={handleClearSearch}
                isSearchActive={isSearchActive}
              />
              
              <FileList 
                onFileCountChange={setFileCount} 
                searchFilters={searchFilters}
                isSearchActive={isSearchActive}
              />
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="animate-slide-up">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Storage Statistics</h2>
                <p className="text-muted-foreground">
                  Monitor your storage usage and deduplication savings.
                </p>
              </div>
              
              <StorageStats fileCount={fileCount} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};