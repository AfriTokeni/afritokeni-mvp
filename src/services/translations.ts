/**
 * Multi-Language Translation Service
 * Supports English, Luganda, and Swahili
 */

export type Language = 'en' | 'lg' | 'sw';

interface Translations {
  [key: string]: {
    en: string;
    lg: string; // Luganda
    sw: string; // Swahili
  };
}

export class TranslationService {
  private static translations: Translations = {
    // Welcome messages
    'welcome': {
      en: 'Welcome to AfriTokeni!',
      lg: 'Tukusanyukidde ku AfriTokeni!',
      sw: 'Karibu AfriTokeni!'
    },
    'account_ready': {
      en: 'Your account is ready.',
      lg: 'Akawunti yo etegefu.',
      sw: 'Akaunti yako iko tayari.'
    },
    
    // Menu items
    'local_currency': {
      en: 'Local Currency',
      lg: 'Ssente z\'omu Uganda',
      sw: 'Sarafu ya Ndani'
    },
    'bitcoin': {
      en: 'Bitcoin',
      lg: 'Bitcoin',
      sw: 'Bitcoin'
    },
    'usdc': {
      en: 'USDC',
      lg: 'USDC',
      sw: 'USDC'
    },
    'dao_governance': {
      en: 'DAO Governance',
      lg: 'Okufuga kwa DAO',
      sw: 'Utawala wa DAO'
    },
    
    // Balance
    'balance': {
      en: 'Balance',
      lg: 'Ssente',
      sw: 'Salio'
    },
    'your_balance': {
      en: 'Your balance is',
      lg: 'Ssente zo',
      sw: 'Salio yako ni'
    },
    
    // Transactions
    'send_money': {
      en: 'Send Money',
      lg: 'Wereza Ssente',
      sw: 'Tuma Pesa'
    },
    'withdraw': {
      en: 'Withdraw Cash',
      lg: 'Ggya Ssente',
      sw: 'Ondoa Pesa'
    },
    'transaction_success': {
      en: 'Transaction successful!',
      lg: 'Ensimbi ziweereddwa!',
      sw: 'Muamala umefanikiwa!'
    },
    'transaction_failed': {
      en: 'Transaction failed',
      lg: 'Ensimbi teziweereddwa',
      sw: 'Muamala umeshindwa'
    },
    
    // Confirmations
    'confirm': {
      en: 'Confirm',
      lg: 'Kakasa',
      sw: 'Thibitisha'
    },
    'cancel': {
      en: 'Cancel',
      lg: 'Sazaamu',
      sw: 'Ghairi'
    },
    'confirm_transaction': {
      en: 'Confirm transaction?',
      lg: 'Kakasa okuweereza?',
      sw: 'Thibitisha muamala?'
    },
    
    // Amounts
    'amount': {
      en: 'Amount',
      lg: 'Omuwendo',
      sw: 'Kiasi'
    },
    'fee': {
      en: 'Fee',
      lg: 'Ssente z\'okuweereza',
      sw: 'Ada'
    },
    'total': {
      en: 'Total',
      lg: 'Omugatte',
      sw: 'Jumla'
    },
    
    // Bitcoin
    'bitcoin_balance': {
      en: 'Bitcoin balance',
      lg: 'Ssente za Bitcoin',
      sw: 'Salio la Bitcoin'
    },
    'bitcoin_rate': {
      en: 'Bitcoin rate',
      lg: 'Omuwendo gwa Bitcoin',
      sw: 'Bei ya Bitcoin'
    },
    'buy_bitcoin': {
      en: 'Buy Bitcoin',
      lg: 'Gula Bitcoin',
      sw: 'Nunua Bitcoin'
    },
    'sell_bitcoin': {
      en: 'Sell Bitcoin',
      lg: 'Tunda Bitcoin',
      sw: 'Uza Bitcoin'
    },
    
    // Errors
    'error': {
      en: 'Error',
      lg: 'Kiremya',
      sw: 'Kosa'
    },
    'invalid_option': {
      en: 'Invalid option. Please try again:',
      lg: 'Ekiragiro si kituufu. Gezaako nate:',
      sw: 'Chaguo si sahihi. Jaribu tena:'
    },
    'insufficient_balance': {
      en: 'Insufficient balance',
      lg: 'Ssente tezimala',
      sw: 'Salio haitoshi'
    },
    'invalid_amount': {
      en: 'Invalid amount',
      lg: 'Omuwendo si mutuufu',
      sw: 'Kiasi si sahihi'
    },
    'invalid_phone': {
      en: 'Invalid phone number',
      lg: 'Namba ya simu si ntuufu',
      sw: 'Nambari ya simu si sahihi'
    },
    'enter_recipient_phone': {
      en: 'Enter recipient phone number:',
      lg: 'Yingiza namba ya simu y\'omuntu:',
      sw: 'Weka nambari ya simu ya mpokeaji:'
    },
    'phone_format_example': {
      en: '(e.g. 256700123456)',
      lg: '(okugeza: 256700123456)',
      sw: '(mfano: 256700123456)'
    },
    
    // Rate limiting
    'too_many_requests': {
      en: 'Too many requests. Please wait.',
      lg: 'Osabidde emirundi mingi. Linda.',
      sw: 'Maombi mengi sana. Tafadhali subiri.'
    },
    'wait_minute': {
      en: 'Wait 1 minute',
      lg: 'Linda dakiika 1',
      sw: 'Subiri dakika 1'
    },
    'daily_limit_reached': {
      en: 'Daily limit reached',
      lg: 'Omugendo gw\'olunaku gutuuse',
      sw: 'Kikomo cha siku kimefikiwa'
    },
    
    // Fraud detection
    'suspicious_activity': {
      en: 'Suspicious activity detected',
      lg: 'Ebikolwa ebitali bya bulijjo bizuuliddwa',
      sw: 'Shughuli ya kutilia shaka imegunduliwa'
    },
    'transaction_blocked': {
      en: 'Transaction blocked for security',
      lg: 'Okuweereza kuziyiddwa olw\'obukuumi',
      sw: 'Muamala umezuiwa kwa usalama'
    },
    'verification_required': {
      en: 'Verification required',
      lg: 'Okukakasa kwetaagisa',
      sw: 'Uthibitisho unahitajika'
    },
    
    // PIN
    'enter_pin': {
      en: 'Enter PIN',
      lg: 'Yingiza PIN',
      sw: 'Weka PIN'
    },
    'wrong_pin': {
      en: 'Wrong PIN',
      lg: 'PIN si ntuufu',
      sw: 'PIN si sahihi'
    },
    'pin_set': {
      en: 'PIN set successfully',
      lg: 'PIN etegekeddwa bulungi',
      sw: 'PIN imewekwa kwa mafanikio'
    },
    'account_locked': {
      en: 'Account locked. Too many attempts.',
      lg: 'Akawunti eziyiddwa. Ogezezzaako emirundi mingi.',
      sw: 'Akaunti imefungwa. Majaribio mengi sana.'
    },
    
    // Menu items
    'check_balance': {
      en: 'Check Balance',
      lg: 'Kebera Ssente',
      sw: 'Angalia Salio'
    },
    'transaction_history': {
      en: 'Transaction History',
      lg: 'Ebyafaayo by\'ensimbi',
      sw: 'Historia ya Muamala'
    },
    'bitcoin_services': {
      en: 'Bitcoin Services',
      lg: 'Empeereza za Bitcoin',
      sw: 'Huduma za Bitcoin'
    },
    'help': {
      en: 'Help',
      lg: 'Obuyambi',
      sw: 'Msaada'
    },
    
    // Help text
    'help_commands': {
      en: 'Commands: BAL, SEND, WITHDRAW, BTC BAL, HELP',
      lg: 'Ebiragiro: BAL, SEND, WITHDRAW, BTC BAL, HELP',
      sw: 'Amri: BAL, SEND, WITHDRAW, BTC BAL, HELP'
    },
    'help_ussd': {
      en: 'Dial *22948# for menu',
      lg: 'Kuba *22948# okufuna menu',
      sw: 'Piga *22948# kwa menyu'
    },
    
    // Language selection
    'select_language': {
      en: 'Select language:\n1. English\n2. Luganda\n3. Swahili',
      lg: 'Londa olulimi:\n1. English\n2. Luganda\n3. Swahili',
      sw: 'Chagua lugha:\n1. English\n2. Luganda\n3. Swahili'
    },
    'language_set': {
      en: 'Language set to English',
      lg: 'Olulimi lutegekeddwa ku Luganda',
      sw: 'Lugha imewekwa kwa Kiswahili'
    },
    'press_zero_back': {
      en: 'Press 0 to return to main menu',
      lg: 'Nyiga 0 okudda ku menu enkulu',
      sw: 'Bonyeza 0 kurudi kwa menyu kuu'
    },
    'back_or_menu': {
      en: '0. Back | 9. Menu',
      lg: '0. Ddayo | 9. Menu',
      sw: '0. Rudi | 9. Menyu'
    },
  };

