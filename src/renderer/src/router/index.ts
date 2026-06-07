import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import Paper from "@/views/Paper.vue";
import Dropper from "@/views/Dropper.vue";
import Cropper from "@/views/Cropper.vue";
import WindowTabs from "@/components/WindowTabs.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/controller",
  },
  {
    path: "/paper",
    name: "paper",
    component: Paper,
  },
  {
    path: "/dropper",
    name: "dropper",
    component: Dropper,
  },
  {
    path: "/controller",
    name: "controller",
    component: WindowTabs,
  },
  {
    path: "/cropper",
    name: "cropper",
    component: Cropper,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
