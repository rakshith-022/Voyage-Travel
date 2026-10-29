// app.js — Voyago frontend: talks to the Express/SQLite API, renders views,
// and handles auth + booking entirely client-side (no framework, by design).

const API_BASE = "/api";

const state = {
  token: localStorage.getItem("voyago_token") || null,
  user: JSON.parse(localStorage.getItem("voyago_user") || "null"),
  destinations: [],
  categories: [],
  currentDetailId: null,
};

// ---------------------------------------------------------------
// Poster art: every destination gets a CSS-gradient + SVG line-icon
// "poster" instead of a stock photo, so the app never depends on
// external images (and stays visually consistent).
// ---------------------------------------------------------------
const CATEGORY_ICONS = {
  Islands: `<svg viewBox="0 0 120 120" width="120" height="120" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.55">
      <circle cx="86" cy="30" r="14"/>
      <path d="M8 78 Q 26 62, 44 78 T 80 78 T 116 78" />
      <path d="M8 94 Q 26 78, 44 94 T 80 94 T 116 94" />
    </svg>`,
  Nature: `<svg viewBox="0 0 120 120" width="120" height="120" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.55">
      <path d="M10 96 L42 44 L60 70 L74 50 L110 96 Z"/>
      <circle cx="90" cy="26" r="10"/>
    </svg>`,
  Culture: `<svg viewBox="0 0 120 120" width="120" height="120" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.55">
      <path d="M30 100 V56 M46 100 V56 M62 100 V56 M78 100 V56 M94 100 V56"/>
      <path d="M22 56 L60 18 L98 56 Z"/>
      <path d="M18 100 H102"/>
    </svg>`,
  Adventure: `<svg viewBox="0 0 120 120" width="120" height="120" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.55">
      <path d="M14 100 L50 30 L86 100 Z"/>
      <path d="M50 30 L50 12 L66 20 L50 30"/>
    </svg>`,
  City: `<svg viewBox="0 0 120 120" width="120" height="120" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.55">
      <path d="M14 100 V60 H34 V100 M40 100 V40 H62 V100 M68 100 V70 H86 V100 M92 100 V50 H108 V100"/>
    </svg>`,
};

function posterHTML(dest, opts = {}) {
  const hue = ["sunset", "forest", "ice"].includes(dest.image_hue) ? dest.image_hue : "forest";
  const icon = CATEGORY_ICONS[dest.category] || CATEGORY_ICONS.Nature;
  const iconStyle = opts.iconPos || "right:-6px; bottom:-14px;";
  const badges = opts.badges === false ? "" : `
    <div class="poster-tag">${escapeHTML(dest.category)}</div>
    <div class="poster-rating">★ ${dest.rating}</div>
  `;
  return `
    <div class="poster hue-${hue}">
      <div style="position:absolute; ${iconStyle} color:white;">${icon}</div>
      ${badges}
    </div>
  `;
}

// ---------------------------------------------------------------
// API helper
// ---------------------------------------------------------------
async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

// ---------------------------------------------------------------
// Toast
// ---------------------------------------------------------------
let toastTimer;
function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

// ---------------------------------------------------------------
// View routing
// ---------------------------------------------------------------
function switchView(view) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`view-${view}`).classList.add("active");
  document.querySelectorAll(".nav-link").forEach((l) => l.classList.toggle("active", l.dataset.view === view));
  if (view === "dashboard") {
    if (!state.token) {
      openAuth("login");
      switchView("home");
      return;
    }
    loadMyBookings();
  }
}

document.querySelectorAll("[data-view]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    switchView(link.dataset.view);
  });
});

// ---------------------------------------------------------------
// Auth
// ---------------------------------------------------------------
function renderAuthArea() {
  const area = document.getElementById("nav-auth-area");
  if (state.user) {
    const initial = escapeHTML(state.user.name.trim().charAt(0).toUpperCase());
    area.innerHTML = `
      <div class="user-chip">
        <div class="avatar">${initial}</div>
        <span>${escapeHTML(state.user.name.split(" ")[0])}</span>
        <button class="btn btn-ghost" id="logout-btn" style="padding:6px 14px; font-size:0.82rem;">Sign out</button>
      </div>`;
    document.getElementById("logout-btn").addEventListener("click", logout);
  } else {
    area.innerHTML = `<button class="btn btn-primary" id="signin-btn">Sign in</button>`;
    document.getElementById("signin-btn").addEventListener("click", () => openAuth("login"));
  }
}

