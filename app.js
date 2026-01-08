// app.js
const DB_URL = "./rules.json";
const favKey = "favorites_rule_ids_v1";

let RULES = [];
let state = {
  game: null,
  category: null,
  query: "",
  activeTag: null,
  favOnly: false,
  fav: new Set(loadFavIds()),
};

// ---- utilities ----
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const page = () => location.pathname.split("/").pop() || "index.html";

function loadFavIds(){
  try{
    const raw = localStorage.getItem(favKey);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch{
    return [];
  }
}
function saveFavIds(){
  localStorage.setItem(favKey, JSON.stringify([...state.fav]));
}

function norm(s=""){
  return String(s).trim().toLowerCase().replace(/\s|　/g,"");
}

// ゴルフ版の「normalize」に相当する役割を、ゲーム汎用として用意（必要ならここを増やす）
function normalizeLabel(s=""){
  return String(s)
    .trim()
    .replace(/\s|　/g,"")
    .replace(/[－―—–]/g,"-");
}

function uniq(arr){
  return [...new Set(arr)];
}

function setStatus(msg){
  const el = $("#status");
  if (el) el.textContent = msg;
}

// ---- load ----
document.addEventListener("DOMContentLoaded", async () => {
  RULES = await fetch(DB_URL).then(r => r.json()).catch(() => []);
  setStatus(`rules: ${RULES.length}`);

  // PWA
  initPWA();

  // page router
  switch(page()){
    case "index.html":
    case "":
      renderIndex();
      break;
    case "rules.html":
      renderRulesPage();
      break;
    case "rule.html":
      renderRulePage();
      break;
    case "favorites.html":
      renderFavoritesPage();
      break;
  }
});

// ---- index ----
function renderIndex(){
  // popular tags
  const chipRoot = $("#keyword-container");
  if (chipRoot){
    chipRoot.innerHTML = "";
    const tags = topTags(RULES, 18);
    tags.forEach(t => {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = `#${t}`;
      b.onclick = () => {
        localStorage.setItem("lastSearch", t);
        location.href = "./rules.html";
      };
      chipRoot.appendChild(b);
    });
  }

  // game preview
  const gameRoot = $("#game-preview");
  if (gameRoot){
    gameRoot.innerHTML = "";
    const games = uniq(RULES.map(r => r.game)).filter(Boolean);
    games.forEach(g => {
      const count = RULES.filter(r => r.game === g).length;
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `<div><b>${g}</b></div><div class="sub">${count}件</div>`;
      div.onclick = () => {
        localStorage.setItem("lastGame", g);
        location.href = "./rules.html";
      };
      gameRoot.appendChild(div);
    });
  }
}

// ---- rules page ----
function renderRulesPage(){
  // restore last search / last game
  const lastSearch = localStorage.getItem("lastSearch") || "";
  const lastGame = localStorage.getItem("lastGame") || "";
  if (lastGame) state.game = lastGame;
  if (lastSearch) state.query = lastSearch;

  const input = $("#searchRulesInput");
  if (input){
    input.value = state.query || "";
    input.addEventListener("input", (e) => {
      state.query = e.target.value;
      paintRuleList();
      paintTags();
    });
  }

  $("#btnClear")?.addEventListener("click", () => {
    state.query = "";
    state.activeTag = null;
    localStorage.removeItem("lastSearch");
    if (input) input.value = "";
    paintRuleList();
    paintTags();
  });

  $("#btnReset")?.addEventListener("click", () => {
    state.game = null;
    state.category = null;
    state.query = "";
    state.activeTag = null;
    state.favOnly = false;
    localStorage.removeItem("lastGame");
    localStorage.removeItem("lastSearch");
    if (input) input.value = "";
    paintAllSelectors();
  });

  $("#btnShowFavOnly")?.addEventListener("click", () => {
    state.favOnly = true;
    paintRuleList();
  });
  $("#btnShowAll")?.addEventListener("click", () => {
    state.favOnly = false;
    paintRuleList();
  });

  paintAllSelectors();
}

function paintAllSelectors(){
  paintGameButtons();
  paintCategoryButtons();
  paintTags();
  paintRuleList();
}

function paintGameButtons(){
  const root = $("#game-buttons");
  if (!root) return;
  root.innerHTML = "";

  const games = uniq(RULES.map(r => r.game)).filter(Boolean);
  games.forEach(g => {
    const btn = document.createElement("button");
    btn.className = "item";
    btn.dataset.active = String(state.game === g);
    const count = RULES.filter(r => r.game === g).length;
    btn.innerHTML = `<div><b>${g}</b></div><div class="sub">${count}件</div>`;
    btn.onclick = () => {
      state.game = g;
      state.category = null;
      localStorage.setItem("lastGame", g);
      paintCategoryButtons();
      paintTags();
      paintRuleList();
    };
    root.appendChild(btn);
  });

  $("#gameHint") && ($("#gameHint").textContent = state.game ? `選択中：${state.game}` : "選ぶ");
}

function paintCategoryButtons(){
  const root = $("#category-buttons");
  if (!root) return;
  root.innerHTML = "";

  if (!state.game){
    $("#categoryHint") && ($("#categoryHint").textContent = "ゲームを選ぶ");
    return;
  }

  const cats = uniq(
    RULES
      .filter(r => r.game === state.game)
      .map(r => normalizeLabel(r.category))
  ).filter(Boolean);

  cats.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "item";
    btn.dataset.active = String(normalizeLabel(state.category) === c);
    const count = RULES.filter(r => r.game === state.game && normalizeLabel(r.category) === c).length;
    btn.innerHTML = `<div><b>${c}</b></div><div class="sub">${count}件</div>`;
    btn.onclick = () => {
      state.category = c;
      paintTags();
      paintRuleList();
    };
    root.appendChild(btn);
  });

  $("#categoryHint") && ($("#categoryHint").textContent = state.category ? `選択中：${state.category}` : "カテゴリを選ぶ");
}

