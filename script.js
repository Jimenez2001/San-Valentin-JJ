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
let gameSeconds = 20;
let score = 0;
let currentPlayerInitials = "--";
let leaderboard = [];

function formatNumber(value) {
  return Number(value).toLocaleString("es-ES");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  const fieldTop = rowSizes.length === 1
    ? (totalRoses <= 4 ? 76 : 56)
    : rowSizes.length === 2
      ? 36
      : 24;
  const fieldBottom = rowSizes.length === 1 ? 108 : 114;

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

function getInitials(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return "";

  const first = [...parts[0]][0] || "";
  const last = [...parts[parts.length - 1]][0] || "";
  return `${first}${last}`.toUpperCase();
}

function loadLeaderboard() {
  try {
    const saved = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
    if (!Array.isArray(saved)) return [];

    return saved
      .filter((item) => item && typeof item.initials === "string" && Number.isFinite(item.score))
      .map((item) => ({ initials: item.initials, score: Number(item.score), at: Number(item.at) || 0 }));
  } catch {
    return [];
  }
}

function saveLeaderboard() {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
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

  const best = leaderboard[0];
  bestPlayerEl.textContent = best.initials;
  bestScoreEl.textContent = formatNumber(best.score);

  const uniqueInitials = [...new Set(leaderboard.map((item) => item.initials))];
  playersInitialsEl.textContent = uniqueInitials.join(" - ");

  leaderboard.slice(0, 10).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.initials} - ${formatNumber(item.score)} pts`;
    leaderboardEl.appendChild(li);
  });
}

function updateLeaderboard(initials, finalScore) {
  leaderboard.push({ initials, score: finalScore, at: Date.now() });
  leaderboard.sort((a, b) => b.score - a.score || a.at - b.at);
  leaderboard = leaderboard.slice(0, 50);
  saveLeaderboard();
  renderLeaderboard();
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
  setTimeout(() => heart.remove(), 1400);
}

function finishGame() {
  clearInterval(gameIntervalId);
  clearInterval(spawnIntervalId);
  clearHearts();

  gameIntervalId = null;
  spawnIntervalId = null;
  startGameBtn.disabled = false;
  startGameBtn.textContent = "Jugar";

  if (currentPlayerInitials !== "--") {
    updateLeaderboard(currentPlayerInitials, score);
  }

  quoteEl.textContent = `Juego terminado. ${currentPlayerInitials} hizo ${score} puntos.`;
}

function startGame() {
  if (gameIntervalId || spawnIntervalId) return;

  const fullName = playerFullnameInput.value.trim();
  const initials = getInitials(fullName);

  if (!initials) {
    alert("Para jugar, escribe nombre y apellido. Ejemplo: Mariana García");
    playerFullnameInput.focus();
    return;
  }

  currentPlayerInitials = initials;
  currentPlayerEl.textContent = currentPlayerInitials;

  score = 0;
  gameSeconds = 20;
  scoreEl.textContent = "0";
  timeLeftEl.textContent = String(gameSeconds);
  startGameBtn.disabled = true;
  startGameBtn.textContent = "Jugando...";

  spawnHeart();
  spawnIntervalId = setInterval(spawnHeart, 650);

  gameIntervalId = setInterval(() => {
    gameSeconds -= 1;
    timeLeftEl.textContent = String(gameSeconds);

    if (gameSeconds <= 0) {
      finishGame();
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

async function increaseGlobalVisits() {
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
  increaseLocalVisits();
  increaseGlobalVisits();
  startFloatingBackground();
})();
