const DB_NAME = "shot-style-library";
const DB_VERSION = 1;
const IDEA_STORE = "ideas";
const IMAGE_STORE = "images";
const SETTINGS_KEY = "photo-notes-settings";
const SEED_DISABLED_KEY = "photo-notes-seed-disabled";

const defaultSettings = {
  language: "zh-CN",
  fontSize: "standard",
  reduceMotion: false,
};

function loadSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return { ...defaultSettings };
  }
}

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
    status: "planned",
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
    status: "planned",
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
    status: "planned",
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
    status: "planned",
    palette: ["#61736b", "#9ca89f", "#d8d3c5", "#f4f1e8"],
  },
];

let state = {
  ideas: [],
  mediaUrls: new Map(),
  filters: {
    theme: "全部",
    status: "all",
    outfit: "",
    accessory: "",
    device: "",
    pose: "",
    place: "",
  },
  editingId: null,
  viewingIdeaId: null,
  viewerMediaId: null,
  viewerMediaIds: [],
  viewerZoom: 1,
  detailScrollTop: 0,
  sharingIdeaId: null,
  settingsOpen: false,
  settings: loadSettings(),
  selectedMediaFiles: [],
  selectedMediaUrls: [],
  toastTimer: null,
};

const $ = (selector) => document.querySelector(selector);
const app = $("#app");

const icons = {
  camera:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></svg>',
  plus:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  close:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  edit:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
  check:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m20 6-11 11-5-5"/></svg>',
  filter:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.5V20l4 2v-9.5Z"/></svg>',
  settings:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.37.36.7.66.96.3.26.69.4 1.09.4H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z"/></svg>',
  share:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>',
};

const translations = {
  "拍照灵感搭配库": "Photo Inspiration Library",
  "今日份灵感": "Today's inspiration",
  "把想拍的画面，": "Keep the scenes you dream of,",
  "先悄悄藏进这里。": "right here for later.",
  "下一次出发，会有好多好看的照片。": "Your next trip will already have beautiful shots waiting.",
  "今天想拍什么？": "What do you want to shoot?",
  "记录一个新想法": "Add a new plan",
  "企划": "Plans",
  "想拍 / 已拍": "Planned / Captured",
  "拍摄企划": "Shoot plans",
  "已拍作品": "Captured works",
  "清空筛选": "Clear filters",
  "快速找灵感": "Find inspiration",
  "筛选": "Filters",
  "状态": "Status",
  "全部": "All",
  "想拍": "Planned",
  "已拍": "Captured",
  "风格主题": "Theme",
  "衣服造型": "Outfit",
  "配饰": "Accessories",
  "拍摄设备": "Camera gear",
  "姿势构图": "Pose & composition",
  "适配地点类型": "Location type",
  "新增灵感": "Add plan",
  "编辑": "Edit",
  "删除": "Delete",
  "未定具体地点": "Location undecided",
  "拍完的企划会来到这里": "Completed shoots will appear here",
  "点击企划里的“已拍”，再上传你真正拍好的照片。": "Mark a plan as captured, then add the photos you made.",
  "编辑拍摄企划": "Edit shoot plan",
  "新增拍摄企划": "New shoot plan",
  "取消": "Cancel",
  "保存修改": "Save changes",
  "保存灵感": "Save plan",
  "分享": "Share",
  "分享企划摘要": "Share plan summary",
  "系统分享": "Share",
  "复制文字": "Copy text",
  "保存分享图片": "Save share image",
  "关闭": "Close",
  "上传多张参考图，也可以加视频": "Upload reference photos or videos",
  "参考图 / 视频（可选）": "References (optional)",
  "想拍类别 / 风格主题": "Plan / theme",
  "具体地点（可选）": "Specific location (optional)",
  "具体想拍什么（可选）": "What to shoot (optional)",
  "衣服/造型标签（可选）": "Outfit tags (optional)",
  "配饰标签（可选）": "Accessory tags (optional)",
  "拍摄设备标签（可选）": "Camera gear tags (optional)",
  "姿势/构图标签（可选）": "Pose tags (optional)",
  "适配地点类型（可选）": "Location tags (optional)",
  "备注（可选）": "Notes (optional)",
  "用逗号、顿号或换行分隔。": "Separate tags with commas or new lines.",
  "设置": "Settings",
  "界面语言": "Language",
  "字体大小": "Text size",
  "小": "Small",
  "标准": "Standard",
  "大": "Large",
  "减少动画": "Reduce motion",
  "减少弹层和滚动动画": "Reduce panel and scrolling animation",
  "联系开发者": "Contact developer",
  "发送邮件": "Send email",
  "数据与隐私": "Data & privacy",
  "企划和图片只保存在这台设备的浏览器中。": "Plans and images are stored only in this browser on this device.",
  "清空本机数据": "Clear local data",
  "关于": "About",
  "喵的拍照笔记 · 网页版": "Miao's Photo Notes · Web",
};

function applySettings() {
  document.documentElement.lang = state.settings.language;
  document.body.dataset.fontSize = state.settings.fontSize;
  document.body.classList.toggle("reduce-motion", state.settings.reduceMotion);
}

function translateInterface() {
  if (state.settings.language !== "en") return;
  const walker = document.createTreeWalker(app, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const original = node.nodeValue.trim();
    if (translations[original]) node.nodeValue = node.nodeValue.replace(original, translations[original]);
    else if (/^\d+ 个还想拍的计划。$/.test(original)) node.nodeValue = `${original.match(/\d+/)[0]} planned shoots.`;
    else if (/^\d+ 个已经完成的企划。$/.test(original)) node.nodeValue = `${original.match(/\d+/)[0]} completed shoots.`;
    else if (/^\d+ 个参考$/.test(original)) node.nodeValue = `${original.match(/\d+/)[0]} references`;
  }
  document.querySelectorAll("[placeholder]").forEach((element) => {
    const placeholderMap = {
      "例如 秋冬氛围、日落海边、咖啡厅日常": "e.g. Autumn mood, sunset beach, cafe day",
      "例如 海边木栈道、靠窗的咖啡厅": "e.g. A seaside boardwalk or window-side cafe",
      "例如 日落时拍海边背影，或在图书馆拍安静阅读": "e.g. A beach silhouette or quiet library portrait",
      "大衣，围巾，白裙，针织衫": "Coat, scarf, white dress, knitwear",
      "耳环，草帽，眼镜，托特包": "Earrings, sun hat, glasses, tote bag",
      "手机，微单，三脚架，补光灯": "Phone, mirrorless camera, tripod, light",
      "走路，回头，背影，低头看书": "Walking, looking back, silhouette, reading",
      "海边，咖啡厅，图书馆，公园": "Beach, cafe, library, park",
      "日落时间、光线方向、需要携带的物品": "Sunset time, light direction, items to bring",
    };
    if (placeholderMap[element.placeholder]) element.placeholder = placeholderMap[element.placeholder];
  });
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDEA_STORE)) {
        db.createObjectStore(IDEA_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE, { keyPath: "id" });
      }
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
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

