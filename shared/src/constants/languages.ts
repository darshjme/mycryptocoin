/**
 * Multi-Language Support — 40+ Languages
 *
 * Includes language code, name, native name, RTL detection,
 * and default language configuration.
 */

export interface LanguageConfig {
  code: string;         // ISO 639-1 code
  name: string;         // English name
  nativeName: string;   // Name in the language itself
  rtl: boolean;         // Right-to-left script
  region?: string;      // Primary region/country
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  // ── Major World Languages ────────────────────
  { code: 'en', name: 'English', nativeName: 'English', rtl: false, region: 'US' },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol', rtl: false, region: 'ES' },
  { code: 'fr', name: 'French', nativeName: 'Francais', rtl: false, region: 'FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false, region: 'DE' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', rtl: false, region: 'IT' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Portugues', rtl: false, region: 'BR' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', rtl: false, region: 'NL' },
  { code: 'ru', name: 'Russian', nativeName: 'Russkij', rtl: false, region: 'RU' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Ukrainska', rtl: false, region: 'UA' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', rtl: false, region: 'PL' },
  { code: 'cs', name: 'Czech', nativeName: 'Cestina', rtl: false, region: 'CZ' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', rtl: false, region: 'HU' },
  { code: 'ro', name: 'Romanian', nativeName: 'Romana', rtl: false, region: 'RO' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Bulgarski', rtl: false, region: 'BG' },
  { code: 'el', name: 'Greek', nativeName: 'Ellinika', rtl: false, region: 'GR' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', rtl: false, region: 'SE' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', rtl: false, region: 'NO' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', rtl: false, region: 'DK' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', rtl: false, region: 'FI' },

  // ── Asian Languages ──────────────────────────
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '\u7B80\u4F53\u4E2D\u6587', rtl: false, region: 'CN' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '\u7E41\u9AD4\u4E2D\u6587', rtl: false, region: 'TW' },
  { code: 'ja', name: 'Japanese', nativeName: '\u65E5\u672C\u8A9E', rtl: false, region: 'JP' },
  { code: 'ko', name: 'Korean', nativeName: '\uD55C\uAD6D\uC5B4', rtl: false, region: 'KR' },
  { code: 'hi', name: 'Hindi', nativeName: '\u0939\u093F\u0928\u094D\u0926\u0940', rtl: false, region: 'IN' },
  { code: 'bn', name: 'Bengali', nativeName: '\u09AC\u09BE\u0982\u09B2\u09BE', rtl: false, region: 'BD' },
  { code: 'ta', name: 'Tamil', nativeName: '\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD', rtl: false, region: 'IN' },
  { code: 'th', name: 'Thai', nativeName: '\u0E44\u0E17\u0E22', rtl: false, region: 'TH' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Ti\u1EBFng Vi\u1EC7t', rtl: false, region: 'VN' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', rtl: false, region: 'ID' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', rtl: false, region: 'MY' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', rtl: false, region: 'PH' },

  // ── RTL Languages ────────────────────────────
  { code: 'ar', name: 'Arabic', nativeName: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629', rtl: true, region: 'SA' },
  { code: 'he', name: 'Hebrew', nativeName: '\u05E2\u05D1\u05E8\u05D9\u05EA', rtl: true, region: 'IL' },
  { code: 'fa', name: 'Persian', nativeName: '\u0641\u0627\u0631\u0633\u06CC', rtl: true, region: 'IR' },
  { code: 'ur', name: 'Urdu', nativeName: '\u0627\u0631\u062F\u0648', rtl: true, region: 'PK' },

  // ── African Languages ────────────────────────
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', rtl: false, region: 'KE' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', rtl: false, region: 'ZA' },

  // ── Other European ───────────────────────────
  { code: 'tr', name: 'Turkish', nativeName: 'T\u00FCrk\u00E7e', rtl: false, region: 'TR' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', rtl: false, region: 'HR' },
  { code: 'sk', name: 'Slovak', nativeName: 'Sloven\u010Dina', rtl: false, region: 'SK' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Sloven\u0161\u010Dina', rtl: false, region: 'SI' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvi\u0173', rtl: false, region: 'LT' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latvie\u0161u', rtl: false, region: 'LV' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', rtl: false, region: 'EE' },
  { code: 'ca', name: 'Catalan', nativeName: 'Catal\u00E0', rtl: false, region: 'ES' },
];

/**
 * Default language.
 */
export const DEFAULT_LANGUAGE = 'en';

/**
 * Get all RTL language codes.
 */
export function getRtlLanguages(): string[] {
  return SUPPORTED_LANGUAGES.filter(l => l.rtl).map(l => l.code);
}

/**
 * Check if a language is RTL.
 */
export function isRtlLanguage(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(l => l.code === code && l.rtl);
}

/**
 * Get language config by code.
 */
export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find(l => l.code === code);
}

/**
 * Get all language codes.
 */
export function getAllLanguageCodes(): string[] {
  return SUPPORTED_LANGUAGES.map(l => l.code);
}

/**
 * Detect direction attribute for HTML.
 */
export function getHtmlDir(languageCode: string): 'ltr' | 'rtl' {
  return isRtlLanguage(languageCode) ? 'rtl' : 'ltr';
}
