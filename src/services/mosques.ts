export type Coordinates = { latitude: number; longitude: number };

export type PostalArea = {
  coordinates: Coordinates;
  postalArea: string;
  city: string;
  province: string;
};

export type Mosque = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  website?: string;
  phone?: string;
};

export type PrayerTimings = Record<
  'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha',
  string
>;

export const CALGARY_CENTRE: Coordinates = {
  latitude: 51.0447,
  longitude: -114.0719,
};

const fallbackMosques = [
  {
    id: 'osm-13089458341',
    name: 'IISC Downtown Mosque',
    address: '1009 7 Avenue SW, Calgary',
    latitude: 51.0468564,
    longitude: -114.0843631,
  },
  {
    id: 'osm-12101258391',
    name: 'Akram Jomaa Islamic Centre',
    address: 'Calgary, Alberta',
    latitude: 51.0880448,
    longitude: -114.0003833,
  },
  {
    id: 'osm-365774365',
    name: 'Al-Salam Centre',
    address: '6415 Ranchview Drive NW, Calgary',
    latitude: 51.1148326,
    longitude: -114.1799531,
    website: 'https://centres.macnet.ca/alsalamcentre/',
  },
  {
    id: 'osm-12253978378',
    name: 'Al-Hedaya Islamic Centre',
    address: '108 Savanna Avenue NE, Calgary',
    latitude: 51.1340068,
    longitude: -113.9645688,
    website: 'https://alhedayacentre.ca/',
  },
  {
    id: 'osm-12253978379',
    name: 'Hazrat Bilal Islamic Centre',
    address: '216–20 Saddlestone Drive NE, Calgary',
    latitude: 51.1295071,
    longitude: -113.9289467,
    website: 'https://hbic.ca/',
  },
  {
    id: 'osm-13176969514',
    name: 'Northwest Islamic Centre',
    address: '23–7750 Ranchview Drive NW, Calgary',
    latitude: 51.1205776,
    longitude: -114.1806243,
    website: 'https://www.ianwc.ca/',
  },
  {
    id: 'osm-14049628802',
    name: 'Bab UL Hawaij Islamic Centre',
    address: '3025 12 Street NE, Calgary',
    latitude: 51.07911,
    longitude: -114.02695,
    website: 'http://babulhawaijcalgary.com',
  },
  {
    id: 'osm-115590438',
    name: 'Ismaili Jamatkhana & Centre',
    address: 'Calgary, Alberta',
    latitude: 51.094044,
    longitude: -114.0376223,
  },
  {
    id: 'osm-486651359',
    name: 'Baitun Nur Mosque',
    address: '4354 54 Avenue NE, Calgary',
    latitude: 51.101882,
    longitude: -113.9712837,
    website: 'https://baitunnur.org/',
  },
  {
    id: 'osm-745053091',
    name: 'Masjid-e-Maryam Calgary',
    address: '183 Beddington Drive NE, Calgary',
    latitude: 51.1286546,
    longitude: -114.0681804,
  },
  {
    id: 'osm-1064131736',
    name: 'Green Dome Masjid',
    address: 'Calgary, Alberta',
    latitude: 51.1261813,
    longitude: -113.9677231,
  },
];

export function distanceKm(from: Coordinates, to: Coordinates) {
  const radius = 6371;
  const degrees = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = degrees(to.latitude - from.latitude);
  const longitudeDelta = degrees(to.longitude - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(degrees(from.latitude)) *
      Math.cos(degrees(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function withDistances(
  items: Omit<Mosque, 'distanceKm'>[],
  origin: Coordinates,
) {
  return items
    .map(item => ({ ...item, distanceKm: distanceKm(origin, item) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function fallbackNearbyMosques(origin: Coordinates) {
  return withDistances(fallbackMosques, origin);
}

export async function geocodeCanadianPostalCode(
  postalCode: string,
): Promise<PostalArea> {
  const normalized = postalCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const validPostalCode =
    /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ](?:\d[ABCEGHJKLMNPRSTVWXYZ]\d)?$/;
  if (!validPostalCode.test(normalized)) {
    throw new Error('Enter a valid Canadian postal code, such as T2P 1J9.');
  }

  // Canadian postal lookups use the first three characters (the FSA). This
  // keeps the search private while still producing a useful local radius.
  const postalArea = normalized.slice(0, 3);
  const response = await fetch(
    `https://api.zippopotam.us/CA/${encodeURIComponent(postalArea)}`,
  );
  if (!response.ok) throw new Error('That postal code area was not found.');
  const payload = await response.json();
  const place = payload.places?.[0];
  const latitude = Number(place?.latitude);
  const longitude = Number(place?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('That postal code area was not found.');
  }
  return {
    coordinates: { latitude, longitude },
    postalArea,
    city: place['place name'] ?? 'Local area',
    province: place.state ?? '',
  };
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchNearbyMosques(
  origin: Coordinates,
): Promise<Mosque[]> {
  const query = `[out:json][timeout:20];nwr["religion"="muslim"]["amenity"~"place_of_worship|community_centre"](around:30000,${origin.latitude},${origin.longitude});out center tags;`;
  const encodedQuery = encodeURIComponent(query);
  const endpoints = [
    `https://overpass-api.de/api/interpreter?data=${encodedQuery}`,
    `https://overpass.kumi.systems/api/interpreter?data=${encodedQuery}`,
  ];
  let payload: any;
  for (const endpoint of endpoints) {
    try {
      const response = await fetchWithTimeout(endpoint, 15000);
      if (!response.ok) continue;
      payload = await response.json();
      break;
    } catch {
      // Try the next public Overpass instance.
    }
  }
  if (!payload) throw new Error('Mosque search is temporarily unavailable.');
  const seen = new Set<string>();
  const mosques = payload.elements.flatMap((element: any) => {
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    const name = element.tags?.name;
    if (!name || latitude == null || longitude == null || seen.has(name))
      return [];
    seen.add(name);
    const tags = element.tags ?? {};
    const street = [tags['addr:housenumber'], tags['addr:street']]
      .filter(Boolean)
      .join(' ');
    const address =
      [street, tags['addr:city']].filter(Boolean).join(', ') ||
      'Address available in Maps';
    return [
      {
        id: `${element.type}-${element.id}`,
        name,
        address,
        latitude,
        longitude,
        website: tags.website ?? tags['contact:website'],
        phone: tags.phone,
      },
    ];
  });
  return withDistances(mosques, origin);
}

export async function fetchPrayerTimings(
  origin: Coordinates,
): Promise<PrayerTimings> {
  const response = await fetch(
    `https://api.aladhan.com/v1/timings?latitude=${origin.latitude}&longitude=${origin.longitude}&method=2`,
  );
  if (!response.ok)
    throw new Error('Prayer times are temporarily unavailable.');
  const payload = await response.json();
  const { Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha } = payload.data.timings;
  return { Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha };
}
