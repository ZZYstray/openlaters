<!--
 * @Author: Shao Tao
 * @Date: 2021-11-18 10:28:33
 * @LastEditTime: 2021-11-19 16:01:17
 * @LastEditors: Shao Tao
 * @Description: 
 * @FilePath: \vue-openlayers\src\components\Route.vue
-->
<template>
  <el-dialog
    title="历史轨迹"
    :visible="dialogVisible"
    custom-class="route"
    append-to-body
    @close="handleClose"
    width="1200px"
    destroy-on-close
  >
    <div id="fence-map" class="map-box"></div>
    <div class="map-area">
      <el-card class="tool-window" style="width: 380px">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="yyyy-MM-dd"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          style="width: 100%"
        >
        </el-date-picker>
        <div style="margin-top: 15px">
          <el-button type="primary" @click="getList">查询</el-button>
        </div>
        <div class="speed">
          速度：
          <div class="speed-input">
            <el-slider
              v-model="speed"
              :min="10"
              :max="1000"
              :step="10"
            ></el-slider>
          </div>
          <el-button type="primary" @click="changeAnimation">{{
            animationText
          }}</el-button>
        </div>
      </el-card>
    </div>
  </el-dialog>
</template>

<script>
import { Map, View, Feature } from "ol";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Point, LineString } from "ol/geom";
import { Style, Fill, Stroke, Circle as sCircle, Icon } from "ol/style";
import * as olProj from "ol/proj";
import { getVectorContext } from "ol/render";

