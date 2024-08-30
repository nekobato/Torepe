import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import Paper from '@/views/Paper.vue';
import Dropper from '@/views/Dropper.vue';
import Controller from '@/views/Controller.vue';
import Cropper from '@/views/Cropper.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/paper',
    name: 'paper',
    component: Paper,
  },
  {
    path: '/dropper',
    name: 'dropper',
    component: Dropper,
  },
  {
    path: '/controller',
    name: 'controller',
    component: Controller,
  },
  {
    path: '/cropper',
    name: 'cropper',
    component: Cropper,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
