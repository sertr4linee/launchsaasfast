import { describe, it, expect } from 'vitest';
import { cn, formatError, sleep } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn', () => {
    it('should merge classes correctly', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500');
      expect(result).toBe('px-4 py-2 bg-blue-500');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('px-4', isActive && 'bg-blue-500');
      expect(result).toBe('px-4 bg-blue-500');
    });

    it('should merge conflicting Tailwind classes', () => {
      const result = cn('px-4 px-6');
      expect(result).toBe('px-6');
    });
  });

  describe('formatError', () => {
    it('should format Error objects', () => {
      const error = new Error('Test error');
      expect(formatError(error)).toBe('Test error');
    });

    it('should format string errors', () => {
      expect(formatError('String error')).toBe('String error');
    });

    it('should handle unknown errors', () => {
      expect(formatError(123)).toBe('An unknown error occurred');
    });
  });

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now();
      await sleep(10);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(10);
    });
  });
});
