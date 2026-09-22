import { buildPrayerNotifications } from '../src/services/prayerNotifications';

const london = { latitude: 51.5176, longitude: -0.0653 };
const now = new Date(2026, 8, 18, 12, 0, 0);

const build = (options = {}) =>
  buildPrayerNotifications({
    origin: london,
    placeName: 'East London Mosque',
    method: 'northAmerica',
    now,
    days: 3,
    ...options,
  });

describe('prayer notifications', () => {
  it('covers the coming days and skips prayers already past', () => {
    const notifications = build();
    // Only prayers still to come today are included.
    expect(
      notifications.filter(n => n.id.startsWith('2026-09-18')).length,
    ).toBeGreaterThan(0);
    expect(
      notifications.filter(n => n.id.startsWith('2026-09-19')),
    ).toHaveLength(5);
    expect(notifications.every(n => new Date(n.date) > now)).toBe(true);
    expect(notifications.map(n => n.date)).toEqual(
      [...notifications.map(n => n.date)].sort(),
    );
    expect(notifications[0].title).toMatch(/· East London Mosque$/);
  });

  it('uses the masjid’s published jama’ah time for today', () => {
    const published = {
      adhan: {},
      iqamah: { Asr: '5:30 PM' },
      jummah: [],
      sourceName: '',
      sourceUrl: '',
      sourceLabel: '',
      verified: true,
      fetchedAt: '',
    };
    const asr = build({ published }).find(n => n.id.endsWith('Asr'))!;
    expect(new Date(asr.date).getHours()).toBe(17);
    expect(new Date(asr.date).getMinutes()).toBe(30);
    expect(asr.body).toBe("Jama'ah at 5:30 PM");
    // Tomorrow falls back to the calculated time, not today's published one.
    const tomorrow = build({ published }).find(n => n.id === '2026-09-19-Asr')!;
    expect(tomorrow.body).toBe('It is time for Asr');
  });

  it('gives every reminder a unique id', () => {
    const ids = build({ days: 12 }).map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeLessThanOrEqual(60);
  });
});
