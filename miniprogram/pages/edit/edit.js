const { getPlan, upsertPlan } = require("../../utils/store");
const { chooseAndSaveMedia } = require("../../utils/media");

const splitTags = (value) => value.split(/[,，、\n]/).map((item) => item.trim()).filter(Boolean);

Page({
  data: { id: "", theme: "", concept: "", outfitText: "", poseText: "", placeText: "", specificPlace: "", note: "", referenceMedia: [], status: "planned", createdAt: 0, saving: false },
  onLoad(options) {
    if (!options.id) return;
    const plan = getPlan(options.id);
    if (!plan) return;
    this.setData({ ...plan, id: plan.id, outfitText: plan.outfitTags.join("，"), poseText: plan.poseTags.join("，"), placeText: plan.placeTypes.join("，") });
  },
  bindField(event) { this.setData({ [event.currentTarget.dataset.field]: event.detail.value }); },
  async chooseMedia() {
    try { const media = await chooseAndSaveMedia(); this.setData({ referenceMedia: this.data.referenceMedia.concat(media) }); }
    catch (error) { if (error.errMsg && !error.errMsg.includes("cancel")) wx.showToast({ title: "素材保存失败", icon: "none" }); }
  },
  removeMedia(event) {
    const referenceMedia = this.data.referenceMedia.slice(); referenceMedia.splice(event.currentTarget.dataset.index, 1); this.setData({ referenceMedia });
  },
  save() {
    const theme = this.data.theme.trim();
    if (!theme) { wx.showToast({ title: "请填写企划主题", icon: "none" }); return; }
    const now = Date.now();
    const old = this.data.id ? getPlan(this.data.id) : null;
    upsertPlan({ id: this.data.id || `${now}-${Math.random().toString(16).slice(2)}`, theme, concept: this.data.concept.trim(), outfitTags: splitTags(this.data.outfitText), poseTags: splitTags(this.data.poseText), placeTypes: splitTags(this.data.placeText), specificPlace: this.data.specificPlace.trim(), note: this.data.note.trim(), status: this.data.status, referenceMedia: this.data.referenceMedia, resultMedia: old ? old.resultMedia : [], createdAt: this.data.createdAt || now, updatedAt: now });
    wx.showToast({ title: "企划已保存", icon: "success" });
    setTimeout(() => wx.navigateBack(), 500);
  }
});
