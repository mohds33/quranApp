import { surahs, totalAyahCount } from '../src/data/quran';
import { parseMosqueSearchCache } from '../src/services/mosqueSearchCache';
import {
  calculatePrayerSchedule,
  extractEmbeddedPrayerScheduleData,
  extractMosqueWebsiteSearchCandidates,
  extractPrayerDataEndpoints,
  extractPrayerScheduleLinks,
  mosqueCity,
  parseAlFaruqPrayerTimesPayload,
  parseAlKafeelKarbalaPrayerPayload,
  parseAthanPlusPrayerScheduleHTML,
  parseFiveTimesSchedulePayload,
  parseMawaqitPrayerScheduleHTML,
  parseMasjidAyeshaPrayerScheduleHTML,
  parseMasjidboxPrayerScheduleHTML,
  parsePublishedMosqueWebsiteHTML,
  parsePublishedMosqueWebsiteData,
  parsePublishedMosquePDFText,
  prayerNames,
  websiteLocationMatchesSelectedMosque,
  websiteMatchesSelectedMosque,
} from '../src/services/prayerTimes';

test('bundles the complete Quran', () => {
  expect(surahs).toHaveLength(114);
  expect(totalAyahCount).toBe(6236);
  expect(surahs[0].ayahs).toHaveLength(7);
  expect(surahs[1].ayahs).toHaveLength(286);
  expect(surahs[113].ayahs).toHaveLength(6);
});

test('restores the last mosque search with the closest masjid first', () => {
  const cached = parseMosqueSearchCache(
    JSON.stringify({
      version: 1,
      origin: { latitude: 51.04, longitude: -114.07 },
      label: 'Calgary, Alberta',
      radiusMeters: 30000,
      savedAt: '2026-08-02T12:00:00.000Z',
      searchedLocation: {
        coordinates: { latitude: 51.04, longitude: -114.07 },
        label: 'T2P 1J9',
      },
      mosques: [
        {
          id: 'far',
          name: 'Far Masjid',
          address: 'North Calgary',
          latitude: 51.14,
          longitude: -114.07,
          distanceKm: 0,
          source: 'apple',
        },
        {
          id: 'near',
          name: 'Near Masjid',
          address: 'Downtown Calgary',
          latitude: 51.041,
          longitude: -114.07,
          distanceKm: 99,
          source: 'apple',
        },
      ],
    }),
  );

  expect(cached?.mosques.map(mosque => mosque.id)).toEqual(['near', 'far']);
  expect(cached?.searchedLocation?.label).toBe('T2P 1J9');
  expect(parseMosqueSearchCache('{invalid')).toBeNull();
});

test('calculates a complete daily prayer schedule offline', () => {
  const schedule = calculatePrayerSchedule(
    { latitude: 53.5461, longitude: -113.4938 },
    new Date(2026, 7, 2, 12),
  );

  for (const prayer of prayerNames) {
    expect(schedule.dates[prayer]).toBeInstanceOf(Date);
    expect(schedule.timings[prayer]).not.toBe('—');
  }
  expect(schedule.methodName).toContain('ISNA');
});

test('parses Masjid Ayesha published adhan, iqamah, and Jumuah times', () => {
  const schedule = parseMasjidAyeshaPrayerScheduleHTML(`
    <h1>Prayer Timing</h1>
    <h4>Fajr</h4><script>ignore this</script>03:43 AM<br />05:00 AM
    <h4>Dhuhr</h4>01:45 PM<br />02:00 PM
    <h4>Asr</h4>05:51 PM<br />06:15 PM
    <h4>Maghrib</h4>09:30 PM<br />09:35 PM
    <h4>Isha</h4>10:46 PM<br />10:51 PM
    <h1>Jumuah Timing</h1>
    <h4>1 Jumuah</h4>02:00 PM
    <h4>2 Jumuah</h4>03:30 PM
  `);

  expect(schedule.adhan.Fajr).toBe('03:43 AM');
  expect(schedule.iqamah.Fajr).toBe('05:00 AM');
  expect(schedule.adhan.Maghrib).toBe('09:30 PM');
  expect(schedule.iqamah.Isha).toBe('10:51 PM');
  expect(schedule.jummah).toEqual(['02:00 PM', '03:30 PM']);
  expect(schedule.sourceUrl).toBe('https://masjidayesha.ca/');
});

