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
    
    // Common prompts
    'enter_amount': {
      en: 'Enter amount',
      lg: 'Yingiza omuwendo',
      sw: 'Weka kiasi'
    },
    'enter_pin_4digit': {
      en: 'Enter your 4-digit PIN',
      lg: 'Yingiza PIN yo ey\'ennamba 4',
      sw: 'Weka PIN yako ya nambari 4'
    },
    'invalid_pin_format': {
      en: 'Invalid PIN format',
      lg: 'Enkola ya PIN si ntuufu',
      sw: 'Muundo wa PIN si sahihi'
    },
    'incorrect_pin': {
      en: 'Incorrect PIN',
      lg: 'PIN si ntuufu',
      sw: 'PIN si sahihi'
    },
    'please_select_option': {
      en: 'Please select an option:',
      lg: 'Londa ekiragiro:',
      sw: 'Tafadhali chagua chaguo:'
    },
    'back_to_main_menu': {
      en: 'Back to Main Menu',
      lg: 'Ddayo ku Menu Enkulu',
      sw: 'Rudi kwa Menyu Kuu'
    },
    'invalid_selection': {
      en: 'Invalid selection',
      lg: 'Ekiragiro si kituufu',
      sw: 'Chaguo si sahihi'
    },
    'user_not_found': {
      en: 'User not found. Please contact support.',
      lg: 'Omukozesa tazuuliddwa. Tuukirire obuyambi.',
      sw: 'Mtumiaji hajapatikana. Tafadhali wasiliana na msaada.'
    },
    'error_try_again': {
      en: 'Error. Please try again later.',
      lg: 'Kiremya. Gezaako oluvannyuma.',
      sw: 'Kosa. Tafadhali jaribu tena baadaye.'
    },
    'thank_you': {
      en: 'Thank you for using AfriTokeni!',
      lg: 'Webale okukozesa AfriTokeni!',
      sw: 'Asante kwa kutumia AfriTokeni!'
    },
    'transaction_cancelled': {
      en: 'Transaction cancelled',
      lg: 'Okuweereza kusaziddwamu',
      sw: 'Muamala umeghairiwa'
    },
    'minimum_amount': {
      en: 'Minimum',
      lg: 'Omuwendo omutono',
      sw: 'Kiwango cha chini'
    },
    'enter_pin_confirm': {
      en: 'Enter your PIN to confirm',
      lg: 'Yingiza PIN yo okukakasa',
      sw: 'Weka PIN yako kuthibitisha'
    },
    'no_agents_available': {
      en: 'No agents available at this time. Please try again later.',
      lg: 'Tewali ba-agent kati. Gezaako oluvannyuma.',
      sw: 'Hakuna mawakala kwa sasa. Tafadhali jaribu tena baadaye.'
    },
    'select_agent': {
      en: 'Select an agent',
      lg: 'Londa agent',
      sw: 'Chagua wakala'
    },
    'choose_amount_type': {
      en: 'Choose amount type',
      lg: 'Londa ekika ky\'omuwendo',
      sw: 'Chagua aina ya kiasi'
    },
    'transaction_complete': {
      en: 'Transaction complete!',
      lg: 'Okuweereza kuwedde!',
      sw: 'Muamala umekamilika!'
    },
    'meet_agent': {
      en: 'Meet your selected agent to complete the transaction.',
      lg: 'Sisinkana ne agent wo okumaliriza.',
      sw: 'Kutana na wakala wako kukamilisha muamala.'
    },
    'receive_cash': {
      en: 'Meet your selected agent to receive cash.',
      lg: 'Sisinkana ne agent wo okufuna ssente.',
      sw: 'Kutana na wakala wako kupokea pesa.'
    },
    'send_bitcoin': {
      en: 'Send Bitcoin',
      lg: 'Wereza Bitcoin',
      sw: 'Tuma Bitcoin'
    },
    'bitcoin_menu_title': {
      en: 'Bitcoin (ckBTC)',
      lg: 'Bitcoin (ckBTC)',
      sw: 'Bitcoin (ckBTC)'
    },
    'buy_btc_enter_amount': {
      en: 'Buy Bitcoin',
      lg: 'Gula Bitcoin',
      sw: 'Nunua Bitcoin'
    },
    'enter_amount_to_spend': {
      en: 'Enter amount to spend',
      lg: 'Yingiza omuwendo ogw\'okusaasaanya',
      sw: 'Weka kiasi cha kutumia'
    },
    'minimum_purchase': {
      en: 'Minimum purchase',
      lg: 'Omuwendo omutono ogw\'okugula',
      sw: 'Ununuzi wa chini'
    },
    'choose_agent': {
      en: 'Choose an agent',
      lg: 'Londa agent',
      sw: 'Chagua wakala'
    },
    'or_cancel': {
      en: 'or 0 to cancel',
      lg: 'oba 0 okusazaamu',
      sw: 'au 0 kughairi'
    },
    'purchase_summary': {
      en: 'Purchase Summary',
      lg: 'Ebikwata ku Kugula',
      sw: 'Muhtasari wa Ununuzi'
    },
    'you_pay': {
      en: 'You pay',
      lg: 'Osasula',
      sw: 'Utalipa'
    },
    'you_receive': {
      en: 'You receive',
      lg: 'Ofuna',
      sw: 'Utapokea'
    },
    'agent': {
      en: 'Agent',
      lg: 'Agent',
      sw: 'Wakala'
    },
    'rate': {
      en: 'Rate',
      lg: 'Omuwendo',
      sw: 'Bei'
    },
    'purchase_failed': {
      en: 'Purchase failed',
      lg: 'Okugula kulemeddwa',
      sw: 'Ununuzi umeshindwa'
    },
    'error_processing_purchase': {
      en: 'Error processing purchase. Please try again later.',
      lg: 'Kiremya mu kugula. Gezaako oluvannyuma.',
      sw: 'Kosa katika kuchakata ununuzi. Tafadhali jaribu tena baadaye.'
    },
    'available': {
      en: 'Available',
      lg: 'Ebiriwo',
      sw: 'Inapatikana'
    },
    'locked': {
      en: 'Locked',
      lg: 'Eziyiddwa',
      sw: 'Imefungwa'
    },
    'enter_btc_amount': {
      en: 'Enter BTC amount',
      lg: 'Yingiza omuwendo gwa BTC',
      sw: 'Weka kiasi cha BTC'
    },
    'minimum_sale': {
      en: 'Minimum sale',
      lg: 'Omuwendo omutono ogw\'okutunda',
      sw: 'Mauzo ya chini'
    },
    'insufficient_btc': {
      en: 'Insufficient Bitcoin balance',
      lg: 'Bitcoin tezimala',
      sw: 'Salio la Bitcoin haitoshi'
    },
    'required': {
      en: 'Required',
      lg: 'Ekyetaagisa',
      sw: 'Inahitajika'
    },
    'enter_smaller_amount': {
      en: 'Enter a smaller amount',
      lg: 'Yingiza omuwendo omutono',
      sw: 'Weka kiasi kidogo'
    },
    'sale_summary': {
      en: 'Sale Summary',
      lg: 'Ebikwata ku Kutunda',
      sw: 'Muhtasari wa Mauzo'
    },
    'you_sell': {
      en: 'You sell',
      lg: 'Otunda',
      sw: 'Unauza'
    },
    'sale_failed': {
      en: 'Sale failed',
      lg: 'Okutunda kulemeddwa',
      sw: 'Mauzo yameshindwa'
    },
    'error_processing_sale': {
      en: 'Error processing sale. Please try again later.',
      lg: 'Kiremya mu kutunda. Gezaako oluvannyuma.',
      sw: 'Kosa katika kuchakata mauzo. Tafadhali jaribu tena baadaye.'
    },
    'enter_recipient_btc': {
      en: 'Enter recipient phone number',
      lg: 'Yingiza namba ya simu y\'omuntu',
      sw: 'Weka nambari ya simu ya mpokeaji'
    },
    'recipient_not_found': {
      en: 'Recipient not found',
      lg: 'Omuntu tazuuliddwa',
      sw: 'Mpokeaji hajapatikana'
    },
    'they_need_register': {
      en: 'They need to register first',
      lg: 'Balina okwewandiisa',
      sw: 'Wanahitaji kusajili kwanza'
    },
    'enter_different_phone': {
      en: 'Enter different phone',
      lg: 'Yingiza namba endala',
      sw: 'Weka nambari nyingine'
    },
    'send_summary': {
      en: 'Send Summary',
      lg: 'Ebikwata ku Kuweereza',
      sw: 'Muhtasari wa Kutuma'
    },
    'to': {
      en: 'To',
      lg: 'Eri',
      sw: 'Kwa'
    },
    'network_fee': {
      en: 'Network Fee',
      lg: 'Ssente z\'omutimbagano',
      sw: 'Ada ya Mtandao'
    },
    'send_failed': {
      en: 'Send failed',
      lg: 'Okuweereza kulemeddwa',
      sw: 'Kutuma kumeshindwa'
    },
    'error_processing_send': {
      en: 'Error processing send. Please try again later.',
      lg: 'Kiremya mu kuweereza. Gezaako oluvannyuma.',
      sw: 'Kosa katika kuchakata. Tafadhali jaribu tena baadaye.'
    },
    'usdc_menu_title': {
      en: 'USDC (ckUSDC)',
      lg: 'USDC (ckUSDC)',
      sw: 'USDC (ckUSDC)'
    },
    'usdc_rate': {
      en: 'USDC Rate',
      lg: 'Omuwendo gwa USDC',
      sw: 'Bei ya USDC'
    },
    'buy_usdc': {
      en: 'Buy USDC',
      lg: 'Gula USDC',
      sw: 'Nunua USDC'
    },
    'sell_usdc': {
      en: 'Sell USDC',
      lg: 'Tunda USDC',
      sw: 'Uza USDC'
    },
    'send_usdc': {
      en: 'Send USDC',
      lg: 'Wereza USDC',
      sw: 'Tuma USDC'
    },
    'current_rate': {
      en: 'Current Rate',
      lg: 'Omuwendo gwa kati',
      sw: 'Bei ya sasa'
    },
    'last_updated': {
      en: 'Last Updated',
      lg: 'Oluvannyuma olw\'okusemba',
      sw: 'Imesasishwa mwisho'
    },
    'error_retrieving_rate': {
      en: 'Error retrieving rate. Please try again later.',
      lg: 'Kiremya mu kufuna omuwendo. Gezaako oluvannyuma.',
      sw: 'Kosa katika kupata bei. Tafadhali jaribu tena baadaye.'
    },
    'local_currency_menu': {
      en: 'Local Currency',
      lg: 'Ssente z\'omu Uganda',
      sw: 'Sarafu ya Ndani'
    },
    'deposit': {
      en: 'Deposit',
      lg: 'Teeka Ssente',
      sw: 'Weka Pesa'
    },
    'transactions': {
      en: 'Transactions',
      lg: 'Ebyafaayo',
      sw: 'Miamala'
    },
    'find_agent': {
      en: 'Find Agent',
      lg: 'Noonya Agent',
      sw: 'Tafuta Wakala'
    },
    'view_proposals': {
      en: 'View Proposals',
      lg: 'Laba Ebirowoozo',
      sw: 'Angalia Mapendekezo'
    },
    'my_voting_power': {
      en: 'My Voting Power',
      lg: 'Amaanyi Gange ag\'Okulonda',
      sw: 'Nguvu Yangu ya Kupiga Kura'
    },
    'active_votes': {
      en: 'Active Votes',
      lg: 'Okulonda Okukola',
      sw: 'Kura Zinazofanya Kazi'
    },
    'registration_failed': {
      en: 'Registration failed. Please try again later.',
      lg: 'Okwewandiisa kulemeddwa. Gezaako oluvannyuma.',
      sw: 'Usajili umeshindwa. Tafadhali jaribu tena baadaye.'
    },
    'verification_failed': {
      en: 'Verification process error. Please try again.',
      lg: 'Kiremya mu kukakasa. Gezaako nate.',
      sw: 'Kosa katika uthibitisho. Tafadhali jaribu tena.'
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

  /**
   * Format demo transaction messages
   */
  static getDemoMessage(type: 'btc_buy' | 'btc_sell' | 'btc_send' | 'usdc_buy' | 'usdc_sell' | 'usdc_send' | 'btc_balance' | 'usdc_balance', lang: Language, data: any): string {
    const messages = {
      btc_buy: {
        en: `Bitcoin Purchase Successful! (Demo)\n\nAmount: {currency} {amount}\nReceived: ₿{btc} BTC\n\nMeet your selected agent to complete the transaction.\n\nThank you for using AfriTokeni!`,
        lg: `Okugula Bitcoin Kuwangudde! (Demo)\n\nOmuwendo: {currency} {amount}\nOfunye: ₿{btc} BTC\n\nSisinkana ne agent wo okumaliriza.\n\nWebale okukozesa AfriTokeni!`,
        sw: `Ununuzi wa Bitcoin Umefanikiwa! (Demo)\n\nKiasi: {currency} {amount}\nUmepokea: ₿{btc} BTC\n\nKutana na wakala wako kukamilisha.\n\nAsante kwa kutumia AfriTokeni!`
      },
      btc_sell: {
        en: `Bitcoin Sale Successful! (Demo)\n\nSold: ₿{btc} BTC\nReceived: {currency} {amount}\n\nMeet your selected agent to receive cash.\n\nThank you for using AfriTokeni!`,
        lg: `Okutunda Bitcoin Kuwangudde! (Demo)\n\nOtunze: ₿{btc} BTC\nOfunye: {currency} {amount}\n\nSisinkana ne agent wo okufuna ssente.\n\nWebale okukozesa AfriTokeni!`,
        sw: `Mauzo ya Bitcoin Yamefanikiwa! (Demo)\n\nUmeuz: ₿{btc} BTC\nUmepokea: {currency} {amount}\n\nKutana na wakala wako kupokea pesa.\n\nAsante kwa kutumia AfriTokeni!`
      },
      btc_send: {
        en: `Bitcoin Sent Successfully! (Demo)\n\nAmount: ₿{btc} BTC\nTo: {phone}\n\nTransaction complete!\n\nThank you for using AfriTokeni!`,
        lg: `Okuweereza Bitcoin Kuwangudde! (Demo)\n\nOmuwendo: ₿{btc} BTC\nEri: {phone}\n\nOmulimu guwedde!\n\nWebale okukozesa AfriTokeni!`,
        sw: `Bitcoin Imetumwa! (Demo)\n\nKiasi: ₿{btc} BTC\n\nKwa: {phone}\n\nMuamala umekamilika!\n\nAsante kwa kutumia AfriTokeni!`
      },
      usdc_buy: {
        en: `USDC Purchase Successful! (Demo)\n\nAmount: {currency} {amount}\nReceived: ${data.usdc} USDC\n\nMeet your selected agent to complete the transaction.\n\nThank you for using AfriTokeni!`,
        lg: `Okugula USDC Kuwangudde! (Demo)\n\nOmuwendo: {currency} {amount}\nOfunye: ${data.usdc} USDC\n\nSisinkana ne agent wo okumaliriza.\n\nWebale okukozesa AfriTokeni!`,
        sw: `Ununuzi wa USDC Umefanikiwa! (Demo)\n\nKiasi: {currency} {amount}\nUmepokea: ${data.usdc} USDC\n\nKutana na wakala wako kukamilisha.\n\nAsante kwa kutumia AfriTokeni!`
      },
      usdc_sell: {
        en: `USDC Sale Successful! (Demo)\n\nSold: ${data.usdc} USDC\nReceived: {currency} {amount}\n\nMeet your selected agent to receive cash.\n\nThank you for using AfriTokeni!`,
        lg: `Okutunda USDC Kuwangudde! (Demo)\n\nOtunze: ${data.usdc} USDC\nOfunye: {currency} {amount}\n\nSisinkana ne agent wo okufuna ssente.\n\nWebale okukozesa AfriTokeni!`,
        sw: `Mauzo ya USDC Yamefanikiwa! (Demo)\n\nUmeuz: ${data.usdc} USDC\nUmepokea: {currency} {amount}\n\nKutana na wakala wako kupokea pesa.\n\nAsante kwa kutumia AfriTokeni!`
      },
      usdc_send: {
        en: `USDC Sent Successfully! (Demo)\n\nAmount: ${data.usdc} USDC\nTo: {phone}\n\nTransaction complete!\n\nThank you for using AfriTokeni!`,
        lg: `Okuweereza USDC Kuwangudde! (Demo)\n\nOmuwendo: ${data.usdc} USDC\nEri: {phone}\n\nOmulimu guwedde!\n\nWebale okukozesa AfriTokeni!`,
        sw: `USDC Imetumwa! (Demo)\n\nKiasi: ${data.usdc} USDC\nKwa: {phone}\n\nMuamala umekamilika!\n\nAsante kwa kutumia AfriTokeni!`
      },
      btc_balance: {
        en: `Your ckBTC Balance (Demo)\n\n₿{btc} BTC\n≈ {currency} {amount}\n\nckBTC provides instant Bitcoin transfers with minimal fees on the Internet Computer blockchain.\n\nThank you for using AfriTokeni!`,
        lg: `Obugagga bwo bwa ckBTC (Demo)\n\n₿{btc} BTC\n≈ {currency} {amount}\n\nckBTC ekuwa okuweereza Bitcoin amangu n'emisolo mitono.\n\nWebale okukozesa AfriTokeni!`,
        sw: `Salio lako la ckBTC (Demo)\n\n₿{btc} BTC\n≈ {currency} {amount}\n\nckBTC inatoa uhamisho wa haraka wa Bitcoin na ada ndogo.\n\nAsante kwa kutumia AfriTokeni!`
      },
      usdc_balance: {
        en: `Your USDC Balance (Demo)\n\n${data.usdc} USDC\n≈ {currency} {amount}\n\nCurrent Rate: 1 USDC = {currency} 3,800\n\nThank you for using AfriTokeni!`,
        lg: `Obugagga bwo bwa USDC (Demo)\n\n${data.usdc} USDC\n≈ {currency} {amount}\n\nOmuwendo gwa kati: 1 USDC = {currency} 3,800\n\nWebale okukozesa AfriTokeni!`,
        sw: `Salio lako la USDC (Demo)\n\n${data.usdc} USDC\n≈ {currency} {amount}\n\nBei ya sasa: 1 USDC = {currency} 3,800\n\nAsante kwa kutumia AfriTokeni!`
      }
    };

    let message = messages[type][lang];
    // Replace placeholders
    if (data.currency) message = message.replace(/{currency}/g, data.currency);
    if (data.amount) message = message.replace(/{amount}/g, data.amount);
    if (data.btc) message = message.replace(/{btc}/g, data.btc);
    if (data.phone) message = message.replace(/{phone}/g, data.phone);
    
    return message;
  }
}
