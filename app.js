const grid = document.querySelector("#grid");
const filtersEl = document.querySelector("#filters");
const searchEl = document.querySelector("#search");
const sortEl = document.querySelector("#sort");
const emptyEl = document.querySelector("#empty");
const introEl = document.querySelector("#intro");
const hoursPanel = document.querySelector("#hours-panel");
const fromHerEl = document.querySelector("#from-her");

const FILTERS = [
  ["all", "All"],
  ["together", "We can play together"],
  ["heart", "Your hearts"],
  ["story", "Story"],
  ["relaxing", "Relaxing"],
  ["funny", "Funny"],
  ["puzzles", "Puzzles"],
  ["exploring", "Exploring"],
  ["building", "Building"],
  ["strategy", "Strategy"],
  ["action", "Action"],
  ["scary", "Scary"],
  ["liked", "Liked"],
  ["noted", "Has a note"]
];

const HEART = new Set([
  "It Takes Two", "Split Fiction", "Unravel Two", "Stardew Valley", "Ori and the Will of the Wisps",
  "Dispatch", "Marvel’s Spider-Man Remastered", "Hogwarts Legacy", "Baldur's Gate 3", "Little Inferno",
  "Hi-Fi RUSH", "Spiritfarer"
]);

const RELAXING = new Set([
  "Stardew Valley", "Ori and the Will of the Wisps", "Little Inferno", "No Man's Sky", "theHunter: Call of the Wild™",
  "Wallpaper Engine", "Unravel Two", "Dorfromantik", "PowerWash"
]);

const FUNNY = new Set([
  "Lethal Company", "Content Warning", "R.E.P.O.", "Dale & Dawson Stationery Supplies", "Among Us",
  "Chained Together", "Brotato", "My Friend Pedro", "South Park™: The Stick of Truth™",
  "South Park™: The Fractured But Whole™", "Crab Game", "MECCHA CHAMELEON", "PEAK", "Clone Drone in the Danger Zone",
  "People Playground", "FRUKT", "Garry's Mod", "Dispatch", "HELLDIVERS™ 2"
]);

const PUZZLES = new Set([
  "Balatro", "Little Inferno", "Unravel Two", "The Witness", "Baba Is You", "Portal"
]);

const EXPLORING = new Set([
  "No Man's Sky", "Subnautica", "Subnautica 2", "Hogwarts Legacy", "ELDEN RING", "Marvel’s Spider-Man Remastered",
  "The Forest", "Sons Of The Forest", "Sea of Thieves: 2026 Edition", "Half-Life: Alyx", "Into the Radius 2",
  "Just Cause 2", "Just Cause 4 Reloaded", "Just Cause™ 3", "Noita"
]);

let activeFilter = "all";
let query = "";
let sort = "most";
let shelf = {};

function hoursLabel(hours) {
  if (hours === null) return "—";
  return `${Number.isInteger(hours) ? hours : hours} h`;
}

function sortHours(hours) {
  return hours === null ? -1 : hours;
}

function coverUrl(appId) {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;
}

function coverMarkup(game) {
  const src = game.cover || (game.steamAppId ? coverUrl(game.steamAppId) : "");
  if (!src) return "";
  const step = game.cover ? "data-step=\"header\"" : "";
  return `<img class="cover" alt="" src="${src}" data-app="${game.steamAppId || ""}" ${step}>`;
}

function moodsOf(game) {
  const moods = new Set();
  const tags = game.tags;
  if ((tags.includes("Co-op") || tags.includes("Party")) && game.title !== "Soundpad") moods.add("together");
  if (tags.includes("Story") || tags.includes("RPG")) moods.add("story");
  if (tags.includes("Horror")) moods.add("scary");
  if (tags.includes("Strategy") || tags.includes("RTS")) moods.add("strategy");
  if (tags.includes("Action") || tags.includes("FPS") || tags.includes("Fighting")) moods.add("action");
  if (tags.includes("Sim") || tags.includes("Sandbox") || tags.includes("Card")) moods.add("building");
  if (tags.includes("Survival") || tags.includes("VR")) moods.add("exploring");
  if (tags.includes("Card")) moods.add("puzzles");
  if (HEART.has(game.title)) moods.add("heart");
  if (RELAXING.has(game.title)) moods.add("relaxing");
  if (FUNNY.has(game.title)) moods.add("funny");
  if (PUZZLES.has(game.title)) moods.add("puzzles");
  if (EXPLORING.has(game.title)) moods.add("exploring");
  if (["Factorio", "Bloons TD 6", "Oxygen Not Included", "RimWorld", "Terraria", "tModLoader", "The Riftbreaker", "Kerbal Space Program"].includes(game.title)) moods.add("building");
  return [...moods];
}