import { getMap } from "@/utils/webStorage";
import mapType from "@/utils/openlayers/maptype";
import { getRotation, getCenterPoint } from "@/utils/openlayers/route";
export default {
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    location: {
      type: Array,
      default: () => {
        return [];
      },
    },
  },
  data() {
    return {
      dialogVisible: false,
      locaMap: null,
      openMap: null,
      routeSource: null,
      routeLayer: null,
      dateRange: [],
      routes: [],
      routesAll: [],
      routeGeometry: null,
      carGeometry: null,
      carFeature: null,
      speed: 60,
      animationText: "开始",
      animating: false, // 动画是否进行中
      lastRouteIndex: 0,
      styles: Object.freeze({
        route: new Style({
          stroke: new Stroke({
            lineDash: [2, 6, 10],
            width: 4,
            color: [0, 255, 0, 1],
          }),
        }),
        marker: new Style({
          image: new sCircle({
            radius: 10,
            stroke: new Stroke({
              color: "#fff",
            }),
            fill: new Fill({
              color: "#3399CC",
            }),
          }),
        }),
        carMarker: new Style({
          image: new Icon({
            rotation: 0,
            src: require("@/assets/img/car.png"),
            imgSize: [20, 36],
          }),
        }),
      }),
    };
  },
  watch: {
    visible: {
      handler: function (value) {
        if (value) {
          this.dialogVisible = true;
          this.locaMap = getMap() || "0";
          this.$nextTick(() => {
            this.initMap();
          });
        }
      },
      immediate: true,
    },
    speed() {
      this.getRoutesAll();
    },
  },
  mounted() {},
  methods: {
    initMap() {
      const _maplist = mapType;
      const _tileLayer = new TileLayer({
        source: _maplist.find((e) => e.id === this.locaMap).value,
      });
      this.routeSource = new VectorSource({ wrapX: false });

      this.routeLayer = new VectorLayer({
        source: this.routeSource,
        style: (feature) => {
          return this.styles[feature.get("type")];
        },
      });
      this.openMap = new Map({
        target: "fence-map",
        layers: [_tileLayer, this.routeLayer],
        view: new View({
          center: this.location,
          zoom: 10,
        }),
        controls: [],
      });
      this.getList();
    },
    getList() {
      let _data = [
        [108.945951, 34.465262],
        [109.04724, 34.262504],
        [108.580321, 34.076162],
        [110.458983, 35.071209],
        [105.734862, 35.49272],
      ];
      this.routes = _data.map((item) => {
        return olProj.fromLonLat(item);
      });
      this.getRoutesAll();
      this.drawRoute();
    },
    // 绘制轨迹
    drawRoute() {
      if (this.routeGeometry) {
        this.routeSource.clear();
      }
      this.routeGeometry = new LineString(this.routes);
      let route = new Feature({
        type: "route",
        geometry: this.routeGeometry,
      });
      // 绘制点
      let opints = this.drawPoint();
      // 添加小车
      let car = this.drawCar();
      this.routeSource.addFeatures([route, ...opints, car]);
      // 按轨迹边界缩放
      this.mapFit();
    },
    // 画点
    drawPoint() {
      let iconFeatures = [];
      this.routes.forEach((item) => {
        let _feature = new Feature({
          type: "marker",
          geometry: new Point(item),
        });
        iconFeatures.push(_feature);
      });
      return iconFeatures;
    },
    // 小车
    drawCar() {
      this.carGeometry = new Point(this.routeGeometry.getFirstCoordinate());
      const carMarker = new Feature({
        type: "carMarker",
        geometry: this.carGeometry,
      });
      this.carFeature = carMarker;
      return carMarker;
    },
    mapFit() {
      let view = this.openMap.getView();
      view.fit(this.routeGeometry, {
        padding: [120, 120, 120, 120],
      });
    },
    changeAnimation() {
      this.animating ? this.stopAnimation() : this.startAnimation();
    },
    // 开始动画
    startAnimation() {
      this.animating = true;
      this.lastTime = Date.now();
      this.animationText = "停止";
      this.routeLayer.on("postrender", this.moveFeature);
      this.carFeature.setGeometry(null);
    },
    // 停止动画
    stopAnimation() {
      this.animating = false;
      this.animationText = "开始";
      this.carFeature.setGeometry(this.carGeometry);
      this.routeLayer.un("postrender", this.moveFeature);
    },
    // 移动动画
    moveFeature(event) {
      const len = this.routesAll.length;
      if (this.lastRouteIndex < len - 1) {
        this.lastRouteIndex++;
      } else {
        this.lastRouteIndex = 0;
      }
      const current = this.routesAll[this.lastRouteIndex];
      // console.log(this.distance, currentCoordinate);
      this.carGeometry.setCoordinates(current.coordinate);
      const vectorContext = getVectorContext(event);
      let _style = new Style({
        image: new Icon({
          anchor: [0.5, 0.5],
          rotation: current.rotation,
          src: require("@/assets/img/car.png"),
          imgSize: [20, 36],
        }),
      });
      vectorContext.setStyle(_style);
      vectorContext.drawGeometry(this.carGeometry);
      this.openMap.render();
    },
    // 分割路径点
    getRoutesAll() {
      this.lastRouteIndex = 0;
      let _routesAll = [
        {
          coordinate: this.routes[0],
        },
      ];
      for (let i = 0, len = this.routes.length; i < len - 1; i++) {
        const item = this.routes[i];
        const itemNext = this.routes[i + 1];
        const rotation = getRotation(...item, ...itemNext);
        let points = getCenterPoint(this.openMap, [item, itemNext], this.speed);
        points = points.map((item) => {
          return {
            rotation,
            coordinate: item,
          };
        });
        _routesAll = [..._routesAll, ...points];
      }
      this.routesAll = _routesAll;
    },
    handleClose() {
      this.$emit("close");
    },
  },
};
</script>

<style lang="scss" scoped>
.route {
  .el-dialog__header {
    padding: 20px;
  }
  .el-dialog__body {
    padding: 0;
    .map-area {
      box-shadow: inset 5em 1em #000000;
      position: relative;
      .tool-window {
        width: 200px;
        position: absolute;
        bottom: 20px;
        right: 20px;
        .button {
          font-size: 20px;
        }
        .speed {
          margin-top: 15px;
          display: flex;
          align-items: center;
          .speed-input {
            flex: 1;
            margin: 0 10px;
          }
        }
      }
    }
  }
}
.map-box {
  width: 100%;
  height: 60vh;
}
</style>
