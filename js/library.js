import { getUniqueValues, loadMemoires, normalizeText } from "./data-store.js";

const listEl = document.querySelector("#memoire-list");
const countEl = document.querySelector("#results-count");
const errorEl = document.querySelector("#library-error");
const emptyEl = document.querySelector("#empty-state");

const searchInput = document.querySelector("#search-input");
const yearSelect = document.querySelector("#year-filter");
const authorSelect = document.querySelector("#author-filter");
const themeSelect = document.querySelector("#theme-filter");
const resetButton = document.querySelector("#reset-filters");

let memoires = [];

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function clearError() {
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

function fillSelect(select, values, defaultLabel) {
  select.innerHTML = "";
  select.append(new Option(defaultLabel, ""));
  for (const value of values) {
    select.append(new Option(value, value));
  }
}

function createTag(text) {
  const tag = document.createElement("span");
  tag.className = "badge";
  tag.textContent = text;
  return tag;
}

function createMemoireCard(memoire) {
  const article = document.createElement("article");
  article.className = "memoire-card";

  const cover = document.createElement("img");
  cover.className = "memoire-cover";
  cover.src = memoire.cover || "./assets/covers/traces-vivantes.svg";
  cover.alt = `Couverture du mémoire ${memoire.title}`;
  cover.loading = "lazy";

  const content = document.createElement("div");

  const header = document.createElement("div");
  header.className = "memoire-header";

  const title = document.createElement("h2");
  title.className = "memoire-title";
  title.textContent = memoire.title;

  const year = document.createElement("span");
  year.className = "muted";
  year.textContent = memoire.year ? String(memoire.year) : "Année non renseignée";

  header.append(title, year);

  const author = document.createElement("p");
  author.className = "muted";
  author.textContent = memoire.author;

  const summary = document.createElement("p");
  summary.textContent = memoire.summary;

  const tagRow = document.createElement("div");
  tagRow.className = "badge-row";
  for (const theme of memoire.themes) {
    tagRow.append(createTag(theme));
  }

  const actions = document.createElement("div");
  const openButton = document.createElement("a");
  openButton.className = "button";
  openButton.href = `./viewer.html?slug=${encodeURIComponent(memoire.slug)}`;
  openButton.textContent = "Consulter";
  actions.append(openButton);

  content.append(header, author, summary, tagRow, actions);
  article.append(cover, content);

  return article;
}

function currentFilters() {
  return {
    search: normalizeText(searchInput.value),
    year: yearSelect.value,
    author: normalizeText(authorSelect.value),
    theme: normalizeText(themeSelect.value),
  };
}

function matchesFilters(memoire, filters) {
  if (filters.year && String(memoire.year || "") !== filters.year) {
    return false;
  }

  if (filters.author && normalizeText(memoire.author) !== filters.author) {
    return false;
  }

  if (filters.theme) {
    const hasTheme = memoire.themes.some((theme) => normalizeText(theme) === filters.theme);
    if (!hasTheme) {
      return false;
    }
  }

  if (filters.search) {
    const haystack = normalizeText(
      [memoire.title, memoire.author, memoire.summary, memoire.year, memoire.themes.join(" ")].join(" "),
    );
    if (!haystack.includes(filters.search)) {
      return false;
    }
  }

  return true;
}

function renderList(items) {
  listEl.innerHTML = "";

  if (items.length === 0) {
    emptyEl.classList.remove("hidden");
  } else {
    emptyEl.classList.add("hidden");
    for (const memoire of items) {
      listEl.append(createMemoireCard(memoire));
    }
  }

  const label = items.length > 1 ? "mémoires" : "mémoire";
  countEl.textContent = `${items.length} ${label} affiché${items.length > 1 ? "s" : ""}`;
}

function applyFilters() {
  const filters = currentFilters();
  const filtered = memoires.filter((memoire) => matchesFilters(memoire, filters));
  renderList(filtered);
}

function resetFilters() {
  searchInput.value = "";
  yearSelect.value = "";
  authorSelect.value = "";
  themeSelect.value = "";
  applyFilters();
}

async function initLibrary() {
  try {
    clearError();
    memoires = await loadMemoires();

    fillSelect(yearSelect, getUniqueValues(memoires, "year").reverse(), "Toutes");
    fillSelect(authorSelect, getUniqueValues(memoires, "author"), "Tous");
    fillSelect(themeSelect, getUniqueValues(memoires, "themes"), "Tous");

    renderList(memoires);

    [searchInput, yearSelect, authorSelect, themeSelect].forEach((input) => {
      input.addEventListener("input", applyFilters);
      input.addEventListener("change", applyFilters);
    });

    resetButton.addEventListener("click", resetFilters);
  } catch {
    showError("Impossible de charger la bibliothèque. Vérifiez le fichier data/memoires.json.");
    countEl.textContent = "Aucun résultat";
    emptyEl.classList.add("hidden");
  }
}

initLibrary();
