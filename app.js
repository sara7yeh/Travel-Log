const DB_NAME = "shot-style-library";
const DB_VERSION = 2;
const IDEA_STORE = "ideas";
const IMAGE_STORE = "images";
const SHOT_ITEM_STORE = "shotItems";
const TEMPLATE_STORE = "templates";
const SETTINGS_KEY = "photo-notes-settings";
const SEED_DISABLED_KEY = "photo-notes-seed-disabled";
const MAX_MEDIA_PER_SECTION = 40;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const defaultSettings = {
  language: "zh-CN",
  fontSize: "standard",
  reduceMotion: false,
};

const seedIdeas = [
  {
    theme: "秋冬氛围",
    concept: "穿大衣和围巾拍一组自然温暖的日常照片",
    outfitTags: ["大衣", "围巾", "短靴"],
    accessoryTags: ["围巾", "耳环"],
    deviceTags: ["手机", "三脚架"],
    poseTags: ["走路", "回头", "捧热饮"],
    placeTypes: ["落叶街道", "公园", "街角"],
    note: "傍晚的暖光很好看，也可以拍围巾和手部细节。",
    palette: ["#8d533a", "#d6a15f", "#efe1cc", "#4e5a4e"],
  },
  {
    theme: "日落海边",
    concept: "在太阳快落下的时候拍海风、剪影和散步的画面",
    outfitTags: ["白裙", "薄外套", "草帽"],
    accessoryTags: ["草帽", "耳环"],
    deviceTags: ["手机", "微单"],
    poseTags: ["背影", "侧脸", "走向海边"],
    placeTypes: ["海边", "沙滩", "礁石"],
    note: "提前看日落时间，逆光时可以拍轮廓和头发被风吹起的瞬间。",
    palette: ["#d77a66", "#6f8ea3", "#f1c47b", "#f8ead8"],
  },
  {
    theme: "咖啡厅日常",
    concept: "记录喝咖啡、看窗外和随手翻书的松弛感",
    outfitTags: ["针织衫", "衬衫", "托特包"],
    accessoryTags: ["托特包", "眼镜"],
    deviceTags: ["手机", "桌面支架"],
    poseTags: ["托腮", "看窗外", "手拿咖啡"],
    placeTypes: ["咖啡厅", "窗边", "露台"],
    note: "选靠窗的位置，桌上的咖啡、书和甜点也可以拍细节。",
    palette: ["#7f6657", "#a98c72", "#d8c4ad", "#f5eee6"],
  },
  {
    theme: "图书馆安静感",
    concept: "在书架和阅读区拍安静、专注的日常照片",
    outfitTags: ["白衬衫", "针织背心", "眼镜"],
    accessoryTags: ["眼镜", "帆布包"],
    deviceTags: ["手机", "静音相机"],
    poseTags: ["低头看书", "书架侧影", "坐姿"],
    placeTypes: ["图书馆", "书店", "阅读区"],
    note: "尽量不用闪光灯，适合拍手翻书、书架之间和桌面光影。",
    palette: ["#61736b", "#9ca89f", "#d8d3c5", "#f4f1e8"],
  },
];

let state = {
  ideas: [],
  shotItems: [],
  templates: [],
  mediaRecords: [],
  mediaUrls: new Map(),
  activeView: "planned",
  filters: {
    theme: "全部",
    outfit: "",
    accessory: "",
    device: "",
    pose: "",
    place: "",
  },
  filterOpen: false,
  settingsOpen: false,
  settings: loadSettings(),
  viewingIdeaId: null,
  viewingTemplateId: null,
  expandedItemIds: new Set(),
  viewerMediaId: null,
  viewerMediaIds: [],
  viewerZoom: 1,
  detailScrollTop: 0,
  pendingDetailScrollRestore: false,
  editingPlanId: null,
  editingItemId: null,
  editingTemplateId: null,
  templateTargetId: null,
  sharingIdeaId: null,
  uploadDrafts: {},
  formDrafts: {},
  toastTimer: null,
};

const $ = (selector) => document.querySelector(selector);
const app = $("#app");

const icons = {
  camera: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></svg>',
  plus: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  close: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  edit: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
  check: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m20 6-11 11-5-5"/></svg>',
  filter: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.5V20l4 2v-9.5Z"/></svg>',
  settings: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.37.36.7.66.96.3.26.69.4 1.09.4H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z"/></svg>',
  share: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>',
  download: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
  list: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>',
};

const translations = {
  "拍照灵感搭配库": "Photo Inspiration Library",
  "设置": "Settings",
  "今日份灵感": "Today",
  "把想拍的画面，先悄悄藏进这里。": "Save the shots you want to make.",
  "下一次出发，会有好多好看的照片。": "Your next outing already has ideas waiting.",
  "筛选": "Filter",
  "清空筛选": "Clear filters",
  "拍摄企划": "Shot Plans",
  "已拍作品": "Captured Works",
  "万能模板": "Templates",
  "想拍": "Planned",
  "已拍": "Captured",
  "新增": "New",
  "模板": "Templates",
  "新建企划": "New plan",
  "新建模板": "New template",
  "创建模板": "Create template",
  "企划": "Plans",
  "想拍 / 已拍": "Planned / Captured",
  "未定地点": "Location TBD",
  "小企划": "Sub-plans",
  "参考图片与视频": "References",
  "小企划清单": "Sub-plan checklist",
  "添加小企划": "Add sub-plan",
  "全部完成，标记已拍": "All done, mark captured",
  "移回想拍": "Move back to planned",
  "全部标签": "All tags",
  "备注": "Notes",
  "我的已拍作品": "My photos",
  "参考素材": "References",
  "成片": "Captured photos",
  "添加参考": "Add reference",
  "添加成片": "Add captured",
  "勾选完成": "Mark done",
  "改回未完成": "Mark not done",
  "编辑拍摄企划": "Edit plan",
  "新增拍摄企划": "New plan",
  "企划名称": "Plan name",
  "企划说明（可选）": "Plan description (optional)",
  "日期（可选）": "Date (optional)",
  "总地点（可选）": "Location (optional)",
  "企划封面（可选）": "Plan cover (optional)",
  "上传一张封面图；不传会自动用小企划里的第一张素材。": "Upload one cover image, or the app will use the first sub-plan image.",
  "取消": "Cancel",
  "保存修改": "Save changes",
  "保存企划": "Save plan",
  "编辑小企划": "Edit sub-plan",
  "新增小企划": "New sub-plan",
  "名称": "Name",
  "具体想拍什么（可选）": "What to shoot (optional)",
  "参考图 / 视频（可选）": "References (optional)",
  "单张": "Single",
  "四宫格": "4-grid",
  "九宫格": "9-grid",
  "可上传照片 / 视频；拼图只支持图片": "Upload photos/videos; collages use images only",
  "衣服/造型标签（可选）": "Outfit tags (optional)",
  "配饰标签（可选）": "Accessory tags (optional)",
  "拍摄设备标签（可选）": "Camera gear tags (optional)",
  "姿势/构图标签（可选）": "Pose tags (optional)",
  "适配地点类型（可选）": "Location tags (optional)",
  "备注（可选）": "Notes (optional)",
  "保存小企划": "Save sub-plan",
  "编辑万能模板": "Edit template",
  "新增万能模板": "New template",
  "保存模板": "Save template",
  "加入企划": "Add to plan",
  "加入哪个企划？": "Choose a plan",
  "分享企划摘要": "Share summary",
  "系统分享": "Share",
  "复制文字": "Copy text",
  "保存分享图片": "Save image",
  "界面语言": "Language",
  "字体大小": "Text size",
  "小": "Small",
  "标准": "Standard",
  "大": "Large",
  "减少动画": "Reduce motion",
  "联系开发者": "Contact developer",
  "发送邮件": "Email",
  "数据与隐私": "Data & privacy",
  "清空本机数据": "Clear local data",
  "关于": "About",
};

function translateInterface() {
  if (state.settings.language !== "en") return;
  const walker = document.createTreeWalker(app, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const text = node.nodeValue.trim();
    if (translations[text]) node.nodeValue = node.nodeValue.replace(text, translations[text]);
    else if (/^\d+ 个还想拍的计划。$/.test(text)) node.nodeValue = `${text.match(/\d+/)[0]} planned plans.`;
    else if (/^\d+ 个已经完成的企划。$/.test(text)) node.nodeValue = `${text.match(/\d+/)[0]} captured plans.`;
    else if (/^\d+ 个$/.test(text)) node.nodeValue = `${text.match(/\d+/)[0]} items`;
  }
}

function loadSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function applySettings() {
  document.documentElement.lang = state.settings.language;
  document.body.dataset.fontSize = state.settings.fontSize;
  document.body.classList.toggle("reduce-motion", state.settings.reduceMotion);
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDEA_STORE)) db.createObjectStore(IDEA_STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(IMAGE_STORE)) db.createObjectStore(IMAGE_STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(SHOT_ITEM_STORE)) db.createObjectStore(SHOT_ITEM_STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(TEMPLATE_STORE)) db.createObjectStore(TEMPLATE_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(storeName, mode, callback) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = callback(store);
    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function getAll(storeName) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

const putRecord = (storeName, record) => withStore(storeName, "readwrite", (store) => store.put(record));
const deleteRecord = (storeName, id) => withStore(storeName, "readwrite", (store) => store.delete(id));

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseTags(value) {
  return String(value || "")
    .split(/[,，、\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function makeCanvasImage(seed) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");
  const colors = seed.palette;
  const gradient = ctx.createLinearGradient(0, 0, 900, 1200);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.5, colors[1]);
  gradient.addColorStop(1, colors[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 900, 1200);
  ctx.fillStyle = "rgba(255, 252, 244, 0.76)";
  ctx.fillRect(92, 94, 716, 1012);
  ctx.fillStyle = colors[3];
  ctx.fillRect(128, 130, 644, 940);
  ctx.fillStyle = "rgba(255,255,255,.52)";
  ctx.beginPath();
  ctx.ellipse(450, 440, 185, 250, 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(35,32,29,.5)";
  ctx.beginPath();
  ctx.ellipse(450, 348, 74, 88, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(356, 450, 188, 330);
  ctx.fillStyle = "rgba(255,253,249,.92)";
  ctx.font = "700 54px system-ui, sans-serif";
  ctx.fillText(seed.theme, 80, 1040);
  ctx.font = "32px system-ui, sans-serif";
  ctx.fillText(seed.placeTypes.slice(0, 2).join(" / "), 80, 1094);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9));
}

function getIdeaMediaIds(idea) {
  if (Array.isArray(idea.mediaIds) && idea.mediaIds.length) return idea.mediaIds;
  if (idea.imageId) return [idea.imageId];
  return [];
}

function getResultMediaIds(idea) {
  return Array.isArray(idea?.resultMediaIds) ? idea.resultMediaIds : [];
}

async function seedIfNeeded() {
  const existing = await getAll(IDEA_STORE);
  if (existing.length || localStorage.getItem(SEED_DISABLED_KEY) === "true") return;
  for (const seed of seedIdeas) {
    const now = new Date().toISOString();
    const imageId = uid("media");
    const blob = await makeCanvasImage(seed);
    await putRecord(IMAGE_STORE, {
      id: imageId,
      blob,
      mimeType: "image/jpeg",
      kind: "image",
      createdAt: now,
    });
    await putRecord(IDEA_STORE, {
      id: uid("idea"),
      theme: seed.theme,
      concept: seed.concept,
      date: "",
      specificPlace: "",
      status: "planned",
      mediaIds: [imageId],
      resultMediaIds: [],
      outfitTags: seed.outfitTags,
      accessoryTags: seed.accessoryTags,
      deviceTags: seed.deviceTags,
      poseTags: seed.poseTags,
      placeTypes: seed.placeTypes,
      note: seed.note,
      createdAt: now,
      updatedAt: now,
    });
  }
}

async function migrateMediaKinds() {
  const records = await getAll(IMAGE_STORE);
  for (const media of records) {
    if (media.kind) continue;
    await putRecord(IMAGE_STORE, {
      ...media,
      kind: media.mimeType?.startsWith("video/") ? "video" : "image",
    });
  }
}

async function migratePlanItems() {
  const [ideas, existingItems] = await Promise.all([getAll(IDEA_STORE), getAll(SHOT_ITEM_STORE)]);
  const legacyIds = new Set(existingItems.map((item) => item.legacyIdeaId).filter(Boolean));
  for (const idea of ideas) {
    const now = new Date().toISOString();
    if (!legacyIds.has(idea.id)) {
      await putRecord(SHOT_ITEM_STORE, {
        id: uid("item"),
        legacyIdeaId: idea.id,
        planId: idea.id,
        title: "整体拍摄灵感",
        description: idea.concept || "",
        note: idea.note || "",
        mediaIds: getIdeaMediaIds(idea),
        resultMediaIds: getResultMediaIds(idea),
        outfitTags: idea.outfitTags || [],
        accessoryTags: idea.accessoryTags || [],
        deviceTags: idea.deviceTags || [],
        poseTags: idea.poseTags || [],
        placeTypes: idea.placeTypes || [],
        status: idea.status === "captured" ? "completed" : "planned",
        sortOrder: 0,
        createdAt: idea.createdAt || now,
        updatedAt: idea.updatedAt || now,
      });
    }
    if (idea.structureVersion !== 2) {
      await putRecord(IDEA_STORE, {
        ...idea,
        concept: idea.concept || "",
        date: idea.date || "",
        specificPlace: idea.specificPlace || "",
        status: idea.status || "planned",
        structureVersion: 2,
        updatedAt: idea.updatedAt || now,
      });
    }
  }
}

async function migrateSeedImages() {
  const ideas = await getAll(IDEA_STORE);
  const catByTheme = {
    "秋冬氛围": "./assets/cat-winter.png",
    "日落海边": "./assets/cat-happy.png",
    "咖啡厅日常": "./assets/cat-camera.png",
    "图书馆安静感": "./assets/cat-planning.png",
  };
  for (const idea of ideas) {
    const imageId = getIdeaMediaIds(idea)[0];
    const assetPath = catByTheme[idea.theme];
    if (!imageId || !assetPath || idea.seedCatMigrated) continue;
    const response = await fetch(assetPath);
    const blob = await response.blob();
    await putRecord(IMAGE_STORE, {
      id: imageId,
      blob,
      mimeType: "image/png",
      kind: "image",
      createdAt: idea.createdAt || new Date().toISOString(),
    });
    await putRecord(IDEA_STORE, { ...idea, seedCatMigrated: true });
  }
}

async function loadData() {
  for (const url of state.mediaUrls.values()) URL.revokeObjectURL(url.replace("#video", ""));
  state.mediaUrls = new Map();
  const [ideas, shotItems, templates, mediaRecords] = await Promise.all([
    getAll(IDEA_STORE),
    getAll(SHOT_ITEM_STORE),
    getAll(TEMPLATE_STORE),
    getAll(IMAGE_STORE),
  ]);
  for (const media of mediaRecords) {
    const suffix = media.kind === "video" || media.mimeType?.startsWith("video/") ? "#video" : "";
    state.mediaUrls.set(media.id, `${URL.createObjectURL(media.blob)}${suffix}`);
  }
  state.mediaRecords = mediaRecords;
  state.ideas = ideas
    .map((idea) => ({
      ...idea,
      theme: idea.theme || "未命名企划",
      concept: idea.concept || "",
      specificPlace: idea.specificPlace || "",
      date: idea.date || "",
      status: idea.status || "planned",
    }))
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  state.shotItems = shotItems
    .map(normalizeShotItem)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || String(a.createdAt).localeCompare(String(b.createdAt)));
  state.templates = templates.map(normalizeTemplate).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function normalizeShotItem(item) {
  return {
    ...item,
    title: item.title || "未命名小企划",
    description: item.description || "",
    note: item.note || "",
    mediaIds: Array.isArray(item.mediaIds) ? item.mediaIds : [],
    resultMediaIds: Array.isArray(item.resultMediaIds) ? item.resultMediaIds : [],
    outfitTags: item.outfitTags || [],
    accessoryTags: item.accessoryTags || [],
    deviceTags: item.deviceTags || [],
    poseTags: item.poseTags || [],
    placeTypes: item.placeTypes || [],
    status: item.status || "planned",
  };
}

function normalizeTemplate(template) {
  return {
    ...template,
    title: template.title || "未命名模板",
    description: template.description || "",
    note: template.note || "",
    mediaIds: Array.isArray(template.mediaIds) ? template.mediaIds : [],
    outfitTags: template.outfitTags || [],
    accessoryTags: template.accessoryTags || [],
    deviceTags: template.deviceTags || [],
    poseTags: template.poseTags || [],
    placeTypes: template.placeTypes || [],
  };
}

function mediaRecord(id) {
  return state.mediaRecords.find((media) => media.id === id);
}

function mediaUrl(id) {
  return state.mediaUrls.get(id) || "";
}

function planItems(planId) {
  return state.shotItems.filter((item) => item.planId === planId);
}

function allPlanTags(plan) {
  const items = planItems(plan.id);
  return {
    outfitTags: unique(items.flatMap((item) => item.outfitTags)),
    accessoryTags: unique(items.flatMap((item) => item.accessoryTags)),
    deviceTags: unique(items.flatMap((item) => item.deviceTags)),
    poseTags: unique(items.flatMap((item) => item.poseTags)),
    placeTypes: unique(items.flatMap((item) => item.placeTypes)),
  };
}

function flatPlanTags(plan) {
  const tags = allPlanTags(plan);
  return unique([
    ...tags.placeTypes,
    ...tags.outfitTags,
    ...tags.accessoryTags,
    ...tags.deviceTags,
    ...tags.poseTags,
  ]);
}

function planProgress(plan) {
  const items = planItems(plan.id);
  const done = items.filter((item) => item.status === "completed").length;
  return { done, total: items.length };
}

function coverMediaId(plan) {
  if (plan.coverMediaId) return plan.coverMediaId;
  const items = planItems(plan.id);
  const result = items.flatMap((item) => item.resultMediaIds)[0];
  return result || items.flatMap((item) => item.mediaIds)[0] || "";
}

function shouldShowBottomNav() {
  return !(
    state.filterOpen ||
    state.settingsOpen ||
    state.viewingIdeaId ||
    state.viewingTemplateId ||
    state.viewerMediaId ||
    state.editingPlanId ||
    state.editingItemId ||
    state.editingTemplateId ||
    state.templateTargetId ||
    state.sharingIdeaId
  );
}

function optionsFor(key) {
  return unique(state.shotItems.flatMap((item) => item[key] || [])).sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function themes() {
  return unique(state.ideas.map((idea) => idea.theme)).sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function getFilteredPlans(status) {
  return state.ideas.filter((plan) => {
    if (plan.status !== status) return false;
    if (state.filters.theme !== "全部" && plan.theme !== state.filters.theme) return false;
    const tags = allPlanTags(plan);
    if (state.filters.outfit && !tags.outfitTags.includes(state.filters.outfit)) return false;
    if (state.filters.accessory && !tags.accessoryTags.includes(state.filters.accessory)) return false;
    if (state.filters.device && !tags.deviceTags.includes(state.filters.device)) return false;
    if (state.filters.pose && !tags.poseTags.includes(state.filters.pose)) return false;
    if (state.filters.place && !tags.placeTypes.includes(state.filters.place)) return false;
    return true;
  });
}

function renderMedia(id, alt, className = "") {
  const url = mediaUrl(id);
  if (!url) return "";
  if (url.includes("#video")) {
    return `<video class="${className}" src="${url.replace("#video", "")}" muted loop playsinline controls aria-label="${escapeHtml(alt)}"></video>`;
  }
  return `<img class="${className}" src="${url}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />`;
}

function renderMediaThumb(id, alt, options = {}) {
  const { showBadge = true } = options;
  const media = mediaRecord(id);
  const url = mediaUrl(id);
  if (!url) return "";
  const badge = showBadge && media?.kind === "collage" ? `<span class="media-badge">${media.collageLayout === 9 ? "九宫格" : "四宫格"}</span>` : "";
  if (url.includes("#video")) {
    return `<video src="${url.replace("#video", "")}" muted playsinline preload="metadata" aria-label="${escapeHtml(alt)}"></video>${showBadge ? '<span class="media-badge">视频</span>' : ""}`;
  }
  return `<img src="${url}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />${badge}`;
}

function tagChips(tags, className = "") {
  return tags.map((tag) => `<span class="chip ${className}">${escapeHtml(tag)}</span>`).join("");
}

function categorizedTagChips(item, limit = Infinity) {
  const groups = [
    { tags: item.placeTypes || [], className: "sage" },
    { tags: item.outfitTags || [], className: "sky" },
    { tags: item.accessoryTags || [], className: "accessory" },
    { tags: item.deviceTags || [], className: "device" },
    { tags: item.poseTags || [], className: "pose" },
  ];
  const chips = [];
  for (const group of groups) {
    for (const tag of group.tags) {
      if (chips.some((chip) => chip.tag === tag)) continue;
      chips.push({ tag, className: group.className });
      if (chips.length >= limit) break;
    }
    if (chips.length >= limit) break;
  }
  return chips.map((chip) => `<span class="chip ${chip.className}">${escapeHtml(chip.tag)}</span>`).join("");
}

function render() {
  const planned = getFilteredPlans("planned");
  const captured = getFilteredPlans("captured");
  const plannedTotal = state.ideas.filter((idea) => idea.status === "planned").length;
  const capturedTotal = state.ideas.filter((idea) => idea.status === "captured").length;

  app.innerHTML = `
    <main class="shell app-shell">
      <header class="topbar compact-topbar">
        <div class="brand">
          <div class="brand-mark"><img src="./assets/cat-planning.png" alt="计划拍摄的小猫" /></div>
          <div class="brand-copy">
            <p class="eyebrow">MIAO'S PHOTO NOTES</p>
            <h1>拍照灵感搭配库</h1>
          </div>
        </div>
        <button class="settings-button icon-label" data-action="open-settings">${icons.settings}<span>设置</span></button>
      </header>

      <section class="hero compact-hero">
        <div class="hero-copy">
          <span class="hero-kicker">今日份灵感</span>
          <h2>把想拍的画面，先悄悄藏进这里。</h2>
          <p>下一次出发，会有好多好看的照片。</p>
        </div>
        <div class="hero-side">
          <img class="hero-cat" src="./assets/cat-camera.png" alt="抱着相机的小猫" />
          <div class="hero-stats">
            <div class="stat"><strong>${state.ideas.length}</strong><span>企划</span></div>
            <div class="stat"><strong>${plannedTotal}/${capturedTotal}</strong><span>想拍 / 已拍</span></div>
          </div>
        </div>
      </section>

      ${renderMainContent(planned, captured)}
    </main>
    ${shouldShowBottomNav() ? renderBottomNav() : ""}
    ${renderFilterDrawer()}
    ${renderPlanDetail()}
    ${renderTemplateDetail()}
    ${renderMediaViewer()}
    ${renderPlanDrawer()}
    ${renderItemDrawer()}
    ${renderTemplateDrawer()}
    ${renderTemplateTargetDialog()}
    ${renderSettings()}
    ${renderShareDialog()}
    <div class="toast" id="toast"></div>
  `;

  applySettings();
  translateInterface();
  bindEvents();
  if (state.pendingDetailScrollRestore) scheduleDetailScrollRestore();
}

function renderMainContent(planned, captured) {
  if (state.activeView === "templates") return renderTemplatesPage();
  const status = state.activeView === "captured" ? "captured" : "planned";
  const plans = status === "captured" ? captured : planned;
  const title = status === "captured" ? "已拍作品" : "拍摄企划";
  const kicker = status === "captured" ? "MY WORKS" : "PLANNED SHOOTS";
  const copy = status === "captured" ? `${plans.length} 个已经完成的企划。` : `${plans.length} 个还想拍的计划。`;
  return `
    <section class="mobile-toolbar">
      <button class="ghost-btn" data-action="open-filters">${icons.filter}<span>筛选</span></button>
      <button class="text-btn" data-action="clear-filters">清空筛选</button>
    </section>
    <section class="plans-section" id="${status === "captured" ? "captured-section" : "planned-section"}">
      <div class="section-head slim-head">
        <div><span class="section-kicker">${kicker}</span><h2>${title}</h2><p>${copy}</p></div>
      </div>
      ${plans.length ? `<div class="plan-list">${plans.map(renderPlanCard).join("")}</div>` : renderListEmpty(status)}
    </section>
  `;
}

function renderPlanCard(plan) {
  const progress = planProgress(plan);
  const cover = coverMediaId(plan);
  const tags = allPlanTags(plan);
  return `
    <article class="plan-card" data-action="open-plan" data-id="${plan.id}">
      <div class="plan-cover">${cover ? renderMedia(cover, `${plan.theme}封面`) : '<span>等待封面</span>'}</div>
      <div class="plan-card-body">
        <div class="plan-card-title">
          <div>
            <span class="status-pill inline">${plan.status === "captured" ? "已拍" : "想拍"}</span>
            <h3>${escapeHtml(plan.theme)}</h3>
          </div>
          <div class="plan-card-actions">
            <button class="icon-btn mini" title="分享" data-action="open-share" data-id="${plan.id}">${icons.share}</button>
            <button class="icon-btn mini" title="编辑" data-action="edit-plan" data-id="${plan.id}">${icons.edit}</button>
            <button class="icon-btn mini" title="删除" data-action="delete-plan" data-id="${plan.id}">${icons.trash}</button>
          </div>
        </div>
        ${plan.concept ? `<p class="plan-copy">${escapeHtml(plan.concept)}</p>` : ""}
        <p class="plan-meta">${escapeHtml([plan.date, plan.specificPlace || "未定地点"].filter(Boolean).join(" · "))}</p>
        <div class="progress-line"><span style="width:${progress.total ? (progress.done / progress.total) * 100 : 0}%"></span></div>
        <div class="plan-bottom"><span>${progress.done}/${progress.total} 小企划</span><div class="chip-row">${categorizedTagChips(tags, 3).replaceAll("chip ", "chip tiny ")}</div></div>
      </div>
    </article>
  `;
}

function renderListEmpty(status) {
  return `
    <div class="empty-compact">
      <h3>${status === "captured" ? "还没有已拍作品" : "还没有拍摄企划"}</h3>
      <p>${status === "captured" ? "拍完之后可以把企划移到这里，再上传成片。" : "先新建一个主题，再往里面加具体想拍的小企划。"}</p>
      <button class="primary-btn" data-action="open-plan-form">${icons.plus}<span>新建企划</span></button>
    </div>
  `;
}

function renderTemplatesPage() {
  return `
    <section class="plans-section">
      <div class="section-head slim-head">
        <div><span class="section-kicker">TEMPLATES</span><h2>万能模板</h2><p>不绑定地点，随时复制进某个拍摄企划。</p></div>
        <button class="ghost-btn" data-action="open-template-form">${icons.plus}<span>新建模板</span></button>
      </div>
      ${
        state.templates.length
          ? `<div class="template-list">${state.templates.map(renderTemplateCard).join("")}</div>`
          : `<div class="empty-compact"><h3>还没有模板</h3><p>可以先保存“御姐站姿”“萌妹拍照姿势”“长焦适合镜头”等万能清单。</p><button class="primary-btn" data-action="open-template-form">${icons.plus}<span>创建模板</span></button></div>`
      }
    </section>
  `;
}

function renderTemplateCard(template) {
  const cover = template.mediaIds[0];
  return `
    <article class="template-card" data-action="open-template" data-id="${template.id}">
      <div class="template-cover">${cover ? renderMedia(cover, `${template.title}参考`) : icons.list}</div>
      <div class="template-body">
        <h3>${escapeHtml(template.title)}</h3>
        ${template.description ? `<p>${escapeHtml(template.description)}</p>` : ""}
        <div class="chip-row">${categorizedTagChips(template, 5).replaceAll("chip ", "chip tiny ")}</div>
        ${template.note ? `<p class="template-note">${escapeHtml(template.note)}</p>` : ""}
        <div class="template-actions">
          <button class="ghost-btn small-btn" data-action="open-template" data-id="${template.id}">查看</button>
          <button class="primary-btn small-btn" data-action="copy-template" data-id="${template.id}">${icons.plus}<span>加入企划</span></button>
          <button class="icon-btn" data-action="edit-template" data-id="${template.id}" title="编辑">${icons.edit}</button>
          <button class="icon-btn" data-action="delete-template" data-id="${template.id}" title="删除">${icons.trash}</button>
        </div>
      </div>
    </article>
  `;
}

function renderTemplateDetail() {
  const template = state.templates.find((item) => item.id === state.viewingTemplateId);
  if (!template) return "";
  return `
    <div class="drawer-backdrop theme-backdrop open" data-action="close-template">
      <section class="theme-detail layered-detail" data-stop-close>
        <div class="drawer-head">
          <div>
            <p class="eyebrow">TEMPLATE</p>
            <h2>${escapeHtml(template.title)}</h2>
            <p class="detail-summary">${escapeHtml(template.description || "万能拍照模板")}</p>
          </div>
          <div class="detail-head-actions">
            <button class="primary-btn small-btn" data-action="copy-template" data-id="${template.id}">${icons.plus}<span>加入企划</span></button>
            <button class="icon-btn" title="编辑模板" data-action="edit-template" data-id="${template.id}">${icons.edit}</button>
            <button class="icon-btn" title="删除模板" data-action="delete-template" data-id="${template.id}">${icons.trash}</button>
            <button class="icon-btn" data-action="close-template" title="关闭">${icons.close}</button>
          </div>
        </div>
        <div class="theme-detail-body">
          <section class="detail-section">
            <div class="detail-section-head"><div><span class="section-kicker">REFERENCES</span><h3>参考图片与视频</h3></div><span>${template.mediaIds.length} 个</span></div>
            ${renderDetailMediaGrid(template.mediaIds, `${template.title}参考`, "还没有参考素材")}
          </section>
          <section class="detail-section">
            <div class="detail-section-head"><div><span class="section-kicker">TAGS</span><h3>标签</h3></div></div>
            <div class="detail-tags">${categorizedTagChips(template) || "<span class='muted'>还没有标签</span>"}</div>
          </section>
          ${template.note ? `<section class="detail-section"><div class="detail-section-head"><div><span class="section-kicker">NOTE</span><h3>备注</h3></div></div><p class="idea-note">${escapeHtml(template.note)}</p></section>` : ""}
        </div>
      </section>
    </div>
  `;
}

function renderBottomNav() {
  return `
    <nav class="bottom-nav" aria-label="主导航">
      <button class="${state.activeView === "planned" ? "active" : ""}" data-action="set-view" data-view="planned">${icons.camera}<span>想拍</span></button>
      <button class="${state.activeView === "captured" ? "active" : ""}" data-action="set-view" data-view="captured">${icons.check}<span>已拍</span></button>
      <button class="nav-add" data-action="open-plan-form">${icons.plus}<span>新增</span></button>
      <button class="${state.activeView === "templates" ? "active" : ""}" data-action="set-view" data-view="templates">${icons.list}<span>模板</span></button>
    </nav>
  `;
}

function renderFilterDrawer() {
  const themeButtons = ["全部", ...themes()]
    .map((theme) => `<button class="chip ${state.filters.theme === theme ? "active" : ""}" data-action="set-theme" data-theme="${escapeHtml(theme)}">${escapeHtml(theme)}</button>`)
    .join("");
  return `
    <div class="sheet-backdrop ${state.filterOpen ? "open" : ""}" data-action="close-filters">
      <aside class="filter-sheet" data-stop-close>
        <div class="drawer-head"><div><p class="eyebrow">FILTER</p><h2>${icons.filter}筛选</h2></div><button class="icon-btn" data-action="close-filters">${icons.close}</button></div>
        <div class="filter-content">
          <div class="filter-block"><span class="filter-label">风格主题</span><div class="chip-row">${themeButtons}</div></div>
          ${renderSelectFilter("outfit", "衣服造型", optionsFor("outfitTags"))}
          ${renderSelectFilter("accessory", "配饰", optionsFor("accessoryTags"))}
          ${renderSelectFilter("device", "拍摄设备", optionsFor("deviceTags"))}
          ${renderSelectFilter("pose", "姿势构图", optionsFor("poseTags"))}
          ${renderSelectFilter("place", "适配地点类型", optionsFor("placeTypes"))}
          <button class="text-btn" data-action="clear-filters">清空筛选</button>
        </div>
      </aside>
    </div>
  `;
}

function renderSelectFilter(key, label, values) {
  return `
    <div class="field">
      <label for="filter-${key}">${label}</label>
      <select id="filter-${key}" data-action="select-filter" data-filter="${key}">
        <option value="">全部</option>
        ${values.map((value) => `<option value="${escapeHtml(value)}" ${state.filters[key] === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}
      </select>
    </div>
  `;
}

function renderPlanDetail() {
  const plan = state.ideas.find((item) => item.id === state.viewingIdeaId);
  if (!plan) return "";
  const items = planItems(plan.id);
  const progress = planProgress(plan);
  const allDone = progress.total > 0 && progress.done === progress.total;
  const planTags = categorizedTagChips(allPlanTags(plan));
  return `
    <div class="drawer-backdrop theme-backdrop open" data-action="close-plan">
      <section class="theme-detail layered-detail" data-stop-close>
        <div class="drawer-head">
          <div>
            <p class="eyebrow">${plan.status === "captured" ? "MY WORK" : "SHOT PLAN"}</p>
            <h2>${escapeHtml(plan.theme)}</h2>
            <p class="detail-summary">${escapeHtml(plan.concept || "拍摄企划详情")}</p>
          </div>
          <div class="detail-head-actions">
            <button class="icon-btn" title="分享" data-action="open-share" data-id="${plan.id}">${icons.share}</button>
            <button class="icon-btn" title="编辑企划" data-action="edit-plan" data-id="${plan.id}">${icons.edit}</button>
            <button class="icon-btn" title="删除企划" data-action="delete-plan" data-id="${plan.id}">${icons.trash}</button>
            <button class="icon-btn" data-action="close-plan" title="关闭">${icons.close}</button>
          </div>
        </div>
        <div class="theme-detail-body">
          ${
            plan.concept
              ? `<section class="detail-section plan-note-section"><div class="detail-section-head"><div><span class="section-kicker">NOTE</span><h3>备注</h3></div></div><p class="idea-note">${escapeHtml(plan.concept)}</p></section>`
              : ""
          }
          <section class="detail-section plan-tags-section">
            <div class="detail-section-head"><div><span class="section-kicker">TAGS</span><h3>标签 🏷️</h3></div></div>
            <div class="detail-tags">${planTags || "<span class='muted'>还没有标签</span>"}</div>
          </section>
          <section class="detail-section">
            <div class="detail-section-head"><div><span class="section-kicker">CHECKLIST</span><h3>小企划清单</h3></div><span>${progress.done}/${progress.total}</span></div>
            <div class="progress-line detail-progress"><span style="width:${progress.total ? (progress.done / progress.total) * 100 : 0}%"></span></div>
            <div class="detail-actions-row">
              <button class="primary-btn" data-action="open-item-form" data-plan-id="${plan.id}">${icons.plus}<span>添加小企划</span></button>
              ${allDone && plan.status === "planned" ? `<button class="ghost-btn complete-plan-btn" data-action="mark-plan-captured" data-id="${plan.id}">${icons.check}<span>全部完成，标记已拍</span></button>` : ""}
              ${plan.status === "captured" ? `<button class="ghost-btn" data-action="mark-plan-planned" data-id="${plan.id}">移回想拍</button>` : ""}
            </div>
            <div class="shot-list">${items.length ? items.map((item, index) => renderShotItem(item, index, items.length)).join("") : `<div class="empty-compact inline-empty"><h3>还没有小企划</h3><p>比如“双人生日合照”“苹果 6s 氛围照”“长焦适合镜头”。</p></div>`}</div>
          </section>
          <section class="detail-section">
            <div class="detail-section-head"><div><span class="section-kicker">MY PHOTOS</span><h3>我的已拍作品</h3></div><span>${items.flatMap((item) => item.resultMediaIds).length} 个</span></div>
            ${renderDetailMediaGrid(items.flatMap((item) => item.resultMediaIds), `${plan.theme}成片`, "完成拍摄后，可以在小企划里上传成片")}
          </section>
        </div>
      </section>
    </div>
  `;
}

function renderShotItem(item, index, total) {
  const expanded = state.expandedItemIds.has(item.id);
  const tags = unique([...item.placeTypes, ...item.outfitTags, ...item.accessoryTags, ...item.deviceTags, ...item.poseTags]);
  const thumbs = [...item.mediaIds, ...item.resultMediaIds].slice(0, 3);
  return `
    <article class="shot-item ${expanded ? "expanded" : ""}">
      <button class="shot-summary" data-action="toggle-item" data-id="${item.id}">
        <span class="shot-check ${item.status === "completed" ? "done" : ""}">${item.status === "completed" ? icons.check : ""}</span>
        <span class="shot-main"><strong>${escapeHtml(item.title)}</strong>${item.description ? `<small>${escapeHtml(item.description)}</small>` : ""}</span>
        <span class="shot-mini-tags">${tags.slice(0, 3).map((tag) => `<em>${escapeHtml(tag)}</em>`).join("")}</span>
        <span class="shot-thumbs">${thumbs.map((id) => `<i>${renderMediaThumb(id, item.title, { showBadge: false })}</i>`).join("")}</span>
      </button>
      ${
        expanded
          ? `<div class="shot-body">
              <div class="shot-actions">
                <button class="ghost-btn" data-action="toggle-item-status" data-id="${item.id}">${item.status === "completed" ? "改回未完成" : "勾选完成"}</button>
                <button class="icon-btn" data-action="move-item" data-id="${item.id}" data-dir="-1" ${index === 0 ? "disabled" : ""}>↑</button>
                <button class="icon-btn" data-action="move-item" data-id="${item.id}" data-dir="1" ${index === total - 1 ? "disabled" : ""}>↓</button>
                <button class="icon-btn" data-action="edit-item" data-id="${item.id}">${icons.edit}</button>
                <button class="icon-btn" data-action="delete-item" data-id="${item.id}">${icons.trash}</button>
              </div>
              <div class="detail-tags">${categorizedTagChips(item)}</div>
              ${item.note ? `<p class="idea-note">${escapeHtml(item.note)}</p>` : ""}
              <div class="item-media-block"><div class="detail-section-head"><div><span class="section-kicker">REFERENCES</span><h3>参考素材</h3></div>${renderQuickUploadControl(item.id, "item-reference", "添加参考")}</div>${renderManagedMediaGrid(item.mediaIds, item.id, "reference")}</div>
              <div class="item-media-block"><div class="detail-section-head"><div><span class="section-kicker">MY PHOTOS</span><h3>成片</h3></div>${renderQuickUploadControl(item.id, "item-result", "添加成片")}</div>${renderManagedMediaGrid(item.resultMediaIds, item.id, "result")}</div>
            </div>`
          : ""
      }
    </article>
  `;
}

function renderQuickUploadControl(itemId, target, label) {
  const key = `quick-${target}-${itemId}`;
  const draft = getDraft(key);
  const needsImages = draft.layout === "grid4" || draft.layout === "grid9";
  return `
    <div class="quick-upload">
      <div class="setting-segmented compact-segmented">
        <button type="button" data-action="set-upload-layout" data-upload-key="${key}" data-layout="single" class="${draft.layout === "single" ? "active" : ""}">单张</button>
        <button type="button" data-action="set-upload-layout" data-upload-key="${key}" data-layout="grid4" class="${draft.layout === "grid4" ? "active" : ""}">四宫格</button>
        <button type="button" data-action="set-upload-layout" data-upload-key="${key}" data-layout="grid9" class="${draft.layout === "grid9" ? "active" : ""}">九宫格</button>
      </div>
      <label class="upload-result-btn small-upload">${icons.plus}<span>${escapeHtml(label)}</span><input data-upload-target="${target}" data-upload-key="${key}" data-item-id="${itemId}" type="file" accept="${needsImages ? "image/*" : "image/*,video/*"}" multiple /></label>
    </div>
  `;
}

function renderManagedMediaGrid(ids, itemId, slot) {
  if (!ids.length) return `<div class="detail-no-media simple-empty"><span>还没有素材</span></div>`;
  return `
    <div class="detail-media-grid managed-media">
      ${ids
        .map(
          (id) => `<div class="managed-media-item">
            <button class="detail-media-item" data-action="open-viewer" data-media-id="${id}">${renderMediaThumb(id, "素材")}</button>
            <div class="media-actions">
              <button class="icon-btn mini" title="下载" data-action="download-media" data-media-id="${id}">${icons.download}</button>
              <button class="icon-btn mini" title="删除" data-action="delete-media" data-item-id="${itemId}" data-media-id="${id}" data-slot="${slot}">${icons.trash}</button>
            </div>
          </div>`,
        )
        .join("")}
    </div>
  `;
}

function renderDetailMediaGrid(ids, alt, emptyCopy) {
  if (!ids.length) return `<div class="detail-no-media no-cat"><span>${escapeHtml(emptyCopy)}</span></div>`;
  return `
    <div class="detail-media-grid">
      ${ids.map((id) => `<button class="detail-media-item" data-action="open-viewer" data-media-id="${id}" title="点开查看">${renderMediaThumb(id, alt)}</button>`).join("")}
    </div>
  `;
}

function renderMediaViewer() {
  if (!state.viewerMediaId) return "";
  const url = mediaUrl(state.viewerMediaId);
  if (!url) return "";
  const isVideo = url.includes("#video");
  const currentIndex = Math.max(0, state.viewerMediaIds.indexOf(state.viewerMediaId));
  const canBrowse = state.viewerMediaIds.length > 1;
  return `
    <div class="media-viewer-backdrop" data-action="close-viewer">
      <div class="media-viewer" data-stop-close>
        <div class="viewer-toolbar">
          ${canBrowse ? `<span class="viewer-counter">${currentIndex + 1} / ${state.viewerMediaIds.length}</span>` : ""}
          <button class="icon-btn" data-action="download-media" data-media-id="${state.viewerMediaId}" title="下载">${icons.download}</button>
          ${isVideo ? "" : '<button class="icon-btn" data-action="zoom-out" title="缩小">−</button><button class="icon-btn zoom-reset" data-action="zoom-reset" title="恢复原始大小">1:1</button><button class="icon-btn" data-action="zoom-in" title="放大">+</button>'}
          <button class="icon-btn" data-action="close-viewer" title="关闭">${icons.close}</button>
        </div>
        <div class="viewer-stage" id="viewer-stage">
          ${canBrowse ? '<button class="viewer-nav viewer-prev" data-action="viewer-prev" title="上一张">‹</button>' : ""}
          ${isVideo ? `<video src="${url.replace("#video", "")}" controls autoplay playsinline></video>` : `<img src="${url}" alt="放大的照片" style="transform: scale(${state.viewerZoom})" />`}
          ${canBrowse ? '<button class="viewer-nav viewer-next" data-action="viewer-next" title="下一张">›</button>' : ""}
        </div>
      </div>
    </div>
  `;
}

function renderPlanDrawer() {
  const editing = state.editingPlanId && state.editingPlanId !== "new" ? state.ideas.find((idea) => idea.id === state.editingPlanId) : null;
  if (!state.editingPlanId) return "";
  const coverId = editing?.coverMediaId || "";
  const draftKey = `plan-${state.editingPlanId}`;
  return `
    <div class="drawer-backdrop open" data-action="close-plan-form">
      <section class="drawer" data-stop-close>
        <div class="drawer-head"><div><p class="eyebrow">${editing ? "EDIT PLAN" : "NEW PLAN"}</p><h2>${editing ? "编辑拍摄企划" : "新增拍摄企划"}</h2></div><button class="icon-btn" data-action="close-plan-form">${icons.close}</button></div>
        <form class="form" id="plan-form" data-draft-key="${draftKey}">
          <div class="field"><label for="theme">企划名称</label><input id="theme" name="theme" data-draft-key="${draftKey}" data-draft-field="theme" value="${escapeHtml(draftValue(draftKey, "theme", editing?.theme || ""))}" placeholder="例如 生日写真、日落海边、咖啡厅日常" required /></div>
          <div class="field"><label for="concept">企划说明（可选）</label><textarea id="concept" name="concept" data-draft-key="${draftKey}" data-draft-field="concept" placeholder="例如 想拍一组生日餐厅、合照和室外散步的照片">${escapeHtml(draftValue(draftKey, "concept", editing?.concept || ""))}</textarea></div>
          ${renderCoverUpload(coverId)}
          <div class="form-grid">
            <div class="field"><label for="date">日期（可选）</label><input id="date" name="date" type="date" data-draft-key="${draftKey}" data-draft-field="date" value="${escapeHtml(draftValue(draftKey, "date", editing?.date || ""))}" /></div>
            <div class="field"><label for="specificPlace">总地点（可选）</label><input id="specificPlace" name="specificPlace" data-draft-key="${draftKey}" data-draft-field="specificPlace" value="${escapeHtml(draftValue(draftKey, "specificPlace", editing?.specificPlace || ""))}" placeholder="例如 云南、某家餐厅、海边" /></div>
          </div>
          <div class="form-actions"><button type="button" class="ghost-btn" data-action="close-plan-form">取消</button><button type="submit" class="primary-btn">${editing ? "保存修改" : "保存企划"}</button></div>
        </form>
      </section>
    </div>
  `;
}

function renderCoverUpload(existingCoverId = "") {
  const draft = getDraft("plan-cover");
  const previews = [
    ...(existingCoverId ? [{ id: existingCoverId, url: mediaUrl(existingCoverId), label: "当前封面" }] : []),
    ...draft.urls.map((url, index) => ({ id: `new-${index}`, url, label: "新增封面" })),
  ].filter((item) => item.url);
  return `
    <div class="upload-box cover-upload">
      <div class="upload-layout">
        <span>企划封面（可选）</span>
        <span class="tag-help">上传一张封面图；不传会自动用小企划里的第一张素材。</span>
      </div>
      <div class="preview-frame cover-preview ${previews.length ? "has-image" : ""}">
        ${previews.length ? renderPreviewItems(previews, "plan-cover") : "<span>选择一张封面图</span>"}
      </div>
      <input data-upload-key="plan-cover" type="file" accept="image/*" />
    </div>
  `;
}

function renderItemDrawer() {
  const editing = state.editingItemId && state.editingItemId !== "new" ? state.shotItems.find((item) => item.id === state.editingItemId) : null;
  if (!state.editingItemId) return "";
  const planId = editing?.planId || state.viewingIdeaId;
  const draftKey = `item-${state.editingItemId}`;
  return `
    <div class="drawer-backdrop open" data-action="close-item-form">
      <section class="drawer" data-stop-close>
        <div class="drawer-head"><div><p class="eyebrow">${editing ? "EDIT ITEM" : "NEW ITEM"}</p><h2>${editing ? "编辑小企划" : "新增小企划"}</h2></div><button class="icon-btn" data-action="close-item-form">${icons.close}</button></div>
        <form class="form" id="item-form" data-plan-id="${planId || ""}" data-draft-key="${draftKey}">
          ${renderShotFields(editing, "item", draftKey)}
          <div class="form-actions"><button type="button" class="ghost-btn" data-action="close-item-form">取消</button><button type="submit" class="primary-btn">${editing ? "保存修改" : "保存小企划"}</button></div>
        </form>
      </section>
    </div>
  `;
}

function renderTemplateDrawer() {
  const editing = state.editingTemplateId && state.editingTemplateId !== "new" ? state.templates.find((template) => template.id === state.editingTemplateId) : null;
  if (!state.editingTemplateId) return "";
  const draftKey = `template-${state.editingTemplateId}`;
  return `
    <div class="drawer-backdrop open" data-action="close-template-form">
      <section class="drawer" data-stop-close>
        <div class="drawer-head"><div><p class="eyebrow">${editing ? "EDIT TEMPLATE" : "NEW TEMPLATE"}</p><h2>${editing ? "编辑万能模板" : "新增万能模板"}</h2></div><button class="icon-btn" data-action="close-template-form">${icons.close}</button></div>
        <form class="form" id="template-form" data-draft-key="${draftKey}">
          ${renderShotFields(editing, "template", draftKey)}
          <div class="form-actions"><button type="button" class="ghost-btn" data-action="close-template-form">取消</button><button type="submit" class="primary-btn">${editing ? "保存修改" : "保存模板"}</button></div>
        </form>
      </section>
    </div>
  `;
}

function renderShotFields(editing, prefix, formDraftKey) {
  const existingMediaIds = editing?.mediaIds || [];
  const draftKey = `${prefix}-reference`;
  return `
    <div class="field"><label for="${prefix}-title">名称</label><input id="${prefix}-title" name="title" data-draft-key="${formDraftKey}" data-draft-field="title" value="${escapeHtml(draftValue(formDraftKey, "title", editing?.title || ""))}" placeholder="例如 双人生日合照、御姐站姿、苹果 6s 氛围照" required /></div>
    <div class="field"><label for="${prefix}-description">具体想拍什么（可选）</label><input id="${prefix}-description" name="description" data-draft-key="${formDraftKey}" data-draft-field="description" value="${escapeHtml(draftValue(formDraftKey, "description", editing?.description || ""))}" placeholder="例如 靠窗坐着举杯，拍半身和手部细节" /></div>
    ${renderUploadDraft(draftKey, existingMediaIds, "参考图 / 视频（可选）")}
    <div class="field"><label for="${prefix}-outfitTags">衣服/造型标签（可选）</label><input id="${prefix}-outfitTags" name="outfitTags" data-draft-key="${formDraftKey}" data-draft-field="outfitTags" value="${escapeHtml(draftValue(formDraftKey, "outfitTags", (editing?.outfitTags || []).join("，")))}" placeholder="白裙，针织衫，西装外套" /><span class="tag-help">用逗号、顿号或换行分隔。</span></div>
    <div class="form-grid">
      <div class="field"><label for="${prefix}-accessoryTags">配饰标签（可选）</label><input id="${prefix}-accessoryTags" name="accessoryTags" data-draft-key="${formDraftKey}" data-draft-field="accessoryTags" value="${escapeHtml(draftValue(formDraftKey, "accessoryTags", (editing?.accessoryTags || []).join("，")))}" placeholder="耳环，草帽，项链，手机" /></div>
      <div class="field"><label for="${prefix}-deviceTags">拍摄设备标签（可选）</label><input id="${prefix}-deviceTags" name="deviceTags" data-draft-key="${formDraftKey}" data-draft-field="deviceTags" value="${escapeHtml(draftValue(formDraftKey, "deviceTags", (editing?.deviceTags || []).join("，")))}" placeholder="手机，微单，长焦，补光灯" /></div>
    </div>
    <div class="field"><label for="${prefix}-poseTags">姿势/构图标签（可选）</label><input id="${prefix}-poseTags" name="poseTags" data-draft-key="${formDraftKey}" data-draft-field="poseTags" value="${escapeHtml(draftValue(formDraftKey, "poseTags", (editing?.poseTags || []).join("，")))}" placeholder="站姿，坐姿，侧脸，背影" /></div>
    <div class="field"><label for="${prefix}-placeTypes">适配地点类型（可选）</label><input id="${prefix}-placeTypes" name="placeTypes" data-draft-key="${formDraftKey}" data-draft-field="placeTypes" value="${escapeHtml(draftValue(formDraftKey, "placeTypes", (editing?.placeTypes || []).join("，")))}" placeholder="海边，咖啡厅，餐厅，室外" /></div>
    <div class="field"><label for="${prefix}-note">备注（可选）</label><textarea id="${prefix}-note" name="note" data-draft-key="${formDraftKey}" data-draft-field="note" placeholder="光线、道具、拍摄提醒">${escapeHtml(draftValue(formDraftKey, "note", editing?.note || ""))}</textarea></div>
  `;
}

function renderUploadDraft(key, existingMediaIds = [], label = "上传素材") {
  const draft = getDraft(key);
  const needsImages = draft.layout === "grid4" || draft.layout === "grid9";
  const previews = [
    ...existingMediaIds.map((id) => ({ id, url: mediaUrl(id), label: mediaRecord(id)?.collageLayout ? `${mediaRecord(id).collageLayout === 9 ? "九宫格" : "四宫格"}` : "已保存" })),
    ...draft.urls.map((url, index) => ({ id: `new-${index}`, url, label: draft.layout === "single" ? "新增素材" : draft.layout === "grid4" ? "四宫格素材" : "九宫格素材" })),
  ];
  return `
    <div class="upload-box">
      <div class="upload-layout">
        <span>${escapeHtml(label)}</span>
        <div class="setting-segmented compact-segmented">
          <button type="button" data-action="set-upload-layout" data-upload-key="${key}" data-layout="single" class="${draft.layout === "single" ? "active" : ""}">单张</button>
          <button type="button" data-action="set-upload-layout" data-upload-key="${key}" data-layout="grid4" class="${draft.layout === "grid4" ? "active" : ""}">四宫格</button>
          <button type="button" data-action="set-upload-layout" data-upload-key="${key}" data-layout="grid9" class="${draft.layout === "grid9" ? "active" : ""}">九宫格</button>
        </div>
      </div>
      <div class="preview-frame ${previews.length ? "has-image" : ""}">
        ${previews.length ? renderPreviewItems(previews, key) : "<span>可上传照片 / 视频；拼图只支持图片</span>"}
      </div>
      <input data-upload-key="${key}" type="file" accept="${needsImages ? "image/*" : "image/*,video/*"}" multiple />
      <p class="tag-help">四宫格必须选择 4 张图片，九宫格必须选择 9 张图片。生成后只保存拼图结果。</p>
    </div>
  `;
}

function renderPreviewItems(items, key) {
  const collageClass = items.length === 4 || items.length === 9 ? `square-preview collage-preview-${items.length}` : "";
  return `
    <div class="preview-grid ${collageClass}" data-preview-key="${key}">
      ${items
        .map((item, index) => {
          const cleanUrl = item.url.replace("#video", "");
          return `<div class="preview-tile" data-index="${index}">
            ${
              item.url.includes("#video")
                ? `<video src="${cleanUrl}" muted playsinline controls></video>`
                : `<img src="${cleanUrl}" alt="${escapeHtml(item.label)}" />`
            }
            <span>${escapeHtml(item.label)}</span>
            ${item.id.startsWith("new-") ? `<div class="preview-order"><button type="button" data-action="reorder-upload" data-upload-key="${key}" data-index="${index}" data-dir="-1">↑</button><button type="button" data-action="reorder-upload" data-upload-key="${key}" data-index="${index}" data-dir="1">↓</button></div>` : ""}
          </div>`;
        })
        .join("")}
    </div>
  `;
}

function renderTemplateTargetDialog() {
  const template = state.templates.find((item) => item.id === state.templateTargetId);
  if (!template) return "";
  const plans = state.ideas.filter((idea) => idea.status === "planned");
  return `
    <div class="share-backdrop open" data-action="close-template-target">
      <section class="share-dialog small-dialog" data-stop-close>
        <div class="share-head"><div><p class="eyebrow">COPY TEMPLATE</p><h2>加入哪个企划？</h2></div><button class="icon-btn" data-action="close-template-target">${icons.close}</button></div>
        <div class="target-list">
          ${plans.length ? plans.map((plan) => `<button data-action="copy-template-to-plan" data-template-id="${template.id}" data-plan-id="${plan.id}"><strong>${escapeHtml(plan.theme)}</strong><span>${escapeHtml(plan.specificPlace || "未定地点")}</span></button>`).join("") : "<p class='muted'>先新建一个拍摄企划，再复制模板进去。</p>"}
        </div>
      </section>
    </div>
  `;
}

function renderSettings() {
  if (!state.settingsOpen) return "";
  const { language, fontSize, reduceMotion } = state.settings;
  return `
    <div class="settings-backdrop open" data-action="close-settings">
      <section class="settings-panel" role="dialog" aria-modal="true" aria-label="设置" data-stop-close>
        <div class="settings-head"><div><p class="eyebrow">PREFERENCES</p><h2>设置</h2></div><button class="icon-btn" data-action="close-settings">${icons.close}</button></div>
        <div class="settings-content">
          <div class="setting-row"><div><strong>界面语言</strong><span>Language</span></div><select data-setting="language"><option value="zh-CN" ${language === "zh-CN" ? "selected" : ""}>简体中文</option><option value="en" ${language === "en" ? "selected" : ""}>English</option></select></div>
          <div class="setting-group"><strong>字体大小</strong><div class="setting-segmented"><button data-action="set-font-size" data-size="small" class="${fontSize === "small" ? "active" : ""}">小</button><button data-action="set-font-size" data-size="standard" class="${fontSize === "standard" ? "active" : ""}">标准</button><button data-action="set-font-size" data-size="large" class="${fontSize === "large" ? "active" : ""}">大</button></div></div>
          <label class="setting-row setting-toggle"><div><strong>减少动画</strong><span>减少弹层和滚动动画</span></div><input type="checkbox" data-setting="reduceMotion" ${reduceMotion ? "checked" : ""} /></label>
          <div class="settings-divider"></div>
          <div class="setting-row contact-row"><div><strong>联系开发者</strong><span>sara7yeh@gmail.com</span></div><a class="contact-button" href="mailto:sara7yeh@gmail.com?subject=Miao%27s%20Photo%20Notes%20Feedback">发送邮件</a></div>
          <div class="setting-info"><strong>数据与隐私</strong><p>企划和图片只保存在这台设备的浏览器中。</p><button class="danger-button" data-action="clear-local-data">清空本机数据</button></div>
          <div class="setting-about"><strong>关于</strong><span>喵的拍照笔记 · 网页版</span><small>Version 2.0</small></div>
        </div>
      </section>
    </div>
  `;
}

function getShareSummary(plan) {
  const progress = planProgress(plan);
  const tags = flatPlanTags(plan);
  const items = planItems(plan.id);
  const lines = [`拍照企划：${plan.theme}`];
  if (plan.concept) lines.push(`说明：${plan.concept}`);
  if (plan.date) lines.push(`日期：${plan.date}`);
  if (plan.specificPlace) lines.push(`地点：${plan.specificPlace}`);
  lines.push(`小企划：${progress.done}/${progress.total} 已完成`);
  items.slice(0, 8).forEach((item) => lines.push(`- ${item.status === "completed" ? "已完成" : "想拍"}｜${item.title}`));
  if (tags.length) lines.push(`标签：${tags.slice(0, 12).join("、")}`);
  lines.push("— 来自喵的拍照笔记");
  return lines.join("\n");
}

function renderShareDialog() {
  const plan = state.ideas.find((item) => item.id === state.sharingIdeaId);
  if (!plan) return "";
  const cover = coverMediaId(plan);
  const tags = flatPlanTags(plan);
  const progress = planProgress(plan);
  return `
    <div class="share-backdrop open" data-action="close-share">
      <section class="share-dialog" role="dialog" aria-modal="true" aria-label="分享企划摘要" data-stop-close>
        <div class="share-head"><div><p class="eyebrow">SHARE PLAN</p><h2>分享企划摘要</h2></div><button class="icon-btn" data-action="close-share">${icons.close}</button></div>
        <div class="share-preview">
          <div class="share-cover">${cover ? renderMediaThumb(cover, `${plan.theme}参考`) : '<img src="./assets/cat-camera.png" alt="拍照小猫" />'}</div>
          <div class="share-copy">
            <span class="share-label">PHOTO PLAN</span>
            <h3>${escapeHtml(plan.theme)}</h3>
            ${plan.concept ? `<p>${escapeHtml(plan.concept)}</p>` : ""}
            <p>${progress.done}/${progress.total} 个小企划完成</p>
            <div class="detail-tags">${tagChips(tags.slice(0, 12))}</div>
          </div>
        </div>
        <p class="share-privacy">分享的是静态摘要，不会上传你的企划，也不会让对方修改本机数据。</p>
        <div class="share-actions"><button class="primary-btn" data-action="system-share" data-id="${plan.id}">${icons.share}<span>系统分享</span></button><button class="ghost-btn" data-action="copy-summary" data-id="${plan.id}">复制文字</button><button class="ghost-btn" data-action="save-share-image" data-id="${plan.id}">保存长图</button></div>
      </section>
    </div>
  `;
}

function bindEvents() {
  app.onclick = handleClick;
  $("#plan-form")?.addEventListener("submit", handlePlanSubmit);
  $("#item-form")?.addEventListener("submit", handleItemSubmit);
  $("#template-form")?.addEventListener("submit", handleTemplateSubmit);
  document.querySelectorAll("[data-upload-key]").forEach((input) => {
    if (input.tagName === "INPUT" && input.type === "file" && !input.dataset.uploadTarget) {
      input.addEventListener("change", handleUploadPreview);
    }
  });
  document.querySelectorAll("[data-upload-target]").forEach((input) => input.addEventListener("change", handleQuickMediaUpload));
  document.querySelectorAll("[data-draft-key][data-draft-field]").forEach((input) => {
    input.addEventListener("input", handleFormDraftInput);
    input.addEventListener("change", handleFormDraftInput);
  });
  document.querySelectorAll("[data-action='select-filter']").forEach((select) => {
    select.addEventListener("change", (event) => {
      state.filters[event.target.dataset.filter] = event.target.value;
      render();
    });
  });
  document.querySelectorAll("[data-setting]").forEach((control) => control.addEventListener("change", handleSettingChange));
  const detailPanel = document.querySelector(".theme-detail");
  detailPanel?.addEventListener("scroll", () => {
    state.detailScrollTop = detailPanel.scrollTop;
  }, { passive: true });
  const viewerStage = $("#viewer-stage");
  if (viewerStage) {
    let touchStartX = 0;
    viewerStage.addEventListener("touchstart", (event) => {
      touchStartX = event.changedTouches[0]?.clientX || 0;
    }, { passive: true });
    viewerStage.addEventListener("touchend", (event) => {
      const distance = (event.changedTouches[0]?.clientX || 0) - touchStartX;
      if (Math.abs(distance) > 45) moveViewer(distance < 0 ? 1 : -1);
    }, { passive: true });
  }
  document.onkeydown = (event) => {
    if (!state.viewerMediaId) return;
    if (event.key === "ArrowLeft") moveViewer(-1);
    if (event.key === "ArrowRight") moveViewer(1);
    if (event.key === "Escape") {
      state.viewerMediaId = null;
      render();
    }
  };
}

function handleClick(event) {
  const target = event.target.closest("[data-action]");
  const closeStop = event.target.closest("[data-stop-close]");
  if (!target) return;
  if (closeStop && target === closeStop.closest("[data-action]")) return;
  const action = target.dataset.action;

  if (action === "set-view") {
    state.activeView = target.dataset.view;
    state.filterOpen = false;
    state.viewingIdeaId = null;
    render();
  }
  if (action === "open-plan-form") openPlanForm();
  if (action === "edit-plan") openPlanForm(target.dataset.id);
  if (action === "close-plan-form") closePlanForm();
  if (action === "open-item-form") openItemForm("new", target.dataset.planId);
  if (action === "edit-item") openItemForm(target.dataset.id);
  if (action === "close-item-form") closeItemForm();
  if (action === "open-template-form") openTemplateForm();
  if (action === "edit-template") openTemplateForm(target.dataset.id);
  if (action === "close-template-form") closeTemplateForm();
  if (action === "open-plan") {
    state.viewingIdeaId = target.dataset.id;
    state.viewingTemplateId = null;
    state.detailScrollTop = 0;
    render();
  }
  if (action === "close-plan") {
    state.viewingIdeaId = null;
    state.detailScrollTop = 0;
    render();
  }
  if (action === "open-template") {
    state.viewingTemplateId = target.dataset.id;
    state.viewingIdeaId = null;
    state.detailScrollTop = 0;
    render();
  }
  if (action === "close-template") {
    state.viewingTemplateId = null;
    state.detailScrollTop = 0;
    render();
  }
  if (action === "toggle-item") {
    preserveDetailScroll();
    const id = target.dataset.id;
    state.expandedItemIds.has(id) ? state.expandedItemIds.delete(id) : state.expandedItemIds.add(id);
    render();
  }
  if (action === "toggle-item-status") toggleItemStatus(target.dataset.id);
  if (action === "move-item") moveItem(target.dataset.id, Number(target.dataset.dir));
  if (action === "delete-item") deleteShotItem(target.dataset.id);
  if (action === "delete-plan") deletePlan(target.dataset.id);
  if (action === "mark-plan-captured") markPlanStatus(target.dataset.id, "captured");
  if (action === "mark-plan-planned") markPlanStatus(target.dataset.id, "planned");
  if (action === "open-filters") {
    state.filterOpen = true;
    render();
  }
  if (action === "close-filters") {
    state.filterOpen = false;
    render();
  }
  if (action === "set-theme") {
    state.filters.theme = target.dataset.theme;
    render();
  }
  if (action === "clear-filters") {
    state.filters = { theme: "全部", outfit: "", accessory: "", device: "", pose: "", place: "" };
    state.filterOpen = false;
    render();
    showToast("筛选已清空。");
  }
  if (action === "set-upload-layout") {
    syncActiveFormDraft();
    preserveDetailScroll();
    const draft = getDraft(target.dataset.uploadKey);
    draft.layout = target.dataset.layout;
    render();
  }
  if (action === "reorder-upload") {
    syncActiveFormDraft();
    reorderDraft(target.dataset.uploadKey, Number(target.dataset.index), Number(target.dataset.dir));
    render();
  }
  if (action === "open-viewer") openViewer(target.dataset.mediaId);
  if (action === "close-viewer") {
    preserveDetailScroll();
    state.viewerMediaId = null;
    state.viewerZoom = 1;
    render();
  }
  if (action === "viewer-prev") moveViewer(-1);
  if (action === "viewer-next") moveViewer(1);
  if (action === "zoom-in") {
    state.viewerZoom = Math.min(4, state.viewerZoom + 0.25);
    render();
  }
  if (action === "zoom-out") {
    state.viewerZoom = Math.max(0.5, state.viewerZoom - 0.25);
    render();
  }
  if (action === "zoom-reset") {
    state.viewerZoom = 1;
    render();
  }
  if (action === "download-media") downloadMedia(target.dataset.mediaId);
  if (action === "delete-media") deleteItemMedia(target.dataset.itemId, target.dataset.mediaId, target.dataset.slot);
  if (action === "copy-template") {
    state.templateTargetId = target.dataset.id;
    state.viewingTemplateId = null;
    render();
  }
  if (action === "close-template-target") {
    state.templateTargetId = null;
    render();
  }
  if (action === "copy-template-to-plan") copyTemplateToPlan(target.dataset.templateId, target.dataset.planId);
  if (action === "delete-template") deleteTemplate(target.dataset.id);
  if (action === "open-settings") {
    state.settingsOpen = true;
    render();
  }
  if (action === "close-settings") {
    state.settingsOpen = false;
    render();
  }
  if (action === "set-font-size") {
    state.settings.fontSize = target.dataset.size;
    saveSettings();
    render();
  }
  if (action === "clear-local-data") clearLocalData();
  if (action === "open-share") {
    state.sharingIdeaId = target.dataset.id;
    render();
  }
  if (action === "close-share") {
    state.sharingIdeaId = null;
    render();
  }
  if (action === "system-share") sharePlan(target.dataset.id);
  if (action === "copy-summary") copyPlanSummary(target.dataset.id);
  if (action === "save-share-image") saveShareImage(target.dataset.id);
}

function handleSettingChange(event) {
  const key = event.target.dataset.setting;
  state.settings[key] = event.target.type === "checkbox" ? event.target.checked : event.target.value;
  saveSettings();
  render();
}

function handleFormDraftInput(event) {
  const { draftKey, draftField } = event.target.dataset;
  if (!draftKey || !draftField) return;
  getFormDraft(draftKey)[draftField] = event.target.value;
}

function preserveDetailScroll() {
  const detail = document.querySelector(".theme-detail");
  if (detail) {
    state.detailScrollTop = detail.scrollTop;
    state.pendingDetailScrollRestore = true;
  }
}

function scheduleDetailScrollRestore() {
  const desired = state.detailScrollTop;
  state.pendingDetailScrollRestore = false;
  if (!state.viewingIdeaId || !desired) return;
  [0, 40, 120, 260, 520].forEach((delay) => {
    window.setTimeout(() => {
      const detail = document.querySelector(".theme-detail");
      if (!detail || !state.viewingIdeaId) return;
      if (Math.abs(detail.scrollTop - desired) > 6) detail.scrollTop = desired;
    }, delay);
  });
}

function getDraft(key) {
  if (!state.uploadDrafts[key]) state.uploadDrafts[key] = { layout: "single", files: [], urls: [] };
  return state.uploadDrafts[key];
}

function getFormDraft(key) {
  if (!state.formDrafts[key]) state.formDrafts[key] = {};
  return state.formDrafts[key];
}

function draftValue(key, field, fallback = "") {
  const draft = getFormDraft(key);
  return Object.prototype.hasOwnProperty.call(draft, field) ? draft[field] : fallback;
}

function syncActiveFormDraft() {
  document.querySelectorAll("form[data-draft-key]").forEach((form) => {
    const key = form.dataset.draftKey;
    const draft = getFormDraft(key);
    new FormData(form).forEach((value, field) => {
      draft[field] = String(value);
    });
  });
}

function clearDraftFiles(draft) {
  draft.urls.forEach((url) => URL.revokeObjectURL(url.replace("#video", "")));
  draft.files = [];
  draft.urls = [];
}

function clearAllDrafts() {
  Object.values(state.uploadDrafts).forEach(clearDraftFiles);
  state.uploadDrafts = {};
  state.formDrafts = {};
}

function handleUploadPreview(event) {
  syncActiveFormDraft();
  const key = event.target.dataset.uploadKey;
  const draft = getDraft(key);
  const files = [...(event.target.files || [])];
  if (key === "plan-cover") {
    if (files.length > 1 || files.some((file) => !file.type.startsWith("image/"))) {
      event.target.value = "";
      showToast("企划封面只能选择 1 张图片。");
      return;
    }
  }
  const layoutCount = draft.layout === "grid4" ? 4 : draft.layout === "grid9" ? 9 : 0;
  if (layoutCount) {
    if (files.length !== layoutCount) {
      event.target.value = "";
      showToast(`${draft.layout === "grid4" ? "四宫格" : "九宫格"}需要刚好选择 ${layoutCount} 张图片。`);
      return;
    }
    if (files.some((file) => !file.type.startsWith("image/"))) {
      event.target.value = "";
      showToast("拼图只支持图片，不能加入视频。");
      return;
    }
  }
  if (files.some((file) => file.type.startsWith("video/") && file.size > MAX_VIDEO_BYTES)) {
    event.target.value = "";
    showToast("单个视频不能超过 100MB。");
    return;
  }
  clearDraftFiles(draft);
  draft.files = files;
  draft.urls = files.map((file) => `${URL.createObjectURL(file)}${file.type.startsWith("video/") ? "#video" : ""}`);
  render();
}

function reorderDraft(key, index, direction) {
  const draft = getDraft(key);
  const next = index + direction;
  if (next < 0 || next >= draft.files.length) return;
  [draft.files[index], draft.files[next]] = [draft.files[next], draft.files[index]];
  [draft.urls[index], draft.urls[next]] = [draft.urls[next], draft.urls[index]];
}

async function handlePlanSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const editing = state.editingPlanId !== "new" ? state.ideas.find((idea) => idea.id === state.editingPlanId) : null;
  const theme = String(form.get("theme") || "").trim();
  if (!theme) {
    showToast("请填写企划名称。");
    return;
  }
  const now = new Date().toISOString();
  const id = editing?.id || uid("idea");
  const coverMediaIds = await saveDraftMedia("plan-cover");
  const coverMediaId = coverMediaIds[0] || editing?.coverMediaId || "";
  await putRecord(IDEA_STORE, {
    ...editing,
    id,
    theme,
    concept: String(form.get("concept") || "").trim(),
    date: String(form.get("date") || ""),
    specificPlace: String(form.get("specificPlace") || "").trim(),
    coverMediaId,
    status: editing?.status || "planned",
    structureVersion: 2,
    createdAt: editing?.createdAt || now,
    updatedAt: now,
  });
  if (!editing) {
    await putRecord(SHOT_ITEM_STORE, {
      id: uid("item"),
      planId: id,
      title: "整体拍摄灵感",
      description: "",
      note: "",
      mediaIds: [],
      resultMediaIds: [],
      outfitTags: [],
      accessoryTags: [],
      deviceTags: [],
      poseTags: [],
      placeTypes: [],
      status: "planned",
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });
  }
  await loadData();
  if (editing?.coverMediaId && coverMediaIds.length) await cleanupUnusedMedia([editing.coverMediaId]);
  clearAllDrafts();
  state.activeView = "planned";
  state.editingPlanId = null;
  state.viewingIdeaId = id;
  render();
  showToast(editing ? "企划已保存。" : "已新建拍摄企划。");
}

async function handleItemSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const editing = state.editingItemId !== "new" ? state.shotItems.find((item) => item.id === state.editingItemId) : null;
  const title = String(form.get("title") || "").trim();
  if (!title) {
    showToast("请填写小企划名称。");
    return;
  }
  const now = new Date().toISOString();
  const planId = editing?.planId || event.target.dataset.planId || state.viewingIdeaId;
  const mediaIds = [...(editing?.mediaIds || [])];
  let newMediaIds = [];
  try {
    newMediaIds = await saveDraftMedia("item-reference");
  } catch {
    showToast("请按当前布局重新选择素材：四宫格 4 张，九宫格 9 张，且不能包含视频。");
    return;
  }
  if (mediaIds.length + newMediaIds.length > MAX_MEDIA_PER_SECTION) {
    showToast(`每个小企划最多 ${MAX_MEDIA_PER_SECTION} 个参考素材。`);
    return;
  }
  mediaIds.push(...newMediaIds);
  await putRecord(SHOT_ITEM_STORE, {
    ...editing,
    id: editing?.id || uid("item"),
    planId,
    title,
    description: String(form.get("description") || "").trim(),
    note: String(form.get("note") || "").trim(),
    mediaIds,
    resultMediaIds: editing?.resultMediaIds || [],
    outfitTags: parseTags(form.get("outfitTags")),
    accessoryTags: parseTags(form.get("accessoryTags")),
    deviceTags: parseTags(form.get("deviceTags")),
    poseTags: parseTags(form.get("poseTags")),
    placeTypes: parseTags(form.get("placeTypes")),
    status: editing?.status || "planned",
    sortOrder: editing?.sortOrder ?? planItems(planId).length,
    createdAt: editing?.createdAt || now,
    updatedAt: now,
  });
  await loadData();
  clearAllDrafts();
  state.editingItemId = null;
  state.expandedItemIds.add(editing?.id || state.shotItems[state.shotItems.length - 1]?.id);
  render();
  showToast(editing ? "小企划已保存。" : "已添加小企划。");
}

async function handleTemplateSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const editing = state.editingTemplateId !== "new" ? state.templates.find((template) => template.id === state.editingTemplateId) : null;
  const title = String(form.get("title") || "").trim();
  if (!title) {
    showToast("请填写模板名称。");
    return;
  }
  const now = new Date().toISOString();
  const mediaIds = [...(editing?.mediaIds || [])];
  let newMediaIds = [];
  try {
    newMediaIds = await saveDraftMedia("template-reference");
  } catch {
    showToast("请按当前布局重新选择素材：四宫格 4 张，九宫格 9 张，且不能包含视频。");
    return;
  }
  if (mediaIds.length + newMediaIds.length > MAX_MEDIA_PER_SECTION) {
    showToast(`每个模板最多 ${MAX_MEDIA_PER_SECTION} 个参考素材。`);
    return;
  }
  mediaIds.push(...newMediaIds);
  await putRecord(TEMPLATE_STORE, {
    ...editing,
    id: editing?.id || uid("template"),
    title,
    description: String(form.get("description") || "").trim(),
    note: String(form.get("note") || "").trim(),
    mediaIds,
    outfitTags: parseTags(form.get("outfitTags")),
    accessoryTags: parseTags(form.get("accessoryTags")),
    deviceTags: parseTags(form.get("deviceTags")),
    poseTags: parseTags(form.get("poseTags")),
    placeTypes: parseTags(form.get("placeTypes")),
    createdAt: editing?.createdAt || now,
    updatedAt: now,
  });
  await loadData();
  clearAllDrafts();
  state.editingTemplateId = null;
  state.activeView = "templates";
  render();
  showToast(editing ? "模板已保存。" : "已创建万能模板。");
}

async function saveDraftMedia(key) {
  const draft = getDraft(key);
  if (!draft.files.length) return [];
  return saveFilesAsMedia(draft.files, draft.layout, "media");
}

async function saveFilesAsMedia(files, layout = "single", prefix = "media") {
  const ids = [];
  const now = new Date().toISOString();
  if (layout === "grid4" || layout === "grid9") {
    const expected = layout === "grid4" ? 4 : 9;
    if (files.length !== expected) throw new Error(`collage needs ${expected} images`);
    if (files.some((file) => !file.type.startsWith("image/"))) throw new Error("collage needs images");
    const blob = await createCollageBlob(files, expected);
    const id = uid("collage");
    await putRecord(IMAGE_STORE, {
      id,
      blob,
      mimeType: "image/jpeg",
      kind: "collage",
      collageLayout: expected,
      createdAt: now,
    });
    return [id];
  }
  for (const file of files) {
    if (file.type.startsWith("video/") && file.size > MAX_VIDEO_BYTES) throw new Error("video too large");
    const id = uid(prefix);
    ids.push(id);
    await putRecord(IMAGE_STORE, {
      id,
      blob: file,
      mimeType: file.type || "application/octet-stream",
      kind: file.type.startsWith("video/") ? "video" : "image",
      createdAt: now,
    });
  }
  return ids;
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };
    img.src = url;
  });
}

function drawCoverImage(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.width - sourceWidth) / 2;
  const sourceY = (image.height - sourceHeight) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

async function createCollageBlob(files, layout) {
  if (files.length !== layout) throw new Error("wrong collage count");
  if (files.some((file) => !file.type.startsWith("image/"))) throw new Error("collage needs images");
  const width = 1800;
  const height = 2400;
  const gap = 14;
  const columns = layout === 4 ? 2 : 3;
  const rows = layout === 4 ? 2 : 3;
  const cellWidth = (width - gap * (columns + 1)) / columns;
  const cellHeight = (height - gap * (rows + 1)) / rows;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fffefd";
  ctx.fillRect(0, 0, width, height);
  const images = await Promise.all(files.map(loadImageFromFile));
  images.forEach((image, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    drawCoverImage(ctx, image, gap + col * (cellWidth + gap), gap + row * (cellHeight + gap), cellWidth, cellHeight);
  });
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("collage failed"))), "image/jpeg", 0.9),
  );
}

async function handleQuickMediaUpload(event) {
  preserveDetailScroll();
  const item = state.shotItems.find((entry) => entry.id === event.target.dataset.itemId);
  const files = [...(event.target.files || [])];
  if (!item || !files.length) return;
  const uploadKey = event.target.dataset.uploadKey || "";
  const layout = getDraft(uploadKey).layout;
  const expected = layout === "grid4" ? 4 : layout === "grid9" ? 9 : 0;
  if (expected && files.length !== expected) {
    event.target.value = "";
    showToast(`${expected === 4 ? "四宫格" : "九宫格"}需要刚好选择 ${expected} 张图片。`);
    return;
  }
  if (expected && files.some((file) => !file.type.startsWith("image/"))) {
    event.target.value = "";
    showToast("拼图只支持图片，不能加入视频。");
    return;
  }
  if (files.some((file) => file.type.startsWith("video/") && file.size > MAX_VIDEO_BYTES)) {
    event.target.value = "";
    showToast("单个视频不能超过 100MB。");
    return;
  }
  const slot = event.target.dataset.uploadTarget === "item-result" ? "resultMediaIds" : "mediaIds";
  const mediaCount = expected ? 1 : files.length;
  if ((item[slot] || []).length + mediaCount > MAX_MEDIA_PER_SECTION) {
    showToast(slot === "mediaIds" ? `每个小企划最多 ${MAX_MEDIA_PER_SECTION} 个参考素材。` : `每个小企划最多 ${MAX_MEDIA_PER_SECTION} 个成片。`);
    return;
  }
  const now = new Date().toISOString();
  let ids = [];
  try {
    ids = await saveFilesAsMedia(files, layout, slot === "mediaIds" ? "media" : "result");
  } catch {
    showToast(expected ? "拼图生成失败，请重新选择图片。" : "素材保存失败，请稍后再试。");
    return;
  }
  const updatedMediaIds = [...(item[slot] || []), ...ids];
  await putRecord(SHOT_ITEM_STORE, { ...item, [slot]: updatedMediaIds, updatedAt: now });
  if (slot === "resultMediaIds" && item.status !== "completed") {
    await putRecord(SHOT_ITEM_STORE, { ...item, [slot]: updatedMediaIds, status: "completed", updatedAt: now });
  }
  await loadData();
  state.expandedItemIds.add(item.id);
  render();
  showToast(expected ? `已生成${expected === 4 ? "四宫格" : "九宫格"}拼图。` : slot === "mediaIds" ? "已添加参考素材。" : "已添加成片。");
}

function openPlanForm(id = "new") {
  state.editingPlanId = id;
  clearAllDrafts();
  render();
}

function closePlanForm() {
  state.editingPlanId = null;
  clearAllDrafts();
  render();
}

function openItemForm(id = "new", planId = null) {
  state.editingItemId = id;
  if (planId) state.viewingIdeaId = planId;
  clearAllDrafts();
  render();
}

function closeItemForm() {
  state.editingItemId = null;
  clearAllDrafts();
  render();
}

function openTemplateForm(id = "new") {
  state.editingTemplateId = id;
  clearAllDrafts();
  render();
}

function closeTemplateForm() {
  state.editingTemplateId = null;
  clearAllDrafts();
  render();
}

async function toggleItemStatus(id) {
  preserveDetailScroll();
  const item = state.shotItems.find((entry) => entry.id === id);
  if (!item) return;
  await putRecord(SHOT_ITEM_STORE, { ...item, status: item.status === "completed" ? "planned" : "completed", updatedAt: new Date().toISOString() });
  await loadData();
  state.expandedItemIds.add(id);
  render();
}

async function moveItem(id, direction) {
  preserveDetailScroll();
  const item = state.shotItems.find((entry) => entry.id === id);
  if (!item) return;
  const items = planItems(item.planId);
  const index = items.findIndex((entry) => entry.id === id);
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return;
  [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
  await Promise.all(items.map((entry, sortOrder) => putRecord(SHOT_ITEM_STORE, { ...entry, sortOrder, updatedAt: new Date().toISOString() })));
  await loadData();
  state.expandedItemIds.add(id);
  render();
}

async function markPlanStatus(id, status) {
  const plan = state.ideas.find((item) => item.id === id);
  if (!plan) return;
  await putRecord(IDEA_STORE, { ...plan, status, updatedAt: new Date().toISOString() });
  await loadData();
  state.activeView = status;
  state.viewingIdeaId = null;
  render();
  showToast(status === "captured" ? "已移动到已拍作品。" : "已移回想拍。");
}

async function deletePlan(id) {
  const plan = state.ideas.find((item) => item.id === id);
  if (!plan || !window.confirm("删除这个拍摄企划吗？里面的小企划和本机素材也会移除。")) return;
  const items = planItems(id);
  await deleteRecord(IDEA_STORE, id);
  for (const item of items) await deleteRecord(SHOT_ITEM_STORE, item.id);
  await cleanupUnusedMedia();
  await loadData();
  state.viewingIdeaId = null;
  render();
  showToast("企划已删除。");
}

async function deleteShotItem(id) {
  preserveDetailScroll();
  const item = state.shotItems.find((entry) => entry.id === id);
  if (!item || !window.confirm("删除这个小企划吗？相关本机素材也会移除。")) return;
  await deleteRecord(SHOT_ITEM_STORE, id);
  await cleanupUnusedMedia();
  await loadData();
  state.expandedItemIds.delete(id);
  render();
  showToast("小企划已删除。");
}

async function deleteItemMedia(itemId, mediaId, slot) {
  preserveDetailScroll();
  const item = state.shotItems.find((entry) => entry.id === itemId);
  if (!item || !window.confirm("删除这个素材吗？")) return;
  const key = slot === "result" ? "resultMediaIds" : "mediaIds";
  await putRecord(SHOT_ITEM_STORE, {
    ...item,
    [key]: (item[key] || []).filter((id) => id !== mediaId),
    updatedAt: new Date().toISOString(),
  });
  await cleanupUnusedMedia([mediaId]);
  await loadData();
  state.expandedItemIds.add(itemId);
  if (state.viewerMediaId === mediaId) state.viewerMediaId = null;
  render();
  showToast("素材已删除。");
}

async function cleanupUnusedMedia(candidates = null) {
  const [items, templates, ideas] = await Promise.all([getAll(SHOT_ITEM_STORE), getAll(TEMPLATE_STORE), getAll(IDEA_STORE)]);
  const used = new Set();
  items.forEach((item) => [...(item.mediaIds || []), ...(item.resultMediaIds || [])].forEach((id) => used.add(id)));
  templates.forEach((template) => (template.mediaIds || []).forEach((id) => used.add(id)));
  ideas.forEach((idea) => [...getIdeaMediaIds(idea), ...getResultMediaIds(idea)].forEach((id) => used.add(id)));
  ideas.forEach((idea) => {
    if (idea.coverMediaId) used.add(idea.coverMediaId);
  });
  const media = candidates || (await getAll(IMAGE_STORE)).map((record) => record.id);
  for (const id of media) {
    if (!used.has(id)) await deleteRecord(IMAGE_STORE, id);
  }
}

async function downloadMedia(id) {
  const media = mediaRecord(id);
  if (!media) return;
  const url = URL.createObjectURL(media.blob);
  const link = document.createElement("a");
  const ext = media.mimeType?.includes("png") ? "png" : media.mimeType?.includes("jpeg") || media.mimeType?.includes("jpg") ? "jpg" : media.mimeType?.startsWith("video/") ? "mp4" : "bin";
  link.href = url;
  link.download = `${media.kind === "collage" ? "拼图" : media.kind === "video" ? "视频" : "参考图"}-${id}.${ext}`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function openViewer(mediaId) {
  state.detailScrollTop = document.querySelector(".theme-detail")?.scrollTop || 0;
  const plan = state.ideas.find((idea) => idea.id === state.viewingIdeaId);
  const template = state.templates.find((item) => item.id === state.viewingTemplateId);
  const ids = plan
    ? planItems(plan.id).flatMap((item) => [...item.mediaIds, ...item.resultMediaIds])
    : template
      ? template.mediaIds
      : [mediaId];
  state.viewerMediaIds = ids.length ? ids : [mediaId];
  state.viewerMediaId = mediaId;
  state.viewerZoom = 1;
  render();
}

function moveViewer(direction) {
  if (state.viewerMediaIds.length < 2) return;
  const currentIndex = Math.max(0, state.viewerMediaIds.indexOf(state.viewerMediaId));
  const nextIndex = (currentIndex + direction + state.viewerMediaIds.length) % state.viewerMediaIds.length;
  state.viewerMediaId = state.viewerMediaIds[nextIndex];
  state.viewerZoom = 1;
  render();
}

async function duplicateMedia(id) {
  const media = mediaRecord(id);
  if (!media) return "";
  const newId = uid(media.kind || "media");
  await putRecord(IMAGE_STORE, { ...media, id: newId, createdAt: new Date().toISOString() });
  return newId;
}

async function copyTemplateToPlan(templateId, planId) {
  const template = state.templates.find((item) => item.id === templateId);
  if (!template) return;
  const now = new Date().toISOString();
  const mediaIds = [];
  for (const id of template.mediaIds) {
    const newId = await duplicateMedia(id);
    if (newId) mediaIds.push(newId);
  }
  await putRecord(SHOT_ITEM_STORE, {
    id: uid("item"),
    planId,
    title: template.title,
    description: template.description,
    note: template.note,
    mediaIds,
    resultMediaIds: [],
    outfitTags: template.outfitTags,
    accessoryTags: template.accessoryTags,
    deviceTags: template.deviceTags,
    poseTags: template.poseTags,
    placeTypes: template.placeTypes,
    status: "planned",
    sortOrder: planItems(planId).length,
    createdAt: now,
    updatedAt: now,
  });
  await loadData();
  state.templateTargetId = null;
  state.viewingTemplateId = null;
  state.viewingIdeaId = planId;
  state.activeView = "planned";
  render();
  showToast("模板已加入企划。");
}

async function deleteTemplate(id) {
  const template = state.templates.find((item) => item.id === id);
  if (!template || !window.confirm("删除这个万能模板吗？")) return;
  await deleteRecord(TEMPLATE_STORE, id);
  await cleanupUnusedMedia(template.mediaIds);
  await loadData();
  if (state.viewingTemplateId === id) state.viewingTemplateId = null;
  render();
  showToast("模板已删除。");
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through.
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("copy failed");
}

async function copyPlanSummary(id) {
  const plan = state.ideas.find((item) => item.id === id);
  if (!plan) return;
  try {
    await copyText(getShareSummary(plan));
    showToast("企划摘要已复制。");
  } catch {
    showToast("复制失败，请稍后再试。");
  }
}

async function sharePlan(id) {
  const plan = state.ideas.find((item) => item.id === id);
  if (!plan) return;
  const shareData = { title: `拍照企划：${plan.theme}`, text: getShareSummary(plan) };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  await copyPlanSummary(id);
  showToast("当前浏览器不支持系统分享，已复制摘要。");
}

function loadCanvasImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const chars = [...text];
  let line = "";
  let lines = 0;
  for (const char of chars) {
    const next = line + char;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      lines += 1;
      line = char;
      if (lines >= maxLines) return y + lines * lineHeight;
    } else {
      line = next;
    }
  }
  if (line && lines < maxLines) {
    ctx.fillText(line, x, y + lines * lineHeight);
    lines += 1;
  }
  return y + lines * lineHeight;
}

async function createSharePoster(plan) {
  const items = planItems(plan.id);
  const progress = planProgress(plan);
  const tagGroups = allPlanTags(plan);
  const tagLines = [
    tagGroups.placeTypes.length ? `地点  ${tagGroups.placeTypes.join(" / ")}` : "",
    tagGroups.outfitTags.length ? `衣服  ${tagGroups.outfitTags.join(" / ")}` : "",
    tagGroups.accessoryTags.length ? `配饰  ${tagGroups.accessoryTags.join(" / ")}` : "",
    tagGroups.deviceTags.length ? `设备  ${tagGroups.deviceTags.join(" / ")}` : "",
    tagGroups.poseTags.length ? `姿势  ${tagGroups.poseTags.join(" / ")}` : "",
  ].filter(Boolean);
  const estimatedHeight = 1020 + tagLines.length * 54 + Math.max(1, items.length) * 132;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = Math.min(3600, Math.max(1500, estimatedHeight));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f7f5f1";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const coverUrl = mediaUrl(coverMediaId(plan));
  const imageSrc = coverUrl && !coverUrl.includes("#video") ? coverUrl : "./assets/cat-camera.png";
  const cover = await loadCanvasImage(imageSrc);
  drawCoverImage(ctx, cover, 60, 60, 960, 560);
  ctx.fillStyle = "#fffefd";
  ctx.fillRect(60, 650, 960, canvas.height - 710);
  ctx.fillStyle = "#b84f43";
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.fillText("MIAO'S PHOTO NOTES", 110, 724);
  ctx.fillStyle = "#302d2a";
  ctx.font = "800 64px system-ui, sans-serif";
  let y = drawWrappedText(ctx, plan.theme, 110, 812, 860, 76, 2) + 24;
  if (plan.concept) {
    ctx.fillStyle = "#655f59";
    ctx.font = "36px system-ui, sans-serif";
    y = drawWrappedText(ctx, plan.concept, 110, y, 860, 52, 3) + 26;
  }
  ctx.font = "32px system-ui, sans-serif";
  ctx.fillStyle = "#514c47";
  y = drawWrappedText(ctx, `小企划 ${progress.done}/${progress.total} 已完成`, 110, y, 860, 46, 2) + 22;
  if (tagLines.length) {
    ctx.fillStyle = "#b84f43";
    ctx.font = "700 28px system-ui, sans-serif";
    ctx.fillText("TAGS", 110, y);
    y += 48;
    ctx.fillStyle = "#514c47";
    ctx.font = "30px system-ui, sans-serif";
    for (const line of tagLines) y = drawWrappedText(ctx, line, 110, y, 860, 42, 2) + 10;
    y += 12;
  }
  ctx.fillStyle = "#b84f43";
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.fillText("CHECKLIST", 110, y);
  y += 52;
  for (const item of items.slice(0, 14)) {
    ctx.fillStyle = item.status === "completed" ? "#6f927b" : "#ef8069";
    ctx.beginPath();
    ctx.arc(127, y - 11, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fffefd";
    ctx.font = "700 24px system-ui, sans-serif";
    ctx.fillText(item.status === "completed" ? "✓" : "·", 120, y - 3);
    ctx.fillStyle = "#302d2a";
    ctx.font = "700 34px system-ui, sans-serif";
    y = drawWrappedText(ctx, item.title, 164, y, 780, 42, 1);
    if (item.description) {
      ctx.fillStyle = "#7c7771";
      ctx.font = "28px system-ui, sans-serif";
      y = drawWrappedText(ctx, item.description, 164, y + 10, 780, 38, 2);
    }
    y += 28;
  }
  if (items.length > 14) {
    ctx.fillStyle = "#7c7771";
    ctx.font = "28px system-ui, sans-serif";
    ctx.fillText(`还有 ${items.length - 14} 个小企划`, 164, y);
    y += 48;
  }
  if (plan.specificPlace || plan.date) {
    ctx.fillStyle = "#655f59";
    ctx.font = "28px system-ui, sans-serif";
    y = drawWrappedText(ctx, [plan.date, plan.specificPlace].filter(Boolean).join(" · "), 110, y + 18, 860, 38, 2) + 16;
  }
  ctx.fillStyle = "#7c7771";
  ctx.font = "26px system-ui, sans-serif";
  ctx.fillText("把想拍的画面，先悄悄藏进这里。", 110, Math.min(canvas.height - 70, y + 42));
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("poster failed"))), "image/png"),
  );
}

async function saveShareImage(id) {
  const plan = state.ideas.find((item) => item.id === id);
  if (!plan) return;
  try {
    const blob = await createSharePoster(plan);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${plan.theme}-分享长图.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("分享长图已生成。");
  } catch {
    showToast("分享图片生成失败，请稍后再试。");
  }
}

function clearLocalData() {
  if (!window.confirm("确定清空这台设备上的全部企划、参考图片和已拍作品吗？")) return;
  localStorage.setItem(SEED_DISABLED_KEY, "true");
  const request = indexedDB.deleteDatabase(DB_NAME);
  request.onsuccess = () => window.location.reload();
  request.onerror = () => showToast("清空失败，请稍后再试。");
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

async function init() {
  try {
    await seedIfNeeded();
    await migrateMediaKinds();
    await migrateSeedImages();
    await migratePlanItems();
    await loadData();
    render();
  } catch (error) {
    app.innerHTML = `<div class="empty-compact"><h3>浏览器存储不可用</h3><p>请换一个现代浏览器，或允许本地网页保存数据。</p></div>`;
    console.error(error);
  }
}

init();
