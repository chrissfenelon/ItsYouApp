'use client';

import { useState, useEffect, useRef } from 'react';

interface Photo {
  id: string;
  userId: string;
  deviceId?: string;
  url: string;
  filename: string;
  size: number;
  uploadedAt: Date;
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  async function fetchPhotos() {
    try {
      setLoading(true);
      const response = await fetch('/api/photos?limit=1000');
      const data = await response.json();

      if (data.success) {
        setPhotos(data.photos);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.');
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      setShowUploadModal(true);
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', 'admin-upload');
      formData.append('deviceId', 'admin-panel');

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        alert('Photo uploaded successfully!');
        setShowUploadModal(false);
        resetUploadForm();
        fetchPhotos();
      } else {
        alert('Failed to upload photo: ' + data.error);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo');
    } finally {
      setUploading(false);
    }
  }

  function resetUploadForm() {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleDelete(photoId: string) {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      const response = await fetch('/api/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Photo deleted successfully!');
        setSelectedPhoto(null);
        fetchPhotos();
      } else {
        alert('Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Error deleting photo');
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function handleDownload(photo: Photo) {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Filter and sort photos
  let filteredPhotos = photos.filter(photo => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      photo.userId.toLowerCase().includes(query) ||
      photo.filename.toLowerCase().includes(query) ||
      new Date(photo.uploadedAt).toLocaleDateString().includes(query)
    );
  });

  filteredPhotos = filteredPhotos.sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      case 'oldest':
        return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      case 'largest':
        return b.size - a.size;
      case 'smallest':
        return a.size - b.size;
      default:
        return 0;
    }
  });

  const totalSize = photos.reduce((sum, photo) => sum + photo.size, 0);
  const thisMonth = photos.filter(p => {
    const date = new Date(p.uploadedAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Shared Photos</h2>
          <p className="text-gray-400">View and manage all photos shared by users</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="glass-button px-6 py-3 rounded-lg text-white font-semibold"
        >
          Upload Photo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Photos</p>
              <p className="text-2xl font-bold text-white">{photos.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">This Month</p>
              <p className="text-2xl font-bold text-white">{thisMonth}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Storage Used</p>
              <p className="text-2xl font-bold text-white">{formatFileSize(totalSize)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search photos by user or date..."
              className="glass-input w-full px-4 py-3 pl-12 rounded-lg text-white placeholder-gray-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="glass-input px-4 py-3 rounded-lg text-white"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="largest">Largest Size</option>
            <option value="smallest">Smallest Size</option>
          </select>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="glass-card p-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading photos...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No photos found. Upload some to get started!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhotos.map((photo) => (
                <div key={photo.id} className="glass-input rounded-lg overflow-hidden hover:glass-card hover:scale-[1.02] transition-all duration-300 group">
                  {/* Photo */}
                  <div className="relative aspect-video bg-gradient-to-br from-blue-500/20 to-pink-500/20">
                    <img
                      src={photo.url}
                      alt={photo.filename}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                      <button
                        onClick={() => setSelectedPhoto(photo)}
                        className="glass-button p-3 rounded-lg"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDownload(photo)}
                        className="glass-button p-3 rounded-lg"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(photo.id)}
                        className="glass-button p-3 rounded-lg bg-red-500/20"
                      >
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-semibold truncate">{photo.userId}</h4>
                      <span className="text-gray-400 text-sm">{formatFileSize(photo.size)}</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {new Date(photo.uploadedAt).toLocaleDateString()}
                    </p>
                    {photo.deviceId && (
                      <p className="text-gray-500 text-xs mt-1 truncate">
                        Device: {photo.deviceId}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
              <p className="text-gray-400 text-sm">
                Showing {filteredPhotos.length} of {photos.length} photos
              </p>
            </div>
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-8 max-w-lg w-full mx-4">
            <h3 className="text-2xl font-bold text-white mb-6">Upload Photo</h3>

            <div className="space-y-4">
              {previewUrl && (
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-800">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Selected File
                </label>
                <p className="text-white text-sm glass-input p-3 rounded-lg">
                  {selectedFile?.name}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {selectedFile && formatFileSize(selectedFile.size)}
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadForm();
                  }}
                  disabled={uploading}
                  className="flex-1 glass-input px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  className="flex-1 glass-button px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="glass-card p-6 max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">Photo Details</h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="glass-input p-2 rounded-lg hover:glass-button transition-all"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="rounded-lg overflow-hidden bg-gray-900 mb-4">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.filename}
                className="w-full max-h-[60vh] object-contain"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 glass-input p-4 rounded-lg">
              <div>
                <p className="text-gray-400 text-sm">User</p>
                <p className="text-white font-semibold">{selectedPhoto.userId}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Filename</p>
                <p className="text-white font-semibold truncate">{selectedPhoto.filename}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Size</p>
                <p className="text-white font-semibold">{formatFileSize(selectedPhoto.size)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Upload Date</p>
                <p className="text-white font-semibold">
                  {new Date(selectedPhoto.uploadedAt).toLocaleString()}
                </p>
              </div>
              {selectedPhoto.deviceId && (
                <div className="col-span-2">
                  <p className="text-gray-400 text-sm">Device ID</p>
                  <p className="text-white font-semibold">{selectedPhoto.deviceId}</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => handleDownload(selectedPhoto)}
                className="flex-1 glass-button px-6 py-3 rounded-lg text-white font-semibold"
              >
                Download
              </button>
              <button
                onClick={() => handleDelete(selectedPhoto.id)}
                className="flex-1 glass-input px-6 py-3 rounded-lg text-red-400 font-semibold hover:bg-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