GAMES.forEach((game) => {
  game.moods = moodsOf(game);
});

function formatCount(value) {
  return Math.round(value).toLocaleString("en-US");
}

function renderIntro() {
  const hours = GAMES.reduce((sum, game) => sum + (game.hours || 0), 0);
  const together = GAMES.filter((game) => game.moods.includes("together")).length;
  const unstarted = GAMES.filter((game) => game.hours === null || game.hours === 0).length;
  introEl.innerHTML = `<strong>${GAMES.length} games</strong> and roughly <strong>${formatCount(hours)} hours</strong> of play. ${together} of them we could play together, and ${unstarted} I haven't even started.`;
}

function renderHours() {
  const top = GAMES.slice().sort((a, b) => sortHours(b.hours) - sortHours(a.hours)).slice(0, 6);
  const max = sortHours(top[0].hours) || 1;
  hoursPanel.innerHTML = `
    <h2>Where most of my hours went</h2>
    <ol>
      ${top.map((game) => `
        <li>
          <span class="hour-name">${escapeHtml(game.title)}</span>
          <span class="hour-value">${hoursLabel(game.hours)}</span>
          <span class="hour-bar" style="--fill:${Math.round((sortHours(game.hours) / max) * 100)}%"></span>
        </li>`).join("")}
    </ol>`;
}

function entryFor(title) {
  return shelf[title] || { liked: false, note: "" };
}

function renderFromHer() {
  const items = GAMES.filter((game) => {
    const entry = shelf[game.title];
    return entry && (entry.liked || entry.note);
  });
  if (!items.length) {
    fromHerEl.hidden = true;
    fromHerEl.innerHTML = "";
    return;
  }
  fromHerEl.hidden = false;
  fromHerEl.innerHTML = `<p><strong>From her.</strong> ${items.map((game) => {
    const entry = entryFor(game.title);
    const mark = entry.liked ? "♥ " : "";
    const note = entry.note ? ` <span class="from-note">${escapeHtml(entry.note)}</span>` : "";
    return `<button type="button" data-jump="${escapeHtml(game.title)}">${mark}${escapeHtml(game.title)}</button>${note}`;
  }).join('<span class="dot"> · </span>')}</p>`;
}

async function loadShelf() {
  try {
    const response = await fetch("/api/shelf");
    if (!response.ok) return;
    const data = await response.json();
    if (data && typeof data === "object") shelf = data;
  } catch {
    shelf = {};
  }
  renderFromHer();
  render();
}

async function saveShelf(id, patch) {
  const previous = shelf[id] ? { ...shelf[id] } : null;
  const current = entryFor(id);
  const next = {
    liked: patch.liked ?? current.liked,
    note: patch.note ?? current.note
  };
  if (!next.liked && !next.note) delete shelf[id];
  else shelf[id] = next;
  renderFromHer();
  const response = await fetch("/api/shelf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, liked: !!next.liked, note: next.note || "" })
  });
  if (!response.ok) {
    if (previous) shelf[id] = previous;
    else delete shelf[id];
    renderFromHer();
    throw new Error("Could not save");
  }
}

function renderFilters() {
  filtersEl.innerHTML = FILTERS.map(([id, label]) => `
    <button type="button" role="tab" data-tag="${id}" aria-selected="${id === activeFilter}">${id === "heart" ? "♥ " : ""}${label}</button>
  `).join("");
}

function moodLabel(id) {
  return FILTERS.find(([key]) => key === id)?.[1] || id;
}

