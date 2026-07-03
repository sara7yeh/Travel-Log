const STORAGE_KEY = "shot-plans-v1";

const seedPlans = [
  {
    id: "seed-ma-mian",
    theme: "马面裙国风写真",
    concept: "穿马面裙拍一组有力量感的国风照片",
    outfitTags: ["马面裙", "发簪"],
    poseTags: ["站姿", "回头"],
    placeTypes: ["古镇", "园林"],
    specificPlace: "",
    note: "收集裙摆展开和走动的参考。",
    status: "planned",
    referenceMedia: [{ path: "/assets/cat-planning.png", type: "image", bundled: true }],
    resultMedia: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "seed-cosplay",
    theme: "角色 cosplay",
    concept: "先收集服装、表情和动作参考",
    outfitTags: ["角色服", "道具"],
    poseTags: ["御姐站姿", "蹲姿"],
    placeTypes: ["漫展", "酒店"],
    specificPlace: "",
    note: "",
    status: "planned",
    referenceMedia: [{ path: "/assets/cat-camera.png", type: "image", bundled: true }],
    resultMedia: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

function ensureSeedData() {
  const existing = wx.getStorageSync(STORAGE_KEY);
  if (!Array.isArray(existing)) wx.setStorageSync(STORAGE_KEY, seedPlans);
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
