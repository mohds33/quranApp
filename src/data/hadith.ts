export type HadithCategory = 'Canonical' | 'Classics' | 'Character';

export type HadithSample = {
  number: string;
  arabic: string;
  translation: string;
  narrator: string;
};

export type HadithCollection = {
  id: string;
  title: string;
  arabicTitle: string;
  compiler: string;
  category: HadithCategory;
  description: string;
  sizeLabel: string;
  samples: HadithSample[];
};

const intention: HadithSample = {
  number: '1',
  arabic:
    'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
  translation:
    'Actions are judged by intentions, and every person will have what they intended.',
  narrator: 'Narrated by Umar ibn al-Khattab',
};

const counsel: HadithSample = {
  number: '55',
  arabic: 'الدِّينُ النَّصِيحَةُ',
  translation: 'The religion is sincere counsel.',
  narrator: 'Narrated by Tamim al-Dari',
};

const mercy: HadithSample = {
  number: '1924',
  arabic: 'الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ',
  translation: 'The merciful are shown mercy by the Most Merciful.',
  narrator: 'Narrated by Abdullah ibn Amr',
};

const character: HadithSample = {
  number: 'Featured',
  arabic: 'إِنَّ مِنْ خِيَارِكُمْ أَحْسَنَكُمْ أَخْلاَقًا',
  translation: 'The best among you are those with the best character.',
  narrator: 'Narrated by Abdullah ibn Amr',
};

export const hadithCollections: HadithCollection[] = [
  {
    id: 'bukhari',
    title: 'Sahih al-Bukhari',
    arabicTitle: 'صحيح البخاري',
    compiler: 'Imam al-Bukhari',
    category: 'Canonical',
    sizeLabel: '97 books',
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
    sizeLabel: '56 books',
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
];