const putRecord = (storeName, record) =>
  withStore(storeName, "readwrite", (store) => store.put(record));

const deleteRecord = (storeName, id) =>
  withStore(storeName, "readwrite", (store) => store.delete(id));

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseTags(value) {
  return value
    .split(/[,，、\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeCanvasImage(seed) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");
  const colors = seed.palette;

  const gradient = ctx.createLinearGradient(0, 0, 900, 1200);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.45, colors[1]);
  gradient.addColorStop(1, colors[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 900, 1200);

  ctx.fillStyle = "rgba(255, 252, 244, 0.72)";
  ctx.fillRect(92, 94, 716, 1012);
  ctx.fillStyle = colors[3];
  ctx.fillRect(128, 130, 644, 940);

  ctx.fillStyle = "rgba(24, 22, 20, 0.18)";
  ctx.fillRect(0, 780, 900, 420);

  ctx.fillStyle = "rgba(255, 255, 255, 0.48)";
  ctx.beginPath();
  ctx.ellipse(450, 440, 185, 250, 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(35, 32, 29, 0.5)";
  ctx.beginPath();
  ctx.ellipse(450, 348, 74, 88, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(356, 450, 188, 330);
  ctx.beginPath();
  ctx.moveTo(356, 500);
  ctx.lineTo(246, 705);
  ctx.lineTo(336, 738);
  ctx.lineTo(430, 540);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(544, 500);
  ctx.lineTo(660, 710);
  ctx.lineTo(570, 742);
  ctx.lineTo(470, 540);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 253, 249, 0.92)";
  ctx.font = "700 54px system-ui, sans-serif";
  ctx.fillText(seed.theme, 80, 1040);
  ctx.font = "32px system-ui, sans-serif";
  ctx.fillText(seed.placeTypes.slice(0, 2).join(" / "), 80, 1094);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
  });
}

function getIdeaMediaIds(idea) {
  if (Array.isArray(idea.mediaIds) && idea.mediaIds.length) return idea.mediaIds;
  if (idea.imageId) return [idea.imageId];
  return [];
}

function getResultMediaIds(idea) {
  return Array.isArray(idea?.resultMediaIds) ? idea.resultMediaIds : [];
}

function mediaUrl(id) {
  return state.mediaUrls.get(id) || "";
}

function renderMedia(id, alt, className = "") {
  const url = mediaUrl(id);
  if (!url) return "";
  const isVideo = url.includes("#video");
  if (isVideo) {
    return `<video class="${className}" src="${url.replace("#video", "")}" muted loop playsinline controls aria-label="${escapeHtml(alt)}"></video>`;
  }
  return `<img class="${className}" src="${url}" alt="${escapeHtml(alt)}" />`;
}

async function seedIfNeeded() {
  const existing = await getAll(IDEA_STORE);
  if (existing.length > 0 || localStorage.getItem(SEED_DISABLED_KEY) === "true") return;

  for (const item of seedIdeas) {
    const now = new Date().toISOString();
    const imageId = uid("image");
    const blob = await makeCanvasImage(item);
    await putRecord(IMAGE_STORE, {
      id: imageId,
      blob,
      mimeType: "image/jpeg",
      createdAt: now,
    });
    await putRecord(IDEA_STORE, {
      id: uid("idea"),
      imageId,
      mediaIds: [imageId],
      theme: item.theme,
      concept: item.concept,
      outfitTags: item.outfitTags,
      accessoryTags: item.accessoryTags,
      deviceTags: item.deviceTags,
      poseTags: item.poseTags,
      placeTypes: item.placeTypes,
      specificPlace: "",
      note: item.note,
      status: item.status,
      createdAt: now,
      updatedAt: now,
    });
  }
}

async function migrateEverydaySeedContent() {
  const replacements = new Map([
    ["穿马面裙拍一组有力量感但不板正的国风照片", seedIdeas[0]],
    ["某个角色的 cosplay 企划，先收服装、表情和动作参考", seedIdeas[1]],
    ["回国去云南玩，想拍漂流视频和自然感照片", seedIdeas[2]],
    ["大衣围巾的日常感照片", seedIdeas[3]],
  ]);
  const ideas = await getAll(IDEA_STORE);
  for (const idea of ideas) {
    const replacement = replacements.get(idea.concept);
    if (!replacement) continue;
    await putRecord(IDEA_STORE, {
      ...idea,
      theme: replacement.theme,
      concept: replacement.concept,
      outfitTags: replacement.outfitTags,
      accessoryTags: replacement.accessoryTags,
      deviceTags: replacement.deviceTags,
      poseTags: replacement.poseTags,
      placeTypes: replacement.placeTypes,
      note: replacement.note,
      seedContentVersion: 2,
    });
  }
}

async function migrateAccessoryAndDeviceTags() {
  const examplesByConcept = new Map(seedIdeas.map((idea) => [idea.concept, idea]));
  const ideas = await getAll(IDEA_STORE);
  for (const idea of ideas) {
    const example = examplesByConcept.get(idea.concept);
    if (!example || (Array.isArray(idea.accessoryTags) && Array.isArray(idea.deviceTags))) continue;
    await putRecord(IDEA_STORE, {
      ...idea,
      accessoryTags: example.accessoryTags,
      deviceTags: example.deviceTags,
    });
  }
}

async function removeExactDuplicateIdeas() {
  const ideas = (await getAll(IDEA_STORE)).sort((a, b) =>
    String(a.createdAt).localeCompare(String(b.createdAt)),
  );
  const seen = new Set();
  for (const idea of ideas) {
    if (getResultMediaIds(idea).length) continue;
    const signature = JSON.stringify({
      theme: idea.theme,
      concept: idea.concept || "",
      outfitTags: idea.outfitTags || [],
      accessoryTags: idea.accessoryTags || [],
      deviceTags: idea.deviceTags || [],
      poseTags: idea.poseTags || [],
      placeTypes: idea.placeTypes || [],
      specificPlace: idea.specificPlace || "",
      note: idea.note || "",
      status: idea.status,
    });
    if (!seen.has(signature)) {
      seen.add(signature);
      continue;
    }
    await deleteRecord(IDEA_STORE, idea.id);
    for (const mediaId of getIdeaMediaIds(idea)) await deleteRecord(IMAGE_STORE, mediaId);
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
    const imageId = idea.imageId || idea.mediaIds?.[0];
    const assetPath = catByTheme[idea.theme];
    if (!imageId?.startsWith("image-") || !assetPath || idea.seedCatMigrated) continue;

    const response = await fetch(assetPath);
    const blob = await response.blob();
    await putRecord(IMAGE_STORE, {
      id: imageId,
      blob,
      mimeType: "image/png",
      createdAt: idea.createdAt || new Date().toISOString(),
    });
    await putRecord(IDEA_STORE, { ...idea, seedCatMigrated: true });
  }
}

async function loadData() {
  for (const url of state.mediaUrls.values()) URL.revokeObjectURL(url.replace("#video", ""));
  state.mediaUrls = new Map();
  const [ideas, images] = await Promise.all([getAll(IDEA_STORE), getAll(IMAGE_STORE)]);
  images.forEach((image) => {
    const suffix = image.mimeType?.startsWith("video/") ? "#video" : "";
    state.mediaUrls.set(image.id, `${URL.createObjectURL(image.blob)}${suffix}`);
  });
  state.ideas = ideas
    .map((idea) => ({
      ...idea,
      mediaIds: getIdeaMediaIds(idea),
      resultMediaIds: getResultMediaIds(idea),
      concept: idea.concept || "",
      accessoryTags: idea.accessoryTags || [],
      deviceTags: idea.deviceTags || [],
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function getFilteredIdeas() {
  return state.ideas.filter((idea) => {
    const { theme, outfit, accessory, device, pose, place } = state.filters;
    if (theme !== "全部" && idea.theme !== theme) return false;
    if (outfit && !idea.outfitTags.includes(outfit)) return false;
    if (accessory && !idea.accessoryTags.includes(accessory)) return false;
    if (device && !idea.deviceTags.includes(device)) return false;
    if (pose && !idea.poseTags.includes(pose)) return false;
    if (place && !idea.placeTypes.includes(place)) return false;
    return true;
  });
}

function getThemeGroups() {
  const groups = new Map();
  state.ideas.forEach((idea) => {
    if (!groups.has(idea.theme)) {
      groups.set(idea.theme, []);
    }
    groups.get(idea.theme).push(idea);
  });
  return [...groups.entries()]
    .map(([theme, ideas]) => ({
      theme,
      ideas,
      cover: ideas[0],
      placeTypes: unique(ideas.flatMap((idea) => idea.placeTypes)).slice(0, 4),
      outfitTags: unique(ideas.flatMap((idea) => idea.outfitTags)).slice(0, 4),
    }))
    .sort((a, b) => b.ideas.length - a.ideas.length || a.theme.localeCompare(b.theme));
}

function optionsFor(key) {
  const values = unique(state.ideas.flatMap((idea) => idea[key] || []));
  return values.sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function themes() {
  return unique(state.ideas.map((idea) => idea.theme)).sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  );
}

function tagChips(tags, className = "") {
  return tags.map((tag) => `<span class="chip ${className}">${escapeHtml(tag)}</span>`).join("");
}

function render() {
  const filtered = getFilteredIdeas();
  const plannedIdeas = filtered.filter((idea) => idea.status === "planned");
  const capturedIdeas = filtered.filter((idea) => idea.status === "captured");
  const plannedCount = state.ideas.filter((idea) => idea.status === "planned").length;
  const capturedCount = state.ideas.filter((idea) => idea.status === "captured").length;

  app.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark"><img src="./assets/cat-planning.png" alt="计划拍摄的小猫" /></div>
          <div class="brand-copy">
            <p class="eyebrow">MIAO'S PHOTO NOTES</p>
            <h1>拍照灵感搭配库</h1>
          </div>
        </div>
        <button class="settings-button" data-action="open-settings" title="设置" aria-label="设置">${icons.settings}<span>设置</span></button>
      </header>

      <section class="hero">
        <div class="hero-copy">
          <span class="hero-kicker">今日份灵感</span>
          <h2>把想拍的画面，<br />先悄悄藏进这里。</h2>
          <p>下一次出发，会有好多好看的照片。</p>
          <div>
            <button class="primary-btn" data-action="open-form">${icons.plus}<span>记录一个新想法</span></button>
          </div>
        </div>
        <div class="hero-side">
          <div class="cat-note">今天想拍什么？</div>
          <img class="hero-cat" src="./assets/cat-camera.png" alt="抱着相机的小猫" />
          <div class="hero-stats">
            <div class="stat"><strong>${state.ideas.length}</strong><span>企划</span></div>
            <div class="stat"><strong>${plannedCount}/${capturedCount}</strong><span>想拍 / 已拍</span></div>
          </div>
        </div>
      </section>

      <div class="main-grid">
        <section>
          <section class="ideas-section first-section" id="planned-section">
            <div class="section-head">
              <div>
                <span class="section-kicker">PLANNED SHOOTS</span>
                <h2>拍摄企划</h2>
                <p>${plannedIdeas.length} 个还想拍的计划。</p>
              </div>
              <img class="section-cat section-cat-planning" src="./assets/cat-planning.png" alt="正在做计划的小猫" />
              <button class="text-btn" data-action="clear-filters">清空筛选</button>
            </div>
            ${
              plannedIdeas.length
                ? `<div class="ideas-grid">${plannedIdeas.map(renderIdeaCard).join("")}</div>`
                : ""
            }
          </section>

          <section class="captured-section" id="captured-section">
            <div class="section-head">
              <div>
                <span class="section-kicker">MY WORKS</span>
                <h2>已拍作品</h2>
                <p>${capturedIdeas.length} 个已经完成的企划。</p>
              </div>
              <img class="section-cat" src="./assets/cat-happy.png" alt="完成拍摄的小猫" />
            </div>
            ${
              capturedIdeas.length
                ? `<div class="ideas-grid captured-grid">${capturedIdeas.map(renderIdeaCard).join("")}</div>`
                : renderCapturedEmpty()
            }
          </section>
        </section>

        ${renderFilters()}
      </div>
    </main>

    ${renderIdeaDetail()}
    ${renderMediaViewer()}
    ${renderDrawer()}
    ${renderSettings()}
    ${renderShareDialog()}
    <div class="toast" id="toast"></div>
  `;

  applySettings();
  translateInterface();
  bindEvents();
  if (state.viewingIdeaId && state.detailScrollTop) {
    window.requestAnimationFrame(() => {
      const detail = document.querySelector(".theme-detail");
      if (detail) detail.scrollTop = state.detailScrollTop;
    });
  }
}

function renderIdeaCard(idea) {
  const referenceIds = getIdeaMediaIds(idea);
  const resultIds = getResultMediaIds(idea);
  const displayIds = idea.status === "captured" && resultIds.length ? resultIds : referenceIds;
  const statusLabel = idea.status === "captured" ? "已拍" : "想拍";
  return `
    <article class="idea-card ${idea.status === "captured" ? "captured-card" : ""}" data-action="open-idea" data-id="${idea.id}">
      <div class="idea-photo">
        ${renderMediaMosaic(displayIds, idea.theme)}
        <span class="status-pill">${statusLabel}</span>
        <span class="media-count">${displayIds.length} ${idea.status === "captured" && resultIds.length ? "张成片" : "个参考"}</span>
        <div class="idea-actions">
          <button class="icon-btn" title="分享" data-action="open-share" data-id="${idea.id}">${icons.share}</button>
          <button class="icon-btn" title="编辑" data-action="edit" data-id="${idea.id}">${icons.edit}</button>
          <button class="icon-btn" title="删除" data-action="delete" data-id="${idea.id}">${icons.trash}</button>
        </div>
      </div>
      <div class="idea-body">
        <div class="idea-title">
          <h3>${escapeHtml(idea.theme)}</h3>
          <span class="idea-place">${escapeHtml(idea.specificPlace || "未定具体地点")}</span>
        </div>
        ${idea.concept ? `<p class="idea-concept">${escapeHtml(idea.concept)}</p>` : ""}
        <div class="chip-row">${tagChips(idea.placeTypes, "sage")}</div>
        <div class="chip-row">${tagChips(idea.outfitTags, "sky")}</div>
        <div class="chip-row">${tagChips(idea.accessoryTags, "accessory")}</div>
        <div class="chip-row">${tagChips(idea.deviceTags, "device")}</div>
        <div class="chip-row">${tagChips(idea.poseTags)}</div>
        ${idea.note ? `<p class="idea-note">${escapeHtml(idea.note)}</p>` : ""}
        <div class="card-footer-actions">
          ${
            idea.status === "planned"
              ? `<button class="captured-btn" data-action="mark-captured" data-id="${idea.id}">${icons.check}<span>已拍</span></button>`
              : `<button class="text-btn" data-action="mark-planned" data-id="${idea.id}"><span>移回想拍</span></button><button class="ghost-btn" data-action="open-idea" data-id="${idea.id}">${icons.camera}<span>查看成片</span></button>`
          }
        </div>
      </div>
    </article>
  `;
}

function renderMediaMosaic(ids, theme) {
  if (!ids.length) return '<div class="no-media">等待添加参考</div>';
  if (ids.length === 1) return renderMedia(ids[0], `${theme}图片`);
  const visible = ids.slice(0, 4);
  return `
    <div class="media-mosaic count-${visible.length}">
      ${visible.map((id) => `<div>${renderMedia(id, `${theme}图片`)}</div>`).join("")}
    </div>
  `;
}

function renderIdeaDetail() {
  const idea = state.ideas.find((item) => item.id === state.viewingIdeaId);
  if (!idea) return "";
  const referenceIds = getIdeaMediaIds(idea);
  const resultIds = getResultMediaIds(idea);
  return `
    <div class="drawer-backdrop theme-backdrop open" data-action="close-idea">
      <section class="theme-detail" data-stop-close>
        <div class="drawer-head">
          <div>
            <p class="eyebrow">${idea.status === "captured" ? "MY WORK" : "SHOT PLAN"}</p>
            <h2>${escapeHtml(idea.theme)}</h2>
            <p class="detail-summary">${escapeHtml(idea.concept || "拍摄企划详情")}</p>
          </div>
          <div class="detail-head-actions">
            <button class="icon-btn" title="分享" data-action="open-share" data-id="${idea.id}">${icons.share}</button>
            <button class="icon-btn" title="编辑" data-action="edit" data-id="${idea.id}">${icons.edit}</button>
            <button class="icon-btn" title="删除" data-action="delete" data-id="${idea.id}">${icons.trash}</button>
            <button class="icon-btn" data-action="close-idea" title="关闭">${icons.close}</button>
          </div>
        </div>
        <div class="theme-detail-body">
          <section class="detail-section">
            <div class="detail-section-head"><div><span class="section-kicker">REFERENCES</span><h3>参考照片与视频</h3></div><span>${referenceIds.length} 个</span></div>
            ${renderDetailMediaGrid(referenceIds, idea.theme, "还没有参考素材")}
          </section>
          <section class="detail-section result-section">
            <div class="detail-section-head"><div><span class="section-kicker">MY PHOTOS</span><h3>我的已拍作品</h3></div><span>${resultIds.length} 个</span></div>
            ${
              idea.status === "captured"
                ? `<div class="result-actions"><button class="text-btn" data-action="mark-planned" data-id="${idea.id}">移回想拍</button><label class="upload-result-btn">${icons.plus}<span>添加已拍照片 / 视频</span><input id="result-media" data-idea-id="${idea.id}" type="file" accept="image/*,video/*" multiple /></label></div>`
                : `<button class="captured-btn detail-capture-btn" data-action="mark-captured" data-id="${idea.id}">${icons.check}<span>标记为已拍</span></button>`
            }
            ${renderDetailMediaGrid(resultIds, idea.theme, idea.status === "captured" ? "把拍好的照片放进这里" : "完成拍摄后，可以上传自己的成片")}
          </section>
          <div class="detail-tags">${tagChips(idea.placeTypes, "sage")}${tagChips(idea.outfitTags, "sky")}${tagChips(idea.accessoryTags, "accessory")}${tagChips(idea.deviceTags, "device")}${tagChips(idea.poseTags)}</div>
          ${idea.note ? `<p class="idea-note">${escapeHtml(idea.note)}</p>` : ""}
        </div>
      </section>
    </div>
  `;
}

function renderDetailMediaGrid(ids, theme, emptyCopy) {
  if (!ids.length) {
    return `<div class="detail-no-media"><img src="./assets/cat-sad.png" alt="等待照片的小猫" /><span>${escapeHtml(emptyCopy)}</span></div>`;
  }
  return `
    <div class="detail-media-grid">
      ${ids.map((id) => `<button class="detail-media-item" data-action="open-viewer" data-media-id="${id}" title="点开查看">${renderMediaThumbnail(id, `${theme}素材`)}</button>`).join("")}
    </div>
  `;
}

function renderMediaThumbnail(id, alt) {
  const url = mediaUrl(id);
  if (!url) return "";
  if (url.includes("#video")) {
    return `<video src="${url.replace("#video", "")}" muted playsinline preload="metadata" aria-label="${escapeHtml(alt)}"></video><span class="video-badge">视频</span>`;
  }
  return `<img src="${url}" alt="${escapeHtml(alt)}" />`;
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
          ${isVideo ? "" : '<button class="icon-btn" data-action="zoom-out" title="缩小">−</button><button class="icon-btn zoom-reset" data-action="zoom-reset" title="恢复原始大小">1:1</button><button class="icon-btn" data-action="zoom-in" title="放大">+</button>'}
          <button class="icon-btn" data-action="close-viewer" title="关闭">${icons.close}</button>
        </div>
        <div class="viewer-stage" id="viewer-stage">
          ${canBrowse ? '<button class="viewer-nav viewer-prev" data-action="viewer-prev" title="上一张" aria-label="上一张">‹</button>' : ""}
          ${isVideo ? `<video src="${url.replace("#video", "")}" controls autoplay playsinline></video>` : `<img src="${url}" alt="放大的照片" style="transform: scale(${state.viewerZoom})" />`}
          ${canBrowse ? '<button class="viewer-nav viewer-next" data-action="viewer-next" title="下一张" aria-label="下一张">›</button>' : ""}
        </div>
      </div>
    </div>
  `;
}

function renderCapturedEmpty() {
  return `<div class="captured-empty"><img src="./assets/cat-happy.png" alt="等待成片的小猫" /><div><h3>拍完的企划会来到这里</h3><p>点击企划里的“已拍”，再上传你真正拍好的照片。</p></div></div>`;
}

function renderFilters() {
  const themeButtons = ["全部", ...themes()]
    .map(
      (theme) =>
        `<button class="chip ${state.filters.theme === theme ? "active" : ""}" data-action="set-theme" data-theme="${escapeHtml(theme)}">${escapeHtml(theme)}</button>`,
    )
    .join("");
  return `
    <aside class="panel filters">
      <img class="filter-cat" src="./assets/cat-winter.png" alt="筛选灵感的小猫" />
      <h2>${icons.filter}筛选</h2>
      <div class="filter-block">
        <span class="filter-label">状态</span>
        <div class="segmented">
          <button class="${state.filters.status === "all" ? "active" : ""}" data-action="set-status" data-status="all">全部</button>
          <button class="${state.filters.status === "planned" ? "active" : ""}" data-action="set-status" data-status="planned">想拍</button>
          <button class="${state.filters.status === "captured" ? "active" : ""}" data-action="set-status" data-status="captured">已拍</button>
        </div>
      </div>
      <div class="filter-block">
        <span class="filter-label">风格主题</span>
        <div class="chip-row">${themeButtons}</div>
      </div>
      ${renderSelectFilter("outfit", "衣服造型", optionsFor("outfitTags"))}
      ${renderSelectFilter("accessory", "配饰", optionsFor("accessoryTags"))}
      ${renderSelectFilter("device", "拍摄设备", optionsFor("deviceTags"))}
      ${renderSelectFilter("pose", "姿势构图", optionsFor("poseTags"))}
      ${renderSelectFilter("place", "适配地点类型", optionsFor("placeTypes"))}
    </aside>
  `;
}

function renderSelectFilter(key, label, values) {
  return `
    <div class="field">
      <label for="filter-${key}">${label}</label>
      <select id="filter-${key}" data-action="select-filter" data-filter="${key}">
        <option value="">全部</option>
        ${values
          .map(
            (value) =>
              `<option value="${escapeHtml(value)}" ${state.filters[key] === value ? "selected" : ""}>${escapeHtml(value)}</option>`,
          )
          .join("")}
      </select>
    </div>
  `;
}

function renderEmpty(title, copy) {
  return `
    <div class="empty-state">
      <img src="./assets/cat-sad.png" alt="等待灵感的小猫" />
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(copy)}</p>
      <button class="primary-btn" data-action="open-form">${icons.plus}<span>新增灵感</span></button>
    </div>
  `;
}

function getShareSummary(idea) {
  const lines = [`拍照企划：${idea.theme}`];
  if (idea.concept) lines.push(`想拍：${idea.concept}`);
  if (idea.outfitTags.length) lines.push(`穿搭：${idea.outfitTags.join("、")}`);
  if (idea.accessoryTags.length) lines.push(`配饰：${idea.accessoryTags.join("、")}`);
  if (idea.deviceTags.length) lines.push(`设备：${idea.deviceTags.join("、")}`);
  if (idea.poseTags.length) lines.push(`姿势：${idea.poseTags.join("、")}`);
  if (idea.placeTypes.length) lines.push(`地点：${idea.placeTypes.join("、")}`);
  if (idea.specificPlace) lines.push(`具体地点：${idea.specificPlace}`);
  if (idea.note) lines.push(`备注：${idea.note}`);
  const mediaCount = getIdeaMediaIds(idea).length;
  if (mediaCount) lines.push(`参考素材：${mediaCount} 个`);
  lines.push("— 来自喵的拍照笔记");
  return lines.join("\n");
}

function renderShareDialog() {
  const idea = state.ideas.find((item) => item.id === state.sharingIdeaId);
  if (!idea) return "";
  const mediaIds = getIdeaMediaIds(idea);
  return `
    <div class="share-backdrop open" data-action="close-share">
      <section class="share-dialog" role="dialog" aria-modal="true" aria-label="分享企划摘要" data-stop-close>
        <div class="share-head">
          <div><p class="eyebrow">SHARE PLAN</p><h2>分享企划摘要</h2></div>
          <button class="icon-btn" data-action="close-share" title="关闭">${icons.close}</button>
        </div>
        <div class="share-preview">
          <div class="share-cover">
            ${mediaIds[0] ? renderMediaThumbnail(mediaIds[0], `${idea.theme}参考`) : '<img src="./assets/cat-camera.png" alt="拍照小猫" />'}
          </div>
          <div class="share-copy">
            <span class="share-label">PHOTO PLAN</span>
            <h3>${escapeHtml(idea.theme)}</h3>
            ${idea.concept ? `<p>${escapeHtml(idea.concept)}</p>` : ""}
            <div class="detail-tags">${tagChips(idea.placeTypes, "sage")}${tagChips(idea.outfitTags, "sky")}${tagChips(idea.accessoryTags, "accessory")}${tagChips(idea.deviceTags, "device")}${tagChips(idea.poseTags)}</div>
            ${idea.note ? `<p class="share-note">${escapeHtml(idea.note)}</p>` : ""}
          </div>
        </div>
        <p class="share-privacy">分享的是静态摘要，不会上传你的企划，也不会让对方修改本机数据。</p>
        <div class="share-actions">
          <button class="primary-btn" data-action="system-share" data-id="${idea.id}">${icons.share}<span>系统分享</span></button>
          <button class="ghost-btn" data-action="copy-summary" data-id="${idea.id}">复制文字</button>
          <button class="ghost-btn" data-action="save-share-image" data-id="${idea.id}">保存分享图片</button>
        </div>
      </section>
    </div>
  `;
}

function renderSettings() {
  if (!state.settingsOpen) return "";
  const { language, fontSize, reduceMotion } = state.settings;
  return `
    <div class="settings-backdrop ${state.settingsOpen ? "open" : ""}" data-action="close-settings">
      <section class="settings-panel" role="dialog" aria-modal="true" aria-label="设置" data-stop-close>
        <div class="settings-head">
          <div><p class="eyebrow">PREFERENCES</p><h2>设置</h2></div>
          <button class="icon-btn" data-action="close-settings" title="关闭" aria-label="关闭">${icons.close}</button>
        </div>
        <div class="settings-content">
          <div class="setting-row">
            <div><strong>界面语言</strong><span>Language</span></div>
            <select data-setting="language" aria-label="界面语言">
              <option value="zh-CN" ${language === "zh-CN" ? "selected" : ""}>简体中文</option>
              <option value="en" ${language === "en" ? "selected" : ""}>English</option>
            </select>
          </div>
          <div class="setting-group">
            <strong>字体大小</strong>
            <div class="setting-segmented" role="group" aria-label="字体大小">
              <button data-action="set-font-size" data-size="small" class="${fontSize === "small" ? "active" : ""}">小</button>
              <button data-action="set-font-size" data-size="standard" class="${fontSize === "standard" ? "active" : ""}">标准</button>
              <button data-action="set-font-size" data-size="large" class="${fontSize === "large" ? "active" : ""}">大</button>
            </div>
          </div>
          <label class="setting-row setting-toggle">
            <div><strong>减少动画</strong><span>减少弹层和滚动动画</span></div>
            <input type="checkbox" data-setting="reduceMotion" ${reduceMotion ? "checked" : ""} />
          </label>
          <div class="settings-divider"></div>
          <div class="setting-row contact-row">
            <div><strong>联系开发者</strong><span>sara7yeh@gmail.com</span></div>
            <a class="contact-button" href="mailto:sara7yeh@gmail.com?subject=Miao%27s%20Photo%20Notes%20Feedback">发送邮件</a>
          </div>
          <div class="setting-info">
            <strong>数据与隐私</strong>
            <p>企划和图片只保存在这台设备的浏览器中。</p>
            <button class="danger-button" data-action="clear-local-data">清空本机数据</button>
          </div>
          <div class="setting-about"><strong>关于</strong><span>喵的拍照笔记 · 网页版</span><small>Version 1.1</small></div>
        </div>
      </section>
    </div>
  `;
}

function renderDrawer() {
  const editing = state.editingId ? state.ideas.find((idea) => idea.id === state.editingId) : null;
  const editingMediaIds = editing ? getIdeaMediaIds(editing) : [];
  const previewItems = [
    ...editingMediaIds.map((id) => ({ id, url: mediaUrl(id), label: "已保存参考" })),
    ...state.selectedMediaUrls.map((url, index) => ({ id: `new-${index}`, url, label: "新增参考" })),
  ].filter((item) => item.url);
  const themeOptions = ["", ...themes()]
    .map(
      (theme) =>
        `<option value="${escapeHtml(theme)}" ${editing?.theme === theme ? "selected" : ""}>${theme ? escapeHtml(theme) : "选择已有主题或直接输入"}</option>`,
    )
    .join("");
  return `
    <div class="drawer-backdrop ${state.editingId === "new" || editing ? "open" : ""}" data-action="close-form">
      <section class="drawer" data-stop-close>
        <div class="drawer-head">
          <div>
            <p class="eyebrow">${editing ? "Edit inspiration" : "New inspiration"}</p>
            <h2>${editing ? "编辑拍摄企划" : "新增拍摄企划"}</h2>
          </div>
          <button class="icon-btn" data-action="close-form" title="关闭">${icons.close}</button>
        </div>
        <form class="form" id="idea-form">
          <div class="preview-frame ${previewItems.length ? "has-image" : ""}" id="image-preview">
            ${previewItems.length ? renderPreviewItems(previewItems) : "<span>上传多张参考图，也可以加视频</span>"}
          </div>
          <div class="field">
            <label for="media">参考图 / 视频（可选）${editing ? " · 选择会追加" : ""}</label>
            <input id="media" name="media" type="file" accept="image/*,video/*" multiple />
          </div>
          <div class="form-grid">
            <div class="field">
              <label for="theme">想拍类别 / 风格主题</label>
              <input id="theme" name="theme" list="theme-list" value="${escapeHtml(editing?.theme || "")}" placeholder="例如 秋冬氛围、日落海边、咖啡厅日常" required />
              <datalist id="theme-list">${themeOptions}</datalist>
            </div>
            <div class="field">
              <label for="specificPlace">具体地点（可选）</label>
              <input id="specificPlace" name="specificPlace" value="${escapeHtml(editing?.specificPlace || "")}" placeholder="例如 海边木栈道、靠窗的咖啡厅" />
            </div>
          </div>
          <div class="field">
            <label for="concept">具体想拍什么（可选）</label>
            <input id="concept" name="concept" value="${escapeHtml(editing?.concept || "")}" placeholder="例如 日落时拍海边背影，或在图书馆拍安静阅读" />
          </div>
          <div class="field">
            <label for="outfitTags">衣服/造型标签（可选）</label>
            <input id="outfitTags" name="outfitTags" value="${escapeHtml(editing?.outfitTags.join("，") || "")}" placeholder="大衣，围巾，白裙，针织衫" />
            <span class="tag-help">用逗号、顿号或换行分隔。</span>
          </div>
          <div class="form-grid">
            <div class="field">
              <label for="accessoryTags">配饰标签（可选）</label>
              <input id="accessoryTags" name="accessoryTags" value="${escapeHtml(editing?.accessoryTags.join("，") || "")}" placeholder="耳环，草帽，眼镜，托特包" />
            </div>
            <div class="field">
              <label for="deviceTags">拍摄设备标签（可选）</label>
              <input id="deviceTags" name="deviceTags" value="${escapeHtml(editing?.deviceTags.join("，") || "")}" placeholder="手机，微单，三脚架，补光灯" />
            </div>
          </div>
          <div class="field">
            <label for="poseTags">姿势/构图标签（可选）</label>
            <input id="poseTags" name="poseTags" value="${escapeHtml(editing?.poseTags.join("，") || "")}" placeholder="走路，回头，背影，低头看书" />
          </div>
          <div class="field">
            <label for="placeTypes">适配地点类型（可选）</label>
            <input id="placeTypes" name="placeTypes" value="${escapeHtml(editing?.placeTypes.join("，") || "")}" placeholder="海边，咖啡厅，图书馆，公园" />
          </div>
          <div class="field">
            <label for="note">备注（可选）</label>
            <textarea id="note" name="note" placeholder="日落时间、光线方向、需要携带的物品">${escapeHtml(editing?.note || "")}</textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="ghost-btn" data-action="close-form">取消</button>
            <button type="submit" class="primary-btn">${editing ? "保存修改" : "保存灵感"}</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function renderPreviewItems(items) {
  return `
    <div class="preview-grid">
      ${items
        .map((item) => {
          const isVideo = item.url.includes("#video") || item.url.startsWith("blob:");
          const cleanUrl = item.url.replace("#video", "");
          return `<div class="preview-tile">
            ${
              item.url.includes("#video")
                ? `<video src="${cleanUrl}" muted playsinline controls></video>`
                : `<img src="${cleanUrl}" alt="${escapeHtml(item.label)}" />`
            }
            <span>${escapeHtml(item.label)}</span>
          </div>`;
        })
        .join("")}
    </div>
  `;
}

function bindEvents() {
  app.onclick = handleClick;
  $("#idea-form")?.addEventListener("submit", handleSubmit);
  $("#media")?.addEventListener("change", handleMediaPreview);
  $("#result-media")?.addEventListener("change", handleResultMediaUpload);
  document.querySelectorAll("[data-action='select-filter']").forEach((select) => {
    select.addEventListener("change", (event) => {
      state.filters[event.target.dataset.filter] = event.target.value;
      render();
    });
  });
  document.querySelectorAll("[data-setting]").forEach((control) => {
    control.addEventListener("change", handleSettingChange);
  });
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

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function handleSettingChange(event) {
  const key = event.target.dataset.setting;
  state.settings[key] = event.target.type === "checkbox" ? event.target.checked : event.target.value;
  saveSettings();
  render();
}

function handleClick(event) {
  const target = event.target.closest("[data-action]");
  const closeStop = event.target.closest("[data-stop-close]");
  if (!target) return;
  if (closeStop && target === closeStop.closest("[data-action]")) return;
  const action = target.dataset.action;

  if (target.dataset.stopClose !== undefined) return;
  if (action === "open-form") openForm();
  if (action === "close-form") closeForm();
  if (action === "open-settings") {
    state.settingsOpen = true;
    render();
  }
  if (action === "close-settings") {
    state.settingsOpen = false;
    render();
  }
  if (action === "open-share") {
    state.sharingIdeaId = target.dataset.id;
    render();
  }
  if (action === "close-share") {
    state.sharingIdeaId = null;
    render();
  }
  if (action === "system-share") shareIdea(target.dataset.id);
  if (action === "copy-summary") copyIdeaSummary(target.dataset.id);
  if (action === "save-share-image") saveShareImage(target.dataset.id);
  if (action === "set-font-size") {
    state.settings.fontSize = target.dataset.size;
    saveSettings();
    render();
  }
  if (action === "clear-local-data") clearLocalData();
  if (action === "set-theme") {
    state.filters.theme = target.dataset.theme;
    render();
  }
  if (action === "open-idea") {
    state.viewingIdeaId = target.dataset.id;
    state.detailScrollTop = 0;
    render();
  }
  if (action === "close-idea") {
    state.viewingIdeaId = null;
    state.detailScrollTop = 0;
    render();
  }
  if (action === "set-status") {
    state.filters.status = target.dataset.status;
    render();
    if (target.dataset.status === "planned") scrollToSection("planned-section");
    if (target.dataset.status === "captured") scrollToSection("captured-section");
  }
  if (action === "clear-filters") {
    state.filters = { theme: "全部", status: "all", outfit: "", accessory: "", device: "", pose: "", place: "" };
    render();
    showToast("筛选已清空。");
  }
  if (action === "edit") openForm(target.dataset.id);
  if (action === "delete") deleteIdea(target.dataset.id);
  if (action === "mark-captured") markCaptured(target.dataset.id);
  if (action === "mark-planned") markPlanned(target.dataset.id);
  if (action === "open-viewer") {
    state.detailScrollTop = document.querySelector(".theme-detail")?.scrollTop || 0;
    const viewingIdea = state.ideas.find((idea) => idea.id === state.viewingIdeaId);
    state.viewerMediaIds = viewingIdea
      ? [...getIdeaMediaIds(viewingIdea), ...getResultMediaIds(viewingIdea)]
      : [target.dataset.mediaId];
    state.viewerMediaId = target.dataset.mediaId;
    state.viewerZoom = 1;
    render();
  }
  if (action === "close-viewer") {
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
}

function moveViewer(direction) {
  if (state.viewerMediaIds.length < 2) return;
  const currentIndex = Math.max(0, state.viewerMediaIds.indexOf(state.viewerMediaId));
  const nextIndex = (currentIndex + direction + state.viewerMediaIds.length) % state.viewerMediaIds.length;
  state.viewerMediaId = state.viewerMediaIds[nextIndex];
  state.viewerZoom = 1;
  render();
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through for browsers that expose Clipboard API without granting access.
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

async function copyIdeaSummary(id) {
  const idea = state.ideas.find((item) => item.id === id);
  if (!idea) return;
  try {
    await copyText(getShareSummary(idea));
    showToast("企划摘要已复制。");
  } catch {
    showToast("复制失败，请稍后再试。");
  }
}

async function shareIdea(id) {
  const idea = state.ideas.find((item) => item.id === id);
  if (!idea) return;
  const shareData = { title: `拍照企划：${idea.theme}`, text: getShareSummary(idea) };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  await copyIdeaSummary(id);
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

function drawCoverImage(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.width - sourceWidth) / 2;
  const sourceY = (image.height - sourceHeight) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const chars = [...text];
  let line = "";
  let lines = 0;
  for (let index = 0; index < chars.length; index += 1) {
    const next = line + chars[index];
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      lines += 1;
      line = chars[index];
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

async function createSharePoster(idea) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f7f5f1";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const firstMediaUrl = mediaUrl(getIdeaMediaIds(idea)[0] || "");
  const imageSrc = firstMediaUrl && !firstMediaUrl.includes("#video")
    ? firstMediaUrl
    : "./assets/cat-camera.png";
  const cover = await loadCanvasImage(imageSrc);
  drawCoverImage(ctx, cover, 60, 60, 960, 650);

  ctx.fillStyle = "#fffefd";
  ctx.fillRect(60, 710, 960, 670);
  ctx.fillStyle = "#b84f43";
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.fillText("MIAO'S PHOTO NOTES", 110, 782);
  ctx.fillStyle = "#302d2a";
  ctx.font = "800 64px system-ui, sans-serif";
  let y = drawWrappedText(ctx, idea.theme, 110, 870, 860, 76, 2) + 24;
  if (idea.concept) {
    ctx.fillStyle = "#655f59";
    ctx.font = "36px system-ui, sans-serif";
    y = drawWrappedText(ctx, idea.concept, 110, y, 860, 52, 3) + 26;
  }
  const detailLines = [
    idea.outfitTags.length ? `穿搭  ${idea.outfitTags.join(" / ")}` : "",
    idea.accessoryTags.length ? `配饰  ${idea.accessoryTags.join(" / ")}` : "",
    idea.deviceTags.length ? `设备  ${idea.deviceTags.join(" / ")}` : "",
    idea.poseTags.length ? `姿势  ${idea.poseTags.join(" / ")}` : "",
    idea.placeTypes.length ? `地点  ${idea.placeTypes.join(" / ")}` : "",
  ].filter(Boolean);
  ctx.font = "32px system-ui, sans-serif";
  ctx.fillStyle = "#514c47";
  for (const line of detailLines) y = drawWrappedText(ctx, line, 110, y, 860, 46, 2) + 12;
  ctx.fillStyle = "#7c7771";
  ctx.font = "26px system-ui, sans-serif";
  ctx.fillText("把想拍的画面，先悄悄藏进这里。", 110, 1330);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("poster failed"))), "image/png"),
  );
}

async function saveShareImage(id) {
  const idea = state.ideas.find((item) => item.id === id);
  if (!idea) return;
  try {
    const blob = await createSharePoster(idea);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${idea.theme}-分享摘要.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("分享图片已生成。");
  } catch {
    showToast("分享图片生成失败，请稍后再试。");
  }
}

function clearLocalData() {
  const message = state.settings.language === "en"
    ? "Delete all plans, reference images, and captured works stored in this browser?"
    : "确定清空这台设备上的全部企划、参考图片和已拍作品吗？";
  if (!window.confirm(message)) return;
  localStorage.setItem(SEED_DISABLED_KEY, "true");
  const request = indexedDB.deleteDatabase(DB_NAME);
  request.onsuccess = () => {
    state.settingsOpen = false;
    window.location.reload();
  };
  request.onerror = () => showToast(state.settings.language === "en" ? "Could not clear local data." : "清空失败，请稍后再试。");
}

function scrollToSection(id) {
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function openForm(id = "new") {
  state.viewingIdeaId = null;
  state.editingId = id;
  state.selectedMediaFiles = [];
  state.selectedMediaUrls.forEach((url) => URL.revokeObjectURL(url.replace("#video", "")));
  state.selectedMediaUrls = [];
  render();
}

function closeForm() {
  state.editingId = null;
  state.selectedMediaFiles = [];
  state.selectedMediaUrls.forEach((url) => URL.revokeObjectURL(url.replace("#video", "")));
  state.selectedMediaUrls = [];
  render();
}

function handleMediaPreview(event) {
  const files = [...(event.target.files || [])];
  state.selectedMediaFiles = files;
  state.selectedMediaUrls.forEach((url) => URL.revokeObjectURL(url.replace("#video", "")));
  state.selectedMediaUrls = files.map((file) => {
    const suffix = file.type.startsWith("video/") ? "#video" : "";
    return `${URL.createObjectURL(file)}${suffix}`;
  });
  const frame = $("#image-preview");
  if (frame) {
    const editing = state.editingId ? state.ideas.find((idea) => idea.id === state.editingId) : null;
    const editingItems = editing
      ? getIdeaMediaIds(editing).map((id) => ({ id, url: mediaUrl(id), label: "已保存参考" }))
      : [];
    const newItems = state.selectedMediaUrls.map((url, index) => ({
      id: `new-${index}`,
      url,
      label: "新增参考",
    }));
    const items = [...editingItems, ...newItems].filter((item) => item.url);
    frame.classList.toggle("has-image", Boolean(items.length));
    frame.innerHTML = items.length
      ? renderPreviewItems(items)
      : "<span>上传多张参考图，也可以加视频</span>";
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const editing = state.editingId !== "new" ? state.ideas.find((idea) => idea.id === state.editingId) : null;
  const now = new Date().toISOString();
  const theme = String(form.get("theme") || "").trim();
  const outfitTags = parseTags(String(form.get("outfitTags") || ""));
  const accessoryTags = parseTags(String(form.get("accessoryTags") || ""));
  const deviceTags = parseTags(String(form.get("deviceTags") || ""));
  const poseTags = parseTags(String(form.get("poseTags") || ""));
  const placeTypes = parseTags(String(form.get("placeTypes") || ""));

  if (!theme) {
    showToast("请填写想拍类别 / 风格主题。");
    return;
  }

  const mediaIds = editing ? [...getIdeaMediaIds(editing)] : [];
  for (const file of state.selectedMediaFiles) {
    const mediaId = uid("media");
    mediaIds.push(mediaId);
    await putRecord(IMAGE_STORE, {
      id: mediaId,
      blob: file,
      mimeType: file.type,
      createdAt: now,
    });
  }

  await putRecord(IDEA_STORE, {
    id: editing?.id || uid("idea"),
    imageId: mediaIds[0] || "",
    mediaIds,
    resultMediaIds: editing?.resultMediaIds || [],
    theme,
    concept: String(form.get("concept") || "").trim(),
    outfitTags,
    accessoryTags,
    deviceTags,
    poseTags,
    placeTypes,
    specificPlace: String(form.get("specificPlace") || "").trim(),
    note: String(form.get("note") || "").trim(),
    status: editing?.status || "planned",
    createdAt: editing?.createdAt || now,
    updatedAt: now,
  });

  await loadData();
  closeForm();
  showToast(editing ? "已保存修改。" : "已记录新的拍照灵感。");
}

async function markCaptured(id) {
  const idea = state.ideas.find((item) => item.id === id);
  if (!idea) return;
  await putRecord(IDEA_STORE, {
    ...idea,
    status: "captured",
    updatedAt: new Date().toISOString(),
  });
  await loadData();
  render();
  showToast("已移动到“已拍作品”。");
}

async function markPlanned(id) {
  const idea = state.ideas.find((item) => item.id === id);
  if (!idea) return;
  await putRecord(IDEA_STORE, {
    ...idea,
    status: "planned",
    updatedAt: new Date().toISOString(),
  });
  await loadData();
  state.viewingIdeaId = null;
  render();
  scrollToSection("planned-section");
  showToast("已移回“拍摄企划”。");
}

async function handleResultMediaUpload(event) {
  const ideaId = event.target.dataset.ideaId;
  const idea = state.ideas.find((item) => item.id === ideaId);
  const files = [...(event.target.files || [])];
  if (!idea || !files.length) return;

  const now = new Date().toISOString();
  const resultMediaIds = [...getResultMediaIds(idea)];
  for (const file of files) {
    const mediaId = uid("result");
    resultMediaIds.push(mediaId);
    await putRecord(IMAGE_STORE, {
      id: mediaId,
      blob: file,
      mimeType: file.type,
      createdAt: now,
    });
  }

  await putRecord(IDEA_STORE, {
    ...idea,
    status: "captured",
    resultMediaIds,
    updatedAt: now,
  });
  await loadData();
  state.viewingIdeaId = ideaId;
  render();
  showToast("已添加到你的已拍作品。");
}

async function deleteIdea(id) {
  const idea = state.ideas.find((item) => item.id === id);
  if (!idea) return;
  const ok = window.confirm("删除这条拍摄企划吗？里面的参考图和视频也会一起从本机移除。");
  if (!ok) return;
  await deleteRecord(IDEA_STORE, id);
  for (const mediaId of getIdeaMediaIds(idea)) {
    await deleteRecord(IMAGE_STORE, mediaId);
  }
  for (const mediaId of getResultMediaIds(idea)) {
    await deleteRecord(IMAGE_STORE, mediaId);
  }
  await loadData();
  if (state.viewingIdeaId === id) state.viewingIdeaId = null;
  state.viewerMediaId = null;
  render();
  showToast("已删除。");
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
    await migrateEverydaySeedContent();
    await migrateAccessoryAndDeviceTags();
    await removeExactDuplicateIdeas();
    await migrateSeedImages();
    await loadData();
    render();
  } catch (error) {
    app.innerHTML = renderEmpty("浏览器存储不可用", "请换一个现代浏览器，或允许本地网页保存数据。");
    console.error(error);
  }
}

init();
