const ROUTES = {
  gallery: "#/gallery",
  viewPrefix: "#/view/"
};

function qs(root, sel) {
  const el = root.querySelector(sel);
  if (!el) throw new Error(`Missing element: ${sel}`);
  return el;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeFallbackSvgDataUri(label) {
  const safe = escapeHtml(label).slice(0, 44);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2b4b8a"/>
      <stop offset="0.55" stop-color="#2a1b5a"/>
      <stop offset="1" stop-color="#0e3a3a"/>
    </linearGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="rgba(0,0,0,.55)"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <g filter="url(#s)">
    <rect x="90" y="120" width="1020" height="560" rx="26" fill="rgba(255,255,255,.10)" stroke="rgba(255,255,255,.18)"/>
    <text x="150" y="220" fill="rgba(255,255,255,.88)" font-size="46" font-family="system-ui, Segoe UI, sans-serif" font-weight="700">이미지 경로를 확인하세요</text>
    <text x="150" y="290" fill="rgba(255,255,255,.72)" font-size="22" font-family="system-ui, Segoe UI, sans-serif">data/prototypes.json에 등록된 파일이 없거나 로드에 실패했습니다.</text>
    <text x="150" y="420" fill="rgba(255,255,255,.92)" font-size="34" font-family="system-ui, Segoe UI, sans-serif" font-weight="650">${safe}</text>
    <text x="150" y="470" fill="rgba(255,255,255,.72)" font-size="20" font-family="system-ui, Segoe UI, sans-serif">예: ./assets/xxx-main.png</text>
  </g>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function loadConfig() {
  const res = await fetch(`./data/prototypes.json?v=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load config: ${res.status}`);
  return await res.json();
}

function getRoute() {
  const hash = window.location.hash || ROUTES.gallery;
  if (hash.startsWith(ROUTES.viewPrefix)) return { name: "view", id: hash.slice(ROUTES.viewPrefix.length) };
  if (hash === ROUTES.gallery) return { name: "gallery" };
  return { name: "gallery" };
}

function navTo(hash) {
  if (window.location.hash === hash) return;
  window.location.hash = hash;
}

function swap(app, nextHtml, { focusSelector } = {}) {
  const prev = app.firstElementChild;
  const next = document.createElement("div");
  next.innerHTML = nextHtml;
  app.appendChild(next);
  if (prev && prev.parentNode === app) app.removeChild(prev);
  if (focusSelector) {
    const focusEl = next.querySelector(focusSelector);
    if (focusEl && typeof focusEl.focus === "function") focusEl.focus();
  }
}

function renderGallery(app, cfg) {
  const items = Array.isArray(cfg?.items) ? cfg.items : [];

  const cardsHtml = items
    .map((it) => {
      const count = Array.isArray(it?.sequence) ? it.sequence.length : 0;
      const title = it?.title ?? it?.id ?? "Untitled";
      const thumb = it?.thumb ?? "";
      const id = it?.id ?? "";
      return `
      <div class="Thumb">
        <button class="ThumbButton" type="button" data-view-id="${escapeHtml(id)}" aria-label="${escapeHtml(
        title
      )} 열기">
          <div class="ThumbInner">
            <img class="ThumbMedia" alt="" loading="lazy" decoding="async" src="${escapeHtml(
              thumb
            )}" data-fallback-label="${escapeHtml(title)}"/>
            <div class="ThumbOverlay">
              <p class="ThumbTitle">${escapeHtml(title)}</p>
            </div>
          </div>
        </button>
      </div>
    `;
    })
    .join("");

  swap(
    app,
    `
    <main class="Screen" role="main">
      <section class="top">
       <div class="inner">
         <img class="Logo" alt="" loading="lazy" decoding="async" src="./assets/logo.png"/> <span>동연에스엔티 홈페이지 리뉴얼</span>
       </div>
      </section>
      <section class="Container">
        <header class="Topbar">
          <h1 class="Title">시안 갤러리</h1>
          <p class="Hint">썸네일 클릭하세요.</p>
        </header>
        <section class="Grid" aria-label="시안 목록">
          ${cardsHtml || `<div class="Card" style="padding:18px;">data/prototypes.json에 items를 추가하세요.</div>`}
        </section>
      </section>
    </main>
    `,
    { focusSelector: ".ThumbButton" }
  );

  const root = app.lastElementChild;
  if (!root) return;

  root.addEventListener("click", (e) => {
    const btn = e.target?.closest?.(".ThumbButton");
    if (!btn) return;
    const id = btn.getAttribute("data-view-id");
    if (!id) return;
    navTo(`${ROUTES.viewPrefix}${id}`);
  });

  // fallback thumbnails
  root.querySelectorAll("img[data-fallback-label]").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        const label = img.getAttribute("data-fallback-label") || "thumbnail";
        img.src = makeFallbackSvgDataUri(label);
      },
      { once: true }
    );
  });
}

