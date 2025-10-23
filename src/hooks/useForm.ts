import { useState, useCallback, useMemo } from 'react';
import { ValidationService, ValidationResult } from '../services/ValidationService';

/**
 * Type pour les règles de validation d'un champ
 */
export type ValidationRule<T> = (value: any, values: T) => ValidationResult;

/**
 * Configuration de validation pour chaque champ du formulaire
 */
export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T>[];
};

/**
 * Interface pour le résultat du hook useForm
 */
export interface UseFormResult<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  handleChange: (field: keyof T, value: any) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e?: any) => Promise<void>;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  setValues: (values: T) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  reset: () => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
}

/**
 * Options de configuration pour useForm
 */
export interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: ValidationSchema<T>;
  onSubmit: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

/**
 * Hook pour la gestion de formulaires avec validation
 *
 * Fournit une gestion complète de l'état du formulaire, des erreurs de validation,
 * et de la soumission. Intégré avec ValidationService pour la validation des champs.
 *
 * @example
 * const { values, errors, handleChange, handleSubmit, isValid } = useForm({
 *   initialValues: { email: '', password: '' },
 *   validationSchema: {
 *     email: [(value) => ValidationService.validateEmail(value)],
 *     password: [(value) => ValidationService.validateMinLength(value, 8, 'Le mot de passe')],
 *   },
 *   onSubmit: async (values) => {
 *     await login(values.email, values.password);
 *   },
 * });
 *
 * // Utilisation
 * <TextInput
 *   value={values.email}
 *   onChangeText={(text) => handleChange('email', text)}
 *   error={errors.email}
 * />
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema = {},
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
}: UseFormOptions<T>): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Valide un champ spécifique
   */
  const validateField = useCallback(
    (field: keyof T): boolean => {
      const rules = validationSchema[field];
      if (!rules || rules.length === 0) {
        return true;
      }

      for (const rule of rules) {
        const result = rule(values[field], values);
        if (!result.valid) {
          setErrors((prev) => ({ ...prev, [field]: result.message }));
          return false;
        }
      }

      // Si toutes les règles sont valides, supprimer l'erreur
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });

      return true;
    },
    [values, validationSchema]
  );

  /**
   * Valide tous les champs du formulaire
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isFormValid = true;

    // Valider tous les champs qui ont des règles de validation
    for (const field in validationSchema) {
      const rules = validationSchema[field as keyof T];
      if (!rules || rules.length === 0) continue;

      for (const rule of rules) {
        const result = rule(values[field as keyof T], values);
        if (!result.valid) {
          newErrors[field as keyof T] = result.message;
          isFormValid = false;
          break;
        }
      }
    }

    setErrors(newErrors);
    return isFormValid;
  }, [values, validationSchema]);

  /**
   * Gère le changement de valeur d'un champ
   */
  const handleChange = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [field]: value }));

      if (validateOnChange && touched[field]) {
        // Valider après un court délai pour éviter la validation pendant la saisie
        setTimeout(() => {
          validateField(field);
        }, 0);
      }
    },
    [validateOnChange, touched, validateField]
  );

  /**
   * Gère le blur (perte de focus) d'un champ
   */
  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      if (validateOnBlur) {
        validateField(field);
      }
    },
    [validateOnBlur, validateField]
  );

  /**
   * Gère la soumission du formulaire
   */
  const handleSubmit = useCallback(
    async (e?: any) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }

      // Marquer tous les champs comme touchés
      const allTouched: Partial<Record<keyof T, boolean>> = {};
      for (const field in values) {
        allTouched[field as keyof T] = true;
      }
      setTouched(allTouched);

      // Valider le formulaire
      const isFormValid = validateForm();

      if (!isFormValid) {
        return;
      }

      setIsSubmitting(true);

      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateForm, onSubmit]
  );

  /**
   * Définit la valeur d'un champ
   */
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Définit l'erreur d'un champ
   */
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  /**
   * Définit l'état "touché" d'un champ
   */
  const setFieldTouched = useCallback((field: keyof T, touched: boolean) => {
    setTouched((prev) => ({ ...prev, [field]: touched }));
  }, []);

  /**
   * Réinitialise le formulaire
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Calcule si le formulaire est valide
   */
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setValues,
    setErrors,
    reset,
    validateField,
    validateForm,
  };
}

export default useForm;
