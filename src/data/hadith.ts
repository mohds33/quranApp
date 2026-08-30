import type { QuranLanguageCode } from './quran';

export type HadithCategory = 'Canonical' | 'Classics' | 'Character';
export type HadithTradition = 'Sunni' | 'Shia';

export type HadithSample = {
  number: string;
  arabic: string;
  translation: string;
  translations: Record<QuranLanguageCode, string>;
  narrator: string;
};

export type HadithCollection = {
  id: string;
  title: string;
  arabicTitle: string;
  compiler: string;
  category: HadithCategory;
  tradition: HadithTradition;
  description: string;
  sizeLabel: string;
  samples: HadithSample[];
  readerUrl?: string;
  readerSource?: string;
};

const intention: HadithSample = {
  number: '1',
  arabic:
    'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
  translation:
    'Actions are judged by intentions, and every person will have what they intended.',
  translations: {
    en: 'Actions are judged by intentions, and every person will have what they intended.',
    bn: 'কাজগুলো নিয়তের উপর নির্ভরশীল, এবং প্রত্যেক ব্যক্তি তাই পাবে যা সে নিয়ত করেছে।',
    zh: '行为取决于意图，每个人将得到他所意图的。',
    es: 'Las obras dependen de las intenciones, y cada persona obtendrá lo que haya pretendido.',
    fr: "Les actes valent par les intentions, et chacun recevra ce qu'il a eu l'intention de faire.",
    fa: 'ارزش اعمال به نیت‌هاست و هر کس همان را خواهد داشت که نیت کرده است.',
    id: 'Amal dinilai berdasarkan niat, dan setiap orang mendapatkan apa yang ia niatkan.',
    ru: 'Дела оцениваются по намерениям, и каждый получит то, что намеревался.',
    sv: 'Handlingar bedöms efter avsikter, och varje människa får det hon avsåg.',
    tr: 'Ameller niyetlere göredir; herkes niyet ettiği şeyi elde eder.',
    ur: 'اعمال کا دارومدار نیتوں پر ہے، اور ہر شخص کو وہی ملے گا جس کی اس نے نیت کی۔',
  },
  narrator: 'Narrated by Umar ibn al-Khattab',
};

const counsel: HadithSample = {
  number: '55',
  arabic: 'الدِّينُ النَّصِيحَةُ',
  translation: 'The religion is sincere counsel.',
  translations: {
    en: 'The religion is sincere counsel.',
    bn: 'ধর্ম হলো আন্তরিক উপদেশ।',
    zh: '宗教是真诚的忠告。',
    es: 'La religión es consejo sincero.',
    fr: 'La religion est le conseil sincère.',
    fa: 'دین، خیرخواهی صادقانه است.',
    id: 'Agama adalah nasihat yang tulus.',
    ru: 'Религия есть искреннее наставление.',
    sv: 'Religionen är uppriktigt råd.',
    tr: 'Din samimi nasihattir.',
    ur: 'دین خیر خواہی ہے۔',
  },
  narrator: 'Narrated by Tamim al-Dari',
};

const mercy: HadithSample = {
  number: '1924',
  arabic: 'الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ',
  translation: 'The merciful are shown mercy by the Most Merciful.',
  translations: {
    en: 'The merciful are shown mercy by the Most Merciful.',
    bn: 'দয়ালুদের প্রতি পরম দয়াময় দয়া করেন।',
    zh: '仁慈者会蒙至仁主的怜悯。',
    es: 'El Misericordioso muestra misericordia a los misericordiosos.',
    fr: 'Le Tout Miséricordieux fait miséricorde aux miséricordieux.',
    fa: 'خداوند رحمان به مهربانان رحمت می‌کند.',
    id: 'Orang-orang penyayang akan dirahmati oleh Yang Maha Penyayang.',
    ru: 'Милостивых помилует Милостивый.',
    sv: 'De barmhärtiga visas barmhärtighet av Den Nåderike.',
    tr: 'Merhamet edenlere Rahman merhamet eder.',
    ur: 'رحم کرنے والوں پر رحمٰن رحم فرماتا ہے۔',
  },
  narrator: 'Narrated by Abdullah ibn Amr',
};

