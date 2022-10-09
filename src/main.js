/*
 * @Author: Shao Tao
 * @Date: 2021-11-01 12:08:13
 * @LastEditTime: 2021-11-08 11:43:39
 * @LastEditors: Shao Tao
 * @Description:
 * @FilePath: \vue-openlayers\src\main.js
 */
import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

// 公共样式
import "@/style/body.scss";
import "element-ui/lib/theme-chalk/index.css";
import ElementUI from "element-ui";
Vue.use(ElementUI);

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
