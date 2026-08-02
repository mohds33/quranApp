export type DailyReflection = {
  arabic: string;
  translation: string;
  reference: string;
  surahNumber: string;
};

export const dailyReflections: DailyReflection[] = [
  {
    arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: 'Indeed, with hardship comes ease.',
    reference: 'Ash-Sharh · 94:5',
    surahNumber: '94',
  },
  {
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    translation: 'Surely in the remembrance of Allah do hearts find comfort.',
    reference: 'Ar-Ra‘d · 13:28',
    surahNumber: '13',
  },
  {
    arabic: 'لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
    translation: 'Do not lose hope in Allah’s mercy.',
    reference: 'Az-Zumar · 39:53',
    surahNumber: '39',
  },
  {
    arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    translation: 'Indeed, Allah is with those who are patient.',
    reference: 'Al-Baqarah · 2:153',
    surahNumber: '2',
  },
  {
    arabic: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    translation: 'Whoever puts their trust in Allah, He is sufficient for them.',
    reference: 'At-Talaq · 65:3',
    surahNumber: '65',
  },
  {
    arabic: 'إِنَّ رَبِّي قَرِيبٌ مُّجِيبٌ',
    translation: 'Surely my Lord is near and responsive.',
    reference: 'Hud · 11:61',
    surahNumber: '11',
  },
  {
    arabic: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    translation: 'My Lord, increase me in knowledge.',
    reference: 'Taha · 20:114',
    surahNumber: '20',
  },
  {
    arabic: 'إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ',
    translation: 'The most noble of you before Allah is the most mindful of Him.',
    reference: 'Al-Hujurat · 49:13',
    surahNumber: '49',
  },
  {
    arabic: 'وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ',
    translation: 'Allah loves those who do good.',
    reference: 'Ali ‘Imran · 3:134',
    surahNumber: '3',
  },
  {
    arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    translation: 'Allah does not require of any soul more than what it can afford.',
    reference: 'Al-Baqarah · 2:286',
    surahNumber: '2',
  },
  {
    arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ',
    translation: 'Remember Me; I will remember you.',
    reference: 'Al-Baqarah · 2:152',
    surahNumber: '2',
  },
  {
    arabic: 'وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ',
    translation: 'My mercy encompasses all things.',
    reference: 'Al-A‘raf · 7:156',
    surahNumber: '7',
  },
];

export function reflectionForDate(date = new Date()) {
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  return dailyReflections[Math.abs(dayNumber) % dailyReflections.length];
}
