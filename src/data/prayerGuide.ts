export type PrayerGuidePosture =
  | 'stand'
  | 'recite'
  | 'bow'
  | 'rise'
  | 'prostrate'
  | 'sit'
  | 'finish';

export type PrayerGuideStep = {
  id: string;
  title: string;
  arabicTitle: string;
  posture: PrayerGuidePosture;
  arabic: string;
  transliteration: string;
  meaning: {
    en: string;
    fa: string;
  };
  note: string;
};

export const rakahPatterns = [
  { count: 2, prayers: 'Fajr' },
  { count: 3, prayers: 'Maghrib' },
  { count: 4, prayers: 'Dhuhr, Asr, Isha' },
] as const;

export const prayerGuideSteps: PrayerGuideStep[] = [
  {
    id: 'takbir',
    title: 'Opening takbir',
    arabicTitle: 'تكبيرة الإحرام',
    posture: 'stand',
    arabic: 'اللّٰهُ أَكْبَرُ',
    transliteration: 'Allahu akbar',
    meaning: {
      en: 'Allah is the Greatest.',
      fa: 'خدا بزرگ‌تر است.',
    },
    note: 'Stand facing the qiblah and begin the prayer with intention in your heart.',
  },
  {
    id: 'fatiha',
    title: 'Standing and Al-Fatiha',
    arabicTitle: 'القيام والفاتحة',
    posture: 'recite',
    arabic:
      'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ\nالْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِينَ\nالرَّحْمٰنِ الرَّحِيمِ\nمَالِكِ يَوْمِ الدِّينِ\nإِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ\nاهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ\nصِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    transliteration:
      "Bismillahir-Rahmanir-Rahim. Alhamdu lillahi Rabbil-'alamin. Ar-Rahmanir-Rahim. Maliki yawmid-din. Iyyaka na'budu wa iyyaka nasta'in. Ihdinas-siratal-mustaqim. Siratal-ladhina an'amta 'alayhim, ghayril-maghdubi 'alayhim wa lad-dallin.",
    meaning: {
      en: 'In the name of Allah, the Most Compassionate, the Most Merciful. All praise is for Allah, Lord of all worlds, the Most Compassionate, the Most Merciful, Master of the Day of Judgment. You alone we worship and You alone we ask for help. Guide us along the Straight Path, the path of those You have blessed, not those who earned anger or went astray.',
      fa: 'به نام خداوند بخشنده مهربان. ستایش مخصوص خداوندی است که پروردگار جهانیان است؛ بخشنده و مهربان، مالک روز جزا. تنها تو را می‌پرستیم و تنها از تو یاری می‌خواهیم. ما را به راه راست هدایت کن؛ راه کسانی که آنان را مشمول نعمت خود ساختی، نه راه خشم‌شدگان و نه گمراهان.',
    },
    note: "Recite Al-Fatiha in every rak'ah. In the first two rak'ahs, follow it with another surah or Quran passage.",
  },
  {
    id: 'ruku',
    title: 'Bowing (ruku)',
    arabicTitle: 'الرُّكُوع',
    posture: 'bow',
    arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
    transliteration: "Subhana Rabbiyal-'Azim",
    meaning: {
      en: 'Glory be to my Lord, the Magnificent.',
      fa: 'پروردگار بزرگ من پاک و منزّه است.',
    },
    note: 'Bow with a level back and say this three times.',
  },
  {
    id: 'rise',
    title: 'Rise from ruku',
    arabicTitle: 'الاعتدال',
    posture: 'rise',
    arabic: 'سَمِعَ اللّٰهُ لِمَنْ حَمِدَهُ\nرَبَّنَا وَلَكَ الْحَمْدُ',
    transliteration: "Sami'Allahu liman hamidah. Rabbana wa lakal-hamd.",
    meaning: {
      en: 'Allah hears the one who praises Him. Our Lord, all praise belongs to You.',
      fa: 'خدا ستایش کسی را که او را ستایش کند می‌شنود. پروردگارا، ستایش از آن توست.',
    },
    note: 'Return to standing and pause before going down.',
  },
  {
    id: 'sujud',
    title: 'Prostration (sajdah)',
    arabicTitle: 'السُّجُود',
    posture: 'prostrate',
    arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
    transliteration: "Subhana Rabbiyal-A'la",
    meaning: {
      en: 'Glory be to my Lord, the Most High.',
      fa: 'پروردگار بلندمرتبه من پاک و منزّه است.',
    },
    note: 'Prostrate and say this three times.',
  },
  {
    id: 'between',
    title: 'Sit between prostrations',
    arabicTitle: 'الجلسة بين السجدتين',
    posture: 'sit',
    arabic: 'رَبِّ اغْفِرْ لِي',
    transliteration: 'Rabbighfir li',
    meaning: {
      en: 'My Lord, forgive me.',
      fa: 'پروردگارا، مرا بیامرز.',
    },
    note: "Sit briefly, then make a second sajdah. This completes one rak'ah.",
  },
  {
    id: 'tashahhud',
    title: 'Tashahhud (tahiyyat)',
    arabicTitle: 'التَّشَهُّد والتَّحِيَّات',
    posture: 'sit',
    arabic:
      'التَّحِيَّاتُ لِلّٰهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللّٰهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    transliteration:
      "At-tahiyyatu lillahi was-salawatu wat-tayyibat. As-salamu 'alayka ayyuhan-nabiyyu wa rahmatullahi wa barakatuh. As-salamu 'alayna wa 'ala 'ibadillahis-salihin. Ashhadu alla ilaha illallah, wa ashhadu anna Muhammadan 'abduhu wa rasuluh.",
    meaning: {
      en: 'All greetings, prayers, and pure words belong to Allah. Peace, mercy, and blessings of Allah be upon you, O Prophet. Peace be upon us and upon the righteous servants of Allah. I bear witness that none has the right to be worshipped except Allah, and I bear witness that Muhammad is His servant and messenger.',
      fa: 'همه درودها، نمازها و پاکی‌ها برای خداست. سلام و رحمت و برکات خدا بر تو ای پیامبر. سلام بر ما و بر بندگان شایسته خدا. گواهی می‌دهم که معبودی جز خدا نیست و گواهی می‌دهم که محمد بنده و فرستاده اوست.',
    },
    note: "Sit for tashahhud after the second rak'ah and again in the final rak'ah.",
  },
  {
    id: 'salam',
    title: 'Finish with salam',
    arabicTitle: 'التَّسْلِيم',
    posture: 'finish',
    arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللّٰهِ',
    transliteration: "As-salamu 'alaykum wa rahmatullah",
    meaning: {
      en: 'Peace and the mercy of Allah be upon you.',
      fa: 'سلام و رحمت خدا بر شما باد.',
    },
    note: 'After the final blessings and supplication, turn to the right and then the left with salam.',
  },
];
