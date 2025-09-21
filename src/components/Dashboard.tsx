import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { FileUpload } from './FileUpload';
import { LogOut, Shield, Upload as UploadIcon } from 'lucide-react';
import vaultLogo from '@/assets/vault-logo.png';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'files'>('upload');

  const handleUploadComplete = () => {
    // Refresh file list when upload completes
    // For now, we'll just show a success state
    console.log('Upload completed, would refresh file list here');
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
              My Files
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
              
              <Card className="bg-gradient-card border-border">
                <CardContent className="p-8 text-center">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">File Management</h3>
                  <p className="text-muted-foreground mb-4">
                    File listing, search, and management features will be implemented here.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Coming in the next phase of development...
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};