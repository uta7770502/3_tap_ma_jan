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
  roo