function openAuth(tab) {
  document.getElementById("auth-overlay").classList.add("open");
  setAuthTab(tab);
}
function closeAuth() {
  document.getElementById("auth-overlay").classList.remove("open");
  document.getElementById("auth-error").classList.remove("show");
}
function setAuthTab(tab) {
  document.querySelectorAll(".auth-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  document.getElementById("login-form").style.display = tab === "login" ? "block" : "none";
  document.getElementById("register-form").style.display = tab === "register" ? "block" : "none";
  document.getElementById("auth-error").classList.remove("show");
}
document.querySelectorAll(".auth-tab").forEach((t) => t.addEventListener("click", () => setAuthTab(t.dataset.tab)));

function showAuthError(msg) {
  const el = document.getElementById("auth-error");
  el.textContent = msg;
  el.classList.add("show");
}

function persistSession(data) {
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem("voyago_token", data.token);
  localStorage.setItem("voyago_user", JSON.stringify(data.user));
  renderAuthArea();
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem("voyago_token");
  localStorage.removeItem("voyago_user");
  renderAuthArea();
  switchView("home");
  toast("Signed out.");
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("login-email").value.trim(),
        password: document.getElementById("login-password").value,
      }),
    });
    persistSession(data);
    closeAuth();
    toast(`Welcome back, ${data.user.name.split(" ")[0]}.`);
  } catch (err) {
    showAuthError(err.message);
  }
});

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("register-name").value.trim(),
        email: document.getElementById("register-email").value.trim(),
        password: document.getElementById("register-password").value,
      }),
    });
    persistSession(data);
    closeAuth();
    toast(`Account created. Welcome, ${data.user.name.split(" ")[0]}.`);
  } catch (err) {
    showAuthError(err.message);
  }
});

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById(btn.dataset.close).classList.remove("open");
  });
});
document.querySelectorAll(".overlay").forEach((ov) => {
  ov.addEventListener("click", (e) => { if (e.target === ov) ov.classList.remove("open"); });
});

// ---------------------------------------------------------------
// Destinations: load, filter, render
// ---------------------------------------------------------------
async function loadCategories() {
  const { categories } = await apiFetch("/destinations/categories");
  state.categories = categories;
  const select = document.getElementById("category-select");
  categories.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = c;
    select.appendChild(opt);
  });
}

function currentFilters() {
  return {
    search: document.getElementById("search-input").value.trim(),
    category: document.getElementById("category-select").value,
    sort: document.getElementById("sort-select").value,
  };
}

let searchDebounce;
async function loadDestinations() {
  const grid = document.getElementById("destination-grid");
  grid.innerHTML = `<div class="empty-state"><span class="loading-dot"></span>Loading destinations…</div>`;

  const { search, category, sort } = currentFilters();
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category && category !== "All") params.set("category", category);
  if (sort) params.set("sort", sort);

  const { destinations } = await apiFetch(`/destinations?${params.toString()}`);
  state.destinations = destinations;
  renderGrid(destinations);

  if (!document.getElementById("hero-card").dataset.filled) {
    renderHeroCard(destinations);
  }
}

function renderGrid(list) {
  const grid = document.getElementById("destination-grid");
  document.getElementById("result-count").textContent = `${list.length} trip${list.length === 1 ? "" : "s"}`;

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state"><h3>No trips match that search</h3><p>Try a different destination, country or category.</p></div>`;
    return;
  }

  grid.innerHTML = list.map((d, i) => {
    const sizeClass = i === 0 ? "featured" : (i % 5 === 2 ? "tall" : "");
    return `
      <article class="card ${sizeClass}" data-id="${d.id}">
        ${posterHTML(d)}
        <div class="card-body">
          <div class="card-country">${escapeHTML(d.country)}</div>
          <h3>${escapeHTML(d.name)}</h3>
          <p class="card-desc">${escapeHTML(truncate(d.description, 96))}</p>
          <div class="card-meta">
            <div class="card-price">₹${formatPrice(d.price_per_person)}<span> / person</span></div>
            <div class="result-count">${d.duration_days} days · ★ ${d.rating}</div>
          </div>
        </div>
      </article>`;
  }).join("");

  grid.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => openDetail(Number(card.dataset.id)));
  });
}

