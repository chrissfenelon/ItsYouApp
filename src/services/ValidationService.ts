/**
 * Interface pour le résultat de validation
 */
export interface ValidationResult {
  valid: boolean;
  message: string;
}

/**
 * Service de validation pour les formulaires
 *
 * Fournit des méthodes statiques pour valider les champs de formulaire courants
 * avec des messages d'erreur en français.
 *
 * @example
 * const emailValidation = ValidationService.validateEmail('test@example.com');
 * if (!emailValidation.valid) {
 *   console.error(emailValidation.message);
 * }
 */
export class ValidationService {
  /**
   * Valide une adresse email
   *
   * @param email - L'adresse email à valider
   * @returns Résultat de la validation avec message
   */
  static validateEmail(email: string): ValidationResult {
    if (!email || email.trim() === '') {
      return {
        valid: false,
        message: 'L\'adresse email est requise',
      };
    }

    // Expression régulière pour valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return {
        valid: false,
        message: 'L\'adresse email n\'est pas valide',
      };
    }

    return {
      valid: true,
      message: '',
    };
  }

  /**
   * Valide un numéro de téléphone
   *
   * @param phone - Le numéro de téléphone à valider
   * @param format - Format optionnel ('FR' pour France, 'INTERNATIONAL' par défaut)
   * @returns Résultat de la validation avec message
   */
  static validatePhone(phone: string, format: 'FR' | 'INTERNATIONAL' = 'INTERNATIONAL'): ValidationResult {
    if (!phone || phone.trim() === '') {
      return {
        valid: false,
        message: 'Le numéro de téléphone est requis',
      };
    }

    // Supprime tous les espaces, tirets et parenthèses
    const cleanedPhone = phone.replace(/[\s\-()]/g, '');

    if (format === 'FR') {
      // Format français: 06, 07, ou +33
      const frenchPhoneRegex = /^(?:(?:\+|00)33|0)[1-9](?:\d{8})$/;

      if (!frenchPhoneRegex.test(cleanedPhone)) {
        return {
          valid: false,
          message: 'Le numéro de téléphone français n\'est pas valide',
        };
      }
    } else {
      // Format international: au moins 10 chiffres
      const internationalPhoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;

      if (!internationalPhoneRegex.test(phone) || cleanedPhone.length < 10) {
        return {
          valid: false,
          message: 'Le numéro de téléphone n\'est pas valide',
        };
      }
    }

    return {
      valid: true,
      message: '',
    };
  }

  /**
   * Valide qu'un champ n'est pas vide
   *
   * @param value - La valeur à valider
   * @param fieldName - Nom du champ pour le message d'erreur
   * @returns Résultat de la validation avec message
   */
  static validateRequired(value: string, fieldName: string = 'Ce champ'): ValidationResult {
    if (!value || value.trim() === '') {
      return {
        valid: false,
        message: `${fieldName} est requis`,
      };
    }

    return {
      valid: true,
      message: '',
    };
  }

  /**
   * Valide la longueur minimale d'un champ
   *
   * @param value - La valeur à valider
   * @param minLength - Longueur minimale requise
   * @param fieldName - Nom du champ pour le message d'erreur
   * @returns Résultat de la validation avec message
   */
  static validateMinLength(value: string, minLength: number, fieldName: string = 'Ce champ'): ValidationResult {
    if (!value) {
      return {
        valid: false,
        message: `${fieldName} est requis`,
      };
    }

    if (value.length < minLength) {
      return {
        valid: false,
        message: `${fieldName} doit contenir au moins ${minLength} caractères`,
      };
    }

    return {
      valid: true,
      message: '',
    };
  }

  /**
   * Valide la longueur maximale d'un champ
   *
   * @param value - La valeur à valider
   * @param maxLength - Longueur maximale autorisée
   * @param fieldName - Nom du champ pour le message d'erreur
   * @returns Résultat de la validation avec message
   */
  static validateMaxLength(value: string, maxLength: number, fieldName: string = 'Ce champ'): ValidationResult {
    if (!value) {
      return {
        valid: true,
        message: '',
      };
    }

    if (value.length > maxLength) {
      return {
        valid: false,
        message: `${fieldName} ne doit pas dépasser ${maxLength} caractères`,
      };
    }

    return {
      valid: true,
      message: '',
    };
  }

  /**
   * Valide un mot de passe avec critères de sécurité
   *
   * @param password - Le mot de passe à valider
   * @param minLength - Longueur minimale (par défaut 8)
   * @returns Résultat de la validation avec message
   */
  static validatePassword(password: string, minLength: number = 8): ValidationResult {
    if (!password || password.trim() === '') {
      return {
        valid: false,
        message: 'Le mot de passe est requis',
      };
    }

    if (password.length < minLength) {
      return {
        valid: false,
        message: `Le mot de passe doit contenir au moins ${minLength} caractères`,
      };
    }

    // Vérifier qu'il contient au moins une lettre et un chiffre
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasLetter || !hasNumber) {
      return {
        valid: false,
        message: 'Le mot de passe doit contenir des lettres et des chiffres',
      };
    }

    return {
      valid: true,
      message: '',
    };
  }

  /**
   * Valide que deux valeurs correspondent (ex: confirmation mot de passe)
   *
   * @param value1 - Première valeur
   * @param value2 - Deuxième valeur
   * @param fieldName - Nom du champ pour le message d'erreur
   * @returns Résultat de la validation avec message
   */
  static validateMatch(value1: string, value2: string, fieldName: string = 'Les champs'): ValidationResult {
    if (value1 !== value2) {
      return {
        valid: false,
        message: `${fieldName} ne correspondent pas`,
      };
    }

    return {
      valid: true,
      message: '',
    };
  }

  /**
   * Valide une URL
   *
   * @param url - L'URL à valider
   * @returns Résultat de la validation avec message
   */
  static validateUrl(url: string): ValidationResult {
    if (!url || url.trim() === '') {
      return {
        valid: false,
        message: 'L\'URL est requise',
      };
    }

    try {
      new URL(url);
      return {
        valid: true,
        message: '',
      };
    } catch {
      return {
        valid: false,
        message: 'L\'URL n\'est pas valide',
      };
    }
  }

  /**
   * Valide une date
   *
   * @param date - La date à valider (string ou Date)
   * @param minDate - Date minimale optionnelle
   * @param maxDate - Date maximale optionnelle
   * @returns Résultat de la validation avec message
   */
  static validateDate(
    date: string | Date,
    minDate?: Date,
    maxDate?: Date
  ): ValidationResult {
    if (!date) {
      return {
        valid: false,
        message: 'La date est requise',
      };
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return {
        valid: false,
        message: 'La date n\'est pas valide',
      };
    }

    if (minDate && dateObj < minDate) {
      return {
        valid: false,
        message: `La date doit être après le ${minDate.toLocaleDateString('fr-FR')}`,
      };
    }

    if (maxDate && dateObj > maxDate) {
      return {
        valid: false,
        message: `La date doit être avant le ${maxDate.toLocaleDateString('fr-FR')}`,
      };
    }

    return {
      valid: true,
      message: '',
    };
  }

  /**
   * Valide un nombre
   *
   * @param value - La valeur à valider
   * @param min - Valeur minimale optionnelle
   * @param max - Valeur maximale optionnelle
   * @returns Résultat de la validation avec message
   */
  static validateNumber(
    value: string | number,
    min?: number,
    max?: number
  ): ValidationResult {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return {
        valid: false,
        message: 'La valeur doit être un nombre',
      };
    }

    if (min !== undefined && numValue < min) {
      return {
        valid: false,
        message: `La valeur doit être supérieure ou égale à ${min}`,
      };
    }

    if (max !== undefined && numValue > max) {
      return {
        valid: false,
        message: `La valeur doit être inférieure ou égale à ${max}`,
      };
    }

    return {
      valid: true,
      message: '',
    };
  }
}

export default ValidationService;
