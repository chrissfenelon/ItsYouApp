import firestore from '@react-native-firebase/firestore';
import { Avatar } from '../types/wordSearch.types';

/**
 * Service pour synchroniser le profil principal avec tous les profils de jeux
 */
export class ProfileSyncService {
  /**
   * Synchroniser le profil principal avec tous les profils de jeux
   * @param userId - ID de l'utilisateur
   * @param name - Nom de l'utilisateur
   * @param photoURL - URL de la photo de profil (Firebase Storage URL)
   */
  static async syncAllGameProfiles(
    userId: string,
    name: string,
    photoURL: string | null | undefined
  ): Promise<void> {
    try {
      console.log('= Syncing all game profiles...', { userId, name, photoURL });

      // Cr�er l'avatar pour les jeux
      const avatar: Avatar = {
        type: photoURL ? 'photo' : 'emoji',
        value: photoURL || '=d',
      };

      // Synchroniser tous les profils en parall�le
      await Promise.all([
        // Word Search Profile
        this.syncWordSearchProfile(userId, name, avatar),

        // Quiz Couple Profile
        this.syncQuizCoupleProfile(userId, name, avatar),

        // Connect4 Profile
        this.syncConnect4Profile(userId, name, avatar),

        // Morpion Profile
        this.syncMorpionProfile(userId, name, avatar),

        // Crosswords - pas de profil s�par�

        // Dominos - pas de profil s�par�
      ]);

      console.log(' All game profiles synced successfully');
    } catch (error) {
      console.error('L Error syncing game profiles:', error);
      // Ne pas throw l'erreur pour ne pas bloquer la sauvegarde du profil principal
    }
  }

