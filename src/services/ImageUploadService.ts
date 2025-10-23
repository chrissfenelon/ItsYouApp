import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';

/**
 * Service pour uploader des images sur Firebase Storage
 */
export class ImageUploadService {
  /**
   * Uploader une photo de profil sur Firebase Storage
   * @param userId - ID de l'utilisateur
   * @param imageUri - URI locale de l'image (file:// ou content://)
   * @returns URL publique de l'image uploadée
   */
  static async uploadProfilePicture(userId: string, imageUri: string): Promise<string> {
    try {
      console.log('📸 Uploading profile picture...', { userId, imageUri });

      // Nettoyer l'URI pour Android
      let uploadUri = imageUri;
      if (Platform.OS === 'android' && !imageUri.startsWith('file://')) {
        uploadUri = `file://${imageUri}`;
      }

      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const extension = imageUri.split('.').pop() || 'jpg';
      const filename = `profile_${timestamp}.${extension}`;

      // Référence Firebase Storage
      const reference = storage().ref(`users/${userId}/profile/${filename}`);

      // Uploader le fichier
      console.log('⬆️ Starting upload to Firebase Storage...');
      await reference.putFile(uploadUri);

      // Obtenir l'URL de téléchargement
      const downloadURL = await reference.getDownloadURL();
      console.log('✅ Profile picture uploaded successfully:', downloadURL);

      return downloadURL;
    } catch (error: any) {
      console.error('❌ Error uploading profile picture:', error);

      // Provide specific error messages based on error code
      if (error.code === 'storage/unauthorized') {
        throw new Error('Vous n\'avez pas la permission d\'uploader des fichiers. Vérifiez vos paramètres.');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload annulé');
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error('Espace de stockage insuffisant. Supprimez des fichiers ou contactez le support.');
      } else if (error.code === 'storage/invalid-checksum') {
        throw new Error('Le fichier est corrompu. Veuillez réessayer.');
      } else if (error.code === 'storage/retry-limit-exceeded') {
        throw new Error('Impossible d\'uploader la photo. Vérifiez votre connexion internet.');
      } else if (error.message?.includes('network')) {
        throw new Error('Erreur de connexion. Vérifiez votre réseau et réessayez.');
      } else {
        throw new Error('Impossible d\'uploader la photo de profil. Réessayez plus tard.');
      }
    }
  }

  /**
   * Supprimer une ancienne photo de profil
   * @param photoURL - URL de la photo à supprimer
   */
  static async deleteProfilePicture(photoURL: string): Promise<void> {
    try {
      // Vérifier que c'est une URL Firebase Storage
      if (!photoURL.includes('firebasestorage.googleapis.com')) {
        console.log('ℹ️ Not a Firebase Storage URL, skipping deletion');
        return;
      }

      console.log('🗑️ Deleting old profile picture...', photoURL);

      // Extraire le chemin depuis l'URL
      const reference = storage().refFromURL(photoURL);

      // Supprimer le fichier
      await reference.delete();
      console.log('✅ Old profile picture deleted');
    } catch (error: any) {
      // Ignorer l'erreur si le fichier n'existe pas
      if (error.code === 'storage/object-not-found') {
        console.log('ℹ️ Profile picture already deleted or does not exist');
      } else {
        console.error('❌ Error deleting profile picture:', error);
      }
    }
  }