test('parses a selected masjid official website schedule without calculating', () => {
  const schedule = parsePublishedMosqueWebsiteHTML(
    `
      <h2>Prayer Times</h2>
      <nav>Jumuah</nav>
      <div>Fajr <span>5:10 AM</span></div>
      <div>Zuhr <span>1:30 PM</span></div>
      <div>Asr <span>5:45 PM</span></div>
      <div>Maghrib <span>9:20 PM</span></div>
      <div>Ishaa <span>10:40 PM</span></div>
      <h2>Jumuah</h2><span>1:45 PM</span><span>3:00 PM</span>
    `,
    {
      id: 'selected-masjid',
      name: 'Selected Masjid',
      address: 'Calgary, Alberta',
      latitude: 51.04,
      longitude: -114.07,
      distanceKm: 1,
      website: 'https://selected.example/',
    },
  );

  expect(schedule.adhan).toEqual({});
  expect(schedule.iqamah).toEqual({
    Fajr: '05:10 AM',
    Dhuhr: '01:30 PM',
    Asr: '05:45 PM',
    Maghrib: '09:20 PM',
    Isha: '10:40 PM',
  });
  expect(schedule.jummah).toEqual(['01:45 PM', '03:00 PM']);
  expect(schedule.sourceLabel).toBe('Official website');
});

test('reads labelled prayer fields from a mosque website before JavaScript runs', () => {
  const schedule = parsePublishedMosqueWebsiteHTML(
    `
      <tbody id="prayerTableBody"></tbody>
      <span id="fajr_adhan" style="display:none"><span>3:29 AM</span></span>
      <span id="fajr_iqamah" style="display:none"><span>5:00 AM</span></span>
      <span id="dhuhr_adhan" style="display:none"><span>1:41 PM</span></span>
      <span id="dhuhr_iqamah" style="display:none"><span>2:00 PM</span></span>
      <span id="asr_adhan" style="display:none"><span>5:53 PM</span></span>
      <span id="asr_iqamah" style="display:none"><span>6:30 PM</span></span>
      <span id="maghrib_adhan" style="display:none"><span>9:33 PM</span></span>
      <span id="maghrib_iqamah" style="display:none"><span>9:38 PM</span></span>
      <span id="isha_adhan" style="display:none"><span>11:03 PM</span></span>
      <span id="isha_iqamah" style="display:none"><span>11:08 PM</span></span>
    `,
    {
      id: 'masjid-annoor-html',
      name: 'Masjid Annoor',
      address: '3032 106 St, Edmonton, AB',
      latitude: 53.46,
      longitude: -113.5,
      distanceKm: 1,
      website: 'https://masjidannoor.ca/',
    },
  );

  expect(schedule.adhan.Fajr).toBe('03:29 AM');
  expect(schedule.iqamah.Asr).toBe('06:30 PM');
  expect(schedule.adhan.Isha).toBe('11:03 PM');
  expect(schedule.iqamah.Isha).toBe('11:08 PM');
});

test('keeps identical published adhan and iqamah times in separate columns', () => {
  const schedule = parsePublishedMosqueWebsiteHTML(
    `
      <title>Masjid Al-Salaam | Edmonton, Alberta</title>
      <ul class="prayer-bar__times">
        <li><span>Fajr</span><span>3:46 AM</span><span>Iqama:</span><span>4:30 AM</span></li>
        <li><span>Dhuhr</span><span>1:40 PM</span><span>Iqama:</span><span>2:00 PM</span></li>
        <li><span>Asr</span><span>5:52 PM</span><span>Iqama:</span><span>6:20 PM</span></li>
        <li><span>Maghrib</span><span>9:30 PM</span><span>Iqama:</span><span>9:35 PM</span></li>
        <li><span>Isha</span><span>11:45 PM</span><span>Iqama:</span><span>11:45 PM</span></li>
      </ul>
    `,
    {
      id: 'masjid-al-salaam',
      name: 'Masjid Al-Salaam',
      address: '550 Clareview Road NW, Edmonton, AB T5A 4H2',
      latitude: 53.603,
      longitude: -113.383,
      distanceKm: 1,
      website: 'https://masjidalsalaam.ca/home',
    },
  );

  expect(schedule.adhan.Isha).toBe('11:45 PM');
  expect(schedule.iqamah.Isha).toBe('11:45 PM');
});

