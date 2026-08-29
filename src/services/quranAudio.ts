const QURAN_AUDIO_BASE_URL = 'https://cdn.islamic.network/quran';
const DEFAULT_BITRATE = 128;
const DEFAULT_RECITER = 'ar.alafasy';

function cleanNumber(value: string | number) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 1) {
    throw new Error('A valid Quran audio number is required.');
  }
  return Math.floor(number);
}

export function getSurahRecitationUrl(surahNumber: string | number) {
  return `${QURAN_AUDIO_BASE_URL}/audio-surah/${DEFAULT_BITRATE}/${DEFAULT_RECITER}/${cleanNumber(
    surahNumber,
  )}.mp3`;
}

export function getAyahRecitationUrl(globalAyahNumber: string | number) {
  return `${QURAN_AUDIO_BASE_URL}/audio/${DEFAULT_BITRATE}/${DEFAULT_RECITER}/${cleanNumber(
    globalAyahNumber,
  )}.mp3`;
}
