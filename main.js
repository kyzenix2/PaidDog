const TICKER = "$PAIDDOG";
const PACK_KEY = "paiddog-pack";

const form = document.querySelector("#pair-form");
const field = document.querySelector("#field");
const input = document.querySelector("#handle");
const errorEl = document.querySelector("#handle-error");
const payeeEl = document.querySelector("#r-payee");
const statusEl = document.querySelector("#r-status");
const noteEl = document.querySelector("#r-note");
const receipt = document.querySelector("#receipt-card");
const stampSmall = document.querySelector("#stamp small");
const copyMeme = document.querySelector("#copy-meme");
const postMeme = document.querySelector("#post-meme");
const packList = document.querySelector("#pack-list");
const toast = document.querySelector("#toast");

let pack = loadPack();
let memeLine = "";
let toastTimer = 0;

renderPack();

document.querySelector(".site-header").classList.toggle("scrolled", window.scrollY > 4);
window.addEventListener("scroll", () => {
  document.querySelector(".site-header").classList.toggle("scrolled", window.scrollY > 4);
}, { passive: true });

document.querySelectorAll("[data-copy-ticker]").forEach((btn) => {
  btn.addEventListener("click", () => copyTicker(btn));
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const handle = normalize(input.value);
  if (!handle) {
    fail("The dog needs a name to put on the stub.");
    return;
  }
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
    fail("Use an X handle: 1–15 letters, numbers, or underscores.");
    return;
  }
  clearError();
  address(handle);
});

input.addEventListener("input", () => {
  clearError();
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.setAttribute("aria-pressed", String(chip.dataset.handle === normalize(input.value)));
  });
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    input.value = chip.dataset.handle;
    form.requestSubmit();
  });
});

copyMeme.addEventListener("click", async () => {
  if (!memeLine) return;
  try {
    await copyText(memeLine);
    showToast("Meme copied");
  } catch {
    showToast("Copy didn’t land. Select the receipt instead.");
  }
});

postMeme.addEventListener("click", () => {
  if (!memeLine) return;
  const url = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(memeLine);
  window.open(url, "_blank", "noopener,noreferrer");
});

function normalize(raw) {
  let value = raw.trim();
  const fromUrl = value.match(/^(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/?(?:[?#].*)?$/i);
  if (fromUrl) return fromUrl[1];
  return value.replace(/^@+/, "");
}

function fail(message) {
  errorEl.textContent = message;
  input.setAttribute("aria-invalid", "true");
  field.classList.remove("shake");
  void field.offsetWidth;
  field.classList.add("shake");
}

function clearError() {
  errorEl.textContent = "";
  input.removeAttribute("aria-invalid");
  field.classList.remove("shake");
}

function address(handle) {
  const at = "@" + handle;
  payeeEl.textContent = at;
  statusEl.textContent = "ADDRESSED";
  statusEl.classList.add("is-addressed");
  noteEl.textContent = "This stub names " + at + " as the payee of a $PAIDDOG meme. No dollars moved.";
  stampSmall.textContent = stampWord(handle);
  receipt.classList.add("is-paid");
  payeeEl.classList.remove("flash");
  void payeeEl.offsetWidth;
  payeeEl.classList.add("flash");
  memeLine = at + ", the dog addressed your meme paycheck. $PAIDDOG — sit, stay, get paid. A meme of @UsePaid. https://x.com/UsePaid";
  copyMeme.disabled = false;
  postMeme.disabled = false;
  input.value = handle;
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.setAttribute("aria-pressed", String(chip.dataset.handle.toLowerCase() === handle.toLowerCase()));
  });
  remember(handle);
}

function stampWord(handle) {
  const name = handle.toLowerCase();
  if (name === "paiddog") return "THAT'S ME";
  if (name === "usepaid" || name === "paid") return "THE RAIL";
  if (name === "goodboy") return "BEST BOY";
  return "GOOD BOY";
}

function remember(handle) {
  const now = Date.now();
  pack = pack.filter((item) => item.handle.toLowerCase() !== handle.toLowerCase());
  pack.unshift({ handle, at: now });
  pack = pack.slice(0, 6);
  try {
    sessionStorage.setItem(PACK_KEY, JSON.stringify(pack));
  } catch {
    /* private mode can refuse storage; the list still renders */
  }
  renderPack();
}

function loadPack() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(PACK_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) => item && typeof item.handle === "string").slice(0, 6);
  } catch {
    return [];
  }
}

function renderPack() {
  packList.replaceChildren();
  if (!pack.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "None yet. The dog is sitting.";
    packList.appendChild(empty);
    return;
  }
  pack.forEach((item) => {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = "@" + item.handle;
    const time = document.createElement("time");
    time.dateTime = new Date(item.at).toISOString();
    time.textContent = new Date(item.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    li.append(name, time);
    packList.appendChild(li);
  });
}

async function copyTicker(btn) {
  try {
    await copyText(TICKER);
    const label = btn.querySelector(".btn-label");
    if (label) {
      label.textContent = "Copied";
      btn.classList.add("is-copied");
      window.setTimeout(() => {
        label.textContent = TICKER;
        btn.classList.remove("is-copied");
      }, 1400);
    }
    showToast("Ticker copied");
  } catch {
    showToast("Copy didn’t land");
  }
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    ok ? resolve() : reject(new Error("copy failed"));
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1600);
}
