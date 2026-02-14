const flowerForm = document.querySelector("#flower-form");
const nameInput = document.querySelector("#friend-name");
const flowerStage = document.querySelector("#flower-stage");

const lifeForm = document.querySelector("#life-form");
const birthDateInput = document.querySelector("#birth-date");
const birthTimeInput = document.querySelector("#birth-time");
const yearsEl = document.querySelector("#years");
const monthsEl = document.querySelector("#months");
const daysEl = document.querySelector("#days");
const hoursEl = document.querySelector("#hours");
const minutesEl = document.querySelector("#minutes");
const secondsEl = document.querySelector("#seconds");
const totalDaysEl = document.querySelector("#total-days");
const totalSecondsEl = document.querySelector("#total-seconds");

const quoteEl = document.querySelector("#quote");
const quoteBtn = document.querySelector("#quote-btn");
const openSurpriseBtn = document.querySelector("#open-surprise");

const playerFullnameInput = document.querySelector("#player-fullname");
const currentPlayerEl = document.querySelector("#current-player");
const startGameBtn = document.querySelector("#start-game");
const gameArea = document.querySelector("#game-area");
const scoreEl = document.querySelector("#score");
const timeLeftEl = document.querySelector("#time-left");
const bestPlayerEl = document.querySelector("#best-player");
const bestScoreEl = document.querySelector("#best-score");
const playersInitialsEl = document.querySelector("#players-initials");
const leaderboardEl = document.querySelector("#leaderboard");

const localVisitsEl = document.querySelector("#local-visits");
const globalVisitsEl = document.querySelector("#global-visits");

const LEADERBOARD_KEY = "san-valentin-leaderboard-v1";
const GLOBAL_SYNC = {
  // Optional: set your Firebase Realtime Database URL for global visits + ranking.
  // Example: "https://tu-proyecto-default-rtdb.firebaseio.com"
  firebaseDbUrl: "https://jardin-amistad-default-rtdb.firebaseio.com/",
  namespace: "san-valentin-jardin"
};
const LETTER_REGEX = /[\p{L}\p{N}]/u;

const rosePalettes = [
  { a: "#ffb5cf", b: "#ef6ea8" },
  { a: "#ffaac8", b: "#e95a9d" },
  { a: "#ffc1d7", b: "#f07cb1" },
  { a: "#ffb2c3", b: "#e9658f" },
  { a: "#ffc7da", b: "#ee75aa" }
];

const quotes = [
  "La amistad sincera hace la vida mas bonita.",
  "Tu luz hace que cualquier dia sea especial.",
  "Las mejores flores nacen de corazones nobles.",
  "Tu risa vale mas que mil regalos.",
  "Gracias por existir y compartir tu energia.",
  "Hoy celebramos que tu amistad es un tesoro.",
  "Quien tiene una buena amiga, tiene un hogar.",
  "Tu presencia convierte momentos en recuerdos.",
  "Brillas sin competir con nadie.",
  "Tu forma de ser es un regalo para el mundo."
];

let birthDate = null;
let lifeIntervalId = null;

let gameIntervalId = null;
let spawnIntervalId = null;
let gameSeconds = 25;
let score = 0;
let currentPlayerInitials = "--";
let currentPlayerId = "";
let currentPlayerName = "";
let leaderboard = [];