test('reads prayer times embedded in a modern JavaScript website payload', () => {
  const html = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(
    {
      props: {
        pageProps: {
          prayerTimes: {
            fajr: { athan: '3:46 AM', iqama: '4:30 AM' },
            dhuhr: { athan: '1:40 PM', iqama: '2:00 PM' },
            asr: { athan: '5:52 PM', iqama: '6:20 PM' },
            maghrib: { athan: '9:30 PM', iqama: '9:35 PM' },
            isha: { athan: '11:45 PM', iqama: '11:45 PM' },
          },
        },
      },
    },
  )}</script>`;
  const payloads = extractEmbeddedPrayerScheduleData(html);
  const schedule = parsePublishedMosqueWebsiteData(
    payloads[0],
    {
      id: 'modern-mosque-site',
      name: 'Modern Mosque',
      address: 'Edmonton, Alberta',
      latitude: 53.5,
      longitude: -113.5,
      distanceKm: 1,
    },
    'https://modern-mosque.example/',
  );

  expect(schedule.adhan.Fajr).toBe('03:46 AM');
  expect(schedule.iqamah.Maghrib).toBe('09:35 PM');
  expect(schedule.adhan.Isha).toBe('11:45 PM');
  expect(schedule.iqamah.Isha).toBe('11:45 PM');
});

test('discovers and parses a same-site mosque prayer data feed', () => {
  expect(
    extractPrayerDataEndpoints(
      `
        <script>
          fetch('/prayer-times.php');
          fetch('https://other.example/prayer-times.json');
          fetch('/analytics.php');
        </script>
      `,
      'https://masjidannoor.ca/',
    ),
  ).toEqual(['https://masjidannoor.ca/prayer-times.php']);

  const schedule = parsePublishedMosqueWebsiteData(
    {
      fajr_adhan: '03:29 AM',
      fajr_iqamah: '05:00 AM',
      dhuhr_adhan: '01:41 PM',
      dhuhr_iqamah: '02:00 PM',
      asr_adhan: '05:53 PM',
      asr_iqamah: '06:30 PM',
      maghrib_adhan: '09:33 PM',
      maghrib_iqamah: '09:38 PM',
      isha_adhan: '11:03 PM',
      isha_iqamah: '11:08 PM',
    },
    {
      id: 'masjid-annoor-json',
      name: 'Masjid Annoor',
      address: '3032 106 St, Edmonton, AB',
      latitude: 53.46,
      longitude: -113.5,
      distanceKm: 1,
      website: 'https://masjidannoor.ca/',
    },
    'https://masjidannoor.ca/prayer-times.php',
  );

  expect(schedule.adhan.Maghrib).toBe('09:33 PM');
  expect(schedule.iqamah.Maghrib).toBe('09:38 PM');
  expect(schedule.sourceLabel).toBe('Official website · live schedule');
});

test("reads today's adhan and iqamah from Al Faruq Centre's live feed", () => {
  const schedule = parseAlFaruqPrayerTimesPayload(
    [
      {
        date: '1',
        month: '8',
        year: '2026',
        fajr: { azzan: '3:43 AM', iqamah: '5:00 AM' },
      },
      {
        date: '2',
        month: '8',
        year: '2026',
        fajr: { azzan: '3:45 AM', iqamah: '5:00 AM' },
        zuhr: { azzan: '1:41 PM', iqamah: '2:00 PM' },
        asr: { azzan: '5:53 PM', iqamah: '6:15 PM' },
        maghrib: { azzan: '9:33 PM', iqamah: '9:38 PM' },
        isha: { azzan: '11:03 PM', iqamah: '11:08 PM' },
      },
    ],
    {
      id: 'al-faruq-centre',
      name: 'Al Faruq Islamic Centre',
      address: '4410 127 St SW, Edmonton, AB',
      latitude: 53.482,
      longitude: -113.54,
      distanceKm: 1,
      website: 'https://www.alfaruqcentre.com/',
    },
    new Date(2026, 7, 2, 12),
  );

  expect(schedule.adhan).toEqual({
    Fajr: '03:45 AM',
    Dhuhr: '01:41 PM',
    Asr: '05:53 PM',
    Maghrib: '09:33 PM',
    Isha: '11:03 PM',
  });
  expect(schedule.iqamah).toEqual({
    Fajr: '05:00 AM',
    Dhuhr: '02:00 PM',
    Asr: '06:15 PM',
    Maghrib: '09:38 PM',
    Isha: '11:08 PM',
  });
  expect(schedule.sourceUrl).toBe('https://www.alfaruqcentre.com/prayertimes');
});

test('keeps Friday prayers separate and rejects nearby early-morning times', () => {
  const schedule = parsePublishedMosqueWebsiteHTML(
    `
      <nav>Jumuah Fajir 5:00 AM Duhr 1:20 PM</nav>
      <div>Fajir 5:10 AM</div>
      <div>Duhr 1:30 PM</div>
      <div>Asar 5:45 PM</div>
      <div>Magrib 9:20 PM</div>
      <div>Esha 10:40 PM</div>
      <h2>Friday Prayers</h2>
      <div>Al-Salam Centre 12:30 PM &amp; 1:30 PM</div>
      <div>Another venue 1:00 PM</div>
    `,
    {
      id: 'friday-test',
      name: 'Friday Test Masjid',
      address: 'Calgary, Alberta',
      latitude: 51.04,
      longitude: -114.07,
      distanceKm: 1,
      website: 'https://masjid.example/',
    },
  );

  expect(schedule.iqamah.Dhuhr).toBe('01:30 PM');
  expect(schedule.iqamah.Isha).toBe('10:40 PM');
  expect(schedule.jummah).toEqual(['12:30 PM', '01:30 PM']);
  expect(schedule.jummah).not.toContain('05:00 AM');
});

test('keeps only the Friday prayer for the selected mosque venue', () => {
  const schedule = parsePublishedMosqueWebsiteHTML(
    `
      <title>Al Rashid Mosque | Edmonton</title>
      <div>Fajr 03:45 AM 04:15 AM</div>
      <div>Dhuhr 01:41 PM 01:51 PM</div>
      <div>Asr 05:53 PM 06:03 PM</div>
      <div>Maghrib 09:33 PM 09:38 PM</div>
      <div>Isha 10:48 PM 10:58 PM</div>
      <div>Jumua at Al Rashid 01:45 PM</div>
      <div>Jumua at ARCA 02:00 PM</div>
    `,
    {
      id: 'al-rashid',
      name: 'Al Rashid Mosque',
      address: '13070 113 Street NW, Edmonton, AB T5E 5A8',
      latitude: 53.5906,
      longitude: -113.5166,
      distanceKm: 1,
      website: 'https://alrashidfoundation.ca/',
    },
  );

  expect(schedule.adhan.Fajr).toBe('03:45 AM');
  expect(schedule.iqamah.Isha).toBe('10:58 PM');
  expect(schedule.jummah).toEqual(['01:45 PM']);
});

test('finds the first credible official website and rejects directories', () => {
  const candidates = extractMosqueWebsiteSearchCandidates(`
    <a class="result__a" href="https://globalprayertimes.org/canada/edmonton/al-rashid-mosque-edmonton/">Prayer directory</a>
    <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Falrashidfoundation.ca%2F&amp;rut=abc">Al Rashid Foundation</a>
    <a class="result__a" href="https://www.facebook.com/alrashidmosque/">Facebook</a>
    <a class="result__a" href="https://www.timesofsalah.com/mosque/al-rashid">Directory</a>
    <a class="result__a" href="https://en.wikipedia.org/wiki/Karbala">Wikipedia</a>
    <a class="result__a" href="https://praysalat.com/karbala">Prayer directory</a>
  `);

  expect(candidates).toEqual(['https://alrashidfoundation.ca/']);
});

test('extracts Karbala from English and Arabic international addresses', () => {
  const mosque = {
    id: 'karbala-city',
    name: 'Karbala Mosque',
    address: 'Karbala, Karbala Governorate, Iraq',
    latitude: 32.616,
    longitude: 44.024,
    distanceKm: 1,
  };

  expect(mosqueCity(mosque)).toBe('Karbala');
  expect(
    mosqueCity({
      ...mosque,
      name: 'مسجد كربلاء',
      address: 'كربلاء، محافظة كربلاء، العراق',
    }),
  ).toBe('كربلاء');
});

test('reads verified Karbala city adhan without inventing mosque iqamah', () => {
  const schedule = parseAlKafeelKarbalaPrayerPayload(
    [
      {
        fajer: '03:46',
        rise: '05:19',
        noon: '12:10',
        ghrob: '07:16',
        mid: '11:23',
      },
    ],
    {
      id: 'karbala-mosque',
      name: 'A Karbala Mosque',
      address: 'Karbala, Karbala Governorate, Iraq',
      latitude: 32.616,
      longitude: 44.024,
      distanceKm: 1,
    },
  );

  expect(schedule.adhan).toEqual({
    Fajr: '03:46 AM',
    Dhuhr: '12:10 PM',
    Maghrib: '07:16 PM',
  });
  expect(schedule.iqamah).toEqual({});
  expect(schedule.adhan.Asr).toBeUndefined();
  expect(schedule.adhan.Isha).toBeUndefined();
  expect(schedule.coverageNote).toContain('missing prayers remain blank');
});

test('verifies that a discovered website belongs to the selected mosque', () => {
  const alRashid = {
    id: 'al-rashid-identity',
    name: 'Al Rashid Mosque',
    address: '13070 113 Street NW, Edmonton, AB T5E 5A8',
    latitude: 53.5906,
    longitude: -113.5166,
    distanceKm: 1,
  };

  expect(
    websiteMatchesSelectedMosque(
      '<title>Al Rashid Foundation</title><main>Serving Edmonton at 13070 113 Street NW</main>',
      alRashid,
    ),
  ).toBe(true);
  expect(
    websiteMatchesSelectedMosque(
      '<title>Unrelated Community Centre</title><main>Prayer times in Toronto</main>',
      alRashid,
    ),
  ).toBe(false);
});

test('recognizes a searched mosque website by its city or street address', () => {
  const mosque = {
    id: 'alternate-organization-name',
    name: 'North Edmonton Muslim Community',
    address: '550 Clareview Road NW, Edmonton, AB T5A 4H2',
    latitude: 53.603,
    longitude: -113.383,
    distanceKm: 1,
  };
  const html = `
    <title>MAS Islamic Centre</title>
    <main>Daily prayer timetable</main>
    <footer>Unit 120, 550 Clareview Road NW, Edmonton, AB T5A 4H2</footer>
  `;

  expect(websiteMatchesSelectedMosque(html, mosque)).toBe(false);
  expect(websiteLocationMatchesSelectedMosque(html, mosque)).toBe(true);
});

test('finds safe official prayer schedule subpages', () => {
  expect(
    extractPrayerScheduleLinks(
      `
        <a href="/prayer-times/">Prayer times</a>
        <a href="https://masjid.example/yearly-timetable/">Timetable</a>
        <a href="https://other.example/prayer-times">Prayer times</a>
        <a href="mailto:office@masjid.example">Schedule questions</a>
        <iframe src="https://timing.athanplus.com/masjid/widgets/embed?masjid_id=test&amp;theme=1"></iframe>
      `,
      'https://masjid.example/',
    ),
  ).toEqual([
    'https://timing.athanplus.com/masjid/widgets/embed?masjid_id=test&theme=1',
    'https://masjid.example/prayer-times/',
    'https://masjid.example/yearly-timetable/',
  ]);
});

test('finds localized prayer timetable links', () => {
  expect(
    extractPrayerScheduleLinks(
      `
        <a href="/horaires-de-priere/">Horaires de prière</a>
        <a href="https://masjidbox.com/gebetszeiten/test-moschee">Gebetszeiten</a>
      `,
      'https://mosquee.example/',
    ),
  ).toEqual([
    'https://masjidbox.com/gebetszeiten/test-moschee',
    'https://mosquee.example/horaires-de-priere/',
  ]);
});

test('reads Arabic prayer names, Arabic digits, adhan, iqamah, and Jumuah', () => {
  const schedule = parsePublishedMosqueWebsiteHTML(
    `
      <h1>مواقيت الصلاة</h1>
      <div>الفجر ٠٥:١٠ ص ٠٥:٣٠ ص</div>
      <div>الظهر ١٢:٤٥ م ١٣:٠٠</div>
      <div>العصر ١٧:١٠ ١٧:٣٠</div>
      <div>المغرب ٢٠:٤٥ ٢٠:٥٠</div>
      <div>العشاء ٢٢:١٥ ٢٢:٣٠</div>
      <div>الجمعة ١٣:٣٠ ١٤:٣٠</div>
    `,
    {
      id: 'arabic-mosque',
      name: 'المسجد الكبير',
      address: 'Edmonton, Alberta',
      latitude: 53.5,
      longitude: -113.5,
      distanceKm: 1,
      website: 'https://arabic.example/',
    },
  );

  expect(schedule.adhan.Fajr).toBe('05:10 AM');
  expect(schedule.iqamah.Fajr).toBe('05:30 AM');
  expect(schedule.adhan.Isha).toBe('10:15 PM');
  expect(schedule.iqamah.Isha).toBe('10:30 PM');
  expect(schedule.jummah).toEqual(['1:30 PM', '2:30 PM']);
});

test('reads Turkish prayer names and Friday prayer times', () => {
  const schedule = parsePublishedMosqueWebsiteHTML(
    `
      <h1>Namaz Vakitleri</h1>
      <div>Sabah 05.10 05.30</div>
      <div>Öğle 13.15 13.30</div>
      <div>İkindi 17.00 17.15</div>
      <div>Akşam 20.45 20.50</div>
      <div>Yatsı 22.00 22.15</div>
      <div>Cuma 13.30 14.30</div>
    `,
    {
      id: 'turkish-mosque',
      name: 'Merkez Camii',
      address: 'Edmonton, Alberta',
      latitude: 53.5,
      longitude: -113.5,
      distanceKm: 1,
      website: 'https://turkish.example/',
    },
  );

  expect(schedule.adhan.Fajr).toBe('05:10 AM');
  expect(schedule.iqamah.Dhuhr).toBe('1:30 PM');
  expect(schedule.adhan.Maghrib).toBe('8:45 PM');
  expect(schedule.iqamah.Isha).toBe('10:15 PM');
  expect(schedule.jummah).toEqual(['1:30 PM', '2:30 PM']);
});

test.each([
  ['French', ['Sobh', 'Dhohr', 'Asr', 'Maghreb', 'Icha'], 'Joumoua'],
  ['Indonesian', ['Subuh', 'Dzuhur', 'Ashar', 'Magrib', 'Isya'], 'Jumat'],
  ['Somali', ['Subax', 'Duhur', 'Casar', 'Maqrib', 'Cisho'], 'Jimco'],
])('reads %s prayer-name variants', (_, labels, fridayLabel) => {
  const schedule = parsePublishedMosqueWebsiteHTML(
    `
      <div>${labels[0]} 05:10 05:30</div>
      <div>${labels[1]} 13:15 13:30</div>
      <div>${labels[2]} 17:00 17:15</div>
      <div>${labels[3]} 20:45 20:50</div>
      <div>${labels[4]} 22:00 22:15</div>
      <div>${fridayLabel} 13:30 14:30</div>
    `,
    {
      id: 'localized-mosque',
      name: 'Localized Mosque',
      address: 'Edmonton, Alberta',
      latitude: 53.5,
      longitude: -113.5,
      distanceKm: 1,
      website: 'https://localized.example/',
    },
  );

  expect(schedule.adhan.Fajr).toBe('05:10 AM');
  expect(schedule.iqamah.Dhuhr).toBe('1:30 PM');
  expect(schedule.adhan.Maghrib).toBe('8:45 PM');
  expect(schedule.iqamah.Isha).toBe('10:15 PM');
  expect(schedule.jummah).toEqual(['1:30 PM', '2:30 PM']);
});

test('finds an official Masjidbox widget linked by a mosque website', () => {
  expect(
    extractPrayerScheduleLinks(
      `
        <a
          data-masjidbox-widget="7_example"
          href="https://masjidbox.com/prayer-times/mce-mosque"
        >Prayer times MCE Mosque</a>
      `,
      'https://www.mcemosque.com/',
    ),
  ).toEqual(['https://masjidbox.com/prayer-times/mce-mosque']);
});

test('reads adhan, iqamah, and Jumuah from an official Masjidbox timetable', () => {
  const payload = {
    masjidbox: {
      masjidboxAthany: {
        name: 'MCE Mosque',
        address: '10721 86 Avenue Northwest, Edmonton, AB, Canada',
        verified: true,
        settings: { timezone: 'America/Edmonton' },
        timetable: [
          {
            date: '2026-08-07T00:00:00-06:00',
            fajr: '2026-08-07T03:46:00-06:00',
            dhuhr: '2026-08-07T13:42:00-06:00',
            asr: '2026-08-07T17:47:00-06:00',
            maghrib: '2026-08-07T21:21:00-06:00',
            isha: '2026-08-07T23:04:00-06:00',
            jumuah: ['2026-08-07T13:45:00-06:00'],
            iqamah: {
              fajr: '2026-08-07T05:00:00-06:00',
              dhuhr: '2026-08-07T13:45:00-06:00',
              asr: '2026-08-07T18:00:00-06:00',
              maghrib: '2026-08-07T21:26:00-06:00',
              isha: '2026-08-07T23:09:00-06:00',
              jumuah: ['2026-08-07T14:20:00-06:00'],
            },
          },
        ],
      },
    },
  };
  const html = `<script>window.REDUX_STATE = '${encodeURIComponent(
    JSON.stringify(payload),
  )}';</script>`;
  const schedule = parseMasjidboxPrayerScheduleHTML(
    html,
    {
      id: 'mce-mosque',
      name: 'MCE Mosque',
      address: '10721 86 Avenue NW, Edmonton, AB T6E 2M8',
      latitude: 53.5218,
      longitude: -113.5073,
      distanceKm: 1,
      website: 'https://www.mcemosque.com/',
    },
    'https://masjidbox.com/prayer-times/mce-mosque',
    new Date('2026-08-07T18:00:00.000Z'),
  );

  expect(schedule.adhan.Fajr).toBe('3:46 AM');
  expect(schedule.iqamah.Fajr).toBe('5:00 AM');
  expect(schedule.adhan.Isha).toBe('11:04 PM');
  expect(schedule.iqamah.Isha).toBe('11:09 PM');
  expect(schedule.jummah).toEqual(['2:20 PM']);
  expect(schedule.sourceLabel).toBe('Official website · Masjidbox');
});

