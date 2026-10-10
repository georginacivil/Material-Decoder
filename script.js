const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const compactInput = document.getElementById("compactInput");
const compactBtn = document.getElementById("compactBtn");
const logoLink = document.getElementById("logoLink");
const message = document.getElementById("message");
const hero = document.getElementById("hero");
const resultCard = document.getElementById("resultCard");
const notFoundBox = document.getElementById("notFoundBox");
const interestSelect = document.getElementById("interestSelect");
const personalText = document.getElementById("personalText");

// Price badge
const cardPriceBadge = document.getElementById("cardPriceBadge");
const cardPrice = document.getElementById("cardPrice");

// Στοιχεία της κάρτας "Υλικό της Εβδομάδας"
const featuredCard = document.getElementById("featuredCard");
const featuredName = document.getElementById("featuredName");
const featuredCategory = document.getElementById("featuredCategory");
const featuredDescription = document.getElementById("featuredDescription");
const featuredBtn = document.getElementById("featuredBtn");

// Στοιχεία του Newsfeed
const newsSection = document.getElementById("newsSection");
const newsList = document.getElementById("newsList");
const newsTab = document.getElementById("newsTab");

// Στοιχεία των Stories
const storiesSection = document.getElementById("storiesSection");
const storiesList = document.getElementById("storiesList");
const storiesTab = document.getElementById("storiesTab");

// Στοιχεία των Brands
const brandsSection = document.getElementById("brandsSection");
const brandsTab = document.getElementById("brandsTab");
const brandsListView = document.getElementById("brandsListView");
const brandDetailView = document.getElementById("brandDetailView");
const brandOrigin = document.getElementById("brandOrigin");
const brandSortBtn = document.getElementById("brandSortBtn");
const brandSearch = document.getElementById("brandSearch");
const brandsCount = document.getElementById("brandsCount");
const brandsGrid = document.getElementById("brandsGrid");
const brandBackBtn = document.getElementById("brandBackBtn");
const brandDetailName = document.getElementById("brandDetailName");
const brandDetailProfile = document.getElementById("brandDetailProfile");
const brandDetailOrigin = document.getElementById("brandDetailOrigin");
const brandDetailCategory = document.getElementById("brandDetailCategory");
const brandWebsiteBtn = document.getElementById("brandWebsiteBtn");
const brandSupportBtn = document.getElementById("brandSupportBtn");
const brandProducts = document.getElementById("brandProducts");

const tabs = document.querySelectorAll(".tab");

// Στοιχεία του Modal
const newsModal = document.getElementById("newsModal");
const modalClose = document.getElementById("modalClose");
const modalDate = document.getElementById("modalDate");
const modalTitle = document.getElementById("modalTitle");
const modalSummary = document.getElementById("modalSummary");
const modalSourceBtn = document.getElementById("modalSourceBtn");

// Οι 7 σταθερές στήλες του materials.csv:
// 0:Name, 1:Category, 2:Ingredients, 3:Mechanism, 4:Applications, 5:Incompatibilities, 6:Price
// (οι στήλες 7-13 είναι οι Info_..., και βρίσκονται από το πρόθεμα "Info_")
const FIXED_COLUMNS = [
  "name",
  "category",
  "ingredients",
  "mechanism",
  "applications",
  "incompatibilities",
  "price"
];

// Οι 4 στήλες του news.csv
const NEWS_COLUMNS = ["date", "title", "summary", "link"];

// Οι 6 στήλες του stories.csv
const STORIES_COLUMNS = ["date", "title", "problem", "cause", "solution", "tags"];

// Οι 6 στήλες του brands.csv
const BRANDS_COLUMNS = [
  "brand_name",
  "short_profile",
  "origin",
  "website",
  "tech_support",
  "core_category"
];

// Το πρόθεμα των δυναμικών στηλών
const INFO_PREFIX = "info_";

// Μετονομασίες για το UI (κλειδί: όνομα στήλης χωρίς "Info_", σε πεζά)
const LABEL_ALIASES = {
  skincare: "Cosmetics",
  cosmetics: "Cosmetics"
};

// Μήνυμα όταν δεν έχει επιλεγεί κατηγορία στο dropdown
const PLACEHOLDER_TEXT =
  "Επίλεξε μια κατηγορία από το μενού για να δεις την προσωποποιημένη εξήγηση";

// Κείμενο που δείχνουμε όταν μια είδηση δεν έχει περίληψη
const NO_SUMMARY_TEXT = "Μη διαθέσιμη περίληψη.";

// Πόσα pixel scroll χρειάζονται για το "scrolled" state του header
const SCROLL_THRESHOLD = 80;

let currentView = "home";   // "home", "news", "stories" ή "brands"
let currentProduct = null;  // το υλικό που εμφανίζεται αυτή τη στιγμή στο Grid
let featuredProduct = null; // το "Υλικό της Εβδομάδας"
let selectedInfo = "";      // η τελευταία επιλογή του dropdown
let isSearching = false;    // αποτρέπει διπλές αναζητήσεις ταυτόχρονα
let newsRequestId = 0;      // για να αγνοούνται παλιές απαντήσεις (Newsfeed)
let storiesRequestId = 0;   // για να αγνοούνται παλιές απαντήσεις (Stories)
let brandsRequestId = 0;    // για να αγνοούνται παλιές απαντήσεις (λίστα Brands)
let brandProductsRequestId = 0; // για να αγνοούνται παλιές απαντήσεις (προϊόντα εταιρείας)
let lastFocusedElement = null; // το στοιχείο που είχε focus πριν ανοίξει το modal

let allBrands = [];         // όλες οι εταιρείες από το brands.csv
let brandsSortAsc = true;   // true = A → Z, false = Z → A

// ---------- Βοηθητικές συναρτήσεις ----------

// Πεζά + αφαίρεση ΟΛΩΝ των κενών: "Kerakoll H40" -> "kerakollh40"
function normalize(text) {
  return String(text).toLowerCase().replace(/\s+/g, "");
}

// Πεζά + ένα μόνο κενό ανάμεσα στις λέξεις: "Isomat   Aquamat " -> "isomat aquamat"
function collapse(text) {
  return String(text).toLowerCase().replace(/\s+/g, " ").trim();
}

