// Builds src/data/hisnMuslim.json from the public Hisn al-Muslim API
// (https://www.hisnmuslim.com/api). Run with: node scripts/build-hisn-muslim.mjs
import { writeFile } from 'node:fs/promises';

const API = 'https://www.hisnmuslim.com/api';

async function getJSON(url) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(url.replace(/^http:/, 'https:'));
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      const text = (await response.text()).replace(/^﻿/, '');
      try {
        return JSON.parse(text);
      } catch {
        // Chapter 126 leaves its title key unterminated ("What to say…: [").
        return JSON.parse(
          text.replace(/^(\s*"[^"\r\n]*?)\s*:?\s*\r?\n(\s*\[)/m, '$1":\n$2'),
        );
      }
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

const clean = text => String(text ?? '').replace(/\s+/g, ' ').trim();
const https = url => (url ? String(url).replace(/^http:/, 'https:') : undefined);

const [english, arabic] = await Promise.all([
  getJSON(`${API}/en/husn_en.json`),
  getJSON(`${API}/ar/husn_ar.json`),
]);
const arabicTitles = new Map(
  Object.values(arabic)[0].map(chapter => [chapter.ID, clean(chapter.TITLE)]),
);

const chapters = [];
for (const chapter of [...english.English].sort((a, b) => a.ID - b.ID)) {
  const body = await getJSON(chapter.TEXT);
  const duas = Object.values(body)[0].map(dua => ({
    id: dua.ID,
    arabic: clean(dua.ARABIC_TEXT),
    transliteration: clean(dua.LANGUAGE_ARABIC_TRANSLATED_TEXT),
    translation: clean(dua.TRANSLATED_TEXT),
    repeat: Number(dua.REPEAT) || 1,
    audio: https(dua.AUDIO),
  }));
  const title = clean(chapter.TITLE);
  chapters.push({
    id: chapter.ID,
    title: title.charAt(0).toUpperCase() + title.slice(1),
    arabicTitle: arabicTitles.get(chapter.ID) ?? '',
    duas,
  });
  process.stdout.write('.');
}

await writeFile(
  new URL('../src/data/hisnMuslim.json', import.meta.url),
  `${JSON.stringify(chapters)}\n`,
);
console.log(
  `\n${chapters.length} chapters, ${chapters.reduce(
    (total, chapter) => total + chapter.duas.length,
    0,
  )} duas`,
);
