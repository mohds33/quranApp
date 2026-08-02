import { Platform } from 'react-native';
import NativeAppleMapsSearch from '../../specs/NativeAppleMapsSearch';

export type Coordinates = { latitude: number; longitude: number };

export type MosqueSearchRegion = Coordinates & {
  latitudeDelta: number;
  longitudeDelta: number;
};

export type PostalArea = {
  coordinates: Coordinates;
  postalArea: string;
  city: string;
  province: string;
  address?: string;
};

export type MosqueSource = 'apple' | 'openstreetmap' | 'saved';

export type Mosque = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  website?: string;
  websiteCandidates?: string[];
  phone?: string;
  source?: MosqueSource;
};

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

function mergeMosqueResults(items: Mosque[], origin: Coordinates) {
  const merged: Mosque[] = [];
  const prioritized = [...items].sort((left, right) => {
    if (left.source === right.source) return left.distanceKm - right.distanceKm;
    return left.source === 'apple' ? -1 : 1;
  });

  for (const item of prioritized) {
    const normalizedName = item.name
      .toLocaleLowerCase()
      .replace(/[\s\-_'’]/g, '');
    const duplicateIndex = merged.findIndex(existing => {
      const existingName = existing.name
        .toLocaleLowerCase()
        .replace(/[\s\-_'’]/g, '');
      const separation = distanceKm(existing, item);
      return (
        separation < 0.08 ||
        (normalizedName.length > 0 &&
          normalizedName === existingName &&
          separation < 0.8)
      );
    });
    if (duplicateIndex === -1) {
      merged.push(item);
    } else {
      const existing = merged[duplicateIndex];
      const websiteCandidates = [
        existing.website,
        ...(existing.websiteCandidates ?? []),
        item.website,
        ...(item.websiteCandidates ?? []),
      ].filter(
        (website, index, websites): website is string =>
          Boolean(website) && websites.indexOf(website) === index,
      );
      merged[duplicateIndex] = {
        ...existing,
        websiteCandidates,
        phone: existing.phone ?? item.phone,
      };
    }
  }

  return merged
    .map(item => ({ ...item, distanceKm: distanceKm(origin, item) }))
    .sort((left, right) => left.distanceKm - right.distanceKm);
}

export function fallbackNearbyMosques(origin: Coordinates) {
  return withDistances(
    fallbackMosques.map(item => ({ ...item, source: 'saved' as const })),
    origin,
  );
}

export async function geocodeCanadianPostalCode(
  postalCode: string,
): Promise<PostalArea> {
  const normalized = postalCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const validPostalCode =
    /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]\d[ABCEGHJKLMNPRSTVWXYZ]\d$/;
  if (!validPostalCode.test(normalized)) {
    throw new Error('Enter a valid Canadian postal code, such as T2P 1J9.');
  }

  if (Platform.OS === 'ios' && NativeAppleMapsSearch) {
    try {
      const payload = JSON.parse(
        await NativeAppleMapsSearch.geocodePostalCode(normalized),
      );
      const latitude = Number(payload.latitude);
      const longitude = Number(payload.longitude);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return {
          coordinates: { latitude, longitude },
          postalArea: payload.postalArea ?? normalized,
          city: payload.city ?? 'Local area',
          province: payload.province ?? '',
          address: payload.address,
        };
      }
    } catch {
      // Fall through to the cross-platform postal-area lookup.
    }
  }

  // The cross-platform fallback resolves the three-character postal district.
  const postalDistrict = normalized.slice(0, 3);
  const response = await fetch(
    `https://api.zippopotam.us/CA/${encodeURIComponent(postalDistrict)}`,
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
    postalArea: `${normalized.slice(0, 3)} ${normalized.slice(3)}`,
    city: place['place name'] ?? 'Local area',
    province: place.state ?? '',
  };
}

async function fetchAppleMapsMosques(
  origin: Coordinates,
  radiusMeters: number,
) {
  if (Platform.OS !== 'ios' || !NativeAppleMapsSearch) return [];
  return parseAppleMapsMosques(
    await NativeAppleMapsSearch.searchMosques(
      origin.latitude,
      origin.longitude,
      radiusMeters,
    ),
    origin,
  );
}

function parseAppleMapsMosques(payloadJSON: string, origin: Coordinates) {
  const payload = JSON.parse(payloadJSON);
  if (!Array.isArray(payload)) throw new Error('Invalid Apple Maps response.');
  const mosques: Omit<Mosque, 'distanceKm'>[] = payload.flatMap(item => {
    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);
    if (
      !item.id ||
      !item.name ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return [];
    }
    return [
      {
        id: String(item.id),
        name: String(item.name),
        address: String(item.address ?? 'Address available in Maps'),
        latitude,
        longitude,
        website: item.website ? String(item.website) : undefined,
        phone: item.phone ? String(item.phone) : undefined,
        source: 'apple' as const,
      },
    ];
  });
  return withDistances(mosques, origin);
}

export async function searchMosquesByName(
  query: string,
  origin: Coordinates,
): Promise<Mosque[]> {
  const appleMapsSearch = NativeAppleMapsSearch;
  if (Platform.OS === 'ios' && appleMapsSearch) {
    const trimmedQuery = query.trim();
    const alreadyDescribesMosque =
      /\b(mosque|masjid|islamic|muslim|jama|jami|cami|mezquita|mosqu[eé]e)\b|مسجد/i.test(
        trimmedQuery,
      );
    const appleQueries = alreadyDescribesMosque
      ? [trimmedQuery, `${trimmedQuery} mosque`]
      : [`${trimmedQuery} mosque`, `${trimmedQuery} masjid`];
    const responses = await Promise.allSettled(
      appleQueries.map(appleQuery =>
        appleMapsSearch.searchPlaces(
          appleQuery,
          origin.latitude,
          origin.longitude,
          50000,
        ),
      ),
    );
    const appleResults = mergeMosqueResults(
      responses.flatMap(response =>
        response.status === 'fulfilled'
          ? parseAppleMapsMosques(response.value, origin)
          : [],
      ),
      origin,
    );
    if (appleResults.length) return appleResults;
  }

  const nearby = await fetchNearbyMosques(origin, 50000);
  const normalizedQuery = query.trim().toLowerCase();
  return nearby.filter(mosque =>
    `${mosque.name} ${mosque.address}`.toLowerCase().includes(normalizedQuery),
  );
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

async function fetchOpenStreetMapMosques(
  origin: Coordinates,
  radiusMeters: number,
) {
  const radius = Math.round(Math.max(5000, Math.min(radiusMeters, 50000)));
  const query = `[out:json][timeout:20];(nwr["religion"="muslim"]["amenity"~"place_of_worship|community_centre"](around:${radius},${origin.latitude},${origin.longitude});nwr["building"="mosque"](around:${radius},${origin.latitude},${origin.longitude}););out center tags;`;
  const encodedQuery = encodeURIComponent(query);
  const endpoints = [
    `https://overpass-api.de/api/interpreter?data=${encodedQuery}`,
    `https://overpass.private.coffee/api/interpreter?data=${encodedQuery}`,
  ];
  const endpointResponses = await Promise.allSettled(
    endpoints.map(async endpoint => {
      const response = await fetchWithTimeout(endpoint, 12000);
      if (!response.ok) throw new Error('Overpass request failed.');
      return response.json();
    }),
  );
  const successfulResponse = endpointResponses.find(
    response => response.status === 'fulfilled',
  );
  const payload =
    successfulResponse?.status === 'fulfilled'
      ? successfulResponse.value
      : undefined;
  if (!payload) throw new Error('Mosque search is temporarily unavailable.');
  const seen = new Set<string>();
  const mosques = payload.elements.flatMap((element: any) => {
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    const tags = element.tags ?? {};
    const name =
      tags.name ?? tags['name:en'] ?? tags['name:ar'] ?? 'Local masjid';
    const identity = `${Number(latitude).toFixed(5)}-${Number(
      longitude,
    ).toFixed(5)}`;
    if (latitude == null || longitude == null || seen.has(identity)) return [];
    seen.add(identity);
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
        source: 'openstreetmap' as const,
      },
    ];
  });
  return withDistances(mosques, origin);
}

