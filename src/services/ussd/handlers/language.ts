/**
 * Language Selection Handler
 * Allows users to change their preferred language
 */

import type { USSDSession } from '../types.js';
import { continueSession, endSession } from '../utils/responses.js';
import { TranslationService, type Language } from '../../translations.js';

/**
 * Handle language selection menu
 */
export async function handleLanguageSelection(
  input: string,
  session: USSDSession
): Promise<string> {
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  
  // Show language menu
  if (!currentInput) {
    return continueSession(TranslationService.translate('select_language', session.language || 'en'));
  }
  
  // Handle language selection
  switch (currentInput) {
    case '1':
      session.language = 'en';
      return endSession(TranslationService.translate('language_set', 'en'));
    
    case '2':
      session.language = 'lg';
      return endSession(TranslationService.translate('language_set', 'lg'));
    
    case '3':
      session.language = 'sw';
      return endSession(TranslationService.translate('language_set', 'sw'));
    
    case '0':
      // Go back to main menu
      session.currentMenu = 'main';
      return continueSession(''); // Will trigger main menu display
    
    default:
      return continueSession(TranslationService.translate('select_language', session.language || 'en'));
  }
}
