import {
  fetchMosqueIqamahSchedule,
  parseMawaqitSearchResult,
  parsePublishedMosqueWebsiteHTML,
  parseTimetableTablesForDate,
  plausiblePublishedSchedule,
} from '../src/services/prayerTimes';

const london = { latitude: 51.5176, longitude: -0.0653 };
const today = new Date(2026, 8, 18, 12);

describe('timetable tables', () => {
  it('reads today’s row from a yearly table with Begins/Jamā’ah columns', () => {
    const html = `<table><thead><tr>
      <th>Gregorian date</th><th>Sunrise</th><th>Fajr Begins</th><th>Fajr Jamā'ah</th>
      <th>Zuhr Begins</th><th>Zuhr Jamā'ah</th><th>Asr Mithl 1</th><th>Asr Mithl 2</th>
      <th>Asr Jamā'ah</th><th>Maghrib Begins</th><th>Maghrib Jamā'ah</th>
      <th>Ishā Begins</th><th>Ishā Jamā'ah</th></tr></thead><tbody>
      <tr><td>10/09/2026</td><td>6:25</td><td>4:50</td><td>5:10</td><td>1:02</td><td>1:30</td><td>4:30</td><td>5:20</td><td>5:45</td><td>7:29</td><td>7:36</td><td>8:50</td><td>9:00</td></tr>
      <tr><td>18/09/2026</td><td>6:37</td><td>5:06</td><td>5:26</td><td>1:00</td><td>1:45</td><td>4:18</td><td>5:09</td><td>5:30</td><td>7:11</td><td>7:18</td><td>8:26</td><td>8:45</td></tr>
      </tbody></table>`;
    expect(parseTimetableTablesForDate(html, today)).toEqual({
      adhan: {
        Fajr: '05:06 AM',
        Dhuhr: '01:00 PM',
        Asr: '04:18 PM',
        Maghrib: '07:11 PM',
        Isha: '08:26 PM',
      },
      iqamah: {
        Fajr: '05:26 AM',
        Dhuhr: '01:45 PM',
        Asr: '05:30 PM',
        Maghrib: '07:18 PM',
        Isha: '08:45 PM',
      },
    });
  });

  it('reads French month names, 24-hour times and a two-row header', () => {
    const html = `<p>Horaires de prière — septembre 2026</p><table>
      <tr><th rowspan="2">Jour</th><th colspan="2">Fajr</th><th colspan="2">Dohr</th>
          <th colspan="2">Asr</th><th colspan="2">Maghreb</th><th colspan="2">Icha</th></tr>
      <tr><th>Adhan</th><th>Iqama</th><th>Adhan</th><th>Iqama</th><th>Adhan</th><th>Iqama</th>
          <th>Adhan</th><th>Iqama</th><th>Adhan</th><th>Iqama</th></tr>
      <tr><td>Ven. 18 sept.</td><td>05:58</td><td>06:10</td><td>13:50</td><td>14:00</td>
          <td>17:09</td><td>17:20</td><td>20:00</td><td>20:05</td><td>21:27</td><td>21:40</td></tr>
      <tr><td>Sam. 19 sept.</td><td>06:00</td><td>06:10</td><td>13:49</td><td>14:00</td>
          <td>17:07</td><td>17:20</td><td>19:58</td><td>20:03</td><td>21:25</td><td>21:40</td></tr>
    </table>`;
    const result = parseTimetableTablesForDate(html, today);
    expect(result?.adhan.Dhuhr).toBe('1:50 PM');
    expect(result?.iqamah.Isha).toBe('9:40 PM');
    expect(result?.iqamah.Fajr).toBe('06:10 AM');
  });

  it('reads month/day order and Turkish Imsak columns', () => {
    const html = `<table>
      <tr><th>Tarih</th><th>İmsak</th><th>Güneş</th><th>Öğle</th><th>İkindi</th><th>Akşam</th><th>Yatsı</th></tr>
      <tr><td>09/17/2026</td><td>05:15</td><td>06:48</td><td>13:12</td><td>16:36</td><td>19:26</td><td>20:53</td></tr>
      <tr><td>09/18/2026</td><td>05:16</td><td>06:49</td><td>13:11</td><td>16:35</td><td>19:24</td><td>20:51</td></tr>
    </table>`;
    const result = parseTimetableTablesForDate(html, today);
    expect(result?.adhan).toEqual({
      Fajr: '05:16 AM',
      Dhuhr: '1:11 PM',
      Asr: '4:35 PM',
      Maghrib: '7:24 PM',
      Isha: '8:51 PM',
    });
  });

  it('ignores tables without a row for today', () => {
    const html = `<table><tr><th>Date</th><th>Fajr</th><th>Dhuhr</th><th>Asr</th></tr>
      <tr><td>01/01/2026</td><td>6:26</td><td>12:09</td><td>1:46</td></tr>
      <tr><td>02/01/2026</td><td>6:26</td><td>12:10</td><td>1:47</td></tr></table>`;
    expect(parseTimetableTablesForDate(html, today)).toBeNull();
  });

  it('ignores prayer names in page metadata and machine timestamps', () => {
    // Real pages list every prayer name in their SEO description, followed by
    // a publish date; that date must not be read as a prayer time.
    const schedule = parsePublishedMosqueWebsiteHTML(
      `<head>
         <meta property="og:description" content="Salah Adhan Iqamah Fajr Sunrise Dhuhr Asr Maghrib Isha Al Rashid" />
         <meta property="article:published_time" content="2025-09-26T04:52:04+00:00" />
       </head>
       <body><div>ADHAN</div><div>IQAMAH</div>
         <div>Fajr</div><div>05:20 AM</div><div>05:40 AM</div>
         <div>Sunrise</div><div>07:20 AM</div>
         <div>Dhuhr</div><div>01:27 PM</div><div>01:37 PM</div>
         <div>Asr</div><div>04:42 PM</div><div>04:52 PM</div>
         <div>Maghrib</div><div>07:34 PM</div><div>07:39 PM</div>
         <div>Isha</div><div>09:25 PM</div><div>09:35 PM</div>
       </body>`,
      {
        id: 'x',
        name: 'Al Rashid Mosque',
        address: 'Edmonton',
        latitude: 53.5966,
        longitude: -113.5094,
        distanceKm: 0,
      },
    );
    expect(schedule.adhan).toEqual({
      Fajr: '05:20 AM',
      Dhuhr: '01:27 PM',
      Asr: '04:42 PM',
      Maghrib: '07:34 PM',
      Isha: '09:25 PM',
    });
    expect(schedule.iqamah).toEqual({
      Fajr: '05:40 AM',
      Dhuhr: '01:37 PM',
      Asr: '04:52 PM',
      Maghrib: '07:39 PM',
      Isha: '09:35 PM',
    });
  });

  it('reads a late-morning Dhuhr without AM/PM as morning', () => {
    const schedule = parsePublishedMosqueWebsiteHTML(
      '<div>Subuh 04:35</div><div>Zuhur 11:53</div><div>Ashar 15:14</div><div>Maghrib 17:47</div><div>Isya 18:59</div>',
      {
        id: 'x',
        name: 'Test',
        address: '',
        latitude: -6.17,
        longitude: 106.83,
        distanceKm: 0,
      },
    );
    expect(schedule.iqamah.Dhuhr).toBe('11:53 AM');
  });
});

