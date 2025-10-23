import RNFS from 'react-native-fs';
import { Platform, PermissionsAndroid } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import StorageService from './StorageService';
import LocalNotesStorage from './LocalNotesStorage';
import GalleryService from './GalleryService';
import MusicService from './MusicService';

export interface ExportData {
  exportDate: string;
  appVersion: string;
  user: {
    id: string;
    email: string;
    name: string;
    relationshipStartDate?: string;
    talkingStartDate?: string;
  };
  notes: any[];
  photos: any[];
  music: any[];
  messages: any[];
  settings: any;
  stats: {
    totalNotes: number;
    totalPhotos: number;
    totalMusic: number;
    totalMessages: number;
  };
}

class DataExportService {
  /**
   * Request storage permissions for Android
   */
  private async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      if (Platform.Version >= 33) {
        // Android 13+ doesn't need WRITE_EXTERNAL_STORAGE for Downloads
        return true;
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Permission de stockage',
          message: 'L\'application a besoin d\'accès au stockage pour exporter vos données.',
          buttonPositive: 'Autoriser',
          buttonNegative: 'Refuser',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Error requesting storage permission:', error);
      return false;
    }
  }

  /**
   * Get all user data for export
   */
  private async getUserData(): Promise<ExportData> {
    try {
      console.log('📦 Collecting user data for export...');

      // Get current user
      const userData = await StorageService.getUserData();
      if (!userData) {
        throw new Error('No user data found');
      }

      // Get notes
      console.log('📝 Fetching notes...');
      const notes = await LocalNotesStorage.getAllNotes();

      // Get photos metadata
      console.log('📸 Fetching photos...');
      let photos: any[] = [];
      try {
        photos = await GalleryService.getMediaItems();
      } catch (error) {
        console.warn('Could not fetch photos:', error);
      }

      // Get music list
      console.log('🎵 Fetching music...');
      let music: any[] = [];
      try {
        music = await MusicService.getSongs();
      } catch (error) {
        console.warn('Could not fetch music:', error);
      }

      // Get messages from Firestore (captured messages)
      console.log('💬 Fetching messages...');
      let messages: any[] = [];
      try {
        const messagesSnapshot = await firestore()
          .collection('capturedMessages')
          .where('userId', '==', userData.id)
          .orderBy('timestamp', 'desc')
          .limit(1000) // Limit to last 1000 messages
          .get();

        messages = messagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()?.toISOString(),
        }));
      } catch (error) {
        console.warn('Could not fetch messages:', error);
      }

      // Prepare export data
      const exportData: ExportData = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          relationshipStartDate: userData.relationshipStartDate?.toISOString(),
          talkingStartDate: userData.talkingStartDate?.toISOString(),
        },
        notes: notes.map(note => ({
          ...note,
          createdAt: note.createdAt?.toISOString?.() || note.createdAt,
          updatedAt: note.updatedAt?.toISOString?.() || note.updatedAt,
        })),
        photos: photos.map(photo => ({
          ...photo,
          // Don't include actual image data, just metadata
          uri: photo.uri ? 'local' : undefined,
        })),
        music: music.map(song => ({
          id: song.id,
          title: song.title,
          artist: song.artist,
          duration: song.duration,
          source: song.source,
          addedAt: song.addedAt,
        })),
        messages,
        settings: {
          isDarkTheme: userData.backgroundType,
          globalFontSettings: userData.globalFontSettings,
          showProfilePhoto: userData.showProfilePhoto,
          messageCustomization: userData.messageCustomization,
        },
        stats: {
          totalNotes: notes.length,
          totalPhotos: photos.length,
          totalMusic: music.length,
          totalMessages: messages.length,
        },
      };

      console.log('✅ Data collection complete:', {
        notes: exportData.stats.totalNotes,
        photos: exportData.stats.totalPhotos,
        music: exportData.stats.totalMusic,
        messages: exportData.stats.totalMessages,
      });

      return exportData;
    } catch (error) {
      console.error('❌ Error collecting user data:', error);
      throw error;
    }
  }

  /**
   * Export data as JSON file
   */
  async exportAsJSON(): Promise<string> {
    try {
      console.log('📤 Starting JSON export...');

      // Request permissions
      const hasPermission = await this.requestStoragePermission();
      if (!hasPermission) {
        throw new Error('Permission de stockage refusée');
      }

      // Get user data
      const exportData = await this.getUserData();

      // Format JSON
      const jsonData = JSON.stringify(exportData, null, 2);

      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const fileName = `ItsYou_Export_${timestamp}.json`;

      // Determine save path
      const downloadPath = Platform.OS === 'android'
        ? `${RNFS.DownloadDirectoryPath}/${fileName}`
        : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      // Write file
      await RNFS.writeFile(downloadPath, jsonData, 'utf8');

      console.log('✅ JSON export successful:', downloadPath);

      return downloadPath;
    } catch (error) {
      console.error('❌ Error exporting JSON:', error);
      throw error;
    }
  }

  /**
   * Export data as compact JSON (without detailed metadata)
   */
  async exportAsCompactJSON(): Promise<string> {
    try {
      console.log('📤 Starting compact JSON export...');

      const hasPermission = await this.requestStoragePermission();
      if (!hasPermission) {
        throw new Error('Permission de stockage refusée');
      }

      const exportData = await this.getUserData();

      // Create compact version
      const compactData = {
        exportDate: exportData.exportDate,
        user: exportData.user,
        notes: exportData.notes.map(n => ({
          title: n.title,
          content: n.content,
          createdAt: n.createdAt,
        })),
        stats: exportData.stats,
      };

      const jsonData = JSON.stringify(compactData);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const fileName = `ItsYou_Compact_${timestamp}.json`;

      const downloadPath = Platform.OS === 'android'
        ? `${RNFS.DownloadDirectoryPath}/${fileName}`
        : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.writeFile(downloadPath, jsonData, 'utf8');

      console.log('✅ Compact JSON export successful:', downloadPath);

      return downloadPath;
    } catch (error) {
      console.error('❌ Error exporting compact JSON:', error);
      throw error;
    }
  }

  /**
   * Export data as ZIP file with images
   */
  async exportAsZIP(): Promise<string> {
    try {
      console.log('📤 Starting ZIP export...');

      const hasPermission = await this.requestStoragePermission();
      if (!hasPermission) {
        throw new Error('Permission de stockage refusée');
      }

      // Get user data
      const exportData = await this.getUserData();

      // Create temporary directory for export
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const tempDir = `${RNFS.CachesDirectoryPath}/export_${timestamp}`;
      await RNFS.mkdir(tempDir);

      // 1. Write JSON data file
      const jsonData = JSON.stringify(exportData, null, 2);
      await RNFS.writeFile(`${tempDir}/data.json`, jsonData, 'utf8');
      console.log('✅ JSON data written');

      // 2. Create a README file
      const readme = `ItsYou App Data Export
======================

Date d'export: ${new Date().toLocaleString('fr-FR')}
Version de l'app: ${exportData.appVersion}

Contenu:
- data.json : Toutes vos données (notes, messages, paramètres)
- photos/ : Copies de vos photos (si disponibles)

Statistiques:
- Notes: ${exportData.stats.totalNotes}
- Photos: ${exportData.stats.totalPhotos}
- Musique: ${exportData.stats.totalMusic}
- Messages: ${exportData.stats.totalMessages}

Format JSON pour faciliter la réimportation.
`;
      await RNFS.writeFile(`${tempDir}/README.txt`, readme, 'utf8');
      console.log('✅ README written');

      // 3. Copy photos if available (limit to avoid huge file)
      if (exportData.photos.length > 0) {
        const photosDir = `${tempDir}/photos`;
        await RNFS.mkdir(photosDir);

        let copiedPhotos = 0;
        const maxPhotos = 50; // Limit to 50 photos to keep ZIP size reasonable

        for (const photo of exportData.photos.slice(0, maxPhotos)) {
          try {
            if (photo.uri && photo.uri !== 'local' && await RNFS.exists(photo.uri)) {
              const fileName = photo.uri.split('/').pop() || `photo_${copiedPhotos}.jpg`;
              await RNFS.copyFile(photo.uri, `${photosDir}/${fileName}`);
              copiedPhotos++;
            }
          } catch (error) {
            console.warn('Could not copy photo:', error);
          }
        }

        console.log(`✅ Copied ${copiedPhotos} photos`);
      }

      // 4. Create ZIP file
      // Since we don't have a ZIP library, we'll create a tar-like structure
      // For now, just create a folder that user can manually zip
      const exportFolderName = `ItsYou_Export_${timestamp}`;
      const downloadPath = Platform.OS === 'android'
        ? `${RNFS.DownloadDirectoryPath}/${exportFolderName}`
        : `${RNFS.DocumentDirectoryPath}/${exportFolderName}`;

      // Copy temp directory to Downloads
      if (await RNFS.exists(downloadPath)) {
        await RNFS.unlink(downloadPath);
      }

      await RNFS.moveFile(tempDir, downloadPath);

      console.log('✅ ZIP export successful (as folder):', downloadPath);

      return downloadPath;
    } catch (error) {
      console.error('❌ Error exporting ZIP:', error);
      throw error;
    }
  }

  /**
   * Get export stats without actually exporting
   */
  async getExportStats(): Promise<{
    totalNotes: number;
    totalPhotos: number;
    totalMusic: number;
    totalMessages: number;
    estimatedSize: string;
  }> {
    try {
      const userData = await StorageService.getUserData();
      if (!userData) {
        return {
          totalNotes: 0,
          totalPhotos: 0,
          totalMusic: 0,
          totalMessages: 0,
          estimatedSize: '0 KB',
        };
      }

      const notes = await LocalNotesStorage.getAllNotes();
      let photos: any[] = [];
      let music: any[] = [];
      let messagesCount = 0;

      try {
        photos = await GalleryService.getMediaItems();
      } catch (error) {
        console.warn('Could not fetch photos for stats');
      }

      try {
        music = await MusicService.getSongs();
      } catch (error) {
        console.warn('Could not fetch music for stats');
      }

      try {
        const messagesSnapshot = await firestore()
          .collection('capturedMessages')
          .where('userId', '==', userData.id)
          .get();
        messagesCount = messagesSnapshot.size;
      } catch (error) {
        console.warn('Could not fetch messages count');
      }

      // Estimate size (very rough)
      const estimatedBytes = (
        notes.length * 1000 + // ~1KB per note
        photos.length * 500 + // ~0.5KB per photo metadata
        music.length * 300 + // ~0.3KB per music entry
        messagesCount * 500 // ~0.5KB per message
      );

      const estimatedSize = estimatedBytes < 1024
        ? `${estimatedBytes} B`
        : estimatedBytes < 1024 * 1024
        ? `${(estimatedBytes / 1024).toFixed(1)} KB`
        : `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;

      return {
        totalNotes: notes.length,
        totalPhotos: photos.length,
        totalMusic: music.length,
        totalMessages: messagesCount,
        estimatedSize,
      };
    } catch (error) {
      console.error('Error getting export stats:', error);
      return {
        totalNotes: 0,
        totalPhotos: 0,
        totalMusic: 0,
        totalMessages: 0,
        estimatedSize: '0 KB',
      };
    }
  }
}

export default new DataExportService();