function formatNumber(value) {
  return Number(value).toLocaleString("es-ES");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function isFirebaseSyncEnabled() {
  return /^https:\/\//.test(GLOBAL_SYNC.firebaseDbUrl.trim());
}

function getFirebaseUrl(path) {
  const base = GLOBAL_SYNC.firebaseDbUrl.trim().replace(/\/+$/, "");
  const namespace = GLOBAL_SYNC.namespace.trim().replace(/^\/+|\/+$/g, "");
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  return `${base}/${namespace}/${cleanPath}.json`;
}

async function firebaseGet(path, fallbackValue) {
  try {
    const response = await fetch(getFirebaseUrl(path), { cache: "no-store" });
    if (!response.ok) {
      throw new Error("firebase_get_failed");
    }
    const data = await response.json();
    return data ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
}

async function firebaseSet(path, value) {
  const response = await fetch(getFirebaseUrl(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value)
  });

  if (!response.ok) {
    throw new Error("firebase_set_failed");
  }
}

function addMonths(baseDate, monthsToAdd) {
  const next = new Date(baseDate);
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + monthsToAdd);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

function getPreciseAgeParts(start, end) {
  if (end < start) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalDays: 0,
      totalSeconds: 0
    };
  }

  let cursor = new Date(start);
  let years = 0;

  while (true) {
    const nextYear = addMonths(cursor, 12);
    if (nextYear <= end) {
      years += 1;
      cursor = nextYear;
      continue;
    }
    break;
  }

  let months = 0;
  while (true) {
    const nextMonth = addMonths(cursor, 1);
    if (nextMonth <= end) {
      months += 1;
      cursor = nextMonth;
      continue;
    }
    break;
  }

  let remainingMs = end.getTime() - cursor.getTime();

  const days = Math.floor(remainingMs / 86400000);
  remainingMs -= days * 86400000;

  const hours = Math.floor(remainingMs / 3600000);
  remainingMs -= hours * 3600000;

  const minutes = Math.floor(remainingMs / 60000);
  remainingMs -= minutes * 60000;

  const seconds = Math.floor(remainingMs / 1000);

  const totalMs = end.getTime() - start.getTime();

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    totalDays: Math.floor(totalMs / 86400000),
    totalSeconds: Math.floor(totalMs / 1000)
  };
}

function renderAge() {
  if (!birthDate) return;

  const now = new Date();
  const age = getPreciseAgeParts(birthDate, now);

  yearsEl.textContent = formatNumber(age.years);
  monthsEl.textContent = formatNumber(age.months);
  daysEl.textContent = formatNumber(age.days);
  hoursEl.textContent = formatNumber(age.hours);
  minutesEl.textContent = formatNumber(age.minutes);
  secondsEl.textContent = formatNumber(age.seconds);
  totalDaysEl.textContent = formatNumber(age.totalDays);
  totalSecondsEl.textContent = formatNumber(age.totalSeconds);
}

function createSparkles(container, total) {
  for (let i = 0; i < total; i += 1) {
    const spark = document.createElement("span");
    spark.className = "float-heart";
    spark.textContent = i % 2 === 0 ? "<3" : "*";
    spark.style.left = `${Math.random() * 100}%`;
    spark.style.animationDuration = `${5 + Math.random() * 5}s`;
    spark.style.animationDelay = `${Math.random() * 0.4}s`;
    container.appendChild(spark);
    setTimeout(() => spark.remove(), 9000);
  }
}

function getNameLetters(rawName) {
  return [...rawName.toUpperCase()].filter((char) => LETTER_REGEX.test(char));
}

function getRoseSpread(total) {
  return Math.round(clamp((total - 1) * 46 + 24, 90, 400));
}

function getRowCount(total) {
  const isMobile = window.matchMedia("(max-width: 700px)").matches;

  if (isMobile) {
    if (total <= 5) return 1;
    if (total <= 12) return 2;
    if (total <= 17) return 3;
    return 4;
  }

  if (total <= 8) return 1;
  if (total <= 14) return 2;
  return 3;
}

function buildRowSizes(total) {
  const rowCount = getRowCount(total);
  const base = Math.floor(total / rowCount);
  const extra = total % rowCount;
  const sizes = [];

  for (let i = 0; i < rowCount; i += 1) {
    sizes.push(base + (i < extra ? 1 : 0));
  }

  return sizes;
}

