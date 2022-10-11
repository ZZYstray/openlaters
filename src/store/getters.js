/*
 * @Author: Shao Tao
 * @Date: 2021-11-09 11:37:19
 * @LastEditTime: 2021-11-09 11:38:44
 * @LastEditors: Shao Tao
 * @Description:
 * @FilePath: \vue-openlayers\src\store\getters.js
 */
const getters = {
  fences: (state) => state.fence.fences,
  pathArr: (state) => state.fence.pathArr,

};
export default getters;