test('finds an Athan+ widget encoded inside a Google Sites custom embed', () => {
  expect(
    extractPrayerScheduleLinks(
      `
        <div
          data-code="&lt;iframe src=&quot;https://timing.athanplus.com/masjid/widgets/embed?theme=1&amp;masjid_id=OA8aM3dp&amp;khutbah=1:00PM&quot;&gt;&lt;/iframe&gt;"
        ></div>
        <iframe title="Custom embed"></iframe>
      `,
      'https://www.sf-mcc.org/',
    ),
  ).toEqual([
    'https://timing.athanplus.com/masjid/widgets/embed?theme=1&masjid_id=OA8aM3dp&khutbah=1:00PM',
  ]);
});

test('finds and reads an official MAWAQIT website widget', () => {
  const widgetUrl =
    'https://mawaqit.net/en/w/masjid-al-rayyan-edmonton-t5t-5x8-canada?showOnly5PrayerTimes=0';
  expect(
    extractPrayerScheduleLinks(
      `<iframe src="${widgetUrl}" title="Prayer Times"></iframe>`,
      'https://globalislamic.org/',
    ),
  ).toEqual([widgetUrl]);

  const emptyMonths = Array.from({ length: 7 }, () => ({}));
  const confData = {
    name: 'Masjid Al Rayaan',
    latitude: 53.54037,
    longitude: -113.68676,
    timezone: 'America/Edmonton',
    calendar: [
      ...emptyMonths,
      { '2': ['03:39', '05:52', '13:43', '17:54', '21:33', '22:48'] },
    ],
    iqamaCalendar: [
      ...emptyMonths,
      { '2': ['04:30', '14:00', '+5', '+5', '+5'] },
    ],
    jumua: '13:30',
    jumua2: '14:15',
    jumua3: '15:00',
  };
  const schedule = parseMawaqitPrayerScheduleHTML(
    `<script>var confData = ${JSON.stringify(
      confData,
    )}; var isMosque = true;</script>`,
    {
      id: 'masjid-al-rayaan',
      name: 'Masjid Al Rayaan',
      address: 'Edmonton, Alberta',
      latitude: 53.54037,
      longitude: -113.68676,
      distanceKm: 1,
      website: 'https://globalislamic.org/',
    },
    widgetUrl,
    new Date('2026-08-02T18:00:00.000Z'),
  );

  expect(schedule.adhan).toEqual({
    Fajr: '03:39 AM',
    Dhuhr: '1:43 PM',
    Asr: '5:54 PM',
    Maghrib: '9:33 PM',
    Isha: '10:48 PM',
  });
  expect(schedule.iqamah).toEqual({
    Fajr: '04:30 AM',
    Dhuhr: '2:00 PM',
    Asr: '5:59 PM',
    Maghrib: '9:38 PM',
    Isha: '10:53 PM',
  });
  expect(schedule.jummah).toEqual(['1:30 PM', '2:15 PM', '3:00 PM']);
  expect(schedule.sourceLabel).toBe('Official website · MAWAQIT');
});

