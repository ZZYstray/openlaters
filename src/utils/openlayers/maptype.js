/*
 * @Author: Shao Tao
 * @Date: 2021-11-03 11:52:50
 * @LastEditTime: 2021-11-03 11:54:09
 * @LastEditors: Shao Tao
 * @Description:
 * @FilePath: \vue-openlayers\src\utils\openlayers\maptype.js
 */
import { XYZ, BingMaps } from "ol/source";

let list = [
  {
    name: "高德地图",
    value: new XYZ({
      url: "https://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}",
    }),
    id: "0",
  },
  {
    name: "必应地图",
    value: new BingMaps({
      key: "AthlLEKCGCsFXV_UTn_LW4KRWH2ihOw15XGRMagtRXa-f2g5Kw5qFL7J9lFERF5o",
      imagerySet: "RoadOnDemand",
    }),
    id: "1",
  },
];

export default list;
