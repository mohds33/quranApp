import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import NativeAppleMapsSearch from '../../specs/NativeAppleMapsSearch';
import type { Coordinates } from './mosques';

export type ResolvedLocation = Coordinates & {
  label: string;
  address?: string;
};

Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
  locationProvider: 'auto',
});

export async function getCurrentCoordinates(): Promise<Coordinates> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Use your location',
        message:
          'Sakinah uses your location to calculate prayer times and find nearby mosques.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      },
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('Location permission was not granted.');
    }
  }

  return new Promise((resolve, reject) =>
    Geolocation.getCurrentPosition(
      position =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    ),
  );
}

function parsedLocation(payloadJSON: string): ResolvedLocation {
  const payload = JSON.parse(payloadJSON);
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('The location result was invalid.');
  }
  return {
    latitude,
    longitude,
    label: String(payload.label ?? payload.address ?? 'Selected location'),
    address: payload.address ? String(payload.address) : undefined,
  };
}

export async function reverseGeocodeCoordinates(
  coordinates: Coordinates,
): Promise<ResolvedLocation> {
  if (Platform.OS === 'ios' && NativeAppleMapsSearch) {
    return parsedLocation(
      await NativeAppleMapsSearch.reverseGeocode(
        coordinates.latitude,
        coordinates.longitude,
      ),
    );
  }
  return {
    ...coordinates,
    label: `${coordinates.latitude.toFixed(3)}, ${coordinates.longitude.toFixed(
      3,
    )}`,
  };
}

export async function geocodeAddressOrCity(
  query: string,
): Promise<ResolvedLocation> {
  const trimmed = query.trim();
  if (trimmed.length < 2) throw new Error('Enter an address or city.');
  if (Platform.OS === 'ios' && NativeAppleMapsSearch) {
    return parsedLocation(await NativeAppleMapsSearch.geocodeAddress(trimmed));
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
      trimmed,
    )}`,
    { headers: { 'User-Agent': 'Sakinah/1.0 location search' } },
  );
  if (!response.ok) throw new Error('Location search is unavailable.');
  const payload = await response.json();
  const result = Array.isArray(payload) ? payload[0] : null;
  if (!result) throw new Error('That address or city was not found.');
  return parsedLocation(
    JSON.stringify({
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      label: result.display_name,
      address: result.display_name,
    }),
  );
}