  /**
   * Uploader une photo pour la galerie
   * @param userId - ID de l'utilisateur
   * @param imageUri - URI locale de l'image
   * @returns URL publique de l'image uploadée
   */
  static async uploadGalleryPhoto(userId: string, imageUri: string): Promise<string> {
    try {
      console.log('📷 Uploading gallery photo...', { userId, imageUri });

      // Nettoyer l'URI pour Android
      let uploadUri = imageUri;
      if (Platform.OS === 'android' && !imageUri.startsWith('file://')) {
        uploadUri = `file://${imageUri}`;
      }

      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const extension = imageUri.split('.').pop() || 'jpg';
      const filename = `photo_${timestamp}_${randomId}.${extension}`;

      // Référence Firebase Storage
      const reference = storage().ref(`users/${userId}/photos/${filename}`);

      // Uploader le fichier
      console.log('⬆️ Starting upload to Firebase Storage...');
      await reference.putFile(uploadUri);

      // Obtenir l'URL de téléchargement
      const downloadURL = await reference.getDownloadURL();
      console.log('✅ Gallery photo uploaded successfully:', downloadURL);

      return downloadURL;
    } catch (error: any) {
      console.error('❌ Error uploading gallery photo:', error);

      // Provide specific error messages based on error code
      if (error.code === 'storage/unauthorized') {
        throw new Error('Vous n\'avez pas la permission d\'uploader des fichiers. Vérifiez vos paramètres.');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload annulé');
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error('Espace de stockage insuffisant. Supprimez des fichiers ou contactez le support.');
      } else if (error.code === 'storage/invalid-checksum') {
        throw new Error('Le fichier est corrompu. Veuillez réessayer.');
      } else if (error.code === 'storage/retry-limit-exceeded') {
        throw new Error('Impossible d\'uploader la photo. Vérifiez votre connexion internet.');
      } else if (error.message?.includes('network')) {
        throw new Error('Erreur de connexion. Vérifiez votre réseau et réessayez.');
      } else {
        throw new Error('Impossible d\'uploader la photo. Réessayez plus tard.');
      }
    }
  }

  /**
   * Uploader une photo partagée (couple)
   * @param coupleId - ID du couple
   * @param imageUri - URI locale de l'image
   * @returns URL publique de l'image uploadée
   */
  static async uploadSharedPhoto(coupleId: string, imageUri: string): Promise<string> {
    try {
      console.log('💑 Uploading shared photo...', { coupleId, imageUri });

      // Nettoyer l'URI pour Android
      let uploadUri = imageUri;
      if (Platform.OS === 'android' && !imageUri.startsWith('file://')) {
        uploadUri = `file://${imageUri}`;
      }

      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const extension = imageUri.split('.').pop() || 'jpg';
      const filename = `shared_${timestamp}_${randomId}.${extension}`;

      // Référence Firebase Storage
      const reference = storage().ref(`shared/${coupleId}/photos/${filename}`);

      // Uploader le fichier
      console.log('⬆️ Starting upload to Firebase Storage...');
      await reference.putFile(uploadUri);

      // Obtenir l'URL de téléchargement
      const downloadURL = await reference.getDownloadURL();
      console.log('✅ Shared photo uploaded successfully:', downloadURL);

      return downloadURL;
    } catch (error: any) {
      console.error('❌ Error uploading shared photo:', error);

      // Provide specific error messages based on error code
      if (error.code === 'storage/unauthorized') {
        throw new Error('Vous n\'avez pas la permission d\'uploader des fichiers partagés. Vérifiez vos paramètres.');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload annulé');
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error('Espace de stockage partagé insuffisant. Supprimez des fichiers ou contactez le support.');
      } else if (error.code === 'storage/invalid-checksum') {
        throw new Error('Le fichier est corrompu. Veuillez réessayer.');
      } else if (error.code === 'storage/retry-limit-exceeded') {
        throw new Error('Impossible d\'uploader la photo partagée. Vérifiez votre connexion internet.');
      } else if (error.message?.includes('network')) {
        throw new Error('Erreur de connexion. Vérifiez votre réseau et réessayez.');
      } else {
        throw new Error('Impossible d\'uploader la photo partagée. Réessayez plus tard.');
      }
    }
  }

  /**
   * Supprimer une photo
   * @param photoURL - URL de la photo à supprimer
   */
  static async deletePhoto(photoURL: string): Promise<void> {
    try {
      // Vérifier que c'est une URL Firebase Storage
      if (!photoURL.includes('firebasestorage.googleapis.com')) {
        console.log('ℹ️ Not a Firebase Storage URL, skipping deletion');
        return;
      }

      console.log('🗑️ Deleting photo...', photoURL);

      // Extraire le chemin depuis l'URL
      const reference = storage().refFromURL(photoURL);

      // Supprimer le fichier
      await reference.delete();
      console.log('✅ Photo deleted');
    } catch (error: any) {
      // Ignorer l'erreur si le fichier n'existe pas
      if (error.code === 'storage/object-not-found') {
        console.log('ℹ️ Photo already deleted or does not exist');
      } else {
        console.error('❌ Error deleting photo:', error);
      }
    }
  }
}

export default ImageUploadService;