describe('Mawaqit', () => {
  it('reads times, iqama offsets and Jumu’ah, including 7-entry time lists', () => {
    const schedule = parseMawaqitSearchResult({
      name: 'DİTİB-Zentralmoschee Köln',
      slug: 'ditib-koln',
      site: 'https://moscheeforum.de/',
      times: ['05:18', '06:05', '07:05', '13:32', '16:55', '19:48', '21:21'],
      iqama: ['+30', '+10', '+10', '+5', '21:40'],
      iqamaEnabled: true,
      jumua: '13:45',
    });
    expect(schedule?.adhan).toEqual({
      Fajr: '5:18 AM',
      Dhuhr: '1:32 PM',
      Asr: '4:55 PM',
      Maghrib: '7:48 PM',
      Isha: '9:21 PM',
    });
    expect(schedule?.iqamah.Fajr).toBe('5:48 AM');
    expect(schedule?.iqamah.Isha).toBe('9:40 PM');
    expect(schedule?.jummah).toEqual(['1:45 PM']);
    expect(schedule?.officialWebsiteUrl).toBe('https://moscheeforum.de/');
  });
});

describe('plausibility against the sky', () => {
  const schedule = (iqamah: Record<string, string>) => ({
    adhan: {},
    iqamah,
    jummah: [],
    sourceName: 'Test',
    sourceUrl: '',
    sourceLabel: 'Test',
    verified: false,
    fetchedAt: '',
  });

  it('keeps a real London schedule', () => {
    const real = schedule({
      Fajr: '5:26 AM',
      Dhuhr: '1:45 PM',
      Asr: '5:30 PM',
      Maghrib: '7:18 PM',
      Isha: '8:45 PM',
    });
    expect(
      plausiblePublishedSchedule(real, london, 'Europe/London', today)?.iqamah,
    ).toEqual(real.iqamah);
  });

  it('drops another season’s Fajr and rejects another city’s times', () => {
    const summer = plausiblePublishedSchedule(
      schedule({
        Fajr: '3:05 AM',
        Dhuhr: '1:30 PM',
        Asr: '6:30 PM',
        Maghrib: '7:18 PM',
        Isha: '8:45 PM',
      }),
      london,
      'Europe/London',
      today,
    );
    expect(summer?.iqamah.Fajr).toBeUndefined();
    expect(summer?.iqamah.Dhuhr).toBe('1:30 PM');

    const jakarta = schedule({
      Fajr: '4:35 AM',
      Dhuhr: '11:53 AM',
      Asr: '3:14 PM',
      Maghrib: '5:47 PM',
      Isha: '6:59 PM',
    });
    expect(
      plausiblePublishedSchedule(jakarta, london, 'Europe/London', today),
    ).toBeNull();
  });

  it('treats a Fajr time just before sunrise as Shuruq', () => {
    const result = plausiblePublishedSchedule(
      schedule({
        Fajr: '6:35 AM',
        Dhuhr: '1:45 PM',
        Asr: '5:30 PM',
        Maghrib: '7:18 PM',
      }),
      london,
      'Europe/London',
      today,
    );
    expect(result?.iqamah.Fajr).toBeUndefined();
  });
});