const character: HadithSample = {
  number: 'Featured',
  arabic: 'إِنَّ مِنْ خِيَارِكُمْ أَحْسَنَكُمْ أَخْلاَقًا',
  translation: 'The best among you are those with the best character.',
  translations: {
    en: 'The best among you are those with the best character.',
    bn: 'তোমাদের মধ্যে উত্তম তারা, যাদের চরিত্র উত্তম।',
    zh: '你们中最好的人，是品德最好的人。',
    es: 'Los mejores entre ustedes son quienes tienen el mejor carácter.',
    fr: "Les meilleurs d'entre vous sont ceux qui ont le meilleur comportement.",
    fa: 'بهترین شما کسانی هستند که بهترین اخلاق را دارند.',
    id: 'Yang terbaik di antara kalian adalah yang paling baik akhlaknya.',
    ru: 'Лучшие из вас те, кто обладает лучшим нравом.',
    sv: 'De bästa bland er är de med bäst karaktär.',
    tr: 'Sizin en hayırlılarınız ahlakı en güzel olanlarınızdır.',
    ur: 'تم میں بہترین وہ ہیں جن کے اخلاق سب سے اچھے ہیں۔',
  },
  narrator: 'Narrated by Abdullah ibn Amr',
};

export function getHadithSampleTranslation(
  sample: HadithSample,
  language: QuranLanguageCode,
) {
  return sample.translations[language] ?? sample.translation;
}

