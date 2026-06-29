import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, Loader2, Upload, Search, Trash2, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface WorkspaceFilesProps {
  contractId: string;
}

interface WorkspaceFile {
  id: string;
  contractId: string;
  conversationId: string | null;
  uploaderId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploader: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}export function WorkspaceFiles({ contractId }: WorkspaceFilesProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const { data: files, isLoading } = useQuery({
    queryKey: ['workspace-files', contractId],
    queryFn: async () => {
      const response = await api.get(`/workspace/files/${contractId}`);
      return response.data as WorkspaceFile[];
    },
    enabled: !!contractId,
  });

  // Join contract room for real-time updates
  useEffect(() => {
    if (socket && contractId) {
      socket.emit('join_contract', { contractId });

      socket.on('file_uploaded', (file: WorkspaceFile) => {
        queryClient.setQueryData(['workspace-files', contractId], (oldData: WorkspaceFile[] | undefined) => {
          return [file, ...(oldData || [])];
        });
      });

      socket.on('file_deleted', ({ fileId }: { fileId: string }) => {
        queryClient.setQueryData(['workspace-files', contractId], (oldData: WorkspaceFile[] | undefined) => {
          return oldData?.filter(f => f.id !== fileId) || [];
        });
      });

      return () => {
        socket.emit('leave_contract', { contractId });
        socket.off('file_uploaded');
        socket.off('file_deleted');
      };
    }
  }, [socket, contractId, queryClient]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // First upload the file
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Then create the workspace file record
      const fileResponse = await api.post(`/workspace/files/${contractId}`, {
        fileName: uploadResponse.data.fileName,
        fileUrl: uploadResponse.data.fileUrl,
        publicId: uploadResponse.data.publicId,
        mimeType: uploadResponse.data.mimeType,
        size: uploadResponse.data.size,
      });

      // Emit socket event for real-time update
      if (socket) {
        socket.emit('file_uploaded', { contractId, file: fileResponse.data });
      }

      return fileResponse.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-files', contractId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await api.delete(`/workspace/files/${contractId}/${fileId}`);
      
      // Emit socket event for real-time update
      if (socket) {
        socket.emit('file_deleted', { contractId, fileId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-files', contractId] });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      alert('File size exceeds 20MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Allowed: JPG, PNG, WEBP, PDF, DOC, DOCX, ZIP');
      return;
    }

    setUploading(true);
    try {
      await uploadMutation.mutateAsync(file);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    
    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      alert('File size exceeds 20MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Allowed: JPG, PNG, WEBP, PDF, DOC, DOCX, ZIP');
      return;
    }

    setUploading(true);
    try {
      await uploadMutation.mutateAsync(file);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const filteredFiles = files?.filter(file =>
    file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">Shared Files</h2>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
            className="hidden"
            disabled={uploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-border/50'
          }`}
        >
          <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">
            {isDragging ? 'Drop file here' : 'Drag & drop files here or click Upload'}
          </p>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16">
            <FileText className="w-12 h-12 text-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">No Files</h3>
            <p className="text-sm text-text-muted text-center max-w-sm">
              {searchQuery ? 'No files match your search.' : 'No files have been shared yet. Upload a file to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="bg-background border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow group"
              >
                {isImage(file.mimeType) ? (
                  <div className="aspect-square">
                    <img
                      src={file.fileUrl}
                      alt={file.fileName}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => window.open(file.fileUrl, '_blank')}
                    />
                  </div>
                ) : (
                  <div className="aspect-square flex items-center justify-center bg-primary/5">
                    <FileText className="w-12 h-12 text-primary" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-medium text-text truncate" title={file.fileName}>
                    {file.fileName}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{formatFileSize(file.size)}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={async () => {
                        try {
                          const response = await api.get('/download', {
                            params: {
                              url: file.fileUrl,
                              fileName: file.fileName,
                            },
                            responseType: 'blob',
                          });
                          
                          const blob = new Blob([response.data]);
                          const downloadUrl = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = downloadUrl;
                          link.download = file.fileName;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(downloadUrl);
                        } catch (error) {
                          console.error('Download failed:', error);
                          alert('Failed to download file');
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-accent hover:text-accent/90"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                    {file.uploaderId === user?.id && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this file?')) {
                            deleteMutation.mutate(file.id);
                          }
                        }}
                        className="p-1 hover:bg-background rounded text-text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