function renderHeroCard(list) {
  if (!list.length) return;
  const d = list.find((x) => x.rating >= 4.8) || list[0];
  const hero = document.getElementById("hero-card");
  hero.dataset.filled = "1";
  hero.innerHTML = `
    <div class="hero-card-top">
      <div>
        <div class="hero-card-eyebrow">Featured this week</div>
        <div class="hero-card-name">${escapeHTML(d.name)}</div>
      </div>
      <div class="hero-card-rating">★ ${d.rating}</div>
    </div>
    <div class="hero-poster">${posterHTML(d, { iconPos: "right:-10px; top:-10px;", badges: false })}</div>
    <div class="hero-card-price">
      <span>From</span>
      <strong>₹${formatPrice(d.price_per_person)}</strong>
    </div>
    <button class="btn btn-gold btn-block" style="margin-top:16px;" id="hero-book-btn">View trip</button>
  `;
  document.getElementById("hero-book-btn").addEventListener("click", () => openDetail(d.id));
}

// ---------------------------------------------------------------
// Destination detail + booking
// ---------------------------------------------------------------
async function openDetail(id) {
  state.currentDetailId = id;
  const overlay = document.getElementById("detail-overlay");
  const content = document.getElementById("detail-modal-content");
  content.innerHTML = `<div class="empty-state"><span class="loading-dot"></span>Loading trip…</div>`;
  overlay.classList.add("open");

  try {
    const { destination: d } = await apiFetch(`/destinations/${id}`);
    renderDetail(d);
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><h3>Couldn't load this trip</h3><p>${escapeHTML(err.message)}</p></div>`;
  }
}

function renderDetail(d) {
  const content = document.getElementById("detail-modal-content");
  const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  content.innerHTML = `
    <div class="detail-poster hue-${d.image_hue}">
      <button class="modal-close" data-close="detail-overlay" style="position:absolute; top:16px; right:16px; background:rgba(255,255,255,0.18); color:white;">✕</button>
      <div style="position:absolute; right:-8px; bottom:-20px; color:white;">${CATEGORY_ICONS[d.category] || ""}</div>
      <div class="detail-poster-country">${escapeHTML(d.country)} · ${escapeHTML(d.category)}</div>
      <div class="detail-poster-name">${escapeHTML(d.name)}</div>
    </div>
    <div class="detail-body">
      <div>
        <p>${escapeHTML(d.description)}</p>
        <h4 style="margin-top:22px; font-size:1.05rem;">Trip highlights</h4>
        <ul class="detail-highlights">
          ${d.highlights.map((h) => `<li><span class="dot"></span>${escapeHTML(h)}</li>`).join("")}
        </ul>
      </div>
      <div class="booking-panel">
        <div class="form-error" id="booking-error"></div>
        <div class="form-group">
          <label for="travel-date">Travel date</label>
          <input type="date" id="travel-date" min="${minDate}" />
        </div>
        <div class="form-group">
          <label for="travelers">Travelers</label>
          <input type="number" id="travelers" min="1" max="12" value="2" />
        </div>
        <div class="price-row"><span>Price per person</span><span>₹${formatPrice(d.price_per_person)}</span></div>
        <div class="price-row"><span>Duration</span><span>${d.duration_days} days</span></div>
        <div class="price-row total"><span>Total</span><span id="total-price">₹${formatPrice(d.price_per_person * 2)}</span></div>
        <button class="btn btn-gold btn-block" style="margin-top:16px;" id="confirm-booking-btn">Confirm booking</button>
      </div>
    </div>
  `;

  content.querySelector("[data-close]").addEventListener("click", () => {
    document.getElementById("detail-overlay").classList.remove("open");
  });

  const travelersInput = content.querySelector("#travelers");
  travelersInput.addEventListener("input", () => {
    const n = Math.max(1, Math.min(12, Number(travelersInput.value) || 1));
    content.querySelector("#total-price").textContent = `₹${formatPrice(d.price_per_person * n)}`;
  });

  content.querySelector("#confirm-booking-btn").addEventListener("click", () => confirmBooking(d));
}

