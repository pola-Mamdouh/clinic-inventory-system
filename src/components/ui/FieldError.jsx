import { AlertCircle } from 'lucide-react';

/**
 * Inline field-level error message.
 * Renders nothing when `message` is falsy.
 */
export default function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400 animate-fade-in">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      {message}
    </p>
  );
}
