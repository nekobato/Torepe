import { createApp } from "vue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import Aura from "@primevue/themes/aura";
import router from "./router";
import App from "./App.vue";
import "@/styles/reset.css";
import "@/styles/fonts.css";
import "primeicons/primeicons.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia)
   .use(router)
   .use(PrimeVue, {
     theme: {
       preset: Aura,
       options: {
         darkModeSelector: 'system',
         cssLayer: false
       }
     }
   })
   .mount("#app").$nextTick(window.removeLoading);