async function confirmBooking(d) {
  const errorEl = document.getElementById("booking-error");
  errorEl.classList.remove("show");

  if (!state.token) {
    document.getElementById("detail-overlay").classList.remove("open");
    openAuth("login");
    toast("Sign in to book this trip.");
    return;
  }

  const travelDate = document.getElementById("travel-date").value;
  const travelers = Number(document.getElementById("travelers").value) || 1;

  if (!travelDate) {
    errorEl.textContent = "Pick a travel date.";
    errorEl.classList.add("show");
    return;
  }

  try {
    await apiFetch("/bookings", {
      method: "POST",
      body: JSON.stringify({ destinationId: d.id, travelDate, travelers }),
    });
    document.getElementById("detail-overlay").classList.remove("open");
    toast(`Trip to ${d.name} booked. Check "My trips".`);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.add("show");
  }
}

// ---------------------------------------------------------------
// Dashboard: my bookings
// ---------------------------------------------------------------
async function loadMyBookings() {
  const list = document.getElementById("bookings-list");
  list.innerHTML = `<div class="empty-state"><span class="loading-dot"></span>Loading your trips…</div>`;
  try {
    const { bookings } = await apiFetch("/bookings/my");
    renderBookings(bookings);
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><h3>Couldn't load your trips</h3><p>${escapeHTML(err.message)}</p></div>`;
  }
}

function renderBookings(bookings) {
  const list = document.getElementById("bookings-list");
  if (bookings.length === 0) {
    list.innerHTML = `<div class="empty-state"><h3>No trips booked yet</h3><p>Head to Explore and find somewhere to go.</p></div>`;
    return;
  }
  list.innerHTML = bookings.map((b) => `
    <div class="booking-row">
      <div class="booking-thumb hue-${b.image_hue}"></div>
      <div class="booking-info">
        <h4>${escapeHTML(b.destination_name)}</h4>
        <p>${escapeHTML(b.country)} · ${formatDate(b.travel_date)} · ${b.travelers} traveler${b.travelers > 1 ? "s" : ""} · ₹${formatPrice(b.total_price)}</p>
        <span class="status-pill status-${b.status}">${b.status}</span>
      </div>
      <div class="booking-actions">
        ${b.status === "confirmed" ? `<button class="btn btn-danger" data-cancel="${b.id}">Cancel</button>` : ""}
      </div>
    </div>
  `).join("");

  list.querySelectorAll("[data-cancel]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Cancel this booking?")) return;
      try {
        await apiFetch(`/bookings/${btn.dataset.cancel}/cancel`, { method: "PATCH" });
        toast("Booking cancelled.");
        loadMyBookings();
      } catch (err) {
        toast(err.message);
      }
    });
  });
}

// ---------------------------------------------------------------
// Filter bar events
// ---------------------------------------------------------------
document.getElementById("search-input").addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(loadDestinations, 300);
});
document.getElementById("category-select").addEventListener("change", loadDestinations);
document.getElementById("sort-select").addEventListener("change", loadDestinations);
document.getElementById("clear-filters").addEventListener("click", () => {
  document.getElementById("search-input").value = "";
  document.getElementById("category-select").value = "All";
  document.getElementById("sort-select").value = "";
  loadDestinations();
});

// ---------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function truncate(str, n) { return str.length > n ? str.slice(0, n - 1).trim() + "…" : str; }
function formatPrice(n) { return Math.round(n).toLocaleString("en-IN"); }
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ---------------------------------------------------------------
// Init
// ---------------------------------------------------------------
(async function init() {
  renderAuthArea();
  try {
    await loadCategories();
    await loadDestinations();
  } catch (err) {
    document.getElementById("destination-grid").innerHTML =
      `<div class="empty-state"><h3>Couldn't reach the server</h3><p>${escapeHTML(err.message)}. Make sure the backend is running on the expected port.</p></div>`;
  }
})();
