import { APP_CONFIG } from "./config.js";

let memoiresCache = null;

function slugify(text) {
  return String(text || "memoire")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function ensureArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeMemoire(raw, index) {
  const title = raw?.title ? String(raw.title).trim() : `Mémoire ${index + 1}`;
  const slug = raw?.slug ? slugify(raw.slug) : slugify(title);
  const themes = ensureArray(raw?.themes).map((theme) => String(theme).trim()).filter(Boolean);

  return {
    slug,
    title,
    author: raw?.author ? String(raw.author).trim() : "Auteur/autrice non renseigné·e",
    year: Number.isFinite(Number(raw?.year)) ? Number(raw.year) : null,
    themes,
    summary: raw?.summary
      ? String(raw.summary).trim()
      : "Résumé non disponible pour ce mémoire.",
    cover: raw?.cover ? String(raw.cover).trim() : "",
    pdf: raw?.pdf ? String(raw.pdf).trim() : "",
  };
}

export async function loadMemoires() {
  if (memoiresCache) {
    return memoiresCache;
  }

  const response = await fetch(APP_CONFIG.data.memoiresPath, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Impossible de charger les métadonnées des mémoires.");
  }

  const json = await response.json();
  if (!Array.isArray(json)) {
    throw new Error("Le fichier de données doit contenir une liste JSON.");
  }

  memoiresCache = json.map(normalizeMemoire).sort((a, b) => {
    if (a.year !== b.year) {
      return (b.year || 0) - (a.year || 0);
    }
    return a.title.localeCompare(b.title, "fr");
  });

  return memoiresCache;
}

export function getUniqueValues(memoires, key) {
  const values = new Set();

  for (const memoire of memoires) {
    if (key === "themes") {
      for (const theme of memoire.themes) {
        values.add(theme);
      }
      continue;
    }

    const value = memoire[key];
    if (value !== null && value !== undefined && value !== "") {
      values.add(String(value));
    }
  }

  return [...values].sort((a, b) => a.localeCompare(b, "fr"));
}

export function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