test('reads today’s prayer times from an official Athan+ website widget', () => {
  const schedule = parseAthanPlusPrayerScheduleHTML(
    `
      <div class="carousel-item active" data-id="0">
        <h2>Sunday, Aug 2, 2026</h2>
      </div>
      <div class="carousel-item" data-id="1">
        <h2>Monday, Aug 3, 2026</h2>
      </div>
      <div class="table_div" id="table_div_0">
        <table>
          <tr><th></th><th>STARTS</th><th>IQAMAH</th></tr>
          <tr><td>Fajr</td><td>3:29 AM</td><td>4:30 AM</td></tr>
          <tr><td>Sunrise</td><td>5:52 AM</td></tr>
          <tr><td>Dhuhr</td><td>1:40 PM</td><td>2:00 PM</td></tr>
          <tr><td>Asr</td><td>5:52 PM</td><td>6:15 PM</td></tr>
          <tr><td>Maghrib</td><td>9:28 PM</td><td>9:33 PM</td></tr>
          <tr><td>Isha</td><td>11:19 PM</td><td>11:19 PM</td></tr>
          <tr><td colspan="3">Isha at 11:16 PM from tomorrow</td></tr>
        </table>
        <h2>Jumuah</h2>
        <li><b>1:30 PM</b><p>Jumuah 1</p></li>
        <li><b>2:30 PM</b><p>Jumuah 2</p></li>
      </div>
      <div class="table_div" id="table_div_1" style="display:none">
        <table>
          <tr><td>Fajr</td><td>5:23 AM</td><td>6:20 AM</td></tr>
          <tr><td>Dhuhr</td><td>1:34 PM</td><td>2:15 PM</td></tr>
          <tr><td>Asr</td><td>6:18 PM</td><td>7:00 PM</td></tr>
          <tr><td>Maghrib</td><td>8:17 PM</td><td>8:25 PM</td></tr>
          <tr><td>Isha</td><td>9:43 PM</td><td>10:15 PM</td></tr>
        </table>
      </div>
    `,
    {
      id: 'masjid-taqwa',
      name: 'Masjid Taqwa',
      address: '10654 101 St NW, Edmonton, AB',
      latitude: 53.55,
      longitude: -113.49,
      distanceKm: 1,
      website: 'https://masjidtaqwa.ca/',
    },
    'https://timing.athanplus.com/masjid/widgets/embed?masjid_id=pVdwyVLe',
  );

  expect(schedule.adhan.Fajr).toBe('03:29 AM');
  expect(schedule.iqamah.Fajr).toBe('04:30 AM');
  expect(schedule.iqamah.Dhuhr).toBe('02:00 PM');
  expect(schedule.adhan.Isha).toBe('11:19 PM');
  expect(schedule.iqamah.Isha).toBe('11:19 PM');
  expect(schedule.jummah).toEqual(['01:30 PM', '02:30 PM']);
  expect(schedule.sourceLabel).toBe('Official website · Athan+');
});