// Αν ένα πεδίο είναι κενό, δείχνουμε παύλα
function valueOrDash(text) {
  return text && text.trim() !== "" ? text : "—";
}

// Διαβάζει CSV κείμενο και επιστρέφει πίνακα γραμμών.
function parseCSV(text, delimiter) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter(function (r) {
    return r.some(function (c) { return c.trim() !== ""; });
  });
}

// Μαντεύει αν το CSV χρησιμοποιεί κόμμα ή ερωτηματικό
function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/)[0];
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  return semicolons > commas ? ";" : ",";
}

// "Info_Skincare" -> "Cosmetics", "Info_Gaming" -> "Gaming"
function cleanLabel(header) {
  const raw = header.trim().slice(INFO_PREFIX.length).replace(/_/g, " ").trim();
  return LABEL_ALIASES[raw.toLowerCase()] || raw;
}

// Προσπαθεί να διαβάσει μια ημερομηνία. Επιστρέφει Date ή null.
function parseDate(text) {
  if (!text) return null;
  const date = new Date(text);
  return isNaN(date.getTime()) ? null : date;
}

// "2026-10-03" -> "3 Οκτωβρίου 2026"
function formatDate(text) {
  const date = parseDate(text);
  if (!date) return text || "—";
  return date.toLocaleDateString("el-GR", { day: "numeric", month: "long", year: "numeric" });
}

// Ταξινόμηση: οι πιο πρόσφατες πρώτα, όσες ημερομηνίες δεν αναγνωρίζονται στο τέλος
function sortByDateDesc(a, b) {
  const da = parseDate(a.date);
  const db = parseDate(b.date);
  if (da && db) return db - da;
  if (da) return -1;
  if (db) return 1;
  return 0;
}

// Επιτρέπουμε μόνο links http/https
function isSafeLink(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
}

// Ακυρώνει όλες τις φορτώσεις που τρέχουν ακόμα (όταν αλλάζει η προβολή)
function cancelPendingLoads() {
  newsRequestId++;
  storiesRequestId++;
  brandsRequestId++;
  brandProductsRequestId++;
}

// ---------- Ανάγνωση της βάσης υλικών (materials.csv) ----------

function buildData(csvText) {
  csvText = csvText.replace(/^\uFEFF/, ""); // αφαιρούμε το αόρατο BOM του Excel

  const rows = parseCSV(csvText, detectDelimiter(csvText));
  if (rows.length < 2) return { products: [], infoColumns: [] };

  const headers = rows[0].map(function (h) { return h.trim(); });

  // Στήλες που ξεκινούν με "Info_" (θέσεις 7-13)
  const infoColumns = [];
  headers.forEach(function (header, index) {
    if (header.toLowerCase().startsWith(INFO_PREFIX)) {
      const label = cleanLabel(header);
      if (label !== "") infoColumns.push({ index: index, label: label });
    }
  });

  // Σταθερές στήλες: με όνομα, αλλιώς με θέση 0-6
  const fixedIndex = {};
  FIXED_COLUMNS.forEach(function (colName, position) {
    const found = headers.findIndex(function (h) {
      return h.toLowerCase() === colName;
    });
    if (found === -1) {
      console.warn('Η στήλη "' + colName + '" δεν βρέθηκε με όνομα. Χρησιμοποιείται η θέση ' + position + ".");
    }
    fixedIndex[colName] = found !== -1 ? found : position;
  });

  const products = rows.slice(1).map(function (row) {
    const product = {
      name: (row[fixedIndex.name] || "").trim(),
      category: (row[fixedIndex.category] || "").trim(),
      ingredients: (row[fixedIndex.ingredients] || "").trim(),
      mechanism: (row[fixedIndex.mechanism] || "").trim(),
      applications: (row[fixedIndex.applications] || "").trim(),
      incompatibilities: (row[fixedIndex.incompatibilities] || "").trim(),
      price: (row[fixedIndex.price] || "").trim(),
      info: {}
    };

    infoColumns.forEach(function (col) {
      product.info[col.label] = (row[col.index] || "").trim();
    });

    return product;
  }).filter(function (p) {
    return p.name !== "";
  });

  return { products: products, infoColumns: infoColumns };
}

// Κάνει fetch το CSV (no-store = πάντα η τελευταία έκδοση από το backend)
async function loadDatabase() {
  const response = await fetch("materials.csv", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }
  return buildData(await response.text());
}

// ---------- Newsfeed (news.csv) ----------

function buildNews(csvText) {
  csvText = csvText.replace(/^\uFEFF/, "");

  const rows = parseCSV(csvText, detectDelimiter(csvText));
  if (rows.length < 2) return [];

  const headers = rows[0].map(function (h) { return h.trim().toLowerCase(); });

  const index = {};
  NEWS_COLUMNS.forEach(function (colName, position) {
    const found = headers.indexOf(colName);
    index[colName] = found !== -1 ? found : position;
  });

  return rows.slice(1).map(function (row) {
    return {
      date: (row[index.date] || "").trim(),
      title: (row[index.title] || "").trim(),
      summary: (row[index.summary] || "").trim(),
      link: (row[index.link] || "").trim()
    };
  }).filter(function (item) {
    return item.title !== "";
  });
}

// Έχει η είδηση πραγματική περίληψη; (κενή ή "Μη διαθέσιμη περίληψη." = όχι)
function hasRealSummary(summary) {
  if (!summary) return false;
  const cleaned = summary.trim().toLowerCase().replace(/[.\s]+$/, "");
  return cleaned !== "" && cleaned !== NO_SUMMARY_TEXT.toLowerCase().replace(/[.\s]+$/, "");
}

function showNewsStatus(text, isError) {
  newsList.innerHTML = "";
  const box = document.createElement("div");
  box.className = "news-status" + (isError ? " is-error" : "");
  box.textContent = text;
  newsList.appendChild(box);
}