function createRose(letter, placement) {
  const {
    index,
    progress,
    rowIndex,
    rowCount,
    rowSize,
    total,
    maxRowSize
  } = placement;
  const curve = 1 - Math.abs(progress - 0.5) * 2;
  const compactMode = rowCount === 1 && total <= 4;
  const spreadBase = getRoseSpread(maxRowSize);
  const rowInset = rowIndex * 14;
  let spread = Math.max(74, spreadBase - rowInset);
  if (compactMode) {
    if (rowSize === 1) {
      spread = 0;
    } else if (rowSize === 2) {
      spread = 72;
    } else {
      spread = 102 + (rowSize - 3) * 14;
    }
  }
  const densityScale = clamp(1 - Math.max(total - 12, 0) * 0.01, 0.84, 1);
  const rowScale = clamp(densityScale - rowIndex * 0.06, 0.74, 1);

  const jitter = compactMode ? 0 : (index % 2 === 0 ? -1 : 1) * Math.random() * 1.2;
  const x = Math.round((progress - 0.5) * spread + jitter);
  const stem = compactMode
    ? Math.round(88 + curve * 16 + Math.random() * 4)
    : Math.round(104 + curve * 26 - rowIndex * 8 + Math.random() * 6);
  const lift = compactMode
    ? Math.round(60 + curve * 5 + Math.random() * 2)
    : Math.round(86 - rowIndex * 28 + curve * 6 + Math.random() * 3);
  const rot = ((progress - 0.5) * 14 + (Math.random() * 3 - 1.5)).toFixed(2);
  const delay = (index * 0.08 + Math.random() * 0.2).toFixed(2);
  const palette = rosePalettes[index % rosePalettes.length];

  const rose = document.createElement("div");
  rose.className = "rose";
  rose.style.setProperty("--x", `${x}px`);
  rose.style.setProperty("--stem", `${stem}px`);
  rose.style.setProperty("--lift", `${lift}px`);
  rose.style.setProperty("--rot", `${rot}deg`);
  rose.style.setProperty("--scale", rowScale.toFixed(3));
  rose.style.setProperty("--delay", `${delay}s`);
  rose.style.setProperty("--rose-a", palette.a);
  rose.style.setProperty("--rose-b", palette.b);
  // Lower rows must render above upper rows so letters remain visible.
  rose.style.zIndex = String(16 + rowIndex * 10 + Math.round(curve * 3));

  const stemEl = document.createElement("span");
  stemEl.className = "rose-stem";

  const leafLeft = document.createElement("span");
  leafLeft.className = "rose-leaf left";

  const leafRight = document.createElement("span");
  leafRight.className = "rose-leaf right";

  const head = document.createElement("div");
  head.className = "rose-head";

  for (let i = 1; i <= 5; i += 1) {
    const petal = document.createElement("span");
    petal.className = `rose-petal p${i}`;
    head.appendChild(petal);
  }

  const letterEl = document.createElement("span");
  letterEl.className = "rose-letter";
  letterEl.textContent = letter;

  head.appendChild(letterEl);
  rose.append(stemEl, leafLeft, leafRight, head);
  return rose;
}

