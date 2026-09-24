const { get, put } = require("@vercel/blob");

const PATH = "shelf.json";

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

async function readShelf() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return {};
  const result = await get(PATH, { access: "private", useCache: false });
  if (!result || result.statusCode === 304 || !result.stream) return {};
  const text = await new Response(result.stream).text();
  if (!text) return {};
  const data = JSON.parse(text);
  return data && typeof data === "object" && !Array.isArray(data) ? data : {};
}

async function writeShelf(shelf) {
  await put(PATH, JSON.stringify(shelf), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json"
  });
}

function cleanEntry(value) {
  const liked = !!value?.liked;
  const note = String(value?.note || "").trim().slice(0, 500);
  if (!liked && !note) return null;
  const entry = { liked, note };
  if (note) entry.author = value?.author === "wahab" ? "wahab" : "her";
  return entry;
}

module.exports = async function shelf(req, res) {
  try {
    if (req.method === "GET") {
      res.status(200).json(await readShelf());
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      res.status(503).json({ error: "Shelf storage is not ready yet" });
      return;
    }
    const body = await readBody(req);
    const id = String(body.id || "").trim();
    if (!id || id.length > 200) {
      res.status(400).json({ error: "Missing game" });
      return;
    }
    const shelfData = await readShelf();
    const entry = cleanEntry({ liked: body.liked, note: body.note, author: body.author });
    if (entry) shelfData[id] = entry;
    else delete shelfData[id];
    await writeShelf(shelfData);
    res.status(200).json(shelfData);
  } catch {
    res.status(500).json({ error: "Could not save the shelf" });
  }
};