function render() {
  const needle = query.trim().toLowerCase();
  const shown = GAMES
    .filter((game) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "liked") return !!entryFor(game.title).liked;
      if (activeFilter === "noted") return !!entryFor(game.title).note;
      return game.moods.includes(activeFilter);
    })
    .filter((game) => !needle || `${game.title} ${game.blurb} ${game.moods.join(" ")}`.toLowerCase().includes(needle))
    .slice()
    .sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title);
      const diff = sortHours(a.hours) - sortHours(b.hours);
      return sort === "least" ? diff : -diff;
    });

  emptyEl.hidden = shown.length > 0;
  grid.innerHTML = shown.map((game) => {
    const tone = game.tags[0] || "Action";
    const labels = game.moods.slice(0, 2).map(moodLabel);
    const entry = entryFor(game.title);
    const title = escapeHtml(game.title);
    return `
      <li>
        <article class="card${game.steamAppId || game.cover ? "" : " missing"}" tabindex="0" style="--tone:${toneColor(tone)}">
          ${coverMarkup(game)}
          <button type="button" class="heart${entry.liked ? " on" : ""}" data-id="${title}" aria-pressed="${entry.liked}" aria-label="Like ${title}">♥</button>
          <div class="fallback" aria-hidden="true"><span class="motif ${tone.toLowerCase().replace("-", "")}"></span></div>
          <div class="meta">
            <h2 class="name">${title}</h2>
            <p class="hours">${hoursLabel(game.hours)}</p>
            <div class="tags">${labels.map((label) => `<span class="tag">${escapeHtml(label)}</span>`).join("")}</div>
          </div>
          <div class="detail">
            <h2 class="name">${title}</h2>
            <p class="hours">${hoursLabel(game.hours)}</p>
            <p class="blurb">${escapeHtml(game.blurb)}</p>
            <div class="tags">${labels.map((label) => `<span class="tag">${escapeHtml(label)}</span>`).join("")}</div>
            <label class="note-label">
              <span class="sr">Note on ${title}</span>
              <textarea class="note" rows="2" maxlength="500" placeholder="Leave a note" data-id="${title}">${escapeHtml(entry.note || "")}</textarea>
            </label>
          </div>
        </article>
      </li>`;
  }).join("");
}

function toneColor(tag) {
  const colors = {
    RTS: "#3d6ea8", FPS: "#8a4a3a", RPG: "#6a4ea3", "Co-op": "#2f7a62", Strategy: "#3f6d4e",
    Horror: "#6d3048", VR: "#3a5f8a", Action: "#8a5a32", Survival: "#4e6840", Sim: "#3d6b78",
    Story: "#6a5278", Sandbox: "#6a6238", Card: "#7a3f55", Fighting: "#8a3d3d", Party: "#3f6a8a"
  };
  return colors[tag] || "#3d4f6a";
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

filtersEl.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-tag]");
  if (!button) return;
  activeFilter = button.dataset.tag;
  renderFilters();
  render();
});

searchEl.addEventListener("input", () => {
  query = searchEl.value;
  render();
});

sortEl.addEventListener("change", () => {
  sort = sortEl.value;
  render();
});

document.addEventListener("error", (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.dataset.app) return;
  if (image.dataset.step === "header") {
    image.closest(".card")?.classList.add("missing");
    return;
  }
  image.dataset.step = "header";
  image.src = `https://cdn.akamai.steamstatic.com/steam/apps/${image.dataset.app}/header.jpg`;
}, true);

grid.addEventListener("click", async (event) => {
  const heart = event.target.closest(".heart");
  if (heart) {
    event.stopPropagation();
    const id = heart.dataset.id;
    const liked = !entryFor(id).liked;
    heart.classList.toggle("on", liked);
    heart.setAttribute("aria-pressed", String(liked));
    try {
      await saveShelf(id, { liked });
    } catch {
      heart.classList.toggle("on", !liked);
      heart.setAttribute("aria-pressed", String(!liked));
    }
    if (activeFilter === "liked" || activeFilter === "noted") render();
    return;
  }
  if (event.target.closest(".note, .note-label")) return;
  const card = event.target.closest(".card");
  if (!card) return;
  const open = card.classList.contains("open");
  grid.querySelectorAll(".card.open").forEach((item) => item.classList.remove("open"));
  if (!open) card.classList.add("open");
});

grid.addEventListener("focusout", async (event) => {
  const note = event.target.closest?.(".note");
  if (!note) return;
  const id = note.dataset.id;
  const text = note.value.trim();
  if (text === (entryFor(id).note || "")) return;
  try {
    await saveShelf(id, { note: text });
  } catch {
    note.value = entryFor(id).note || "";
  }
  if (activeFilter === "noted" || activeFilter === "liked") render();
});

grid.addEventListener("mouseout", (event) => {
  const card = event.target.closest?.(".card");
  if (!card || card.contains(event.relatedTarget)) return;
  if (card.contains(document.activeElement)) return;
  card.classList.remove("open");
});

document.addEventListener("click", (event) => {
  const jump = event.target.closest("[data-jump]");
  if (jump) {
    searchEl.value = jump.dataset.jump;
    query = jump.dataset.jump;
    activeFilter = "all";
    renderFilters();
    render();
    return;
  }
  if (event.target.closest(".card")) return;
  grid.querySelectorAll(".card.open").forEach((item) => item.classList.remove("open"));
});

renderIntro();
renderHours();
renderFilters();
render();
loadShelf();