test('parses a mosque official 5Times app payload', () => {
  const schedule = parseFiveTimesSchedulePayload(
    {
      prayers: [
        {
          fajr_adhan: '4:33',
          fajr_iqama: '4:53',
          dhuhr_adhan: '1:42',
          dhuhr_iqama: '2:00',
          asr_adhan: '5:51',
          asr_iqama: '6:00',
          maghrib_adhan: '9:21',
          maghrib_iqama: '9:31',
          isha_adhan: '10:51',
          isha_iqama: '11:01',
          jumuah_1: '01:00 PM',
          jumuah_2: '02:00 PM',
        },
      ],
    },
    {
      id: 'al-salam',
      name: 'Al-Salam Centre',
      address: 'Calgary, Alberta',
      latitude: 51.11,
      longitude: -114.18,
      distanceKm: 1,
      website: 'https://centres.macnet.ca/alsalamcentre/',
    },
  );

  expect(schedule.adhan.Fajr).toBe('04:33 AM');
  expect(schedule.iqamah.Maghrib).toBe('09:31 PM');
  expect(schedule.iqamah.Isha).toBe('11:01 PM');
  expect(schedule.jummah).toEqual(['01:00 PM', '02:00 PM']);
  expect(schedule.sourceLabel).toBe('Official 5Times app');
});

