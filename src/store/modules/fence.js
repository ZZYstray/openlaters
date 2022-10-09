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
  },
  mutations: {
    SET_FENCES: (state, value) => {
      state.fences = value;
    },
  },
  actions: {
    addFences({ state, commit }, value) {
      let data = [...state.fences, value];
      commit("SET_FENCES", data);
    },
  },
};

export default fence;
