// Common typos mapping for Indonesian financial context
const TYPO_FIXES: Record<string, string> = {
  'batr': 'batre',
  'batrai': 'batre',
  'batery': 'batre',
  'gopay': 'GoPay',
  'go pay': 'GoPay',
  'gopay ': 'GoPay',
  'ovo': 'OVO',
  'dana': 'Dana',
  'shopeepay': 'ShopeePay',
  'shopee pay': 'ShopeePay',
  'bca': 'BCA',
  'mandiri': 'Mandiri',
  'bni': 'BNI',
  'bri': 'BRI',
  'btn': 'BTN',
  'cash': 'Cash',
  'tunai': 'Cash',
  'tunae': 'Cash',
  'beli': 'beli',
  'makan': 'makan',
  'minum': 'minum',
  'kopi': 'kopi',
  'mkn': 'makan',
  'mnum': 'minum',
  'trf': 'transfer',
  'xfer': 'transfer',
  'tf': 'transfer',
  'yg': 'yang',
  'dg': 'dengan',
  'dr': 'dari',
  'ke': 'ke',
  'udah': 'sudah',
  'ga': 'tidak',
  'gak': 'tidak',
  'nggak': 'tidak',
  'kagak': 'tidak',
  'blm': 'belum',
  'sblm': 'sebelum',
  'sesudah': 'setelah',
  'abiz': 'habis',
  'abis': 'habis',
};

// Slang to formal mapping
const SLANG_NORMALIZE: Record<string, string> = {
  'gajian': 'gaji',
  'dpt gaji': 'gaji',
  'terima gaji': 'gaji',
  'masuk gaji': 'gaji',
  'beliin': 'beli',
  'beli in': 'beli',
  'bayarin': 'bayar',
  'bayar in': 'bayar',
  'transferin': 'transfer',
  'transfer in': 'transfer',
  'kirimin': 'kirim',
  'kirim in': 'kirim',
  'topup': 'top up',
  'top up': 'top up',
  'isi ulang': 'top up',
  'rekening': 'rekening',
  'reken': 'rekening',
  'rek': 'rekening',
};

// Number words in Indonesian
const NUMBER_WORDS: Record<string, number> = {
  'nol': 0,
  'satu': 1,
  'dua': 2,
  'tiga': 3,
  'empat': 4,
  'lima': 5,
  'enam': 6,
  'tujuh': 7,
  'delapan': 8,
  'sembilan': 9,
  'sepuluh': 10,
  'sebelas': 11,
  'dua belas': 12,
  'tiga belas': 13,
  'empat belas': 14,
  'lima belas': 15,
  'enam belas': 16,
  'tujuh belas': 17,
  'delapan belas': 18,
  'sembilan belas': 19,
  'dua puluh': 20,
  'tiga puluh': 30,
  'empat puluh': 40,
  'lima puluh': 50,
  'enam puluh': 60,
  'tujuh puluh': 70,
  'delapan puluh': 80,
  'sembilan puluh': 90,
  'seratus': 100,
  'seribu': 1000,
  'sejuta': 1000000,
};

const NUMBER_UNITS: Record<string, number> = {
  'rb': 1000,
  'ribu': 1000,
  'rebu': 1000,
  'k': 1000,
  'jt': 1000000,
  'juta': 1000000,
  'm': 1000000,
  'miliar': 1000000000,
  't': 1000000000000,
  'triliun': 1000000000000,
};

export function fixTypos(text: string): string {
  let result = text.toLowerCase();
  
  for (const [typo, fix] of Object.entries(TYPO_FIXES)) {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    result = result.replace(regex, fix);
  }
  
  return result;
}

export function normalizeSlang(text: string): string {
  let result = text;
  
  for (const [slang, normal] of Object.entries(SLANG_NORMALIZE)) {
    const regex = new RegExp(`\\b${slang}\\b`, 'gi');
    result = result.replace(regex, normal);
  }
  
  return result;
}

export function convertNumberWords(text: string): string {
  let result = text;
  
  for (const [word, num] of Object.entries(NUMBER_WORDS)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, num.toString());
  }
  
  return result;
}

export function extractNumberWithUnit(text: string): string {
  const patterns = [
    /(\d+(?:[.,]\d+)?)\s*(rb|ribu|rebu|k|jt|juta|m|miliar|t|triliun)/gi,
    /(\d+(?:[.,]\d+)?)\s*(rb|ribu|rebu|k|jt|juta|m|miliar|t|triliun)/gi,
  ];
  
  for (const pattern of patterns) {
    text = text.replace(pattern, (match, number, unit) => {
      const numValue = parseFloat(number.replace(',', '.'));
      const multiplier = NUMBER_UNITS[unit.toLowerCase()] || 1;
      return (numValue * multiplier).toString();
    });
  }
  
  return text;
}

export function removeEmojis(text: string): string {
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '');
}

export function extractEmojis(text: string): string[] {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu;
  return text.match(emojiRegex) || [];
}

export function preprocessMessage(message: string): string {
  let result = message;
  
  result = fixTypos(result);
  result = normalizeSlang(result);
  result = convertNumberWords(result);
  result = extractNumberWithUnit(result);
  
  return result.trim();
}

export function extractContextFromEmojis(emojis: string[]): string[] {
  const context: string[] = [];
  
  const emojiContext: Record<string, string[]> = {
    '☕': ['kopi', 'Makanan'],
    '🍔': ['makanan', 'Makanan'],
    '🍕': ['makanan', 'Makanan'],
    '🍜': ['makanan', 'Makanan'],
    '🍱': ['makanan', 'Makanan'],
    '🥤': ['minuman', 'Makanan'],
    '⛽': ['bensin', 'Transport'],
    '🚗': ['mobil', 'Transport'],
    '🚕': ['taksi', 'Transport'],
    '🚌': ['bus', 'Transport'],
    '🏍️': ['motor', 'Transport'],
    '💰': ['uang', 'Gaji'],
    '💵': ['uang', 'Gaji'],
    '💳': ['kartu', 'Kartu Kredit'],
    '🏦': ['bank', 'Bank'],
    '📱': ['pulsa', 'Elektronik'],
    '💊': ['obat', 'Kesehatan'],
    '🏥': ['rumah sakit', 'Kesehatan'],
    '🛒': ['belanja', 'Belanja'],
    '🎬': ['nonton', 'Hiburan'],
    '🎮': ['game', 'Hiburan'],
  };
  
  for (const emoji of emojis) {
    if (emojiContext[emoji]) {
      context.push(...emojiContext[emoji]);
    }
  }
  
  return context;
}