test('parses today from an official yearly PDF timetable', () => {
  const schedule = parsePublishedMosquePDFText(
    `
      Prayer Times - August 2026
      Date Day Fajr Sunrise Dhuhr Asr Maghrib Isha
      1 Sat 4:31 4:51 6:01 1:42 2:00 5:50 6:00 9:23 9:33 10:53 11:03
      2 Sun 4:33 4:53 6:03 1:42 2:00 5:51 6:00 9:21 9:31 10:51 11:01
      3 Mon 4:35 4:55 6:05 1:42 2:00 5:52 6:00 9:19 9:29 10:49 10:59
      Jumu'ah is held at 1:00, 1:30, and 2:05 in the community hall.
      Prayer Times - September 2026
    `,
    {
      id: 'pdf-masjid',
      name: 'PDF Masjid',
      address: 'Calgary, Alberta',
      latitude: 51.13,
      longitude: -113.96,
      distanceKm: 1,
    },
    'https://masjid.example/timetable.pdf',
    new Date(2026, 7, 2, 12),
  );

  expect(schedule.adhan.Fajr).toBe('04:33 AM');
  expect(schedule.iqamah.Dhuhr).toBe('02:00 PM');
  expect(schedule.adhan.Maghrib).toBe('09:21 PM');
  expect(schedule.iqamah.Isha).toBe('11:01 PM');
  expect(schedule.jummah).toEqual(['01:00 PM', '01:30 PM']);
  expect(schedule.sourceLabel).toBe('Official PDF timetable');
});
