import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";
import { initSentry } from "./sentry";
import "element-plus/theme-chalk/base.css";
import "element-plus/theme-chalk/el-button.css";
import "element-plus/theme-chalk/el-input.css";
import "element-plus/theme-chalk/el-input-number.css";
import "element-plus/theme-chalk/el-popper.css";
import "element-plus/theme-chalk/el-tooltip.css";
import "element-plus/theme-chalk/el-slider.css";
import "element-plus/theme-chalk/el-tag.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "@/styles/reset.css";
import "@/styles/fonts.css";

const app = createApp(App);
const pinia = createPinia();

initSentry(app);

app.use(pinia).use(router).mount("#app").$nextTick(window.removeLoading);
