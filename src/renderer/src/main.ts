import { createApp } from "vue";
import router from "./router";
import App from "./App.vue";
import "@/styles/reset.css";
import "@/styles/fonts.css";

createApp(App).use(router).mount("#app").$nextTick(window.removeLoading);
