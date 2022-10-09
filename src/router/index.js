/*
 * @Author: Shao Tao
 * @Date: 2021-11-01 12:08:13
 * @LastEditTime: 2021-11-05 16:04:58
 * @LastEditors: Shao Tao
 * @Description:
 * @FilePath: \vue-openlayers\src\router\index.js
 */
import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
];

const router = new VueRouter({
  routes,
});

export default router;