  /**
   * Synchroniser le profil Word Search
   */
  private static async syncWordSearchProfile(
    userId: string,
    name: string,
    avatar: Avatar
  ): Promise<void> {
    try {
      const profileRef = firestore().collection('word_search_profiles').doc(userId);
      const profileDoc = await profileRef.get();

      if (profileDoc.exists) {
        // Mettre � jour seulement le nom et l'avatar
        await profileRef.update({
          name,
          avatar,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        console.log(' Word Search profile updated');
      } else {
        console.log('9 Word Search profile does not exist yet (will be created on first game)');
      }
    } catch (error) {
      console.error('L Error syncing Word Search profile:', error);
    }
  }

  /**
   * Synchroniser le profil Quiz Couple
   */
  private static async syncQuizCoupleProfile(
    userId: string,
    name: string,
    avatar: Avatar
  ): Promise<void> {
    try {
      const profileRef = firestore().collection('quiz_couple_profiles').doc(userId);
      const profileDoc = await profileRef.get();

      if (profileDoc.exists) {
        // Mettre � jour seulement le nom et l'avatar
        await profileRef.update({
          name,
          avatar,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        console.log(' Quiz Couple profile updated');
      } else {
        console.log('9 Quiz Couple profile does not exist yet (will be created on first game)');
      }
    } catch (error) {
      console.error('L Error syncing Quiz Couple profile:', error);
    }
  }

  /**
   * Synchroniser le profil Connect4 (Puissance 4)
   */
  private static async syncConnect4Profile(
    userId: string,
    name: string,
    avatar: Avatar
  ): Promise<void> {
    try {
      const profileRef = firestore().collection('connect4_profiles').doc(userId);
      const profileDoc = await profileRef.get();

      if (profileDoc.exists) {
        // Mettre � jour seulement le nom et l'avatar
        await profileRef.update({
          name,
          avatar,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        console.log(' Connect4 profile updated');
      } else {
        console.log('9 Connect4 profile does not exist yet (will be created on first game)');
      }
    } catch (error) {
      console.error('L Error syncing Connect4 profile:', error);
    }
  }

  /**
   * Synchroniser le profil Morpion
   */
  private static async syncMorpionProfile(
    userId: string,
    name: string,
    avatar: Avatar
  ): Promise<void> {
    try {
      const profileRef = firestore().collection('morpion_profiles').doc(userId);
      const profileDoc = await profileRef.get();

      if (profileDoc.exists) {
        // Mettre � jour seulement le nom et l'avatar
        await profileRef.update({
          name,
          avatar,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        console.log(' Morpion profile updated');
      } else {
        console.log('9 Morpion profile does not exist yet (will be created on first game)');
      }
    } catch (error) {
      console.error('L Error syncing Morpion profile:', error);
    }
  }

  /**
   * Mettre � jour les parties en cours avec le nouveau profil
   * Utile si l'utilisateur change son profil pendant une partie
   */
  static async updateActiveGamesProfile(
    userId: string,
    name: string,
    avatar: Avatar
  ): Promise<void> {
    try {
      console.log('<� Updating active games with new profile...');

      // Mettre � jour les parties Quiz Couple en cours
      await this.updateQuizCoupleActiveGames(userId, name, avatar);

      // Mettre � jour les parties Word Search multijoueur en cours
      await this.updateWordSearchActiveGames(userId, name, avatar);
      // Mettre à jour les parties Morpion en cours
      await this.updateMorpionActiveGames(userId, name, avatar);


      console.log(' Active games updated');
    } catch (error) {
      console.error('L Error updating active games:', error);
    }
  }

  /**
   * Mettre � jour les parties Quiz Couple actives
   */
  private static async updateQuizCoupleActiveGames(
    userId: string,
    name: string,
    avatar: Avatar
  ): Promise<void> {
    try {
      const gamesSnapshot = await firestore()
        .collection('quiz_couple_games')
        .where('status', 'in', ['waiting', 'playing'])
        .get();

      const batch = firestore().batch();
      let updateCount = 0;

      gamesSnapshot.forEach((doc) => {
        const game = doc.data();
        if (game.players && Array.isArray(game.players)) {
          const updatedPlayers = game.players.map((player: any) => {
            if (player.id === userId) {
              updateCount++;
              return {
                ...player,
                profile: {
                  ...player.profile,
                  name,
                  avatar,
                },
              };
            }
            return player;
          });

          if (updatedPlayers.some((p: any) => p.id === userId)) {
            batch.update(doc.ref, {
              players: updatedPlayers,
              updatedAt: Date.now(),
            });
          }
        }
      });

      if (updateCount > 0) {
        await batch.commit();
        console.log(` Updated ${updateCount} Quiz Couple games`);
      }
    } catch (error) {
      console.error('L Error updating Quiz Couple active games:', error);
    }
  }

  /**
   * Mettre � jour les parties Word Search multijoueur actives
   */
  private static async updateWordSearchActiveGames(
    userId: string,
    name: string,
    avatar: Avatar
  ): Promise<void> {
    try {
      // Parties multijoueur comp�titives
      const multiplayerSnapshot = await firestore()
        .collection('multiplayer_games')
        .where('status', 'in', ['waiting', 'active'])
        .get();

      // Parties coop�ratives
      const coopSnapshot = await firestore()
        .collection('cooperative_games')
        .where('status', 'in', ['waiting', 'active'])
        .get();

      const batch = firestore().batch();
      let updateCount = 0;

      // Traiter les parties multijoueur
      multiplayerSnapshot.forEach((doc) => {
        const game = doc.data();
        if (game.players && Array.isArray(game.players)) {
          const updatedPlayers = game.players.map((player: any) => {
            if (player.profile && player.profile.id === userId) {
              updateCount++;
              return {
                ...player,
                profile: {
                  ...player.profile,
                  name,
                  avatar,
                },
              };
            }
            return player;
          });

          batch.update(doc.ref, { players: updatedPlayers });
        }
      });

      // Traiter les parties coop�ratives
      coopSnapshot.forEach((doc) => {
        const game = doc.data();
        if (game.players && Array.isArray(game.players)) {
          const updatedPlayers = game.players.map((player: any) => {
            if (player.profile && player.profile.id === userId) {
              updateCount++;
              return {
                ...player,
                profile: {
                  ...player.profile,
                  name,
                  avatar,
                },
              };
            }
            return player;
          });

          batch.update(doc.ref, { players: updatedPlayers });
        }
      });

      if (updateCount > 0) {
        await batch.commit();
        console.log(` Updated ${updateCount} Word Search games`);
      }
    } catch (error) {
      console.error('L Error updating Word Search active games:', error);
    }
  }


  /**
   * Mettre à jour les parties Morpion actives
   */
  private static async updateMorpionActiveGames(
    userId: string,
    name: string,
    avatar: Avatar
  ): Promise<void> {
    try {
      const gamesSnapshot = await firestore()
        .collection('morpion_games')
        .where('status', 'in', ['waiting', 'playing'])
        .get();

      const batch = firestore().batch();
      let updateCount = 0;

      gamesSnapshot.forEach((doc) => {
        const game = doc.data();
        if (game.players && Array.isArray(game.players)) {
          const updatedPlayers = game.players.map((player: any) => {
            if (player.id === userId) {
              updateCount++;
              return {
                ...player,
                profile: {
                  ...player.profile,
                  name,
                  avatar,
                },
              };
            }
            return player;
          });

          if (updatedPlayers.some((p: any) => p.id === userId)) {
            batch.update(doc.ref, {
              players: updatedPlayers,
              updatedAt: Date.now(),
            });
          }
        }
      });

      if (updateCount > 0) {
        await batch.commit();
        console.log(` Updated ${updateCount} Morpion games`);
      }
    } catch (error) {
      console.error('L Error updating Morpion active games:', error);
    }
  }
  /**
   * Obtenir l'avatar format� depuis l'URL de photo
   */
  static getAvatarFromPhotoURL(photoURL: string | null | undefined): Avatar {
    if (photoURL && (photoURL.startsWith('http') || photoURL.startsWith('file://'))) {
      return {
        type: 'photo',
        value: photoURL,
      };
    }
    return {
      type: 'emoji',
      value: '=d',
    };
  }
}

export default ProfileSyncService;