function topTags(rules, limit=12){
  const map = new Map();
  rules.forEach(r => (r.tags || []).forEach(t => {
    const k = String(t).trim();
    if (!k) return;
    map.set(k, (map.get(k) || 0) + 1);
  }));
  return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([k])=>k);
}

function scopedRulesForTags(){
  return RULES.filter(r => {
    if (state.game && r.game !== state.game) return false;
    if (state.category && normalizeLabel(r.category) !== normalizeLabel(state.category)) return false;
    return true;
  });
}

function paintTags(){
  const root = $("#tagChips");
  if (!root) return;
  root.innerHTML = "";

  const tags = topTags(scopedRulesForTags(), 14);
  tags.forEach(t => {
    const b = document.createElement("button");
    b.className = "chip";
    b.dataset.active = String(norm(state.activeTag) === norm(t));
    b.textContent = `#${t}`;
    b.onclick = () => {
      state.activeTag = norm(state.activeTag) === norm(t) ? null : t;
      paintRuleList();
    };
    root.appendChild(b);
  });
}

function ruleMatches(r){
  if (state.game && r.game !== state.game) return false;
  if (state.category && normalizeLabel(r.category) !== normalizeLabel(state.category)) return false;

  if (state.favOnly && !state.fav.has(r.id)) return false;

  if (state.activeTag){
    const tags = (r.tags || []).map(norm);
    if (!tags.includes(norm(state.activeTag))) return false;
  }

  const q = norm(state.query);
  if (!q) return true;

  const hay = [
    r.title, r.description, r.detail, r.procedure, r.penalty,
    ...(r.tags || []),
    ...(r.aliases || []),
    r.game, r.category
  ].filter(Boolean).map(norm).join(" ");

  return hay.includes(q);
}

