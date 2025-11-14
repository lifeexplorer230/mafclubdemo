/**
 * Unit Tests for Input Validation
 * Tests: shared/validation.js
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateId,
  validateIds,
  validateDate,
  validateString,
  validateNumber,
  validateEnum
} from '../shared/validation.js';

describe('validateId', () => {
  it('should accept positive integers', () => {
    expect(validateId(1)).toBe(1);
    expect(validateId('5')).toBe(5);
    expect(validateId(999)).toBe(999);
  });

  it('should reject zero and negative numbers', () => {
    expect(() => validateId(0)).toThrow('must be a positive integer');
    expect(() => validateId(-1)).toThrow('must be a positive integer');
    expect(() => validateId('-5')).toThrow('must be a positive integer');
  });

  it('should reject non-integers', () => {
    expect(() => validateId(1.5)).toThrow('must be a positive integer');
    expect(() => validateId('abc')).toThrow('must be a positive integer');
    expect(() => validateId(null)).toThrow('must be a positive integer');
    expect(() => validateId(undefined)).toThrow('must be a positive integer');
  });

  it('should use custom field name in error message', () => {
    expect(() => validateId(-1, 'User ID')).toThrow('Invalid User ID');
  });
});

describe('validateIds', () => {
  it('should accept array of valid IDs', () => {
    expect(validateIds([1, 2, 3])).toEqual([1, 2, 3]);
    expect(validateIds(['5', '10'])).toEqual([5, 10]);
  });

  it('should reject non-arrays', () => {
    expect(() => validateIds('123')).toThrow('must be an array');
    expect(() => validateIds(123)).toThrow('must be an array');
  });

  it('should reject arrays with invalid IDs', () => {
    expect(() => validateIds([1, -2, 3])).toThrow('must be a positive integer');
  });
});

describe('validateDate', () => {
  it('should accept valid YYYY-MM-DD dates', () => {
    expect(validateDate('2025-01-15')).toBe('2025-01-15');
    expect(validateDate('2024-12-31')).toBe('2024-12-31');
    expect(validateDate('2023-02-28')).toBe('2023-02-28');
  });

  it('should reject invalid date formats', () => {
    expect(() => validateDate('15-01-2025')).toThrow('must be YYYY-MM-DD');
    expect(() => validateDate('2025/01/15')).toThrow('must be YYYY-MM-DD');
    expect(() => validateDate('2025-1-5')).toThrow('must be YYYY-MM-DD');
  });

  it('should reject invalid date values', () => {
    expect(() => validateDate('2025-13-01')).toThrow('Invalid date value');
    expect(() => validateDate('2025-02-30')).toThrow('Invalid date value');
  });

  it('should reject non-strings', () => {
    expect(() => validateDate(20250115)).toThrow('must be a string');
    expect(() => validateDate(null)).toThrow('must be a string');
  });
});

describe('validateString', () => {
  it('should accept valid strings', () => {
    expect(validateString('hello')).toBe('hello');
    expect(validateString('  test  ')).toBe('test'); // trimmed
  });

  it('should reject non-strings', () => {
    expect(() => validateString(123)).toThrow('must be a string');
    expect(() => validateString(null)).toThrow('must be a string');
  });

  it('should enforce minLength', () => {
    expect(() => validateString('', { minLength: 1 })).toThrow('at least 1 characters');
    expect(() => validateString('ab', { minLength: 3 })).toThrow('at least 3 characters');
  });

  it('should enforce maxLength', () => {
    expect(() => validateString('a'.repeat(300), { maxLength: 255 })).toThrow('at most 255 characters');
  });
});

describe('validateNumber', () => {
  it('should accept valid numbers', () => {
    expect(validateNumber(5)).toBe(5);
    expect(validateNumber('10')).toBe(10);
    expect(validateNumber(0)).toBe(0);
    expect(validateNumber(-5)).toBe(-5);
  });

  it('should reject NaN', () => {
    expect(() => validateNumber('abc')).toThrow('must be a number');
    expect(() => validateNumber(null)).toThrow('must be a number');
  });

  it('should enforce min/max', () => {
    expect(() => validateNumber(5, { min: 10 })).toThrow('at least 10');
    expect(() => validateNumber(100, { max: 50 })).toThrow('at most 50');
  });
});

describe('validateEnum', () => {
  it('should accept values in allowed list', () => {
    expect(validateEnum('red', ['red', 'green', 'blue'])).toBe('red');
    expect(validateEnum(1, [1, 2, 3])).toBe(1);
  });

  it('should reject values not in allowed list', () => {
    expect(() => validateEnum('yellow', ['red', 'green', 'blue'])).toThrow('must be one of');
  });
});