function findItem(cfg, id) {
  const items = Array.isArray(cfg?.items) ? cfg.items : [];
  return items.find((it) => String(it?.id) === String(id));
}

function renderViewer(app, cfg, id) {
  const item = findItem(cfg, id);
  const title = item?.title ?? item?.id ?? id ?? "Viewer";
  const seq = Array.isArray(item?.sequence) ? item.sequence : [];
  const safeSeq = seq.length ? seq : [""];

  swap(
    app,
    `
    <div class="Viewer" role="dialog" aria-modal="true" aria-label="전체 화면 시안">
      <div class="FloatingControls" aria-label="뷰어 컨트롤">
        <button class="IconBtn" type="button" id="btnBack">갤러리</button>
        <button class="IconBtn" type="button" id="btnNext">다음</button>
      </div>
      <div class="StepPill" aria-live="polite">${escapeHtml(title)} · <span id="stepText"></span></div>
      <img class="BottomRightFloat" src="./assets/float.png" alt="" decoding="async" />
      <div class="Stage">
        <div class="Frame FrameA"><img id="imgA" alt="${escapeHtml(title)}"/></div>
        <div class="Frame FrameB"><img id="imgB" alt="${escapeHtml(title)}"/></div>
        <div class="ClickCatcher" id="catcher" aria-label="클릭하여 다음 이미지"></div>
      </div>
    </div>
    `,
    { focusSelector: "#btnNext" }
  );

  const root = app.lastElementChild;
  if (!root) return;

  const btnBack = qs(root, "#btnBack");
  const btnNext = qs(root, "#btnNext");
  const catcher = qs(root, "#catcher");
  const imgA = qs(root, "#imgA");
  const imgB = qs(root, "#imgB");
  const stepText = qs(root, "#stepText");

  const frameA = imgA.closest(".FrameA");
  const frameB = imgB.closest(".FrameB");

  let idx = 0;
  let showA = true;

  const applySrc = (imgEl, src, label) => {
    imgEl.src = src || makeFallbackSvgDataUri(label);
    imgEl.addEventListener(
      "error",
      () => {
        imgEl.src = makeFallbackSvgDataUri(label);
      },
      { once: true }
    );
  };

  const setStepText = () => {
    const total = safeSeq.length;
    const current = idx + 1;
    stepText.textContent = `${current}/${total}`;
    btnNext.textContent = current >= total ? "닫기" : "다음";
  };

  const show = (newIdx) => {
    idx = clamp(newIdx, 0, safeSeq.length - 1);
    setStepText();
    const label = `${title} (${idx + 1})`;
    const src = safeSeq[idx];

    if (showA) {
      applySrc(imgA, src, label);
      frameA.classList.add("is-visible");
      frameB.classList.remove("is-visible");
    } else {
      applySrc(imgB, src, label);
      frameB.classList.add("is-visible");
      frameA.classList.remove("is-visible");
    }
    showA = !showA;
  };

  const advance = () => {
    if (idx >= safeSeq.length - 1) {
      navTo(ROUTES.gallery);
      return;
    }
    show(idx + 1);
  };

  const backToGallery = () => navTo(ROUTES.gallery);

  btnBack.addEventListener("click", backToGallery);
  btnNext.addEventListener("click", advance);
  catcher.addEventListener("click", advance);

  const onKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      backToGallery();
      return;
    }
    if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
      e.preventDefault();
      advance();
    }
  };
  window.addEventListener("keydown", onKey);

  // cleanup on route change
  const onHash = () => {
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("hashchange", onHash);
  };
  window.addEventListener("hashchange", onHash);

  show(0);
}

function renderNotFound(app) {
  swap(
    app,
    `
    <main class="Screen" role="main">
      <section class="Container">
        <div class="Card" style="padding:18px;">
          <h1 class="Title" style="margin:0 0 8px;">페이지를 찾을 수 없습니다</h1>
          <p class="Hint" style="margin:0 0 14px;">갤러리로 이동합니다.</p>
          <button class="IconBtn" type="button" id="goGallery">갤러리</button>
        </div>
      </section>
    </main>
    `
  );
  const root = app.lastElementChild;
  const btn = root ? root.querySelector("#goGallery") : null;
  if (btn) btn.addEventListener("click", () => navTo(ROUTES.gallery));
  setTimeout(() => navTo(ROUTES.gallery), 900);
}

async function main() {
  const app = document.getElementById("app");
  if (!app) throw new Error("Missing #app");

  let cfg;
  try {
    cfg = await loadConfig();
  } catch (e) {
    cfg = { intro: { title: "시안 프로토타입" }, items: [] };
    console.error(e);
  }

  const render = () => {
    const route = getRoute();
    if (route.name === "gallery") return renderGallery(app, cfg);
    if (route.name === "view") return renderViewer(app, cfg, route.id);
    return renderNotFound(app);
  };

  window.addEventListener("hashchange", render);
  if (!window.location.hash) navTo(ROUTES.gallery);
  render();
}

main();