function createNameFlower(rawName) {
  const cleanName = rawName.trim();

  if (!cleanName) {
    flowerStage.innerHTML = '<p class="muted">Escribe un nombre para crear el ramo.</p>';
    return;
  }

  const letters = getNameLetters(cleanName);
  if (letters.length === 0) {
    flowerStage.innerHTML = '<p class="muted">Usa letras o numeros para formar el ramo.</p>';
    return;
  }

  const totalRoses = Math.min(letters.length, 20);
  const bouquet = document.createElement("div");
  bouquet.className = "bouquet";

  const rowSizes = buildRowSizes(totalRoses);
  const maxRowSize = Math.max(...rowSizes);
  const spread = getRoseSpread(maxRowSize) + (rowSizes.length - 1) * 8;
  const bouquetSpan = spread + 122;
  const backWidth = Math.round(clamp(bouquetSpan + 34, 240, 420));
  const backHeight = Math.round(clamp(130 + totalRoses * 3.1, 128, 194));
  const sideWidth = Math.round(clamp(bouquetSpan * 0.62, 145, 250));
  const sideHeight = Math.round(clamp(170 + totalRoses * 4, 178, 252));
  const sideOffset = Math.round(sideWidth - 26);
  const knotWidth = Math.round(clamp(78 + totalRoses * 2.5, 86, 128));
  const knotHeight = Math.round(clamp(68 + totalRoses * 1.5, 76, 98));
  const ribbonWidth = Math.round(knotWidth + 18);
  const noteWidth = Math.round(clamp(knotWidth + 88, 165, 228));
  const rowCount = rowSizes.length;
  const fieldTop = rowCount === 1
    ? (totalRoses <= 4 ? 76 : 56)
    : rowCount === 2
      ? 36
      : rowCount === 3
        ? 24
        : 12;
  const fieldBottom = rowCount === 1
    ? 108
    : rowCount === 2
      ? 114
      : rowCount === 3
        ? 118
        : 122;

  bouquet.style.setProperty("--wrap-back-width", `${backWidth}px`);
  bouquet.style.setProperty("--wrap-back-height", `${backHeight}px`);
  bouquet.style.setProperty("--wrap-side-width", `${sideWidth}px`);
  bouquet.style.setProperty("--wrap-side-height", `${sideHeight}px`);
  bouquet.style.setProperty("--wrap-side-offset", `${sideOffset}px`);
  bouquet.style.setProperty("--knot-width", `${knotWidth}px`);
  bouquet.style.setProperty("--knot-height", `${knotHeight}px`);
  bouquet.style.setProperty("--ribbon-width", `${ribbonWidth}px`);
  bouquet.style.setProperty("--note-width", `${noteWidth}px`);
  bouquet.style.setProperty("--field-top", `${fieldTop}px`);
  bouquet.style.setProperty("--field-bottom", `${fieldBottom}px`);

  const roseField = document.createElement("div");
  roseField.className = "rose-field";

  let letterCursor = 0;
  for (let rowIndex = 0; rowIndex < rowSizes.length; rowIndex += 1) {
    const rowSize = rowSizes[rowIndex];
    for (let i = 0; i < rowSize; i += 1) {
      const progress = rowSize === 1 ? 0.5 : i / (rowSize - 1);
      const placement = {
        index: letterCursor,
        progress,
        rowIndex,
        rowCount: rowSizes.length,
        rowSize,
        total: totalRoses,
        maxRowSize
      };
      roseField.appendChild(createRose(letters[letterCursor], placement));
      letterCursor += 1;
    }
  }

  const wrapBack = document.createElement("div");
  wrapBack.className = "bouquet-wrap-back";

  const wrapLeft = document.createElement("div");
  wrapLeft.className = "bouquet-wrap-left";

  const wrapRight = document.createElement("div");
  wrapRight.className = "bouquet-wrap-right";

  const knot = document.createElement("div");
  knot.className = "bouquet-knot";

  const ribbon = document.createElement("div");
  ribbon.className = "bouquet-ribbon";

  const note = document.createElement("div");
  note.className = "bouquet-note";
  note.textContent = cleanName;

  bouquet.append(wrapBack, roseField, wrapLeft, wrapRight, knot, ribbon, note);
  flowerStage.replaceChildren(bouquet);
  createSparkles(document.body, 16);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeSpaces(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function getBaseInitials(fullName) {
  const words = normalizeSpaces(fullName).split(" ").filter(Boolean);
  if (words.length < 2) {
    const solo = normalizeText(words[0] || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    return (solo.slice(0, 2) || "").padEnd(2, "X");
  }

  const first = normalizeText(words[0]).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const last = normalizeText(words[words.length - 1]).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `${first[0] || ""}${last[0] || ""}`;
}

function buildPlayerId(fullName) {
  const normalized = normalizeText(normalizeSpaces(fullName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized;
}

function getPlayerIdentity(rawFullName) {
  const fullName = normalizeSpaces(rawFullName);
  const words = fullName.split(" ").filter(Boolean);
  if (words.length < 2) {
    return null;
  }

  const id = buildPlayerId(fullName);
  const initials = getBaseInitials(fullName);
  if (!id || !initials) {
    return null;
  }

  return { id, fullName, initials };
}

function getAliasLetterPool(fullName) {
  const words = normalizeSpaces(fullName).split(" ").filter(Boolean);
  const first = normalizeText(words[0] || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const last = normalizeText(words[words.length - 1] || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `${first.slice(1)}${last.slice(1)}`;
}

function buildAliasMap(entries) {
  const groups = new Map();

  entries.forEach((entry) => {
    const base = getBaseInitials(entry.fullName || "") || "XX";
    if (!groups.has(base)) {
      groups.set(base, []);
    }
    groups.get(base).push(entry);
  });

  const aliasById = new Map();

  groups.forEach((groupEntries, base) => {
    const used = new Set();
    const sorted = [...groupEntries].sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));

    sorted.forEach((entry) => {
      let alias = base;
      if (used.has(alias)) {
        alias = "";
      }

      if (!alias) {
        const pool = getAliasLetterPool(entry.fullName);
        let accum = "";
        for (const ch of pool) {
          accum += ch;
          const candidate = `${base}${accum}`;
          if (!used.has(candidate)) {
            alias = candidate;
            break;
          }
        }
      }

      if (!alias) {
        let suffix = 2;
        while (used.has(`${base}${suffix}`)) {
          suffix += 1;
        }
        alias = `${base}${suffix}`;
      }

      used.add(alias);
      aliasById.set(entry.id, alias);
    });
  });

  return aliasById;
}

function sortLeaderboard(items) {
  return [...items]
    .sort((a, b) => b.score - a.score || a.fullName.localeCompare(b.fullName, "es"))
    .slice(0, 50);
}

function loadLeaderboard() {
  try {
    const saved = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
    if (!Array.isArray(saved)) return [];

    const parsed = saved
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        if (typeof item.id === "string" && typeof item.fullName === "string" && Number.isFinite(item.score)) {
          return {
            id: item.id,
            fullName: normalizeSpaces(item.fullName),
            score: Number(item.score),
            at: Number(item.at) || 0
          };
        }

        if (typeof item.initials === "string" && Number.isFinite(item.score)) {
          // Legacy fallback for previous versions.
          const fallbackName = normalizeSpaces(item.initials.toUpperCase());
          return {
            id: `legacy-${fallbackName}-${Number(item.at) || 0}`,
            fullName: fallbackName,
            score: Number(item.score),
            at: Number(item.at) || 0
          };
        }

        return null;
      })
      .filter(Boolean);

    return sortLeaderboard(parsed);
  } catch {
    return [];
  }
}

function saveLeaderboard() {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
}

function normalizeLeaderboardFromMap(playersMap) {
  if (!playersMap || typeof playersMap !== "object") {
    return [];
  }

  const mapped = Object.entries(playersMap)
    .map(([id, value]) => {
      if (value && typeof value === "object") {
        const fullName = normalizeSpaces(value.fullName || id);
        return {
          id,
          fullName,
          score: Number(value.score) || 0,
          at: Number(value.updatedAt) || 0
        };
      }

      // Legacy fallback when value is just a number.
      return {
        id: `legacy-${id}`,
        fullName: normalizeSpaces(String(id).toUpperCase()),
        score: Number(value) || 0,
        at: 0
      };
    })
    .filter((item) => item.id && item.fullName && item.score >= 0);

  return sortLeaderboard(mapped);
}

function renderLeaderboard() {
  leaderboardEl.innerHTML = "";

  if (leaderboard.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "Sin partidas aun.";
    leaderboardEl.appendChild(empty);
    bestPlayerEl.textContent = "--";
    bestScoreEl.textContent = "0";
    playersInitialsEl.textContent = "--";
    return;
  }

  const aliasById = buildAliasMap(leaderboard);
  const best = leaderboard[0];
  const bestAlias = aliasById.get(best.id) || getBaseInitials(best.fullName) || "--";
  bestPlayerEl.textContent = bestAlias;
  bestScoreEl.textContent = formatNumber(best.score);

  const uniqueAliases = [...new Set(leaderboard.map((item) => aliasById.get(item.id) || "XX"))];
  playersInitialsEl.textContent = uniqueAliases.join(" - ");

  leaderboard.slice(0, 10).forEach((item) => {
    const li = document.createElement("li");
    const alias = aliasById.get(item.id) || getBaseInitials(item.fullName) || "XX";
    li.textContent = `${alias} - ${formatNumber(item.score)} pts`;
    leaderboardEl.appendChild(li);
  });
}

function updateLocalLeaderboard(player, finalScore) {
  const existing = leaderboard.find((item) => item.id === player.id);
  if (existing) {
    if (finalScore > existing.score) {
      existing.score = finalScore;
      existing.at = Date.now();
      existing.fullName = player.fullName;
    }
  } else {
    leaderboard.push({
      id: player.id,
      fullName: player.fullName,
      score: finalScore,
      at: Date.now()
    });
  }

  leaderboard = sortLeaderboard(leaderboard);
  saveLeaderboard();
  renderLeaderboard();
}

async function loadGlobalLeaderboardFirebase() {
  if (!isFirebaseSyncEnabled()) {
    return false;
  }

  const players = await firebaseGet("players", {});
  if (players === null || typeof players !== "object") {
    return false;
  }

  leaderboard = normalizeLeaderboardFromMap(players);
  saveLeaderboard();
  renderLeaderboard();
  return true;
}

async function updateLeaderboard(player, finalScore) {
  if (!isFirebaseSyncEnabled()) {
    updateLocalLeaderboard(player, finalScore);
    return;
  }

  try {
    const key = player.id;
    const current = await firebaseGet(`players/${key}`, null);
    const currentScore = Number(current?.score) || 0;

    if (finalScore > currentScore) {
      await firebaseSet(`players/${key}`, {
        fullName: player.fullName,
        score: finalScore,
        updatedAt: Date.now()
      });
    }

    const loaded = await loadGlobalLeaderboardFirebase();
    if (!loaded) {
      updateLocalLeaderboard(player, finalScore);
    }
  } catch {
    updateLocalLeaderboard(player, finalScore);
  }
}

flowerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createNameFlower(nameInput.value);
});

lifeForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const dateValue = birthDateInput.value;
  const timeValue = birthTimeInput.value || "00:00";

  if (!dateValue) return;

  const candidate = new Date(`${dateValue}T${timeValue}:00`);

  if (Number.isNaN(candidate.getTime())) {
    alert("Fecha u hora invalida.");
    return;
  }

  birthDate = candidate;
  if (lifeIntervalId) {
    clearInterval(lifeIntervalId);
  }

  renderAge();
  lifeIntervalId = setInterval(renderAge, 1000);
});

