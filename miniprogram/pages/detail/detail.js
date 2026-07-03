const { getPlan, upsertPlan, removePlan } = require("../../utils/store");
const { chooseAndSaveMedia } = require("../../utils/media");

Page({
  data: { id: "", plan: null },
  onLoad(options) { this.setData({ id: options.id || "" }); },
  onShow() { const plan = getPlan(this.data.id); if (plan) this.setData({ plan }); },
  previewImage(event) {
    const source = event.currentTarget.dataset.source;
    const urls = this.data.plan[source].filter((item) => item.type === "image").map((item) => item.path);
    wx.previewImage({ current: event.currentTarget.dataset.path, urls });
  },
  edit() { wx.navigateTo({ url: `/pages/edit/edit?id=${this.data.id}` }); },
  changeStatus() {
    const plan = this.data.plan; plan.status = plan.status === "planned" ? "captured" : "planned"; plan.updatedAt = Date.now(); upsertPlan(plan); this.setData({ plan });
    wx.showToast({ title: plan.status === "captured" ? "已放入作品" : "已移回想拍", icon: "success" });
  },
  async addResult() {
    try { const media = await chooseAndSaveMedia(); const plan = this.data.plan; plan.resultMedia = plan.resultMedia.concat(media); plan.status = "captured"; plan.updatedAt = Date.now(); upsertPlan(plan); this.setData({ plan }); }
    catch (error) { if (error.errMsg && !error.errMsg.includes("cancel")) wx.showToast({ title: "作品保存失败", icon: "none" }); }
  },
  removeResult(event) {
    const plan = this.data.plan; plan.resultMedia.splice(event.currentTarget.dataset.index, 1); plan.updatedAt = Date.now(); upsertPlan(plan); this.setData({ plan });
  },
  deletePlan() {
    wx.showModal({ title: "删除这个企划？", content: "企划与其中的素材记录将从小程序里移除。", confirmColor: "#df634f", success: ({ confirm }) => { if (confirm) { removePlan(this.data.id); wx.navigateBack(); } } });
  }
});
