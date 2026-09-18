import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Alert, StyleSheet } from 'react-native';
import Video from 'react-native-video';
import { globalAyahNumber, surahs } from '../data/quran';
import { getAyahRecitationUrl, RECITER_NAME } from '../services/quranAudio';
import type { AyahReference } from '../services/quranReading';

type QuranAudioContextValue = {
  /** The verse loaded in the player, or null when nothing is playing. */
  current: AyahReference | null;
  paused: boolean;
  buffering: boolean;
  /** Recites from this verse to the end of its surah. */
  play: (surah: string, ayah?: string) => void;
  togglePause: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
};

const QuranAudioContext = createContext<QuranAudioContextValue>({
  current: null,
  paused: true,
  buffering: false,
  play: () => undefined,
  togglePause: () => undefined,
  stop: () => undefined,
  next: () => undefined,
  previous: () => undefined,
});

function verseCount(surahNumber: string) {
  return surahs.find(surah => surah.number === surahNumber)?.ayahs.length ?? 0;
}

export function QuranAudioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [current, setCurrent] = useState<AyahReference | null>(null);
  const [paused, setPaused] = useState(true);
  const [buffering, setBuffering] = useState(false);

  const play = useCallback((surah: string, ayah = '1') => {
    setCurrent({ surah, ayah });
    setPaused(false);
  }, []);
  const stop = useCallback(() => {
    setCurrent(null);
    setPaused(true);
    setBuffering(false);
  }, []);
  const togglePause = useCallback(() => setPaused(value => !value), []);
  const step = useCallback(
    (offset: number) =>
      setCurrent(track => {
        if (!track) return track;
        const ayah = Number(track.ayah) + offset;
        if (ayah < 1) return track;
        if (ayah > verseCount(track.surah)) {
          setPaused(true);
          return null;
        }
        return { surah: track.surah, ayah: String(ayah) };
      }),
    [],
  );
  const next = useCallback(() => step(1), [step]);
  const previous = useCallback(() => step(-1), [step]);

  const value = useMemo(
    () => ({
      current,
      paused,
      buffering,
      play,
      togglePause,
      stop,
      next,
      previous,
    }),
    [buffering, current, next, paused, play, previous, stop, togglePause],
  );
  const surahName = surahs.find(
    surah => surah.number === current?.surah,
  )?.name;

  return (
    <QuranAudioContext.Provider value={value}>
      {children}
      {current ? (
        <Video
          key={`${current.surah}:${current.ayah}`}
          source={{
            uri: getAyahRecitationUrl(
              globalAyahNumber(current.surah, current.ayah),
            ),
            metadata: {
              title: `${surahName} · Verse ${current.ayah}`,
              artist: RECITER_NAME,
            },
          }}
          paused={paused}
          playInBackground
          playWhenInactive
          ignoreSilentSwitch="ignore"
          showNotificationControls
          onLoadStart={() => setBuffering(true)}
          onLoad={() => setBuffering(false)}
          onBuffer={({ isBuffering }) => setBuffering(isBuffering)}
          onEnd={next}
          onError={() => {
            stop();
            Alert.alert(
              'Recitation unavailable',
              'Could not play the Quran audio. Check your connection and try again.',
            );
          }}
          style={styles.hidden}
        />
      ) : null}
    </QuranAudioContext.Provider>
  );
}

export function useQuranAudio() {
  return useContext(QuranAudioContext);
}

const styles = StyleSheet.create({
  hidden: { width: 0, height: 0, position: 'absolute' },
});
