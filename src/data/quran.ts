export type Ayah = {
  number: string;
  arabic: string;
  translation: string;
};

export type Surah = {
  number: string;
  name: string;
  meaning: string;
  arabicName: string;
  verseCount: string;
  ayahs: Ayah[];
};

export const surahs: Surah[] = [
  {
    number: '1',
    name: 'Al-Fatihah',
    meaning: 'The Opening',
    arabicName: 'الفاتحة',
    verseCount: '7',
    ayahs: [
      {
        number: '١',
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        translation:
          'In the name of Allah, the Most Compassionate, Most Merciful.',
      },
      {
        number: '٢',
        arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
        translation: 'All praise is for Allah—Lord of all worlds.',
      },
      {
        number: '٣',
        arabic: 'الرَّحْمَٰنِ الرَّحِيمِ',
        translation: 'The Most Compassionate, Most Merciful.',
      },
    ],
  },
  {
    number: '2',
    name: 'Al-Baqarah',
    meaning: 'The Cow',
    arabicName: 'البقرة',
    verseCount: '286',
    ayahs: [
      { number: '١', arabic: 'الم', translation: 'Alif-Lãm-Mĩm.' },
      {
        number: '٢',
        arabic: 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ',
        translation:
          'This is the Book! There is no doubt about it—a guide for those mindful of Allah.',
      },
      {
        number: '٢٥٥',
        arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
        translation:
          'Allah! There is no god worthy of worship except Him, the Ever-Living, All-Sustaining.',
      },
    ],
  },
  {
    number: '3',
    name: 'Ali ‘Imran',
    meaning: 'Family of Imran',
    arabicName: 'آل عمران',
    verseCount: '200',
    ayahs: [
      { number: '١', arabic: 'الم', translation: 'Alif-Lãm-Mĩm.' },
      {
        number: '٢',
        arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
        translation:
          'Allah! There is no god worthy of worship except Him—the Ever-Living, All-Sustaining.',
      },
    ],
  },
  {
    number: '4',
    name: 'An-Nisa',
    meaning: 'The Women',
    arabicName: 'النساء',
    verseCount: '176',
    ayahs: [
      {
        number: '١',
        arabic: 'يَا أَيُّهَا النَّاسُ اتَّقُوا رَبَّكُمُ',
        translation:
          'O humanity! Be mindful of your Lord Who created you from a single soul.',
      },
    ],
  },
  {
    number: '5',
    name: 'Al-Ma’idah',
    meaning: 'The Table Spread',
    arabicName: 'المائدة',
    verseCount: '120',
    ayahs: [
      {
        number: '١',
        arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا أَوْفُوا بِالْعُقُودِ',
        translation: 'O believers! Honour your obligations.',
      },
    ],
  },
  {
    number: '6',
    name: 'Al-An’am',
    meaning: 'The Cattle',
    arabicName: 'الأنعام',
    verseCount: '165',
    ayahs: [
      {
        number: '١',
        arabic: 'الْحَمْدُ لِلَّهِ الَّذِي خَلَقَ السَّمَاوَاتِ وَالْأَرْضَ',
        translation:
          'All praise is for Allah Who created the heavens and the earth.',
      },
    ],
  },
];
