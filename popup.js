// popup.js — Pentest URL Opener
// All event wiring done here via addEventListener (required by MV3 CSP).
// Opens tabs directly from popup — no background script message passing needed.

// ── Your dirs.txt — 106 paths ─────────────────────────────────────────────
const DIRS = [
  "/robots.txt",
  "/sitemap.xml",
  "/crossdomain.xml",
  "/clientaccesspolicy.xml",
  "/security.txt",
  "/.well-known/security.txt",
  "/.well-known/assetlinks.json",
  "/.well-known/openid-configuration",
  "/.env",
  "/.env.example",
  "/.env.local",
  "/.env.production",
  "/.env.dev",
  "/config.php",
  "/config.json",
  "/configuration.php",
  "/appsettings.json",
  "/web.config",
  "/settings.py",
  "/database.yml",
  "/wp-config.php",
  "/local_settings.py",
  "/index.php.bak",
  "/index.php.old",
  "/index.php.save",
  "/config.php.bak",
  "/config.php.old",
  "/config.php~",
  "/database.sql",
  "/backup.zip",
  "/site.tar.gz",
  "/db.sql",
  "/dump.sql",
  "/backup.tar",
  "/backup.rar",
  "/www.zip",
  "/admin/",
  "/administrator/",
  "/panel/",
  "/dashboard/",
  "/cpanel/",
  "/portal/",
  "/backend/",
  "/api/",
  "/api/v1/",
  "/uploads/",
  "/assets/",
  "/private/",
  "/temp/",
  "/tmp/",
  "/logs/",
  "/log/",
  "/backup/",
  "/backups/",
  "/old/",
  "/dev/",
  "/staging/",
  "/test/",
  "/internal/",
  "/.git/",
  "/.git/config",
  "/.svn/",
  "/.hg/",
  "/.DS_Store",
  "/.idea/",
  "/.vscode/",
  "/package.json",
  "/yarn.lock",
  "/Gemfile",
  "/pom.xml",
  "/Dockerfile",
  "/docker-compose.yml",
  "/wp-admin/",
  "/wp-login.php",
  "/wp-content/uploads/",
  "/xmlrpc.php",
  "/storage/logs/laravel.log",
  "/vendor/",
  "/db.sqlite3",
  "/server.js",
  "/app.js",
  "/error.log",
  "/access.log",
  "/debug.log",
  "/logs/error.log",
  "/storage/logs/",
  "/phpinfo.php",
  "/test.php",
  "/info.php",
  "/debug.php",
  "/example.php",
  "/sample.php",
  "/backup.sql",
  "/db_backup.sql",
  "/db.sqlite",
  "/data.db",
  "/swagger/",
  "/swagger.json",
  "/api-docs/",
  "/graphql",
  "/actuator/",
  "/metrics",
  "/health",
  "/server-status",
  "/phpmyadmin/",
  "/adminer.php"
];

// ── Browser shim: works in both Chrome and Firefox ────────────────────────
const _br = typeof browser !== "undefined" ? browser : chrome;

// ── State ─────────────────────────────────────────────────────────────────
let activeTab = "wordlist";
let selectedIdx = new Set(DIRS.map((_, i) => i));

// ── Wire up everything after DOM is ready ─────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {

  // Build path checklist
  buildPathList();
  updateCount();

  // Tab switching
  document.getElementById("tab-wordlist").addEventListener("click", function () {
    switchTab("wordlist");
  });
  document.getElementById("tab-custom").addEventListener("click", function () {
    switchTab("custom");
  });

  // Select all / none
  document.getElementById("btn-all").addEventListener("click", function () {
    selectAll();
  });
  document.getElementById("btn-none").addEventListener("click", function () {
    selectNone();
  });

  // Main button
  document.getElementById("go-btn").addEventListener("click", function () {
    run();
  });

});

// ── Build scrollable path checklist ──────────────────────────────────────
function buildPathList() {
  var container = document.getElementById("path-list");
  container.innerHTML = "";

  DIRS.forEach(function (path, i) {
    var row = document.createElement("label");
    row.className = "path-item";

    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;

    var txt = document.createElement("span");
    txt.textContent = path;

    cb.addEventListener("change", function () {
      if (cb.checked) {
        selectedIdx.add(i);
        txt.className = "";
      } else {
        selectedIdx.delete(i);
        txt.className = "unchecked";
      }
      updateCount();
    });

    row.appendChild(cb);
    row.appendChild(txt);
    container.appendChild(row);
  });
}

function updateCount() {
  document.getElementById("sel-count").textContent = selectedIdx.size + " selected";
}

function selectAll() {
  selectedIdx = new Set(DIRS.map(function (_, i) { return i; }));
  var boxes = document.querySelectorAll("#path-list input[type=checkbox]");
  boxes.forEach(function (cb) {
    cb.checked = true;
    cb.parentElement.querySelector("span").className = "";
  });
  updateCount();
}

