import Vue from 'vue';
import VueRouter from 'vue-router';
import Paper from '@/views/Paper.vue';
import Dropper from '@/views/Dropper.vue';
import Controller from '@/views/Controller.vue';
import Cropper from '@/views/Cropper.vue';

Vue.use(VueRouter);

const routes = [
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

const router = new VueRouter({
  routes,
});

export default router;