const sunniHadithCollections: Array<Omit<HadithCollection, 'tradition'>> = [
  {
    id: 'bukhari',
    title: 'Sahih al-Bukhari',
    arabicTitle: 'صحيح البخاري',
    compiler: 'Imam al-Bukhari',
    category: 'Canonical',
    sizeLabel: '7,277 hadith · 97 books',
    description:
      'The most widely recognized collection of rigorously authenticated narrations.',
    samples: [intention, character],
  },
  {
    id: 'muslim',
    title: 'Sahih Muslim',
    arabicTitle: 'صحيح مسلم',
    compiler: 'Imam Muslim',
    category: 'Canonical',
    sizeLabel: '7,459 hadith · 57 books',
    description:
      'A foundational collection arranged carefully by subject and chains of narration.',
    samples: [counsel, mercy],
  },
  {
    id: 'abudawud',
    title: 'Sunan Abi Dawud',
    arabicTitle: 'سنن أبي داود',
    compiler: 'Imam Abu Dawud',
    category: 'Canonical',
    sizeLabel: '43 books',
    description:
      'A major collection focused especially on narrations used in Islamic law.',
    samples: [mercy, intention],
  },
  {
    id: 'tirmidhi',
    title: 'Jami at-Tirmidhi',
    arabicTitle: 'جامع الترمذي',
    compiler: 'Imam al-Tirmidhi',
    category: 'Canonical',
    sizeLabel: '49 books',
    description:
      'Narrations accompanied by valuable notes on grading and scholarly practice.',
    samples: [mercy, character],
  },
  {
    id: 'nasai',
    title: 'Sunan an-Nasa’i',
    arabicTitle: 'سنن النسائي',
    compiler: 'Imam an-Nasa’i',
    category: 'Canonical',
    sizeLabel: '51 books',
    description:
      'One of the six canonical collections, known for careful selection of narrators.',
    samples: [counsel, character],
  },
  {
    id: 'ibnmajah',
    title: 'Sunan Ibn Majah',
    arabicTitle: 'سنن ابن ماجه',
    compiler: 'Imam Ibn Majah',
    category: 'Canonical',
    sizeLabel: '37 books',
    description:
      'The sixth canonical collection, organized into practical chapters of knowledge and law.',
    samples: [intention, counsel],
  },
  {
    id: 'muwatta',
    title: 'Muwatta Malik',
    arabicTitle: 'موطأ مالك',
    compiler: 'Imam Malik',
    category: 'Classics',
    sizeLabel: '61 books',
    description:
      'An early work combining Prophetic narrations with the practice of Madinah.',
    samples: [intention, mercy],
  },
  {
    id: 'musnadahmad',
    title: 'Musnad Ahmad',
    arabicTitle: 'مسند أحمد',
    compiler: 'Imam Ahmad ibn Hanbal',
    category: 'Classics',
    sizeLabel: 'By Companion',
    description:
      'A vast early collection arranged primarily according to the narrating Companion.',
    samples: [character, counsel],
  },
  {
    id: 'darimi',
    title: 'Sunan ad-Darimi',
    arabicTitle: 'سنن الدارمي',
    compiler: 'Imam ad-Darimi',
    category: 'Classics',
    sizeLabel: '24 books',
    description:
      'An early hadith collection with strong emphasis on knowledge and religious practice.',
    samples: [intention, character],
  },
  {
    id: 'bayhaqi',
    title: 'Sunan al-Kubra',
    arabicTitle: 'السنن الكبرى للبيهقي',
    compiler: 'Imam al-Bayhaqi',
    category: 'Classics',
    sizeLabel: 'Legal chapters',
    description:
      'A major reference connecting hadith evidence to detailed legal chapters.',
    samples: [counsel, mercy],
  },
  {
    id: 'riyad',
    title: 'Riyad as-Salihin',
    arabicTitle: 'رياض الصالحين',
    compiler: 'Imam an-Nawawi',
    category: 'Character',
    sizeLabel: '20 sections',
    description:
      'A beloved thematic collection on worship, manners, sincerity, and daily life.',
    samples: [intention, character, mercy],
  },
  {
    id: 'nawawi40',
    title: 'Forty Hadith Nawawi',
    arabicTitle: 'الأربعون النووية',
    compiler: 'Imam an-Nawawi',
    category: 'Character',
    sizeLabel: '42 hadith',
    description:
      'Concise foundational narrations that summarize central principles of Islam.',
    samples: [intention, counsel],
  },
  {
    id: 'adab',
    title: 'Al-Adab al-Mufrad',
    arabicTitle: 'الأدب المفرد',
    compiler: 'Imam al-Bukhari',
    category: 'Character',
    sizeLabel: '644 chapters',
    description:
      'A focused collection about character, parents, neighbours, and social conduct.',
    samples: [character, mercy],
  },
  {
    id: 'shamail',
    title: 'Shama’il Muhammadiyah',
    arabicTitle: 'الشمائل المحمدية',
    compiler: 'Imam al-Tirmidhi',
    category: 'Character',
    sizeLabel: '56 chapters',
    description:
      'Narrations describing the appearance, habits, and noble character of the Prophet ﷺ.',
    samples: [character, mercy],
  },
  {
    id: 'bulugh',
    title: 'Bulugh al-Maram',
    arabicTitle: 'بلوغ المرام',
    compiler: 'Ibn Hajar al-Asqalani',
    category: 'Classics',
    sizeLabel: '16 books',
    description:
      'A concise legal hadith collection widely studied alongside books of jurisprudence.',
    samples: [intention, counsel],
  },
  {
    id: 'mishkat',
    title: 'Mishkat al-Masabih',
    arabicTitle: 'مشكاة المصابيح',
    compiler: 'Khatib at-Tabrizi',
    category: 'Classics',
    sizeLabel: 'Thematic chapters',
    description:
      'A comprehensive thematic anthology drawing from the major hadith collections.',
    samples: [mercy, character],
  },
  {
    id: 'qudsi40',
    title: 'Forty Hadith Qudsi',
    arabicTitle: 'الأربعون القدسية',
    compiler: 'Selected sacred narrations',
    category: 'Character',
    sizeLabel: '40 hadith',
    description:
      'A concise collection of sacred narrations conveying meanings attributed to Allah in Prophetic teaching.',
    samples: [mercy, counsel],
  },
  {
    id: 'shahwaliullah40',
    title: 'Forty Hadith of Shah Waliullah',
    arabicTitle: 'أربعون الشاه ولي الله',
    compiler: 'Shah Waliullah al-Dihlawi',
    category: 'Classics',
    sizeLabel: '40 hadith',
    description:
      'Forty narrations selected and transmitted by Shah Waliullah al-Dihlawi.',
    samples: [intention, character],
  },
];

