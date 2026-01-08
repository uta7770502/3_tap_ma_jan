// app.js
const db = window.RULE_DB;

const el = (id) => document.getElementById(id);

const state = {
  selectedGameId: null,
  selectedCategoryId: null,
  query: "",
  activeTag: null,
  showFavOnly: false,
  fav: new Set(loadFav()),
};

function loadFav() {
  try {
    const raw = localStorage.getItem("favRules");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveFav() {
  localStorage.setItem("favRules", JSON.stringify([...state.fav]));
}

function norm(s) {
  return (s || "").toString().trim().toLowerCase();
}

function ruleMatches(r) {
  if (state.selectedGameId && r.gameId !== state.selectedGameId) return false;
  if (state.selectedCategoryId && r.categoryId !== state.selectedCategoryId) return false;

  if (state.showFavOnly && !state.fav.has(r.id)) return false;

  const q = norm(state.query);
  const t = norm(state.activeTag);

  if (t) {
    const tags = (r.tags || []).map(norm);
    if (!tags.includes(t)) return false;
  }

  if (!q) return true;

  const hay = [
    r.title,
    r.description,
    r.detail,
    r.procedure,
    r.penalty,
    ...(r.tags || []),
    ...(r.aliases || []),
  ]
    .filter(Boolean)
    .map(norm)
    .join(" ");

  return hay.includes(q);
}

function gameName(gameId) {
  return db.games.find((g) => g.id === gameId)?.name ?? "";
}
function categoryName(gameId, categoryId) {
  const g = db.games.find((x) => x.id === gameId);
  return g?.categories?.find((c) => c.id === categoryId)?.name ?? "";
}

function renderGames() {
  const root = el("gameList");
  root.innerHTML = "";
  db.games.forEach((g) => {
    const btn = document.createElement("button");
    btn.className = "card";
    btn.dataset.active = String(state.selectedGameId === g.id);
    btn.innerHTML = `
      <div class="card__title">${g.icon} ${g.name}</div>
      <div class="card__sub">${g.categories.length}カテゴリ</div>
    `;
    btn.onclick = () => {
      state.selectedGameId = g.id;
      state.selectedCategoryId = null;
      state.activeTag = null;
      renderAll();
    };
    root.appendChild(btn);
  });
}

function renderCategories() {
  const root = el("catList");
  const hint = el("catHint");
  root.innerHTML = "";

  if (!state.selectedGameId) {
    hint.textContent = "ゲームを選ぶ";
    return;
  }

  hint.textContent = "カテゴリを選ぶ";
  const g = db.games.find((x) => x.id === state.selectedGameId);
  g.categories.forEach((c) => {
    const btn = document.createElement("button");
    btn.className = "card";
    btn.dataset.active = String(state.selectedCategoryId === c.id);
    btn.innerHTML = `
      <div class="card__title">${c.name}</div>
      <div class="card__sub">タップして絞り込み</div>
    `;
    btn.onclick = () => {
      state.selectedCategoryId = c.id;
      state.activeTag = null;
      renderAll();
    };
    root.appendChild(btn);
  });
}

function collectTopTags(rules) {
  const map = new Map();
  rules.forEach((r) => (r.tags || []).forEach((t) => map.set(t, (map.get(t) || 0) + 1)));
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([t]) => t);
}

function renderTags() {
  const root = el("tagChips");
  root.innerHTML = "";

  const scoped = db.rules.filter((r) => {
    if (state.selectedGameId && r.gameId !== state.selectedGameId) return false;
    if (state.selectedCategoryId && r.categoryId !== state.selectedCategoryId) return false;
    return true;
  });

  const tags = collectTopTags(scoped);

  tags.forEach((t) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.dataset.active = String(norm(state.activeTag) === norm(t));
    b.textContent = `#${t}`;
    b.onclick = () => {
      state.activeTag = norm(state.activeTag) === norm(t) ? null : t;
      renderAll();
    };
    root.appendChild(b);
  });
}

