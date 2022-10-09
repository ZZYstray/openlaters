/*
 * @Author: Shao Tao
 * @Date: 2021-11-03 14:27:50
 * @LastEditTime: 2021-11-03 14:27:50
 * @LastEditors: Shao Tao
 * @Description:
 * @FilePath: \vue-openlayers\src\utils\webStorage.js
 */
const locaMap = "locaMap";

export function getMap() {
  return localStorage.getItem(locaMap);
}

export function setMap(e) {
  return localStorage.setItem(locaMap, e);
}