const shiaHadithCollections: HadithCollection[] = [
  {
    id: 'alkafi',
    title: 'Al-Kafi',
    arabicTitle: 'الكافي',
    compiler: "Shaykh Muhammad ibn Ya'qub al-Kulayni",
    category: 'Canonical',
    tradition: 'Shia',
    sizeLabel: '8 volumes',
    description:
      'A foundational Twelver Shia collection covering belief, ethics, worship, law, and transmitted teachings.',
    samples: [],
    readerUrl: 'https://thaqalayn.net/book/1',
    readerSource: 'Thaqalayn',
  },
  {
    id: 'manlayahduruh',
    title: 'Man La Yahduruhu al-Faqih',
    arabicTitle: 'من لا يحضره الفقيه',
    compiler: 'Shaykh al-Saduq',
    category: 'Canonical',
    tradition: 'Shia',
    sizeLabel: '5 volumes',
    description:
      'One of the Four Books of Twelver Shia hadith, organized primarily around practical law and worship.',
    samples: [],
    readerUrl: 'https://thaqalayn.net/book/34',
    readerSource: 'Thaqalayn',
  },
  {
    id: 'tahdhib',
    title: 'Tahdhib al-Ahkam',
    arabicTitle: 'تهذيب الأحكام',
    compiler: 'Shaykh al-Tusi',
    category: 'Canonical',
    tradition: 'Shia',
    sizeLabel: '4 translated volumes',
    description:
      'A major hadith-based work of Imami jurisprudence and one of the Four Books.',
    samples: [],
    readerUrl: 'https://thaqalayn.net/book/41',
    readerSource: 'Thaqalayn',
  },
  {
    id: 'istibsar',
    title: 'Al-Istibsar',
    arabicTitle: 'الاستبصار',
    compiler: 'Shaykh al-Tusi',
    category: 'Canonical',
    tradition: 'Shia',
    sizeLabel: '4 volumes',
    description:
      'One of the Four Books, focused on apparently differing legal narrations and their reconciliation.',
    samples: [],
  },
  {
    id: 'nahj',
    title: 'Nahj al-Balagha',
    arabicTitle: 'نهج البلاغة',
    compiler: 'Al-Sharif al-Radi',
    category: 'Classics',
    tradition: 'Shia',
    sizeLabel: 'Sermons, letters, maxims',
    description:
      'A celebrated anthology of sermons, letters, and sayings attributed to Imam Ali.',
    samples: [],
    readerUrl: 'https://thaqalayn.net/book/32',
    readerSource: 'Thaqalayn',
  },
  {
    id: 'altawhid',
    title: 'Al-Tawhid',
    arabicTitle: 'التوحيد',
    compiler: 'Shaykh al-Saduq',
    category: 'Classics',
    tradition: 'Shia',
    sizeLabel: 'Theological chapters',
    description:
      'Narrations on Divine unity, attributes, worship, and theological questions.',
    samples: [],
    readerUrl: 'https://thaqalayn.net/book/14',
    readerSource: 'Thaqalayn',
  },
  {
    id: 'alkhisal',
    title: 'Al-Khisal',
    arabicTitle: 'الخصال',
    compiler: 'Shaykh al-Saduq',
    category: 'Classics',
    tradition: 'Shia',
    sizeLabel: 'Thematic narrations',
    description:
      'A thematic collection arranged around numbered qualities, teachings, and ethical traits.',
    samples: [],
    readerUrl: 'https://thaqalayn.net/book/10',
    readerSource: 'Thaqalayn',
  },
  {
    id: 'amali-mufid',
    title: 'Al-Amali of al-Mufid',
    arabicTitle: 'أمالي المفيد',
    compiler: 'Shaykh al-Mufid',
    category: 'Classics',
    tradition: 'Shia',
    sizeLabel: '42 assemblies',
    description:
      'Narrations dictated in scholarly assemblies on conduct, supplication, history, and the Ahl al-Bayt.',
    samples: [],
    readerUrl: 'https://thaqalayn.net/book/13',
    readerSource: 'Thaqalayn',
  },
];

export const hadithCollections: HadithCollection[] = [
  ...sunniHadithCollections.map(collection => ({
    ...collection,
    tradition: 'Sunni' as const,
  })),
  ...shiaHadithCollections,
];