quoteBtn.addEventListener("click", () => {
  const index = Math.floor(Math.random() * quotes.length);
  quoteEl.textContent = quotes[index];
});

if (openSurpriseBtn) {
  openSurpriseBtn.addEventListener("click", () => {
    window.open("https://proyecto-san-valentin.vercel.app", "_blank", "noopener,noreferrer");
  });
}

function clearHearts() {
  gameArea.querySelectorAll(".catch-heart").forEach((heart) => heart.remove());
}

function spawnHeart() {
  const rect = gameArea.getBoundingClientRect();
  const maxLeft = Math.max(rect.width - 42, 0);
  const maxTop = Math.max(rect.height - 42, 0);

  const heart = document.createElement("button");
  heart.type = "button";
  heart.className = "catch-heart";
  heart.textContent = "<3";
  heart.style.left = `${Math.random() * maxLeft}px`;
  heart.style.top = `${Math.random() * maxTop}px`;

  heart.addEventListener("click", () => {
    score += 1;
    scoreEl.textContent = String(score);
    heart.remove();
  });

  gameArea.appendChild(heart);
  setTimeout(() => heart.remove(), 1050);
}

function spawnHeartWave() {
  const roll = Math.random();
  let total = 1;

  if (roll < 0.48) total = 2;
  if (roll < 0.16) total = 3;

  for (let i = 0; i < total; i += 1) {
    spawnHeart();
  }
}