  /**
   * Get translation for a key
   */
  static translate(key: string, language: Language = 'en'): string {
    const translation = this.translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language] || translation.en;
  }

  /**
   * Get translation with variable substitution
   */
  static translateWithVars(
    key: string,
    vars: Record<string, string | number>,
    language: Language = 'en'
  ): string {
    let text = this.translate(key, language);
    
    Object.entries(vars).forEach(([varKey, value]) => {
      text = text.replace(`{${varKey}}`, String(value));
    });
    
    return text;
  }

  /**
   * Detect language from phone number or user preference
   */
  static async detectLanguage(phoneNumber: string): Promise<Language> {
    // Default to English
    // In production, this would check user preferences in database
    // For now, we can detect by country code:
    // +256 (Uganda) -> Luganda preferred
    // +254 (Kenya) -> Swahili preferred
    // +255 (Tanzania) -> Swahili preferred
    
    if (phoneNumber.startsWith('+256')) {
      return 'lg'; // Luganda for Uganda
    } else if (phoneNumber.startsWith('+254') || phoneNumber.startsWith('+255')) {
      return 'sw'; // Swahili for Kenya/Tanzania
    }
    
    return 'en'; // Default to English
  }

  /**
   * Format amount with currency in local language
   */
  static formatAmount(amount: number, currency: string, language: Language = 'en'): string {
    const formatted = amount.toLocaleString();
    
    switch (language) {
      case 'lg':
        return `${formatted} ${currency}`;
      case 'sw':
        return `${currency} ${formatted}`;
      default:
        return `${formatted} ${currency}`;
    }
  }

  /**
   * Get all supported languages
   */
  static getSupportedLanguages(): { code: Language; name: string; nativeName: string }[] {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'lg', name: 'Luganda', nativeName: 'Luganda' },
      { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' }
    ];
  }
}
