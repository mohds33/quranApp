import { Platform } from 'react-native';
import NativeAppleMapsSearch from '../../specs/NativeAppleMapsSearch';
import { distanceKm } from './mosques';
import type { Coordinates, Mosque } from './mosques';

export type CachedSearchedLocation = {
  coordinates: Coordinates;
  label: string;
  address?: string;
};

export type MosqueSearchCache = {
  version: 1;
  origin: Coordinates;
  label: string;
  mosques: Mosque[];
  searchedLocation?: CachedSearchedLocation;
  radiusMeters: number;
  savedAt: string;
};

function validCoordinates(value: any): value is Coordinates {
  return (
    Number.isFinite(value?.latitude) &&
    Number.isFinite(value?.longitude) &&
    Math.abs(value.latitude) <= 90 &&
    Math.abs(value.longitude) <= 180
  );
}

function validMosque(value: any): value is Mosque {
  return (
    typeof value?.id === 'string' &&
    typeof value?.name === 'string' &&
    typeof value?.address === 'string' &&
    validCoordinates(value)
  );
}

export function parseMosqueSearchCache(payloadJson: string) {
  if (!payloadJson) return null;
  try {
    const value = JSON.parse(payloadJson);
    if (
      value?.version !== 1 ||
      !validCoordinates(value.origin) ||
      typeof value.label !== 'string' ||
      !Array.isArray(value.mosques) ||
      !value.mosques.every(validMosque)
    ) {
      return null;
    }
    const origin = value.origin as Coordinates;
    const mosques = (value.mosques as Mosque[])
      .map(mosque => ({
        ...mosque,
        distanceKm: distanceKm(origin, mosque),
      }))
      .sort((left, right) => left.distanceKm - right.distanceKm);
    const searchedLocation = validCoordinates(
      value.searchedLocation?.coordinates,
    )
      ? {
          coordinates: value.searchedLocation.coordinates,
          label: String(value.searchedLocation.label ?? ''),
          address: value.searchedLocation.address
            ? String(value.searchedLocation.address)
            : undefined,
        }
      : undefined;
    return {
      version: 1 as const,
      origin,
      label: value.label,
      mosques,
      searchedLocation,
      radiusMeters: Number.isFinite(value.radiusMeters)
        ? Math.max(5000, Math.min(50000, value.radiusMeters))
        : 30000,
      savedAt: typeof value.savedAt === 'string' ? value.savedAt : '',
    } satisfies MosqueSearchCache;
  } catch {
    return null;
  }
}

export async function readLastMosqueSearch() {
  if (Platform.OS !== 'ios' || !NativeAppleMapsSearch) return null;
  try {
    return parseMosqueSearchCache(
      await NativeAppleMapsSearch.readMosqueSearchCache(),
    );
  } catch {
    return null;
  }
}

export async function saveLastMosqueSearch(
  cache: Omit<MosqueSearchCache, 'version' | 'savedAt'>,
) {
  if (
    Platform.OS !== 'ios' ||
    !NativeAppleMapsSearch ||
    !cache.mosques.length
  ) {
    return;
  }
  const payload: MosqueSearchCache = {
    ...cache,
    version: 1,
    mosques: cache.mosques.slice(0, 250),
    savedAt: new Date().toISOString(),
  };
  await NativeAppleMapsSearch.saveMosqueSearchCache(JSON.stringify(payload));
}