function renderRules() {
  const root = el("ruleList");
  const hint = el("ruleHint");
  root.innerHTML = "";

  if (!state.selectedGameId) {
    hint.textContent = "ゲームを選ぶとルールが表示されます";
    return;
  }
  if (!state.selectedCategoryId) {
    hint.textContent = "カテゴリを選ぶ（検索だけなら未選択でもOK）";
  } else {
    hint.textContent = "ルールをタップで詳細";
  }

  const rules = db.rules.filter(ruleMatches);

  if (rules.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "該当するルールがありません";
    root.appendChild(empty);
    setStatus(`0件`);
    return;
  }

  rules.forEach((r) => {
    const card = document.createElement("button");
    card.className = "rule";
    const isFav = state.fav.has(r.id);
    card.innerHTML = `
      <div class="rule__top">
        <div class="rule__title">${r.title}</div>
        <div class="rule__fav">${isFav ? "★" : "☆"}</div>
      </div>
      <div class="rule__sub">${r.description || ""}</div>
      <div class="rule__meta">${gameName(r.gameId)} / ${categoryName(r.gameId, r.categoryId)}</div>
    `;
    card.onclick = () => openRule(r.id);
    root.appendChild(card);
  });

  setStatus(`${rules.length}件表示`);
}

function openRule(ruleId) {
  const r = db.rules.find((x) => x.id === ruleId);
  if (!r) return;

  el("dlgMeta").textContent = `${gameName(r.gameId)} / ${categoryName(r.gameId, r.categoryId)} • ${r.id}`;
  el("dlgTitle").textContent = r.title;
  el("dlgDesc").textContent = r.description || "—";
  el("dlgDetail").textContent = r.detail || "—";
  el("dlgProcedure").textContent = r.procedure || "—";
  el("dlgPenalty").textContent = r.penalty || "—";

  const tagsRoot = el("dlgTags");
  tagsRoot.innerHTML = "";
  (r.tags || []).forEach((t) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = `#${t}`;
    span.onclick = () => {
      state.activeTag = t;
      closeDlg();
      renderAll();
    };
    tagsRoot.appendChild(span);
  });

  const favBtn = el("btnFav");
  const setFavLabel = () => {
    favBtn.textContent = state.fav.has(r.id) ? "★ お気に入り解除" : "☆ お気に入り";
  };
  setFavLabel();

  favBtn.onclick = () => {
    if (state.fav.has(r.id)) state.fav.delete(r.id);
    else state.fav.add(r.id);
    saveFav();
    setFavLabel();
    renderRules();
  };

  el("btnShare").onclick = async () => {
    const text =
`${r.title}
${gameName(r.gameId)} / ${categoryName(r.gameId, r.categoryId)}
要約：${r.description || "—"}
詳細：${r.detail || "—"}
手順：${r.procedure || "—"}
結果：${r.penalty || "—"}
`;

    if (navigator.share) {
      try { await navigator.share({ title: r.title, text }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert("共有テキストをコピーしました");
      } catch {
        prompt("コピーして共有してください", text);
      }
    }
  };

  el("dlg").showModal();
}

function closeDlg() {
  const d = el("dlg");
  if (d.open) d.close();
}

function setStatus(msg) {
  el("status").textContent = `v${db.version} • ${msg}`;
}

function bindUI() {
  el("q").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderAll(false);
  });
  el("btnClear").onclick = () => {
    state.query = "";
    el("q").value = "";
    state.activeTag = null;
    renderAll();
  };
  el("btnReset").onclick = () => {
    state.selectedGameId = null;
    state.selectedCategoryId = null;
    state.query = "";
    state.activeTag = null;
    state.showFavOnly = false;
    el("q").value = "";
    renderAll();
  };

  el("dlgClose").onclick = closeDlg;
  el("dlg").addEventListener("click", (e) => {
    const rect = el("dlg").getBoundingClientRect();
    const inDialog =
      rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width;
    if (!inDialog) closeDlg();
  });

  el("btnShowFav").onclick = () => {
    state.showFavOnly = true;
    renderAll();
  };
  el("btnAll").onclick = () => {
    state.showFavOnly = false;
    renderAll();
  };
}

function renderAll(rerenderLists = true) {
  if (rerenderLists) {
    renderGames();
    renderCategories();
  }
  renderTags();
  renderRules();
}

// PWA（任意）
function initPWA() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const b = el("btnInstall");
    b.hidden = false;
    b.onclick = async () => {
      b.hidden = true;
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch {}
      deferredPrompt = null;
    };
  });
}

(function boot() {
  bindUI();
  renderAll();
  initPWA();
})();
