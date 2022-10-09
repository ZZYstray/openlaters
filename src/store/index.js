import Vue from "vue";
import Vuex from "vuex";

import fence from "./modules/fence";
import getters from "./getters";
Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    fence,
  },
  getters,
});