function paintRuleList(){
  const root = $("#rule-list");
  if (!root) return;
  root.innerHTML = "";

  const list = RULES.filter(ruleMatches);
  $("#rulesHint") && ($("#rulesHint").textContent = `${list.length}件`);

  if (list.length === 0){
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<div><b>該当なし</b></div><div class="sub">検索やカテゴリを変えてみてください</div>`;
    root.appendChild(div);
    return;
  }

  list.forEach(r => {
    const isFav = state.fav.has(r.id);
    const btn = document.createElement("button");
    btn.className = "rule";
    btn.innerHTML = `
      <div class="top">
        <div class="title">${escapeHtml(r.title)}</div>
        <div class="fav">${isFav ? "★" : "☆"}</div>
      </div>
      <div class="desc">${escapeHtml(r.description || "")}</div>
      <div class="meta">${escapeHtml(r.game)} / ${escapeHtml(normalizeLabel(r.category))} • ${r.id}</div>
    `;
    btn.onclick = () => {
      // lastSearch保存は維持（トップから来た時にも便利）
      if (state.query) localStorage.setItem("lastSearch", state.query);
      location.href = `./rule.html?id=${encodeURIComponent(r.id)}`;
    };
    root.appendChild(btn);
  });
}

// ---- rule detail page ----
function renderRulePage(){
  const id = new URLSearchParams(location.search).get("id");
  const r = RULES.find(x => String(x.id) === String(id));
  if (!r){
    setStatus("not found");
    return;
  }

  $("#rule-meta") && ($("#rule-meta").textContent = `${r.game} / ${normalizeLabel(r.category)} • ${r.id}`);
  $("#rule-title") && ($("#rule-title").textContent = r.title);

  const content = $("#rule-content");
  if (content){
    content.innerHTML = `
      <h3>要約</h3><p>${escapeHtml(r.description || "—")}</p>
      <h3>詳細</h3><p>${escapeHtml(r.detail || "—")}</p>
      <h3>手順</h3><p>${escapeHtml(r.procedure || "—")}</p>
      <h3>ペナルティ / 結果</h3><p>${escapeHtml(r.penalty || "—")}</p>
      <h3>タグ</h3><p>${(r.tags || []).map(t => `#${escapeHtml(t)}`).join("  ") || "—"}</p>
    `;
  }

  const favBtn = $("#addFavoriteBtn");
  if (favBtn){
    const refresh = () => favBtn.textContent = state.fav.has(r.id) ? "★ お気に入り解除" : "☆ お気に入り";
    refresh();

    favBtn.onclick = () => {
      if (state.fav.has(r.id)) state.fav.delete(r.id);
      else state.fav.add(r.id);
      saveFavIds();
      refresh();
    };
  }

  $("#shareBtn")?.addEventListener("click", async () => {
    const text =
`${r.title}
${r.game} / ${normalizeLabel(r.category)}
要約：${r.description || "—"}
詳細：${r.detail || "—"}
手順：${r.procedure || "—"}
結果：${r.penalty || "—"}
タグ：${(r.tags || []).join(", ")}
`;
    if (navigator.share){
      try{ await navigator.share({ title: r.title, text }); }catch{}
    }else{
      try{
        await navigator.clipboard.writeText(text);
        alert("共有テキストをコピーしました");
      }catch{
        prompt("コピーして共有してください", text);
      }
    }
  });
}

// ---- favorites page ----
function renderFavoritesPage(){
  const root = $("#favorites-list");
  if (!root) return;

  const favRules = RULES.filter(r => state.fav.has(r.id));
  if (favRules.length === 0){
    root.innerHTML = `<div class="item"><div><b>お気に入りなし</b></div><div class="sub">詳細ページで☆を押すと追加されます</div></div>`;
  }else{
    root.innerHTML = "";
    favRules.forEach(r => {
      const btn = document.createElement("button");
      btn.className = "rule";
      btn.innerHTML = `
        <div class="top">
          <div class="title">${escapeHtml(r.title)}</div>
          <div class="fav">★</div>
        </div>
        <div class="desc">${escapeHtml(r.description || "")}</div>
        <div class="meta">${escapeHtml(r.game)} / ${escapeHtml(normalizeLabel(r.category))} • ${r.id}</div>
      `;
      btn.onclick = () => location.href = `./rule.html?id=${encodeURIComponent(r.id)}`;
      root.appendChild(btn);
    });
  }

  $("#btnClearFav")?.addEventListener("click", () => {
    if (!confirm("お気に入りを全削除します。よろしいですか？")) return;
    state.fav = new Set();
    saveFavIds();
    renderFavoritesPage();
  });
}

// ---- PWA ----
function initPWA(){
  if ("serviceWorker" in navigator){
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  }
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const b = $("#btnInstall");
    if (!b) return;
    b.hidden = false;
    b.onclick = async () => {
      b.hidden = true;
      deferredPrompt.prompt();
      try{ await deferredPrompt.userChoice; }catch{}
      deferredPrompt = null;
    };
  });
}

// ---- xss safe ----
function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}
