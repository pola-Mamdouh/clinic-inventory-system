import { useState, useCallback } from 'react';
import { validate, validateForm } from '../utils/validators';

/**
 * Manage per-field and whole-form validation state.
 *
 * @param {Object} schema  — { fieldName: [rule, ...], ... }
 *
 * Returns:
 *   errors         — { fieldName: errorString | undefined }
 *   submitted      — true after the first validateAll() call (enables inline errors)
 *   validateField  — (name, value) => errorString | null  (call on onChange)
 *   validateAll    — (formData, extraRules?) => boolean    (call on submit)
 *   resetValidation— () => void                           (call on modal close)
 */
export function useFormValidation(schema) {
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  /** Validate a single field and update its error slot. */
  const validateField = useCallback(
    (name, value) => {
      const rules = schema[name];
      if (!rules?.length) return null;
      const error = validate(value, rules);
      setErrors((prev) => {
        if (error) return { ...prev, [name]: error };
        const next = { ...prev };
        delete next[name];
        return next;
      });
      return error;
    },
    [schema],
  );

  /**
   * Validate every field in the schema (+ any extra one-off rules).
   * extraRules overrides/extends the schema for this call only
   * (useful for cross-field checks like confirmPassword).
   * Returns true when there are no errors.
   */
  const validateAll = useCallback(
    (formData, extraRules = {}) => {
      setSubmitted(true);
      const effectiveSchema = { ...schema, ...extraRules };
      const newErrors = validateForm(formData, effectiveSchema);
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [schema],
  );

  /** Reset all errors and the submitted flag (call when modal closes). */
  const resetValidation = useCallback(() => {
    setErrors({});
    setSubmitted(false);
  }, []);

  return { errors, submitted, validateField, validateAll, resetValidation };
}