function selectNone() {
  selectedIdx.clear();
  var boxes = document.querySelectorAll("#path-list input[type=checkbox]");
  boxes.forEach(function (cb) {
    cb.checked = false;
    cb.parentElement.querySelector("span").className = "unchecked";
  });
  updateCount();
}

// ── Tab switching ─────────────────────────────────────────────────────────
function switchTab(name) {
  activeTab = name;

  document.getElementById("tab-wordlist").className = "tab" + (name === "wordlist" ? " active" : "");
  document.getElementById("tab-custom").className   = "tab" + (name === "custom"   ? " active" : "");
  document.getElementById("panel-wordlist").className = "panel" + (name === "wordlist" ? " active" : "");
  document.getElementById("panel-custom").className   = "panel" + (name === "custom"   ? " active" : "");
}

// ── normalize_domain() — mirrors url_builder.py ───────────────────────────
function normalizeDomain(domain) {
  domain = domain.trim();
  if (domain.indexOf("http://") !== 0 && domain.indexOf("https://") !== 0) {
    domain = "https://" + domain;
  }
  return domain.replace(/\/+$/, "");
}

// ── Get the active path list ──────────────────────────────────────────────
function getSelectedPaths() {
  if (activeTab === "wordlist") {
    return DIRS.filter(function (_, i) { return selectedIdx.has(i); });
  } else {
    var raw = document.getElementById("custom-paths").value;
    return raw.split("\n")
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l.length > 0 && l.charAt(0) !== "#"; })
      .map(function (l) { return "/" + l.replace(/^\/+/, ""); });
  }
}

// ── Main run — builds URLs and opens tabs directly ────────────────────────
function run() {
  var rawDomain = document.getElementById("base-url").value.trim();
  if (!rawDomain) {
    setStatus("Enter a target URL first.", "err");
    return;
  }

  var domain  = normalizeDomain(rawDomain);
  var paths   = getSelectedPaths();
  var maxTabs = parseInt(document.getElementById("max-tabs").value, 10) || 106;
  var delay   = parseInt(document.getElementById("delay").value, 10) || 0;
  var newWin  = document.getElementById("new-window").checked;

  if (paths.length === 0) {
    setStatus("No paths selected.", "err");
    return;
  }

  // Build full URLs — same as url_builder.py build_urls()
  var allUrls = paths.map(function (p) { return domain + p; });
  var total   = allUrls.length;
  var toOpen  = allUrls.slice(0, maxTabs);

  var btn = document.getElementById("go-btn");
  btn.disabled = true;
  btn.textContent = "Opening " + toOpen.length + " tabs...";

  setStatus("Generating URLs for " + domain + "...", "info");
  showPreview(toOpen);

  // Open tabs directly using the browser tabs API
  openTabsSequentially(toOpen, delay, newWin).then(function () {
    var note = total > maxTabs ? " (max " + maxTabs + " of " + total + ")" : "";
    setStatus("Done! Opened " + toOpen.length + " tabs" + note, "ok");
    btn.disabled = false;
    btn.textContent = "Generate & Open All URLs";
  }).catch(function (e) {
    setStatus("Error: " + e.message, "err");
    btn.disabled = false;
    btn.textContent = "Generate & Open All URLs";
  });
}

// ── Open tabs one by one ──────────────────────────────────────────────────
async function openTabsSequentially(urls, delay, newWin) {
  var windowId = undefined;
  var list = urls.slice();

  if (newWin && list.length > 0) {
    var win = await _br.windows.create({ url: list[0], focused: true });
    windowId = win.id;
    list = list.slice(1);
  }

  for (var i = 0; i < list.length; i++) {
    var opts = { url: list[i], active: false };
    if (windowId !== undefined) opts.windowId = windowId;
    await _br.tabs.create(opts);
    if (delay > 0) {
      await new Promise(function (resolve) { setTimeout(resolve, delay); });
    }
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────
function setStatus(msg, type) {
  var el = document.getElementById("status");
  el.textContent = msg;
  el.className = type;
}

function showPreview(urls) {
  var wrap   = document.getElementById("preview");
  var scroll = document.getElementById("preview-scroll");
  scroll.innerHTML = "";

  var limit = Math.min(urls.length, 40);
  for (var i = 0; i < limit; i++) {
    var d = document.createElement("div");
    d.textContent = urls[i];
    d.title = urls[i];
    scroll.appendChild(d);
  }

  if (urls.length > 40) {
    var more = document.createElement("div");
    more.className = "more";
    more.textContent = "... and " + (urls.length - 40) + " more";
    scroll.appendChild(more);
  }

  wrap.style.display = "block";
}