// Φτιάχνει μία κάρτα είδησης
function createNewsCard(item, position) {
  const card = document.createElement("article");
  card.className = "news-card";
  card.style.animationDelay = Math.min(position * 0.06, 0.5) + "s";

  const date = document.createElement("span");
  date.className = "news-date";
  date.textContent = formatDate(item.date);

  const title = document.createElement("h3");
  title.className = "news-title";
  title.textContent = item.title;

  const hasSummary = hasRealSummary(item.summary);
  const hasLink = isSafeLink(item.link);

  const summary = document.createElement("p");
  summary.className = "news-summary" + (hasSummary ? "" : " is-empty");
  summary.textContent = hasSummary ? item.summary : NO_SUMMARY_TEXT;

  card.appendChild(date);
  card.appendChild(title);
  card.appendChild(summary);

  if (hasSummary) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "news-btn";
    button.textContent = "Διαβάστε περισσότερα";
    button.addEventListener("click", function () {
      openModal(item);
    });
    card.appendChild(button);
  } else if (hasLink) {
    const link = document.createElement("a");
    link.className = "news-btn";
    link.href = item.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Διαβάστε περισσότερα";
    card.appendChild(link);
  }

  return card;
}

async function loadNews() {
  const requestId = ++newsRequestId;
  showNewsStatus("Φόρτωση ειδήσεων...", false);

  try {
    const response = await fetch("news.csv", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    const items = buildNews(await response.text());

    if (requestId !== newsRequestId) return;

    if (items.length === 0) {
      showNewsStatus("Δεν υπάρχουν διαθέσιμες ειδήσεις αυτή τη στιγμή.", false);
      return;
    }

    items.sort(sortByDateDesc);

    newsList.innerHTML = "";
    items.forEach(function (item, position) {
      newsList.appendChild(createNewsCard(item, position));
    });
  } catch (error) {
    if (requestId !== newsRequestId) return;
    console.error("Σφάλμα φόρτωσης news.csv:", error);
    showNewsStatus(
      "Δεν μπόρεσε να φορτωθεί το news.csv. Βεβαιώσου ότι υπάρχει στον ίδιο φάκελο και ότι ανοίγεις το project με Live Server.",
      true
    );
  }
}

// ---------- Stories (stories.csv) ----------

function buildStories(csvText) {
  csvText = csvText.replace(/^\uFEFF/, "");

  const rows = parseCSV(csvText, detectDelimiter(csvText));
  if (rows.length < 2) return [];

  const headers = rows[0].map(function (h) { return h.trim().toLowerCase(); });

  const index = {};
  STORIES_COLUMNS.forEach(function (colName, position) {
    const found = headers.indexOf(colName);
    index[colName] = found !== -1 ? found : position;
  });

  return rows.slice(1).map(function (row) {
    const tags = (row[index.tags] || "")
      .split(/[,;|]/)
      .map(function (t) { return t.trim(); })
      .filter(function (t) { return t !== ""; });

    return {
      date: (row[index.date] || "").trim(),
      title: (row[index.title] || "").trim(),
      problem: (row[index.problem] || "").trim(),
      cause: (row[index.cause] || "").trim(),
      solution: (row[index.solution] || "").trim(),
      tags: tags
    };
  }).filter(function (story) {
    return story.title !== "";
  });
}

function showStoriesStatus(text, isError) {
  storiesList.innerHTML = "";
  const box = document.createElement("div");
  box.className = "news-status" + (isError ? " is-error" : "");
  box.textContent = text;
  storiesList.appendChild(box);
}

function createStorySection(className, heading, text) {
  const section = document.createElement("div");
  section.className = "story-section " + className;

  const h4 = document.createElement("h4");
  h4.textContent = heading;

  const p = document.createElement("p");
  p.textContent = valueOrDash(text);

  section.appendChild(h4);
  section.appendChild(p);
  return section;
}

function createStoryCard(story, position) {
  const card = document.createElement("article");
  card.className = "story-card";
  card.style.animationDelay = Math.min(position * 0.06, 0.5) + "s";

  const bodyId = "story-body-" + position;

  const head = document.createElement("button");
  head.type = "button";
  head.className = "story-head";
  head.setAttribute("aria-expanded", "false");
  head.setAttribute("aria-controls", bodyId);

  const headMain = document.createElement("div");
  headMain.className = "story-head-main";

  const date = document.createElement("span");
  date.className = "story-date";
  date.textContent = formatDate(story.date);

  const title = document.createElement("h3");
  title.className = "story-title";
  title.textContent = story.title;

  headMain.appendChild(date);
  headMain.appendChild(title);

  if (story.tags.length > 0) {
    const tagsBox = document.createElement("div");
    tagsBox.className = "story-tags";
    story.tags.forEach(function (tag) {
      const badge = document.createElement("span");
      badge.className = "story-tag";
      badge.textContent = tag;
      tagsBox.appendChild(badge);
    });
    headMain.appendChild(tagsBox);
  }

  const chevron = document.createElement("span");
  chevron.className = "story-chevron";
  chevron.setAttribute("aria-hidden", "true");
  chevron.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';

  head.appendChild(headMain);
  head.appendChild(chevron);

  const body = document.createElement("div");
  body.className = "story-body";
  body.id = bodyId;

  const inner = document.createElement("div");
  inner.className = "story-body-inner";

  const sections = document.createElement("div");
  sections.className = "story-sections";
  sections.appendChild(createStorySection("story-problem", "⚠️ Το Πρόβλημα", story.problem));
  sections.appendChild(createStorySection("story-cause", "🔬 Η Αιτία", story.cause));
  sections.appendChild(createStorySection("story-solution", "✅ Η Λύση του Μάστορα", story.solution));

  inner.appendChild(sections);
  body.appendChild(inner);

  head.addEventListener("click", function () {
    const isOpen = card.classList.toggle("is-open");
    head.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  card.appendChild(head);
  card.appendChild(body);
  return card;
}

async function loadStories() {
  const requestId = ++storiesRequestId;
  showStoriesStatus("Φόρτωση stories...", false);

  try {
    const response = await fetch("stories.csv", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    const stories = buildStories(await response.text());

    if (requestId !== storiesRequestId) return;

    if (stories.length === 0) {
      showStoriesStatus("Δεν υπάρχουν διαθέσιμα stories αυτή τη στιγμή.", false);
      return;
    }

    stories.sort(sortByDateDesc);

    storiesList.innerHTML = "";
    stories.forEach(function (story, position) {
      storiesList.appendChild(createStoryCard(story, position));
    });
  } catch (error) {
    if (requestId !== storiesRequestId) return;
    console.error("Σφάλμα φόρτωσης stories.csv:", error);
    showStoriesStatus(
      "Δεν μπόρεσε να φορτωθεί το stories.csv. Βεβαιώσου ότι υπάρχει στον ίδιο φάκελο και ότι ανοίγεις το project με Live Server.",
      true
    );
  }
}

// ---------- Brands (brands.csv) ----------

// Μετατρέπει το brands.csv σε λίστα εταιρειών
function buildBrands(csvText) {
  csvText = csvText.replace(/^\uFEFF/, "");

  const rows = parseCSV(csvText, detectDelimiter(csvText));
  if (rows.length < 2) return [];

  // "Brand Name" και "brand_name" θεωρούνται το ίδιο
  const headers = rows[0].map(function (h) {
    return h.trim().toLowerCase().replace(/\s+/g, "_");
  });

  const index = {};
  BRANDS_COLUMNS.forEach(function (colName, position) {
    const found = headers.indexOf(colName);
    index[colName] = found !== -1 ? found : position;
  });

  return rows.slice(1).map(function (row) {
    return {
      name: (row[index.brand_name] || "").trim(),
      profile: (row[index.short_profile] || "").trim(),
      origin: (row[index.origin] || "").trim(),
      website: (row[index.website] || "").trim(),
      support: (row[index.tech_support] || "").trim(),
      category: (row[index.core_category] || "").trim()
    };
  }).filter(function (brand) {
    return brand.name !== "";
  });
}

// Website: αν λείπει το https://, το προσθέτουμε. Επιστρέφει "" αν δεν είναι έγκυρο.
function buildWebsiteUrl(text) {
  let url = (text || "").trim();
  if (url === "") return "";
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  return isSafeLink(url) ? url : "";
}

// Τεχνική υποστήριξη: τηλέφωνο -> "tel:...", email -> "mailto:...", αλλιώς "" (δεν γίνεται link)
function buildSupportHref(text) {
  const value = (text || "").trim();
  if (value === "") return "";

  if (value.indexOf("@") !== -1 && value.indexOf(" ") === -1) {
    return "mailto:" + value;
  }

  const digits = value.replace(/[^\d+]/g, "");
  if (digits.replace(/\D/g, "").length >= 5) {
    return "tel:" + digits;
  }
  return "";
}

// Το υλικό ανήκει στην εταιρεία αν το Name του ξεκινά με το όνομά της ΩΣ ΞΕΧΩΡΙΣΤΗ ΛΕΞΗ.
// "Isomat Aquamat" ανήκει στην "Isomat", αλλά το "Isomatic X" δεν ανήκει.
function belongsToBrand(productName, brandName) {
  const p = collapse(productName);
  const b = collapse(brandName);
  return b !== "" && (p === b || p.indexOf(b + " ") === 0);
}

// Γεμίζει το dropdown χωρών με τις μοναδικές τιμές του Origin
function fillOriginDropdown(brands) {
  const previous = brandOrigin.value;
  const unique = new Map();

  brands.forEach(function (brand) {
    if (brand.origin !== "") {
      unique.set(brand.origin.toLowerCase(), brand.origin);
    }
  });

  const origins = Array.from(unique.values()).sort(function (a, b) {
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });

  brandOrigin.innerHTML = "";

  const all = document.createElement("option");
  all.value = "";
  all.textContent = "Όλες οι χώρες";
  brandOrigin.appendChild(all);

  origins.forEach(function (origin) {
    const option = document.createElement("option");
    option.value = origin;
    option.textContent = origin;
    brandOrigin.appendChild(option);
  });

  // Κρατάμε την προηγούμενη επιλογή αν υπάρχει ακόμα
  const stillExists = origins.indexOf(previous) !== -1;
  brandOrigin.value = stillExists ? previous : "";
}

function showBrandsStatus(text, isError) {
  brandsGrid.innerHTML = "";
  const box = document.createElement("div");
  box.className = "news-status" + (isError ? " is-error" : "");
  box.textContent = text;
  brandsGrid.appendChild(box);
}

// Φτιάχνει μία κάρτα εταιρείας
function createBrandCard(brand, position) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "brand-card";
  card.style.animationDelay = Math.min(position * 0.04, 0.4) + "s";

  const name = document.createElement("h3");
  name.className = "brand-card-name";
  name.textContent = brand.name;

  const meta = document.createElement("div");
  meta.className = "brand-card-meta";

  const category = document.createElement("span");
  category.className = "brand-category-badge";
  category.textContent = valueOrDash(brand.category);

  const origin = document.createElement("span");
  origin.className = "brand-origin-badge";
  origin.textContent = "📍 " + valueOrDash(brand.origin);

  meta.appendChild(category);
  meta.appendChild(origin);

  card.appendChild(name);
  card.appendChild(meta);

  card.addEventListener("click", function () {
    openBrandDetail(brand);
  });

  return card;
}

// Εφαρμόζει φίλτρα (χώρα + αναζήτηση) και ταξινόμηση, και ξαναζωγραφίζει το grid
function renderBrands() {
  const originFilter = brandOrigin.value.toLowerCase();
  const query = normalize(brandSearch.value);

  const visible = allBrands.filter(function (brand) {
    const matchesOrigin = originFilter === "" || brand.origin.toLowerCase() === originFilter;
    const matchesQuery = query === "" || normalize(brand.name).indexOf(query) !== -1;
    return matchesOrigin && matchesQuery;
  });

  visible.sort(function (a, b) {
    const result = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    return brandsSortAsc ? result : -result;
  });

  brandsCount.textContent =
    visible.length === 1 ? "1 εταιρεία" : visible.length + " εταιρείες";

  if (visible.length === 0) {
    showBrandsStatus("Δεν βρέθηκαν εταιρείες με αυτά τα κριτήρια.", false);
    return;
  }

  brandsGrid.innerHTML = "";
  visible.forEach(function (brand, position) {
    brandsGrid.appendChild(createBrandCard(brand, position));
  });
}

// Κάνει fetch το brands.csv και ζωγραφίζει τη λίστα
async function loadBrands() {
  const requestId = ++brandsRequestId;
  brandsCount.textContent = "";
  showBrandsStatus("Φόρτωση εταιρειών...", false);

  try {
    const response = await fetch("brands.csv", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    const brands = buildBrands(await response.text());

    if (requestId !== brandsRequestId) return;

    allBrands = brands;

    if (allBrands.length === 0) {
      showBrandsStatus("Δεν υπάρχουν διαθέσιμες εταιρείες αυτή τη στιγμή.", false);
      return;
    }

    fillOriginDropdown(allBrands);
    renderBrands();
  } catch (error) {
    if (requestId !== brandsRequestId) return;
    console.error("Σφάλμα φόρτωσης brands.csv:", error);
    showBrandsStatus(
      "Δεν μπόρεσε να φορτωθεί το brands.csv. Βεβαιώσου ότι υπάρχει στον ίδιο φάκελο και ότι ανοίγεις το project με Live Server.",
      true
    );
  }
}

// Εναλλαγή μέσα στο tab Brands: λίστα <-> αναλυτική προβολή
function showBrandsList() {
  brandProductsRequestId++;
  brandDetailView.hidden = true;
  brandsListView.hidden = false;
}

function showProductsStatus(text, isError) {
  brandProducts.innerHTML = "";
  const box = document.createElement("div");
  box.className = "news-status" + (isError ? " is-error" : "");
  box.textContent = text;
  brandProducts.appendChild(box);
}

// Κλικ σε υλικό: πάει στην κλασική ανάλυση του υλικού (σαν να το έψαξε ο χρήστης)
function openProductAnalysis(product) {
  searchInput.value = product.name;
  compactInput.value = product.name;
  handleSearch();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Φτιάχνει μια μικρή κάρτα υλικού μέσα στην προβολή της εταιρείας
function createProductCard(product, position) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "product-card";
  card.style.animationDelay = Math.min(position * 0.05, 0.4) + "s";

  const main = document.createElement("div");
  main.className = "product-card-main";

  const name = document.createElement("div");
  name.className = "product-card-name";
  name.textContent = product.name;

  main.appendChild(name);

  if (product.category !== "") {
    const category = document.createElement("span");
    category.className = "product-card-category";
    category.textContent = product.category;
    main.appendChild(category);
  }

  const arrow = document.createElement("span");
  arrow.className = "product-card-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";

  card.appendChild(main);
  card.appendChild(arrow);

  card.addEventListener("click", function () {
    openProductAnalysis(product);
  });

  return card;
}

// Φέρνει από το materials.csv τα υλικά της εταιρείας και τα εμφανίζει
async function loadBrandProducts(brand) {
  const requestId = ++brandProductsRequestId;
  showProductsStatus("Φόρτωση προϊόντων...", false);

  try {
    const data = await loadDatabase();

    if (requestId !== brandProductsRequestId) return;

    const matches = data.products.filter(function (product) {
      return belongsToBrand(product.name, brand.name);
    });

    if (matches.length === 0) {
      showProductsStatus("Δεν υπάρχουν ακόμα προϊόντα αυτής της εταιρείας στη βάση.", false);
      return;
    }

    matches.sort(function (a, b) {
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

    brandProducts.innerHTML = "";
    matches.forEach(function (product, position) {
      brandProducts.appendChild(createProductCard(product, position));
    });
  } catch (error) {
    if (requestId !== brandProductsRequestId) return;
    console.error("Σφάλμα φόρτωσης προϊόντων εταιρείας:", error);
    showProductsStatus(
      "Δεν μπόρεσε να φορτωθεί το materials.csv. Βεβαιώσου ότι υπάρχει στον ίδιο φάκελο και ότι ανοίγεις το project με Live Server.",
      true
    );
  }
}

// Ανοίγει την αναλυτική προβολή μιας εταιρείας
function openBrandDetail(brand) {
  pushHistory({ view: "brand", brand: brand.name }, "#brand=" + encodeURIComponent(brand.name)); 
  brandDetailName.textContent = brand.name;
  brandDetailProfile.textContent = valueOrDash(brand.profile);
  brandDetailOrigin.textContent = "📍 " + valueOrDash(brand.origin);
  brandDetailCategory.textContent = valueOrDash(brand.category);

  // Κουμπί Website
  const websiteUrl = buildWebsiteUrl(brand.website);
  if (websiteUrl !== "") {
    brandWebsiteBtn.href = websiteUrl;
    brandWebsiteBtn.hidden = false;
  } else {
    brandWebsiteBtn.removeAttribute("href");
    brandWebsiteBtn.hidden = true;
  }

  // Κουμπί Τεχνικής Υποστήριξης (τηλέφωνο ή email)
  if (brand.support !== "") {
    const supportHref = buildSupportHref(brand.support);
    const isEmail = supportHref.indexOf("mailto:") === 0;
    brandSupportBtn.textContent = (isEmail ? "✉️ " : "📞 ") + brand.support;

    if (supportHref !== "") {
      brandSupportBtn.href = supportHref;
      brandSupportBtn.classList.remove("is-static");
    } else {
      brandSupportBtn.removeAttribute("href");
      brandSupportBtn.classList.add("is-static");
    }
    brandSupportBtn.hidden = false;
  } else {
    brandSupportBtn.hidden = true;
  }

  brandsListView.hidden = true;
  brandDetailView.hidden = false;

  loadBrandProducts(brand);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Modal ειδήσεων ----------

function openModal(item) {
  lastFocusedElement = document.activeElement;

  modalDate.textContent = formatDate(item.date);
  modalTitle.textContent = item.title;
  modalSummary.textContent = hasRealSummary(item.summary) ? item.summary : NO_SUMMARY_TEXT;

  if (isSafeLink(item.link)) {
    modalSourceBtn.href = item.link;
    modalSourceBtn.hidden = false;
  } else {
    modalSourceBtn.removeAttribute("href");
    modalSourceBtn.hidden = true;
  }

  newsModal.hidden = false;
  document.body.classList.add("modal-open");
  newsModal.querySelector(".modal").scrollTop = 0;
  modalClose.focus();
}

function closeModal() {
  if (newsModal.hidden) return;

  newsModal.hidden = true;
  document.body.classList.remove("modal-open");

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus({ preventScroll: true });
  }
  lastFocusedElement = null;
}

// ---------- Εναλλαγή προβολής (home / news / stories / brands) ----------

function showView(view) {
  currentView = view;
  const isHome = view === "home";
  const isNews = view === "news";
  const isStories = view === "stories";
  const isBrands = view === "brands";

  // Η κλάση "news-view" δείχνει τη μικρή μπάρα αναζήτησης στο header
  // (σε Newsfeed, Stories και Brands δεν υπάρχει η κεντρική μπάρα)
  document.body.classList.toggle("news-view", !isHome);

  newsTab.classList.toggle("active", isNews);
  storiesTab.classList.toggle("active", isStories);
  brandsTab.classList.toggle("active", isBrands);

  hero.hidden = !isHome;
  newsSection.hidden = !isNews;
  storiesSection.hidden = !isStories;
  brandsSection.hidden = !isBrands;

  if (!isHome) {
    resultCard.hidden = true;
    notFoundBox.hidden = true;
    currentProduct = null;
    message.textContent = "";
    message.classList.remove("error");
  }

  if (!isNews) {
    closeModal(); // το modal ανήκει μόνο στο Newsfeed
  }

  syncFeatured();
}

function openNews() {
  pushHistory({ view: "news" }, "#news");
  cancelPendingLoads();
  showView("news");
  loadNews();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openStories() {
  pushHistory({ view: "stories" }, "#stories");
  cancelPendingLoads();
  showView("stories");
  loadStories();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openBrands() {
  pushHistory({ view: "brands" }, "#brands");
  cancelPendingLoads();
  showView("brands");
  showBrandsList(); // πάντα ξεκινάμε από τη λίστα εταιρειών
  loadBrands();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Υλικό της Εβδομάδας ----------

function pickFeatured(products) {
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
  const weekNumber = Math.floor(Date.now() / MS_PER_WEEK);
  return products[weekNumber % products.length];
}

function fillFeatured(product) {
  featuredName.textContent = product.name;
  featuredCategory.textContent = valueOrDash(product.category);
  featuredDescription.textContent = valueOrDash(product.mechanism !== "" ? product.mechanism : product.applications);
}

async function loadFeatured() {
  try {
    const data = await loadDatabase();
    if (data.products.length === 0) return;

    featuredProduct = pickFeatured(data.products);
    fillFeatured(featuredProduct);
    syncFeatured();
  } catch (error) {
    console.error("Σφάλμα φόρτωσης Υλικού της Εβδομάδας:", error);
  }
}

function syncFeatured() {
  const shouldShow =
    currentView === "home" &&
    featuredProduct !== null &&
    resultCard.hidden &&
    notFoundBox.hidden;
  featuredCard.hidden = !shouldShow;
}

function openFeaturedAnalysis() {
  if (!featuredProduct) return;

  searchInput.value = featuredProduct.name;
  compactInput.value = featuredProduct.name;

  handleSearch();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Dropdown ----------

function fillDropdown(infoColumns) {
  interestSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Επιλογή";
  interestSelect.appendChild(placeholder);

  infoColumns.forEach(function (col) {
    const option = document.createElement("option");
    option.value = col.label;
    option.textContent = col.label;
    interestSelect.appendChild(option);
  });

  const stillExists = infoColumns.some(function (col) {
    return col.label === selectedInfo;
  });
  interestSelect.value = stillExists ? selectedInfo : "";
  selectedInfo = interestSelect.value;
}

function updatePersonalInfo() {
  if (!currentProduct) return;

  const selected = interestSelect.value;

  if (selected === "") {
    personalText.textContent = PLACEHOLDER_TEXT;
    personalText.classList.add("is-placeholder");
  } else {
    const text = currentProduct.info[selected];
    personalText.textContent = text || "Δεν υπάρχει διαθέσιμο info για αυτή την επιλογή.";
    personalText.classList.remove("is-placeholder");
  }

  personalText.style.animation = "none";
  void personalText.offsetWidth;
  personalText.style.animation = "";
}

// ---------- Εμφάνιση αποτελεσμάτων ----------

function clearResults() {
  resultCard.hidden = true;
  notFoundBox.hidden = true;
  currentProduct = null;
  message.textContent = "";
  message.classList.remove("error");
  syncFeatured();
}

function showCard(product) {
  currentProduct = product;

  document.getElementById("cardName").textContent = product.name;
  document.getElementById("cardCategory").textContent = valueOrDash(product.category);
  document.getElementById("cardIngredients").textContent = valueOrDash(product.ingredients);
  document.getElementById("cardIncompatibilities").textContent = valueOrDash(product.incompatibilities);
  document.getElementById("cardMechanism").textContent = valueOrDash(product.mechanism);
  document.getElementById("cardApplications").textContent = valueOrDash(product.applications);

  // Price badge: εμφανίζεται μόνο αν υπάρχει τιμή
  if (product.price !== "") {
    cardPrice.textContent = product.price;
    cardPriceBadge.hidden = false;
  } else {
    cardPrice.textContent = "";
    cardPriceBadge.hidden = true;
  }

  updatePersonalInfo();

  resultCard.hidden = false;
  resultCard.style.animation = "none";
  void resultCard.offsetWidth;
  resultCard.style.animation = "";

  syncFeatured();
}

function showNotFound() {
  notFoundBox.hidden = false;
  notFoundBox.style.animation = "none";
  void notFoundBox.offsetWidth;
  notFoundBox.style.animation = "";

  syncFeatured();
}

// ---------- Αναζήτηση ----------

function setSearchDisabled(disabled) {
  searchBtn.disabled = disabled;
  compactBtn.disabled = disabled;
}

async function handleSearch() {
  if (isSearching) return;

  // Αν ο χρήστης ήταν σε Newsfeed, Stories ή Brands, επιστρέφουμε στην προβολή αναζήτησης
  cancelPendingLoads();
  showView("home");

  const query = normalize(searchInput.value);
  clearResults();

  if (query === "") {
    message.textContent = "Γράψε πρώτα ένα υλικό για να ψάξουμε.";
    return;
  }
  pushHistory({ view: "search", query: searchInput.value.trim() }, "#search=" + encodeURIComponent(searchInput.value.trim()));

  isSearching = true;
  setSearchDisabled(true);

  try {
    const data = await loadDatabase();

    const product = data.products.find(function (item) {
      return normalize(item.name) === query;
    });

    if (product) {
      fillDropdown(data.infoColumns);
      showCard(product);
    } else {
      showNotFound();
    }
  } catch (error) {
    console.error("Σφάλμα φόρτωσης:", error);
    message.textContent =
      "Δεν μπόρεσε να φορτωθεί το materials.csv. Άνοιξε το project μέσω Live Server (όχι με διπλό κλικ στο index.html).";
    message.classList.add("error");
  } finally {
    isSearching = false;
    setSearchDisabled(false);
  }
}

function handleCompactSearch() {
  searchInput.value = compactInput.value;
  handleSearch();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Home (κλικ στο logo) ----------

function resetToHome(event) {
  event.preventDefault();
   pushHistory({ view: "home" }, "#home");

  cancelPendingLoads();
  searchInput.value = "";
  compactInput.value = "";
  showView("home");
  clearResults();
  interestSelect.value = "";
  selectedInfo = "";

  window.scrollTo({ top: 0, behavior: "smooth" });
  searchInput.focus({ preventScroll: true });
}

// ---------- Scroll: sticky header state ----------

function updateScrolledState() {
  document.body.classList.toggle("scrolled", window.scrollY > SCROLL_THRESHOLD);
}

// ---------- Events ----------

searchBtn.addEventListener("click", handleSearch);
searchInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") handleSearch();
});

compactBtn.addEventListener("click", handleCompactSearch);
compactInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") handleCompactSearch();
});

searchInput.addEventListener("input", function () {
  compactInput.value = searchInput.value;
});
compactInput.addEventListener("input", function () {
  searchInput.value = compactInput.value;
});

logoLink.addEventListener("click", resetToHome);

// Tabs: Newsfeed, Brands και Stories είναι ενεργά, τα υπόλοιπα ακόμα placeholders
tabs.forEach(function (tab) {
  tab.addEventListener("click", function (event) {
    event.preventDefault();
    if (tab.dataset.view === "news") {
      openNews();
    } else if (tab.dataset.view === "stories") {
      openStories();
    } else if (tab.dataset.view === "brands") {
      openBrands();
    }
  });
});

featuredBtn.addEventListener("click", openFeaturedAnalysis);

interestSelect.addEventListener("change", function () {
  selectedInfo = interestSelect.value;
  updatePersonalInfo();
});

// Brands: φίλτρα, ταξινόμηση, αναζήτηση εταιρείας, επιστροφή στη λίστα
brandOrigin.addEventListener("change", renderBrands);

brandSearch.addEventListener("input", renderBrands);

brandSortBtn.addEventListener("click", function () {
  brandsSortAsc = !brandsSortAsc;
  brandSortBtn.textContent = brandsSortAsc ? "A → Z" : "Z → A";
  renderBrands();
});

brandBackBtn.addEventListener("click", function () {
  pushHistory({ view: "brands" }, "#brands");
  showBrandsList();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Modal: κλείσιμο με το "X"
modalClose.addEventListener("click", closeModal);

// Modal: κλείσιμο με κλικ έξω από το πλαίσιο (στο backdrop)
newsModal.addEventListener("click", function (event) {
  if (event.target === newsModal) closeModal();
});

// Modal: κλείσιμο με το πλήκτρο Escape
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeModal();
});

window.addEventListener("scroll", updateScrolledState, { passive: true });

updateScrolledState();

document.addEventListener("DOMContentLoaded", loadFeatured);
// ===== AUTOCOMPLETE: ΑΡΧΗ =====

function setupAutocomplete() {
  const list = document.getElementById("autocompleteList");
  const box = searchInput.closest(".search-box");
  const MAX_SUGGESTIONS = 8;

  let names = [];        // τα ονόματα υλικών από το materials.csv
  let activeIndex = -1;  // ποια πρόταση είναι επιλεγμένη με τα βελάκια
  let loadId = 0;

  // Ρυθμίσεις προσβασιμότητας (χωρίς να αλλάξεις το <input> στο HTML)
  searchInput.setAttribute("role", "combobox");
  searchInput.setAttribute("aria-autocomplete", "list");
  searchInput.setAttribute("aria-controls", "autocompleteList");
  searchInput.setAttribute("aria-expanded", "false");

  function openList() {
    list.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
  }

  function closeList() {
    list.hidden = true;
    activeIndex = -1;
    searchInput.setAttribute("aria-expanded", "false");
    searchInput.removeAttribute("aria-activedescendant");
  }

  // Φέρνει φρέσκα τα ονόματα από το materials.csv
  async function refreshNames() {
    const id = ++loadId;
    try {
      const data = await loadDatabase();
      if (id !== loadId) return;
      names = Array.from(new Set(data.products.map(function (p) { return p.name; })));
      if (document.activeElement === searchInput) renderSuggestions();
    } catch (error) {
      console.error("Autocomplete: αδυναμία φόρτωσης materials.csv", error);
    }
  }

  // Μία πρόταση, με επισήμανση του κομματιού που ταιριάζει
  function createItem(name, index) {
    const item = document.createElement("li");
    item.className = "autocomplete-item";
    item.id = "autocomplete-option-" + index;
    item.setAttribute("role", "option");
    item.dataset.name = name;

    const typed = collapse(searchInput.value);
    const pos = typed === "" ? -1 : name.toLowerCase().indexOf(typed);

    if (pos !== -1) {
      const mark = document.createElement("mark");
      mark.textContent = name.slice(pos, pos + typed.length);
      item.appendChild(document.createTextNode(name.slice(0, pos)));
      item.appendChild(mark);
      item.appendChild(document.createTextNode(name.slice(pos + typed.length)));
    } else {
      item.textContent = name;
    }

    item.addEventListener("click", function () {
      selectSuggestion(name);
    });

    return item;
  }

  // Φιλτράρει τα ονόματα και ζωγραφίζει τη λίστα
  function renderSuggestions() {
    const query = normalize(searchInput.value);

    if (query === "" || names.length === 0) {
      closeList();
      return;
    }

    const startsWith = [];
    const contains = [];
    names.forEach(function (name) {
      const n = normalize(name);
      if (n.indexOf(query) === 0) startsWith.push(name);
      else if (n.indexOf(query) !== -1) contains.push(name);
    });

    const matches = startsWith.concat(contains).slice(0, MAX_SUGGESTIONS);

    if (matches.length === 0) {
      closeList();
      return;
    }

    list.innerHTML = "";
    activeIndex = -1;
    searchInput.removeAttribute("aria-activedescendant");
    matches.forEach(function (name, index) {
      list.appendChild(createItem(name, index));
    });
    openList();
  }

  // Επιλογή πρότασης: γράφεται στις μπάρες, κλείνει η λίστα, φορτώνει η κάρτα
  function selectSuggestion(name) {
    searchInput.value = name;
    compactInput.value = name;
    closeList();
    handleSearch();
  }

  // Επισήμανση με τα βελάκια
  function setActive(index) {
    const items = list.children;
    if (activeIndex >= 0 && items[activeIndex]) {
      items[activeIndex].classList.remove("is-active");
    }
    activeIndex = index;
    if (items[activeIndex]) {
      items[activeIndex].classList.add("is-active");
      items[activeIndex].scrollIntoView({ block: "nearest" });
      searchInput.setAttribute("aria-activedescendant", items[activeIndex].id);
    }
  }

  // --- Events ---

  // Πληκτρολόγηση: φιλτράρισμα ζωντανά
  searchInput.addEventListener("input", function () {
    if (names.length === 0) refreshNames();
    renderSuggestions();
  });

  // Focus / κλικ μέσα στο input: φρέσκα δεδομένα και εμφάνιση προτάσεων
  searchInput.addEventListener("focus", refreshNames);
  searchInput.addEventListener("click", renderSuggestions);

  // Πληκτρολόγιο (capture στο wrapper, ώστε το Enter σε επιλεγμένη πρόταση
  // να μην τρέξει πρώτα η απλή αναζήτηση με το μισό κείμενο)
  box.addEventListener("keydown", function (event) {
    if (event.target !== searchInput) return;

    if (list.hidden) {
      if (event.key === "ArrowDown") renderSuggestions();
      return;
    }

    const count = list.children.length;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((activeIndex + 1) % count);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(activeIndex <= 0 ? count - 1 : activeIndex - 1);
    } else if (event.key === "Enter") {
      if (activeIndex >= 0) {
        event.preventDefault();
        event.stopPropagation();
        selectSuggestion(list.children[activeIndex].dataset.name);
      } else {
        closeList(); // η κανονική αναζήτηση συνεχίζει κανονικά
      }
    } else if (event.key === "Escape" || event.key === "Tab") {
      closeList();
    }
  }, true);

  // Το πάτημα στη λίστα δεν αφαιρεί το focus από το input
  list.addEventListener("mousedown", function (event) {
    event.preventDefault();
  });

  // Κουμπί "Αναζήτηση": κλείνει η λίστα
  searchBtn.addEventListener("click", closeList);

  // Κλικ οπουδήποτε έξω από τη μπάρα: κλείνει το dropdown
  document.addEventListener("click", function (event) {
    if (!box.contains(event.target)) closeList();
  });
}

setupAutocomplete();

// ===== AUTOCOMPLETE: ΤΕΛΟΣ =====
// ===== HISTORY (κουμπί Πίσω): ΑΡΧΗ =====

// Όταν είναι true, οι συναρτήσεις ΔΕΝ γράφουν νέα εγγραφή στο ιστορικό.
// Το χρειαζόμαστε όταν ο χρήστης πατάει Πίσω, για να μην ξαναγράφουμε ό,τι μόλις διαβάσαμε.
let isRestoringHistory = false;

// Καταγράφει στο ιστορικό τι βλέπει ο χρήστης και αλλάζει το hash του URL
function pushHistory(state, hash) {
  if (isRestoringHistory) return;

  // Αν είμαστε ήδη σε αυτή την προβολή (π.χ. διπλό κλικ στο ίδιο tab),
  // αντικαθιστούμε την εγγραφή αντί να φτιάξουμε διπλότυπο
  const current = location.hash || "#home";
  if (current === hash) {
    history.replaceState(state, "", hash);
  } else {
    history.pushState(state, "", hash);
  }
}

function safeDecode(text) {
  try {
    return decodeURIComponent(text);
  } catch (error) {
    return text;
  }
}

// Διαβάζει το hash του URL και το μετατρέπει σε state
// (χρειάζεται όταν ανοίγεις link με hash ή κάνεις refresh)
function stateFromHash() {
  const hash = location.hash.replace(/^#/, "");

  if (hash === "news" || hash === "stories" || hash === "brands") {
    return { view: hash };
  }
  if (hash.indexOf("search=") === 0) {
    return { view: "search", query: safeDecode(hash.slice("search=".length)) };
  }
  if (hash.indexOf("brand=") === 0) {
    return { view: "brand", brand: safeDecode(hash.slice("brand=".length)) };
  }
  return { view: "home" };
}

// Εμφανίζει την προβολή που περιγράφει ένα state, ΧΩΡΙΣ να γράψει νέα εγγραφή στο ιστορικό
async function restoreView(state) {
  isRestoringHistory = true;

  try {
    switch (state.view) {
      case "news":
        openNews();
        break;

      case "stories":
        openStories();
        break;

      case "brands":
        openBrands();
        break;

      case "brand": {
        // Αναλυτική προβολή εταιρείας: πρώτα φορτώνουμε τη λίστα, μετά ανοίγουμε την εταιρεία
        cancelPendingLoads();
        showView("brands");
        showBrandsList();
        await loadBrands();

        const brand = allBrands.find(function (b) {
          return b.name === state.brand;
        });
        if (brand) openBrandDetail(brand);
        break;
      }

      case "search":
        searchInput.value = state.query || "";
        compactInput.value = state.query || "";
        handleSearch();
        break;

      default: // "home": καθαρή αρχική οθόνη
        cancelPendingLoads();
        searchInput.value = "";
        compactInput.value = "";
        showView("home");
        clearResults();
        window.scrollTo({ top: 0 });
        break;
    }
  } finally {
    isRestoringHistory = false;
  }
}

// Πάτημα του κουμπιού Πίσω / Μπροστά του browser (ή αλλαγή του hash με το χέρι)
window.addEventListener("popstate", function (event) {
  restoreView(event.state || stateFromHash());
});

// Στην πρώτη φόρτωση: δηλώνουμε την τρέχουσα προβολή ως πρώτη εγγραφή του ιστορικού.
// Αν το URL έχει hash (refresh ή κοινοποιημένο link), ανοίγουμε αυτή την προβολή.
(function initHistory() {
  const initial = stateFromHash();
  history.replaceState(initial, "");
  if (initial.view !== "home") restoreView(initial);
})();

// ===== HISTORY: ΤΕΛΟΣ =====