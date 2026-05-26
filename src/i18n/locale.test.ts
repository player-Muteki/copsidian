import { describe, expect, it } from 'vitest';
import en from './en';
import zh from './zh';

// Helper to get all keys from an object recursively
function getAllKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.push(fullKey);
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey));
    }
  }
  return keys;
}

describe('i18n locale completeness', () => {
  const enKeys = getAllKeys(en).sort();
  const zhKeys = getAllKeys(zh).sort();

  it('zh has all keys that en has', () => {
    const missingInZh = enKeys.filter(k => !zhKeys.includes(k));
    expect(missingInZh).toEqual([]);
  });

  it('en has all keys that zh has', () => {
    const missingInEn = zhKeys.filter(k => !enKeys.includes(k));
    expect(missingInEn).toEqual([]);
  });

  it('all string values in en are non-empty', () => {
    const checkStrings = (obj: any, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'string') {
          expect(value.length, `Key "${fullKey}" should not be empty`).toBeGreaterThan(0);
        } else if (typeof value === 'object' && value !== null) {
          checkStrings(value, fullKey);
        }
      }
    };
    checkStrings(en);
  });

  it('all string values in zh are non-empty', () => {
    const checkStrings = (obj: any, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'string') {
          expect(value.length, `Key "${fullKey}" should not be empty`).toBeGreaterThan(0);
        } else if (typeof value === 'object' && value !== null) {
          checkStrings(value, fullKey);
        }
      }
    };
    checkStrings(zh);
  });

  it('placeholder patterns match between en and zh', () => {
    const getPlaceholders = (str: string): string[] => {
      const matches = str.match(/\{[^}]+\}/g);
      return matches?.sort() ?? [];
    };

    const checkPlaceholders = (enObj: any, zhObj: any, prefix = '') => {
      for (const [key, enValue] of Object.entries(enObj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const zhValue = (zhObj as any)[key];

        if (typeof enValue === 'string' && typeof zhValue === 'string') {
          const enPlaceholders = getPlaceholders(enValue);
          const zhPlaceholders = getPlaceholders(zhValue);
          expect(enPlaceholders, `Placeholders in "${fullKey}" should match`).toEqual(zhPlaceholders);
        } else if (typeof enValue === 'object' && typeof zhValue === 'object') {
          checkPlaceholders(enValue, zhValue, fullKey);
        }
      }
    };
    checkPlaceholders(en, zh);
  });
});