export async function fetchNearbyMosques(
  origin: Coordinates,
  radiusMeters = 30000,
): Promise<Mosque[]> {
  const radius = Math.round(Math.max(5000, Math.min(radiusMeters, 50000)));
  const responses = await Promise.allSettled([
    fetchAppleMapsMosques(origin, radius),
    fetchOpenStreetMapMosques(origin, radius),
  ]);
  const results = responses.flatMap(response =>
    response.status === 'fulfilled' ? response.value : [],
  );
  if (!results.length && responses.every(response => response.status === 'rejected')) {
    throw new Error('Mosque search is temporarily unavailable.');
  }
  return mergeMosqueResults(results, origin);
}

export async function fetchMosquesInRegion(region: MosqueSearchRegion) {
  const latitudeKm = Math.abs(region.latitudeDelta) * 111;
  const longitudeKm =
    Math.abs(region.longitudeDelta) *
    111 *
    Math.max(Math.cos((region.latitude * Math.PI) / 180), 0.2);
  const halfDiagonalKm = Math.hypot(latitudeKm, longitudeKm) / 2;
  if (halfDiagonalKm > 48) {
    throw new Error('Zoom in closer to search a city-sized area.');
  }

  const origin = {
    latitude: region.latitude,
    longitude: region.longitude,
  };
  const useTiles = latitudeKm > 28 || longitudeKm > 28;
  const centers: Coordinates[] = useTiles
    ? [-0.23, 0.23].flatMap(latitudeOffset =>
        [-0.23, 0.23].map(longitudeOffset => ({
          latitude: region.latitude + region.latitudeDelta * latitudeOffset,
          longitude: region.longitude + region.longitudeDelta * longitudeOffset,
        })),
      )
    : [origin];
  const appleRadius = Math.round(
    Math.max(
      10000,
      Math.min(50000, halfDiagonalKm * 1000 * (useTiles ? 0.72 : 1.1)),
    ),
  );
  const osmRadius = Math.round(
    Math.max(5000, Math.min(50000, halfDiagonalKm * 1000 * 1.08)),
  );
  const responses = await Promise.allSettled([
    ...centers.map(center => fetchAppleMapsMosques(center, appleRadius)),
    fetchOpenStreetMapMosques(origin, osmRadius),
  ]);
  const results = responses.flatMap(response =>
    response.status === 'fulfilled' ? response.value : [],
  );
  if (
    !results.length &&
    responses.every(response => response.status === 'rejected')
  ) {
    throw new Error('Mosque search is temporarily unavailable.');
  }

  const latitudeLimit = Math.max(region.latitudeDelta * 0.55, 0.03);
  const longitudeLimit = Math.max(region.longitudeDelta * 0.55, 0.03);
  return mergeMosqueResults(results, origin).filter(mosque => {
    const wrappedLongitudeDifference = Math.abs(
      ((mosque.longitude - region.longitude + 540) % 360) - 180,
    );
    return (
      Math.abs(mosque.latitude - region.latitude) <= latitudeLimit &&
      wrappedLongitudeDifference <= longitudeLimit
    );
  });
}
