const { getPlans, upsertPlan } = require("../../utils/store");

Page({
  data: { planned: [], captured: [], plannedCount: 0, capturedCount: 0 },

  onShow() {
    this.loadPlans();
  },

  loadPlans() {
    const plans = getPlans().map((plan) => ({
      ...plan,
      cover: (plan.status === "captured" && plan.resultMedia[0]) || plan.referenceMedia[0] || { path: "/assets/cat-planning.png", type: "image" }
    }));
    const planned = plans.filter((plan) => plan.status === "planned");
    const captured = plans.filter((plan) => plan.status === "captured");
    this.setData({ planned, captured, plannedCount: planned.length, capturedCount: captured.length });
  },

  addPlan() {
    wx.navigateTo({ url: "/pages/edit/edit" });
  },

  openPlan(event) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${event.currentTarget.dataset.id}` });
  },

  editPlan(event) {
    wx.navigateTo({ url: `/pages/edit/edit?id=${event.currentTarget.dataset.id}` });
  },

  jumpTo(event) {
    wx.pageScrollTo({ selector: `#${event.currentTarget.dataset.target}`, duration: 300 });
  },

  changeStatus(event) {
    const plans = getPlans();
    const plan = plans.find((item) => item.id === event.currentTarget.dataset.id);
    if (!plan) return;
    plan.status = event.currentTarget.dataset.status;
    plan.updatedAt = Date.now();
    upsertPlan(plan);
    this.loadPlans();
    wx.showToast({ title: plan.status === "captured" ? "已放入作品" : "已移回想拍", icon: "success" });
  }
});
