import { Platform, Vibration } from 'react-native';

export class FeedbackService {
  /**
   * Retour haptique léger - utilise l'API native
   */
  static lightImpact() {
    if (Platform.OS === 'ios') {
      // Sur iOS, on simule avec une vibration très courte
      Vibration.vibrate(10);
    } else {
      // Sur Android, vibration courte
      Vibration.vibrate(20);
    }
  }

  /**
   * Retour haptique medium - pour les boutons et sélections
   */
  static mediumImpact() {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(25);
    } else {
      Vibration.vibrate(40);
    }
  }

  /**
   * Retour haptique fort - pour les actions importantes
   */
  static heavyImpact() {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(50);
    } else {
      Vibration.vibrate(80);
    }
  }

  /**
   * Notification générique
   */
  static notification() {
    // Pattern de vibration pour les notifications
    Vibration.vibrate([0, 50, 30, 80]);
  }

  /**
   * Notification de succès
   */
  static success() {
    // Pattern de vibration pour le succès
    Vibration.vibrate([0, 100, 50, 100]);
  }

  /**
   * Notification d'erreur
   */
  static error() {
    // Pattern de vibration pour l'erreur
    Vibration.vibrate([0, 200, 100, 200, 100, 200]);
  }

  /**
   * Notification d'avertissement
   */
  static warning() {
    // Pattern de vibration pour l'avertissement
    Vibration.vibrate([0, 150, 100, 150]);
  }

  /**
   * Sélection - pour les menus et listes
   */
  static selection() {
    Vibration.vibrate(15);
  }

  /**
   * Retour haptique pour les boutons
   */
  static buttonPress() {
    FeedbackService.mediumImpact();
  }

  /**
   * Retour haptique romantique personnalisé - battement de cœur
   */
  static heartbeat() {
    // Double impulsion comme un battement de cœur
    Vibration.vibrate([0, 100, 50, 150]);
  }

  /**
   * Retour haptique pour les boutons romantiques
   */
  static romanticButton() {
    // Impulsion douce et romantique
    Vibration.vibrate([0, 50, 30, 100]);
  }

  /**
   * Séquence haptique pour la connexion réussie
   */
  static loginSuccess() {
    // Pattern romantique pour la connexion réussie
    Vibration.vibrate([0, 80, 50, 120, 50, 150]);
  }

  /**
   * Vibration longue personnalisée
   */
  static customLongVibration() {
    Vibration.vibrate([0, 200, 100, 300, 100, 200]);
  }

  /**
   * Pas de retour haptique
   */
  static none() {
    // Méthode vide
  }
}

export default FeedbackService;