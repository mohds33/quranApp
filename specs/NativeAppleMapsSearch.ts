import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  searchMosques(
    latitude: number,
    longitude: number,
    radiusMeters: number,
  ): Promise<string>;
  searchPlaces(
    query: string,
    latitude: number,
    longitude: number,
    radiusMeters: number,
  ): Promise<string>;
  geocodePostalCode(postalCode: string): Promise<string>;
  geocodeAddress(query: string): Promise<string>;
  reverseGeocode(latitude: number, longitude: number): Promise<string>;
  extractPdfText(url: string): Promise<string>;
  extractRenderedWebsiteHTML(url: string): Promise<string>;
  readMosqueSearchCache(): Promise<string>;
  saveMosqueSearchCache(payloadJson: string): Promise<boolean>;
  readAppPreferences(): Promise<string>;
  saveAppPreferences(payloadJson: string): Promise<boolean>;
}

export default TurboModuleRegistry.get<Spec>('NativeAppleMapsSearch');
