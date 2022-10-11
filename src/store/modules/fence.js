/*
 * @Author: Shao Tao
 * @Date: 2021-11-09 11:37:12
 * @LastEditTime: 2021-11-09 11:41:38
 * @LastEditors: Shao Tao
 * @Description:
 * @FilePath: \vue-openlayers\src\store\modules\fence.js
 */
const fence = {
  state: {
    fences: [],
    pathArr: []
  },
  mutations: {
    SET_FENCES: (state, value) => {
      state.fences = value;
    },
    SET_PATHARR: (state, value) => {
      state.pathArr = value;
    },
  },
  actions: {
    // 添加弹层
    addFences({ state, commit }, value) {
      let data = [...state.fences, value];
      commit("SET_FENCES", data);
    },
    // 添加路径
    addPathArr({ state, commit }, value) {
      let data = [...state.pathArr, value];
      commit("SET_PATHARR", data);
    },
  },
};

export default fence;