async function finishGame() {
  clearInterval(gameIntervalId);
  clearInterval(spawnIntervalId);
  clearHearts();

  gameIntervalId = null;
  spawnIntervalId = null;
  startGameBtn.disabled = false;
  startGameBtn.textContent = "Jugar";

  if (currentPlayerId) {
    await updateLeaderboard(
      {
        id: currentPlayerId,
        fullName: currentPlayerName
      },
      score
    );
  }

  quoteEl.textContent = `Juego terminado. ${currentPlayerInitials} hizo ${score} puntos.`;
}

function startGame() {
  if (gameIntervalId || spawnIntervalId) return;

  const fullName = playerFullnameInput.value.trim();
  const identity = getPlayerIdentity(fullName);

  if (!identity) {
    alert("Para jugar, escribe nombre y apellido. Ejemplo: Mariana García");
    playerFullnameInput.focus();
    return;
  }

  currentPlayerId = identity.id;
  currentPlayerName = identity.fullName;
  currentPlayerInitials = identity.initials;
  currentPlayerEl.textContent = currentPlayerInitials;

  score = 0;
  gameSeconds = 25;
  scoreEl.textContent = "0";
  timeLeftEl.textContent = String(gameSeconds);
  startGameBtn.disabled = true;
  startGameBtn.textContent = "Jugando...";

  spawnHeartWave();
  spawnIntervalId = setInterval(spawnHeartWave, 430);

  gameIntervalId = setInterval(() => {
    gameSeconds -= 1;
    timeLeftEl.textContent = String(gameSeconds);

    if (gameSeconds <= 0) {
      void finishGame();
    }
  }, 1000);
}