describe('community schedules', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });
  const respond = (candidate: object) => {
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ data: [candidate] }),
    })) as any;
  };
  const mosque = {
    id: 'm',
    name: 'Test Masjid',
    address: '',
    latitude: 51.5,
    longitude: -0.06,
    distanceKm: 0,
  };
  const candidate = {
    name: 'Test Masjid',
    distanceMeters: 10,
    effectiveTimings: {
      fajr: '05:26',
      dhuhr: '13:45',
      asr: '17:30',
      isha: '20:45',
    },
  };

  it('ignores unverified entries that have not been updated for weeks', async () => {
    respond({ ...candidate, effectiveKeeperUpdatedAt: '2026-05-16T03:30:00Z' });
    expect(await fetchMosqueIqamahSchedule(mosque)).toBeNull();
  });

  it('keeps recently updated or verified entries', async () => {
    respond({
      ...candidate,
      effectiveKeeperUpdatedAt: new Date().toISOString(),
    });
    expect((await fetchMosqueIqamahSchedule(mosque))?.timings.Fajr).toBe(
      '5:26 AM',
    );
    respond({
      ...candidate,
      effectiveKeeperIsVerifiedSchedule: true,
      effectiveKeeperUpdatedAt: '2026-01-01T00:00:00Z',
    });
    expect((await fetchMosqueIqamahSchedule(mosque))?.verified).toBe(true);
  });
});
