const { ensureSeedData } = require("./utils/store");

App({
  onLaunch() {
    ensureSeedData();
  },
});