startGameBtn.addEventListener("click", startGame);

function increaseLocalVisits() {
  const key = "san-valentin-local-visits";
  const current = Number(localStorage.getItem(key) || "0") + 1;
  localStorage.setItem(key, String(current));
  localVisitsEl.textContent = formatNumber(current);
}

function getVisitNamespace() {
  const id = `${window.location.host}${window.location.pathname}`;
  const safe = id.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  return `san-valentin-${safe || "default"}`;
}

async function increaseGlobalVisitsCountApi() {
  const namespace = getVisitNamespace();
  const endpoint = `https://api.countapi.xyz/hit/${namespace}/visits`;

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("request_failed");
    }

    const data = await response.json();
    globalVisitsEl.textContent = formatNumber(data.value || 0);
  } catch (error) {
    globalVisitsEl.textContent = "No disponible";
  }
}

async function increaseGlobalVisitsFirebase() {
  try {
    const current = Number(await firebaseGet("visits", 0)) || 0;
    const next = current + 1;
    await firebaseSet("visits", next);
    globalVisitsEl.textContent = formatNumber(next);
  } catch {
    globalVisitsEl.textContent = "No disponible";
  }
}

async function increaseGlobalVisits() {
  if (isFirebaseSyncEnabled()) {
    await increaseGlobalVisitsFirebase();
    return;
  }

  await increaseGlobalVisitsCountApi();
}

function startFloatingBackground() {
  setInterval(() => {
    const piece = document.createElement("span");
    piece.className = "float-heart";
    piece.textContent = Math.random() > 0.4 ? "<3" : "*";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDuration = `${7 + Math.random() * 7}s`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 15000);
  }, 1400);
}

(function init() {
  const today = new Date();
  birthDateInput.value = today.toISOString().slice(0, 10);
  leaderboard = loadLeaderboard();
  renderLeaderboard();

  if (isFirebaseSyncEnabled()) {
    loadGlobalLeaderboardFirebase();
  }

  increaseLocalVisits();
  increaseGlobalVisits();
  startFloatingBackground();
})();
