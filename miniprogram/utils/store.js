const STORAGE_KEY = "shot-plans-v1";
const SEED_VERSION_KEY = "shot-plans-seed-version";

const seedPlans = [
  {
    id: "seed-autumn",
    theme: "秋冬氛围",
    concept: "穿大衣和围巾拍一组自然温暖的日常照片",
    outfitTags: ["大衣", "围巾", "短靴"],
    poseTags: ["走路", "回头", "捧热饮"],
    placeTypes: ["落叶街道", "公园", "街角"],
    specificPlace: "",
    note: "傍晚的暖光很好看，也可以拍围巾和手部细节。",
    status: "planned",
    referenceMedia: [{ path: "/assets/cat-planning.png", type: "image", bundled: true }],
    resultMedia: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "seed-sunset",
    theme: "日落海边",
    concept: "在太阳快落下的时候拍海风、剪影和散步的画面",
    outfitTags: ["白裙", "薄外套", "草帽"],
    poseTags: ["背影", "侧脸", "走向海边"],
    placeTypes: ["海边", "沙滩", "礁石"],
    specificPlace: "",
    note: "提前看日落时间，逆光时可以拍轮廓和头发被风吹起的瞬间。",
    status: "planned",
    referenceMedia: [{ path: "/assets/cat-happy.png", type: "image", bundled: true }],
    resultMedia: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "seed-cafe",
    theme: "咖啡厅日常",
    concept: "记录喝咖啡、看窗外和随手翻书的松弛感",
    outfitTags: ["针织衫", "衬衫", "托特包"],
    poseTags: ["托腮", "看窗外", "手拿咖啡"],
    placeTypes: ["咖啡厅", "窗边", "露台"],
    specificPlace: "",
    note: "选靠窗的位置，桌上的咖啡、书和甜点也可以拍细节。",
    status: "planned",
    referenceMedia: [{ path: "/assets/cat-camera.png", type: "image", bundled: true }],
    resultMedia: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "seed-library",
    theme: "图书馆安静感",
    concept: "在书架和阅读区拍安静、专注的日常照片",
    outfitTags: ["白衬衫", "针织背心", "眼镜"],
    poseTags: ["低头看书", "书架侧影", "坐姿"],
    placeTypes: ["图书馆", "书店", "阅读区"],
    specificPlace: "",
    note: "尽量不用闪光灯，适合拍手翻书、书架之间和桌面光影。",
    status: "planned",
    referenceMedia: [{ path: "/assets/cat-planning.png", type: "image", bundled: true }],
    resultMedia: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

function ensureSeedData() {
  const existing = wx.getStorageSync(STORAGE_KEY);
  if (!Array.isArray(existing)) {
    wx.setStorageSync(STORAGE_KEY, seedPlans);
    wx.setStorageSync(SEED_VERSION_KEY, 2);
    return;
  }
  if (wx.getStorageSync(SEED_VERSION_KEY) === 2) return;
  const untouchedOldSeed = (plan) =>
    (plan.id === "seed-ma-mian" && plan.concept === "穿马面裙拍一组有力量感的国风照片") ||
    (plan.id === "seed-cosplay" && plan.concept === "先收集服装、表情和动作参考");
  const customPlans = existing.filter((plan) => !untouchedOldSeed(plan));
  wx.setStorageSync(STORAGE_KEY, [...seedPlans, ...customPlans]);
  wx.setStorageSync(SEED_VERSION_KEY, 2);
}

function getPlans() {
  ensureSeedData();
  return wx.getStorageSync(STORAGE_KEY) || [];
}

function savePlans(plans) {
  wx.setStorageSync(STORAGE_KEY, plans);
}

function getPlan(id) {
  return getPlans().find((plan) => plan.id === id);
}

function upsertPlan(plan) {
  const plans = getPlans();
  const index = plans.findIndex((item) => item.id === plan.id);
  if (index >= 0) plans[index] = plan;
  else plans.unshift(plan);
  savePlans(plans);
  return plan;
}

function removePlan(id) {
  savePlans(getPlans().filter((plan) => plan.id !== id));
}

module.exports = { getPlans, getPlan, upsertPlan, removePlan, ensureSeedData };
