'use client';

import { useState, useRef } from 'react';
import { useFirebaseAuth } from '../../../hooks/useFirebaseAuth';
import { useMusicPaginated, type MusicTrack } from '../../../hooks/useMusicPaginated';
import LoadingProgress from '../../../components/LoadingProgress';
import { db, storage, collection, addDoc, deleteDoc, updateDoc, doc, Timestamp, ref, uploadBytes, getDownloadURL, deleteObject } from '../../../lib/firebase-client';

export default function MusicPage() {
  const { isAuthenticated } = useFirebaseAuth();

  // Use paginated hook for performance
  const {
    tracks: musicTracks,
    loading,
    hasMore,
    loadMore,
    refresh,
    totalCount,
    loadedCount
  } = useMusicPaginated(isAuthenticated, 50);

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Multiple uploads state
  interface UploadTask {
    id: string;
    file: File;
    title: string;
    artist: string;
    category: string;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
  }
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/m4a'];
    const validFiles: File[] = [];

    // Validate all selected files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type for ${file.name}. Only MP3, WAV, OGG, and M4A files are allowed.`);
        continue;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert(`File size exceeds 50MB limit for ${file.name}.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      // Create upload tasks for each file
      const newTasks: UploadTask[] = validFiles.map(file => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        artist: 'Unknown Artist',
        category: 'Romantic',
        progress: 0,
        status: 'pending' as const,
      }));

      setUploadTasks(prev => [...prev, ...newTasks]);
      setShowUploadModal(true);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function uploadSingleTask(task: UploadTask) {
    try {
      // Update status to uploading
      setUploadTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'uploading' as const, progress: 10 } : t
      ));

      // Upload file to Firebase Storage
      const filename = `${Date.now()}_${task.file.name}`;
      const storageRef = ref(storage, `music/${filename}`);

      setUploadTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, progress: 30 } : t
      ));

      const snapshot = await uploadBytes(storageRef, task.file);

      setUploadTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, progress: 60 } : t
      ));

      const downloadURL = await getDownloadURL(snapshot.ref);

      setUploadTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, progress: 80 } : t
      ));

      // Add music document to Firestore
      await addDoc(collection(db, 'musicLibrary'), {
        title: task.title,
        artist: task.artist,
        category: task.category,
        url: downloadURL,
        filename: task.file.name,
        size: task.file.size,
        uploadedAt: Timestamp.now(),
        uploadedBy: 'admin'
      });

      // Mark as success
      setUploadTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'success' as const, progress: 100 } : t
      ));

      console.log(`✅ Uploaded: ${task.title}`);
    } catch (error) {
      console.error(`❌ Error uploading ${task.title}:`, error);
      setUploadTasks(prev => prev.map(t =>
        t.id === task.id ? {
          ...t,
          status: 'error' as const,
          error: (error as Error).message
        } : t
      ));
    }
  }

  async function handleUploadAll() {
    const pendingTasks = uploadTasks.filter(t => t.status === 'pending');

    if (pendingTasks.length === 0) {
      alert('No pending uploads');
      return;
    }

    // Upload all tasks in parallel
    await Promise.all(pendingTasks.map(task => uploadSingleTask(task)));

    // Refresh music list
    refresh();
  }

  function removeTask(taskId: string) {
    setUploadTasks(prev => prev.filter(t => t.id !== taskId));
  }

  function updateTaskField(taskId: string, field: keyof UploadTask, value: any) {
    setUploadTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, [field]: value } : t
    ));
  }

  function clearCompletedTasks() {
    setUploadTasks(prev => prev.filter(t => t.status === 'pending' || t.status === 'uploading'));
    if (uploadTasks.every(t => t.status === 'success' || t.status === 'error')) {
      setShowUploadModal(false);
    }
  }

  async function handleDelete(trackId: string) {
    if (!confirm('Are you sure you want to delete this track? This will permanently delete the file from storage.')) {
      return;
    }

    try {
      // Find the track to get the storage URL
      const track = musicTracks.find(t => t.id === trackId);

      if (track && track.url) {
        try {
          // Delete from Storage first
          const storageRef = ref(storage, track.url);
          await deleteObject(storageRef);
          console.log('✅ File deleted from Storage');
        } catch (storageError: any) {
          console.warn('⚠️ Could not delete file from Storage:', storageError.message);
          // Continue anyway to delete Firestore metadata
        }
      }

      // Delete metadata from Firestore
      await deleteDoc(doc(db, 'musicLibrary', trackId));

      alert('Track deleted successfully!');
      refresh();
    } catch (error) {
      console.error('Error deleting track:', error);
      alert('Error deleting track: ' + (error as Error).message);
    }
  }

  async function handleUpdate() {
    if (!editingTrack) return;

    try {
      await updateDoc(doc(db, 'musicLibrary', editingTrack.id), {
        title: editingTrack.title,
        artist: editingTrack.artist,
        category: editingTrack.category,
        updatedAt: Timestamp.now(),
      });

      alert('Track updated successfully!');
      setEditingTrack(null);
      refresh();
    } catch (error) {
      console.error('Error updating track:', error);
      alert('Error updating track: ' + (error as Error).message);
    }
  }

  function togglePlay(track: MusicTrack) {
    if (playingTrackId === track.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = track.url;
        audioRef.current.play();
        setPlayingTrackId(track.id);
      }
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  const filteredTracks = categoryFilter === 'all'
    ? musicTracks
    : musicTracks.filter(t => t.category.toLowerCase() === categoryFilter.toLowerCase());

  const totalSize = musicTracks.reduce((sum, track) => sum + (track.size || 0), 0);
  const categories = Array.from(new Set(musicTracks.map(t => t.category)));

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/m4a"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Hidden audio player */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingTrackId(null)}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Music Library</h2>
          <p className="text-gray-400">Manage music tracks available in the app</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="glass-button px-6 py-3 rounded-lg text-white font-semibold"
        >
          Upload Music
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Tracks</p>
              <p className="text-2xl font-bold text-white">{musicTracks.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Filtered Tracks</p>
              <p className="text-2xl font-bold text-white">{filteredTracks.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Storage Used</p>
              <p className="text-2xl font-bold text-white">{formatFileSize(totalSize)}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Categories</p>
              <p className="text-2xl font-bold text-white">{categories.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="glass-card p-8">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center hover:border-blue-400/50 hover:bg-blue-500/5 transition-all cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Upload Music Files</h3>
          <p className="text-gray-400 mb-4">Drag and drop your music files here, or click to browse</p>
          <p className="text-gray-500 text-sm">Supported formats: MP3, WAV, OGG, M4A (Max 50MB)</p>
        </div>
      </div>

      {/* Music List */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Music Tracks</h3>
          <div className="flex space-x-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="glass-input px-4 py-2 rounded-lg text-white text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat.toLowerCase()}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading Progress */}
        {loading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold">Loading Music Tracks...</h4>
              <span className="text-gray-400 text-sm">
                {loadedCount} / {totalCount} tracks
              </span>
            </div>
            <LoadingProgress
              loaded={loadedCount}
              total={totalCount}
              itemName="tracks"
              showPercentage={true}
            />
          </div>
        )}

        {!loading && filteredTracks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No music tracks found. Upload some to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTracks.map((track, index) => (
              <div key={track.id} className="glass-input p-4 rounded-lg hover:glass-card transition-all duration-200">
                <div className="flex items-center space-x-4">
                  {/* Track Number & Play Button */}
                  <div className="flex items-center space-x-4 w-20">
                    <span className="text-gray-400 text-sm w-6 text-right">{index + 1}</span>
                    <button
                      onClick={() => togglePlay(track)}
                      className="w-10 h-10 rounded-full bg-blue-500/20 hover:bg-blue-500/30 flex items-center justify-center transition-all group"
                    >
                      {playingTrackId === track.id ? (
                        <svg className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Track Info */}
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{track.title}</h4>
                    <p className="text-gray-400 text-sm">{track.artist}</p>
                  </div>

                  {/* Category Badge */}
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold">
                    {track.category}
                  </span>

                  {/* Duration */}
                  <div className="w-20 text-center">
                    <p className="text-gray-300 text-sm">{track.duration || 'N/A'}</p>
                  </div>

                  {/* Size */}
                  <div className="w-24 text-center">
                    <p className="text-gray-400 text-sm">{formatFileSize(track.size || 0)}</p>
                  </div>

                  {/* Upload Date */}
                  <div className="w-32">
                    <p className="text-gray-400 text-sm">
                      {new Date(track.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <a
                      href={track.url}
                      download={track.filename}
                      className="glass-input p-2 rounded-lg hover:glass-button transition-all"
                    >
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                    <button
                      onClick={() => setEditingTrack(track)}
                      className="glass-input p-2 rounded-lg hover:glass-button transition-all"
                    >
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(track.id)}
                      className="glass-input p-2 rounded-lg hover:bg-red-500/20 transition-all"
                    >
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info and Load More */}
        {!loading && filteredTracks.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
            <p className="text-gray-400 text-sm">
              Showing {filteredTracks.length} of {totalCount} tracks (Loaded: {loadedCount})
            </p>
            {hasMore && (
              <button
                onClick={loadMore}
                className="glass-button px-4 py-2 rounded-lg text-white text-sm font-medium"
              >
                Load More
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal - Multiple Files */}
      {showUploadModal && uploadTasks.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                Upload Music Tracks ({uploadTasks.length})
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Upload Tasks List */}
            <div className="space-y-4 mb-6">
              {uploadTasks.map((task) => (
                <div key={task.id} className="glass-input p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {task.status === 'success' && (
                          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {task.status === 'error' && (
                          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        {task.status === 'uploading' && (
                          <svg className="w-5 h-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        <span className="text-white font-medium">{task.file.name}</span>
                        <span className="text-gray-400 text-sm">({formatFileSize(task.file.size)})</span>
                      </div>

                      {task.error && (
                        <p className="text-red-400 text-sm mb-2">{task.error}</p>
                      )}

                      {task.status === 'pending' && (
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => updateTaskField(task.id, 'title', e.target.value)}
                            placeholder="Title"
                            className="glass-input px-3 py-2 rounded text-white text-sm"
                          />
                          <input
                            type="text"
                            value={task.artist}
                            onChange={(e) => updateTaskField(task.id, 'artist', e.target.value)}
                            placeholder="Artist"
                            className="glass-input px-3 py-2 rounded text-white text-sm"
                          />
                          <select
                            value={task.category}
                            onChange={(e) => updateTaskField(task.id, 'category', e.target.value)}
                            className="glass-input px-3 py-2 rounded text-white text-sm"
                          >
                            <option value="Romantic">Romantic</option>
                            <option value="Jazz">Jazz</option>
                            <option value="Classical">Classical</option>
                            <option value="Pop">Pop</option>
                            <option value="Acoustic">Acoustic</option>
                            <option value="Rock">Rock</option>
                            <option value="Electronic">Electronic</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      )}

                      {(task.status === 'uploading' || task.status === 'success') && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${task.status === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {task.status === 'pending' && (
                      <button
                        onClick={() => removeTask(task.id)}
                        className="ml-3 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={clearCompletedTasks}
                className="glass-input px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-colors text-sm"
              >
                Clear Completed
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setUploadTasks([]);
                    setShowUploadModal(false);
                  }}
                  className="glass-input px-6 py-3 rounded-lg text-white font-semibold"
                >
                  Cancel All
                </button>
                <button
                  onClick={handleUploadAll}
                  disabled={uploadTasks.filter(t => t.status === 'pending').length === 0}
                  className="glass-button px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50"
                >
                  Upload All ({uploadTasks.filter(t => t.status === 'pending').length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTrack && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-white mb-6">Edit Track</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Track Title
                </label>
                <input
                  type="text"
                  value={editingTrack.title}
                  onChange={(e) => setEditingTrack({ ...editingTrack, title: e.target.value })}
                  className="glass-input w-full px-4 py-3 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Artist
                </label>
                <input
                  type="text"
                  value={editingTrack.artist}
                  onChange={(e) => setEditingTrack({ ...editingTrack, artist: e.target.value })}
                  className="glass-input w-full px-4 py-3 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={editingTrack.category}
                  onChange={(e) => setEditingTrack({ ...editingTrack, category: e.target.value })}
                  className="glass-input w-full px-4 py-3 rounded-lg text-white"
                >
                  <option value="Romantic">Romantic</option>
                  <option value="Jazz">Jazz</option>
                  <option value="Classical">Classical</option>
                  <option value="Pop">Pop</option>
                  <option value="Acoustic">Acoustic</option>
                  <option value="Rock">Rock</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setEditingTrack(null)}
                  className="flex-1 glass-input px-6 py-3 rounded-lg text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 glass-button px-6 py-3 rounded-lg text-white font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
