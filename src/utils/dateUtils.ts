// Utilitaires pour les calculs de dates - Interface française
export class DateUtils {
  // Date de début de votre relation - À MODIFIER avec votre vraie date
  private static readonly RELATIONSHIP_START_DATE = new Date('2024-01-15'); // Exemple: 15 janvier 2024

  /**
   * Calcule le temps écoulé depuis le début de la relation
   */
  static getTimeTogether(): {
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalDays: number;
  } {
    const now = new Date();
    const start = this.RELATIONSHIP_START_DATE;
    const diffInMs = now.getTime() - start.getTime();

    const seconds = Math.floor(diffInMs / 1000) % 60;
    const minutes = Math.floor(diffInMs / (1000 * 60)) % 60;
    const hours = Math.floor(diffInMs / (1000 * 60 * 60)) % 24;
    const totalDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    // Calcul plus précis des années et mois
    const years = Math.floor(totalDays / 365);
    const remainingDaysAfterYears = totalDays % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const days = remainingDaysAfterYears % 30;

    return {
      years,
      months,
      days,
      hours,
      minutes,
      seconds,
      totalDays
    };
  }

  /**
   * Formate une date en français
   */
  static formatDateFr(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  /**
   * Obtient un message romantique basé sur le nombre de jours
   */
  static getRomanticMessage(totalDays: number): string {
    const messages = [
      "Tu es mon ancre dans la tempête. ⚓️💕",
      "Chaque jour avec toi est un cadeau précieux. 🎁✨",
      "Tu illumines ma vie comme personne d'autre. ☀️💖",
      "Mon cœur te choisit encore et encore. 💕🔄",
      "Avec toi, chaque moment devient magique. ✨💫",
      "Tu es ma plus belle aventure. 🗺️❤️",
      "Dans tes bras, j'ai trouvé mon chez-moi. 🏠💝",
      "Tu es la mélodie de mon cœur. 🎵💘",
      "Tes sourires réchauffent mon âme. 😊🔥",
      "Tu es mon étoile dans la nuit. ⭐🌙"
    ];

    // Change de message chaque jour
    const index = totalDays % messages.length;
    return messages[index];
  }

  /**
   * Obtient le message d'en-tête personnalisé
   */
  static getHeaderMessage(partnerName: string = "Orlie"): string {
    return `Yon ti mesaj pou ${partnerName}❤️🔒`;
  }

  /**
   * Obtient le jour de la semaine en français
   */
  static getCurrentDayFr(): string {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[new Date().getDay()];
  }

  /**
   * Vérifie si c'est un jour spécial (anniversaires mensuels)
   */
  static isSpecialDay(): boolean {
    const now = new Date();
    const startDay = this.RELATIONSHIP_START_DATE.getDate();
    return now.getDate() === startDay;
  }
}

export default DateUtils;