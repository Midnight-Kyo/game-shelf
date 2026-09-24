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
  return shelf[title] || { liked: false, note: "", author: "" };
}

function writer() {
  return localStorage.getItem("shelf-writer") === "wahab" ? "wahab" : "her";
}

function authorName(author) {
  return author === "wahab" ? "Wahab" : "Nicole";
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
  fromHerEl.innerHTML = `<p><strong>From Nicole.</strong> ${items.map((game) => {
    const entry = entryFor(game.title);
    const mark = entry.liked ? "♥ " : "";
    const note = entry.note ? ` <span class="from-note">${escapeHtml(authorName(entry.author || "her"))}: ${escapeHtml(entry.note)}</span>` : "";
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
    note: patch.note ?? current.note,
    author: patch.author ?? current.author
  };
  if (next.note && next.author !== "wahab") next.author = "her";
  if (!next.note) next.author = "";
  if (!next.liked && !next.note) delete shelf[id];
  else shelf[id] = next;
  renderFromHer();
  const response = await fetch("/api/shelf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, liked: !!next.liked, note: next.note || "", author: next.author || "her" })
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
    <button type="button" role="tab" data-tag="${id}" aria-selected="${id === activeFilter}">${label}</button>
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
            <div class="note-label">
              <span class="sr">Note on ${title}</span>
              <div class="who" role="group" aria-label="Who is writing">
                <button type="button" data-who="her" aria-pressed="${(entry.note ? entry.author !== "wahab" : writer() !== "wahab")}">Nicole</button>
                <button type="button" data-who="wahab" aria-pressed="${(entry.note ? entry.author === "wahab" : writer() === "wahab")}">Wahab</button>
              </div>
              <textarea class="note" rows="2" maxlength="500" placeholder="Leave a note" data-id="${title}">${escapeHtml(entry.note || "")}</textarea>
            </div>
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
  const who = event.target.closest("[data-who]");
  if (who) {
    event.stopPropagation();
    const id = who.closest(".card")?.querySelector(".note")?.dataset.id;
    localStorage.setItem("shelf-writer", who.dataset.who);
    who.parentElement.querySelectorAll("[data-who]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button === who));
    });
    if (id && entryFor(id).note && entryFor(id).author !== who.dataset.who) {
      try {
        await saveShelf(id, { author: who.dataset.who });
      } catch {
        render();
      }
    }
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
  const author = note.parentElement.querySelector('[data-who][aria-pressed="true"]')?.dataset.who || writer();
  if (text === (entryFor(id).note || "") && (!text || author === (entryFor(id).author || "her"))) return;
  try {
    await saveShelf(id, { note: text, author });
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

function drawHeart(context, x, y, size) {
  context.save();
  context.translate(x, y);
  context.scale(size, size);
  context.beginPath();
  context.moveTo(0, 0.3);
  context.bezierCurveTo(-0.05, -0.25, -1.05, -0.2, -1, 0.35);
  context.bezierCurveTo(-0.95, 0.9, -0.15, 1.15, 0, 1.6);
  context.bezierCurveTo(0.15, 1.15, 0.95, 0.9, 1, 0.35);
  context.bezierCurveTo(1.05, -0.2, 0.05, -0.25, 0, 0.3);
  context.fillStyle = "rgba(255, 186, 206, 0.96)";
  context.shadowColor = "rgba(255, 120, 160, 0.85)";
  context.shadowBlur = 18;
  context.fill();
  context.restore();
}

function startSky() {
  const canvas = document.querySelector("#sky");
  if (!canvas) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const context = canvas.getContext("2d");
  const stars = Array.from({ length: 64 }, () => ({
    x: Math.random(),
    y: 0.18 + Math.random() * 0.64,
    r: Math.random() < 0.1 ? 1.5 + Math.random() * 0.8 : 0.35 + Math.random() * 0.85,
    v: 0.012 + Math.random() * 0.028,
    tw: Math.random() * Math.PI * 2
  }));

  function frame(time) {
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (!cssW || !cssH) {
      requestAnimationFrame(frame);
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(cssW * dpr);
    const height = Math.round(cssH * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, cssW, cssH);

    const title = document.querySelector(".title-line h1");
    const origin = title
      ? Math.max(0, title.getBoundingClientRect().right - canvas.getBoundingClientRect().left)
      : cssW * 0.42;
    const start = Math.min(0.62, Math.max(0.12, (origin - 28) / cssW));
    const drift = reduced ? 0 : Math.sin(time / 4200) * 0.015;
    const blueAt = Math.min(0.72, start + 0.08 + drift);
    const midAt = Math.min(0.84, blueAt + 0.16);
    const pinkAt = Math.min(0.94, midAt + 0.08);
    const wash = context.createLinearGradient(0, 0, cssW, 0);
    wash.addColorStop(0, "rgba(80, 140, 255, 0)");
    wash.addColorStop(Math.max(0.02, start - 0.05), "rgba(80, 140, 255, 0)");
    wash.addColorStop(blueAt, "rgba(90, 155, 255, 0.72)");
    wash.addColorStop(midAt, "rgba(160, 100, 220, 0.5)");
    wash.addColorStop(pinkAt, "rgba(235, 105, 170, 0.68)");
    wash.addColorStop(1, "rgba(255, 140, 175, 0.12)");
    context.fillStyle = wash;
    context.fillRect(0, 0, cssW, cssH);

    const blue = context.createRadialGradient(origin + 40, cssH * 0.5, 0, origin + 40, cssH * 0.5, cssH * 1.8);
    blue.addColorStop(0, "rgba(110, 170, 255, 0.55)");
    blue.addColorStop(1, "rgba(110, 170, 255, 0)");
    context.fillStyle = blue;
    context.fillRect(0, 0, cssW, cssH);

    const pink = context.createRadialGradient(cssW * 0.86, cssH * 0.48, 0, cssW * 0.86, cssH * 0.48, cssH * 1.6);
    pink.addColorStop(0, "rgba(255, 120, 170, 0.5)");
    pink.addColorStop(1, "rgba(255, 120, 170, 0)");
    context.fillStyle = pink;
    context.fillRect(0, 0, cssW, cssH);

    for (let band = 0; band < 3; band += 1) {
      context.beginPath();
      const amp = cssH * (0.1 + band * 0.035);
      const yBase = cssH * (0.32 + band * 0.14);
      const speed = reduced ? 0 : time / (1600 + band * 520);
      for (let x = 0; x <= cssW; x += 3) {
        const y = yBase + Math.sin(x / (70 + band * 18) + speed + band) * amp * 0.45
          + Math.sin(x / 140 + speed * 0.6) * amp * 0.25;
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.strokeStyle = band === 2 ? "rgba(255, 170, 196, 0.45)" : "rgba(150, 190, 255, 0.32)";
      context.lineWidth = 1.4 + band * 0.7;
      context.stroke();
    }

    stars.forEach((star) => {
      if (!reduced) {
        star.x += star.v * 0.0035;
        if (star.x > 1.03) star.x = -0.03;
      }
      const x = star.x * cssW;
      if (x < origin - 8) return;
      const twinkle = reduced ? 0.7 : 0.45 + Math.sin(time / 650 + star.tw) * 0.4;
      const color = star.x > 0.58 ? "255, 190, 210" : "196, 220, 255";
      context.fillStyle = `rgba(${color}, ${twinkle})`;
      context.beginPath();
      context.arc(x, star.y * cssH, star.r, 0, Math.PI * 2);
      context.fill();
    });

    const pulse = reduced ? 1 : 1 + Math.sin(time / 900) * 0.08;
    const heartX = cssW * (0.84 + (reduced ? 0 : Math.sin(time / 2800) * 0.025));
    const heartY = cssH * (0.42 + (reduced ? 0 : Math.cos(time / 3200) * 0.05));
    drawHeart(context, heartX, heartY, Math.max(6, cssH * 0.16) * pulse);

    if (!reduced) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

renderIntro();
renderHours();
renderFilters();
render();
loadShelf();
startSky();
