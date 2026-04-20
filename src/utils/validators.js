/**
 * Pure validator functions — each returns null (valid) or an error string.
 * Compose them into arrays and pass to `validate()` or `validateForm()`.
 */

/** Field is required (non-empty after trimming). */
export const required = (message = 'This field is required') =>
  (value) => {
    const str = (value == null ? '' : String(value)).trim();
    return str ? null : message;
  };

/** Valid email format (only checked when a value is present). */
export const email = (message = 'Enter a valid email address') =>
  (value) => {
    if (!value?.trim()) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : message;
  };

/**
 * Egyptian phone number: exactly 11 digits, starts with 01.
 * Only validated when a value is present.
 */
export const egyptianPhone = (message) =>
  (value) => {
    if (!value?.trim()) return null;
    const digits = String(value).replace(/\D/g, '');
    if (digits.length !== 11) return message ?? 'Phone number must be exactly 11 digits';
    if (!digits.startsWith('01')) return 'Phone number must start with 01';
    return null;
  };

/** Must be a valid finite number (only checked when a value is present). */
export const numeric = (message = 'Must be a valid number') =>
  (value) => {
    if (value === '' || value == null) return null;
    const n = Number(value);
    return !isNaN(n) && isFinite(n) ? null : message;
  };

/** Must be >= min (only checked when a value is present). */
export const minValue = (min, message) =>
  (value) => {
    if (value === '' || value == null) return null;
    return Number(value) >= min ? null : (message ?? `Must be ${min} or greater`);
  };

/** Must have at least `min` characters (only checked when a value is present). */
export const minLength = (min, message) =>
  (value) => {
    if (!value?.trim()) return null;
    return value.trim().length >= min ? null : (message ?? `Must be at least ${min} characters`);
  };

/**
 * Run a single value through an array of rule functions.
 * Returns the first error string found, or null.
 */
export const validate = (value, rules = []) => {
  for (const rule of rules) {
    const err = rule(value);
    if (err) return err;
  }
  return null;
};

/**
 * Run an entire form data object through a schema map.
 * schema: { fieldName: [rule, rule, ...], ... }
 * Returns { fieldName: errorString } for every failing field (empty = all valid).
 */
export const validateForm = (data, schema) => {
  const errors = {};
  for (const [field, rules] of Object.entries(schema)) {
    const err = validate(data[field], rules);
    if (err) errors[field] = err;
  }
  return errors;
};

/**
 * Build an input className that switches to red border on error.
 * `extra` is appended as additional Tailwind classes.
 */
export const inputCls = (hasError, extra = '') =>
  [
    'w-full bg-navy-800 border text-white placeholder-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all',
    hasError
      ? 'border-red-500/50 focus:border-red-500/60 focus:ring-1 focus:ring-red-500/10'
      : 'border-white/10 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
