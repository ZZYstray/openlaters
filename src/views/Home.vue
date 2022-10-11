<template>
  <div class="home">
    <div id="map" class="map-home"></div>
    <!-- 信息弹框 -->
    <div ref="popup" class="popup" v-show="showPopup">
      <div class="info">
        <ul>
          <li>信息1：xxx</li>
          <li>信息2：xxx</li>
          <li>信息3：xxx</li>
        </ul>
        <div class="btns-box">
          <el-button @click.native="handleOperate('dialog-route')">
            历史轨迹
          </el-button>
        </div>
      </div>
    </div>
    <!-- 右键菜单 -->
    <div ref="menuPopup" class="menu-popup" v-show="showMenuPopup">
      <div class="menus">
        <ul>
          <li>
            <el-button @click.native="handleOperate('dialog-fence')"
              >新增围栏</el-button
            >
          </li>
          <li>
            <el-button @click.native="handleOperate('dialog-trajectory')"
              >新增轨迹</el-button
            >
          </li>
        </ul>
      </div>
    </div>
    <!-- 右下角选择控件 -->
    <div class="map-toolbar">
      <!-- 地图围栏 -->
      <el-select v-model="fence" style="width: 150px">
        <el-option
          label="不显示围栏"
          value="-1"
          key="-1"
          @click.native="handleSelectFence(null)"
        ></el-option>
        <el-option
          v-for="(item, index) in fences"
          :label="item.name"
          :value="item.name"
          :key="index"
          @click.native="handleSelectFence(item)"
        ></el-option>
      </el-select>
      <!-- 地图选择 -->
      <el-select v-model="locaMap" style="width: 150px">
        <el-option
          v-for="item in mapList"
          :label="item.name"
          :value="item.id"
          :key="item.id"
          @click.native="setMapSource(item)"
        ></el-option>
      </el-select>
    </div>
    <!-- 鼠标经纬度坐标 -->
    <div id="mouse-position">经纬度坐标</div>
    <!-- 全屏控件 -->
    <div id="Full-Screen">全屏</div>

    <div id="Overview-Map">缩略图</div>
    <div id="Scale-Line">比例尺</div>
    <div id="Zoom-ToExtent">放大</div>


    <component
      v-if="operateDialogVisible"
      :is="currentComponent"
      :visible="operateDialogVisible"
      :location="position"
      @close="handleOperateClose"
    ></component>
  </div>
</template>

<script>
import { Map, View, Feature, Overlay } from "ol";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { Cluster, Vector as VectorSource } from "ol/source";
import * as olProj from "ol/proj";
import { Point, Polygon, Circle as gCircle, MultiLineString} from "ol/geom";
import { Style, Fill, Stroke, Text, Circle as sCircle } from "ol/style";
import { boundingExtent } from "ol/extent";
import { mapGetters } from "vuex";
import { getMap, setMap } from "@/utils/webStorage";
import mapType from "@/utils/openlayers/maptype";

import {defaults,FullScreen,MousePosition,OverviewMap,ScaleLine,ZoomSlider,ZoomToExtent} from 'ol/control';

export default {
  name: "Home",
  components: {
    DialogFence: () => import("@/components/Fences"),
    DialogRoute: () => import("@/components/Route"),
    DialogTrajectory: () => import("@/components/Trajectory"),
  },
  data() {
    return {
      openMap: null,
      popup: null,
      menuPopup: null,
      showPopup: false,
      showMenuPopup: false,
      tileLayer: null, // 地图层
      markerLayer: null, // 坐标标记层
      markerSource: null, // 坐标数据源
      mapList: null, // 地图列表
      locaMap: getMap() || "1",
      operateDialogVisible: false,
      currentComponent: null,
      position: null,
      fence: null,
      fenceVector: null, // 围栏层
    };
  },
  computed: {
    ...mapGetters(["fences"]),
  },
  mounted() {
    this.mapList = mapType;
    this.tileLayer = new TileLayer({
      source: mapType.find((e) => e.id === this.locaMap).value,
    });
    this.initMap();
  },
  methods: {
    // 安装地图组件
    initMap() {
      this.openMap = new Map({
        // 选择放置的标签元素
        target: "map",
        layers: [this.tileLayer],
        // 配置地图窗口
        view: new View({
          center: olProj.fromLonLat([108.945951, 34.465262]),
          zoom: 6,
        }),
        controls: defaults().extend([
            new FullScreen({
              target: document.getElementById('Full-Screen'),     // 容器id
            }),// 全屏控件
            new MousePosition({
              projection: 'EPSG:4326',                               // 投影
              className: 'custom-mouse-position',                    // 文字样式
              target: document.getElementById('mouse-position'),     // 容器id
              undefinedHTML: '&nbsp'                                 // 未定义坐标的标记
            }), //  鼠标位置控件
            new OverviewMap({
              target: document.getElementById('Overview-Map'),     // 容器id
            }), // 缩略图控件
            new ScaleLine({
              target: document.getElementById('Scale-Line'),     // 容器id
            }),// 比例尺控件
            new ZoomSlider({
              target: document.getElementById('Zoom-Slider'),     // 容器id
            }), // 缩放滚动条控件
            new ZoomToExtent({
              target: document.getElementById('Zoom-ToExtent'),     // 容器id
            })// 放大到设定区域控件
        ]),
      });
      this.setMarker();
      this.addOverlay();
      this.addEvent();
    },
    getPoints() {
      // 各个城市点坐标
      return [
        [108.945951, 34.465262],
        [109.04724, 34.262504],
        [108.580321, 34.076162],
        [110.458983, 35.071209],
        [105.734862, 35.49272],
        [120.200062, 30.30272], // 杭州
        [113.235362, 23.10622], // 广州
        [114.055235, 22.551754], // 深圳
        [116.397119, 39.90790], // 北京
        [121.447119, 31.23790], // 上海

      ];
    },
    setMarkerSource() {
      const _points = this.getPoints();
      const _features = _points.map((item) => {
        const _feature = new Feature({
          geometry: new Point(olProj.fromLonLat(item)),
        });
        return _feature;
      });
      this.markerSource = new Cluster({
        distance: 100,
        source: new VectorSource({
          features: _features,
        }),
      });
    },
    setClusterStyle() {
      const styleCache = {};
      const _style = (feature) => {
        const size = feature.get("features").length;
        let style = styleCache[size];
        if (!style) {
          if (size > 1) {
            style = new Style({
              image: new sCircle({
                radius: 20,
                stroke: new Stroke({
                  color: "#fff",
                }),
                fill: new Fill({
                  color: "#3399CC",
                }),
              }),
              text: new Text({
                text: size.toString(),
                fill: new Fill({
                  color: "#fff",
                }),
              }),
            });
          } else {
            style = new Style({
              image: new sCircle({
                radius: 15,
                stroke: new Stroke({
                  color: "#fff",
                }),
                fill: new Fill({
                  color: "#e9b626",
                }),
              }),
            });
          }
          styleCache[size] = style;
        }
        return style;
      };
      return _style;
    },
    setMarker() {
      this.setMarkerSource();
      let _style = this.setClusterStyle();
      this.markerLayer = new VectorLayer({
        source: this.markerSource,
        style: _style,
      });
      this.openMap.addLayer(this.markerLayer);
    },
    addOverlay() {
      // 创建Overlay
      let elPopup = this.$refs.popup;
      this.popup = new Overlay({
        element: elPopup,
        positioning: "bottom-center",
        stopEvent: false,
        offset: [0, -20],
      });
      this.openMap.addOverlay(this.popup);
      // 创建右键Overlay
      let elMenuPopup = this.$refs.menuPopup;
      this.menuPopup = new Overlay({
        element: elMenuPopup,
      });
      this.openMap.addOverlay(this.menuPopup);
    },
    // 监听事件统一调用
    addEvent() {
      this.mouseClick();
      this.resolutionChange();
      this.pointermove();
    },
    mouseClick() {
      // 左键点击
      this.openMap.on("singleclick", (e) => {
        // 隐藏右键菜单
        this.showMenuPopup = false;
        this.markerLayer.getFeatures(e.pixel).then((clickedFeatures) => {
          if (clickedFeatures.length) {
            const features = clickedFeatures[0].get("features");
            if (features.length > 1) {
              const extent = boundingExtent(
                features.map((r) => r.getGeometry().getCoordinates())
              );
              this.mapFit(extent);
            } else {
              this.showPopup = true;
              // 设置弹窗位置
              let coordinates = features[0].getGeometry().getCoordinates();
              this.position = coordinates;
              this.popup.setPosition(coordinates);
            }
          } else {
            this.showPopup = false;
          }
        });
      });
      // 右键点击
      this.openMap.getViewport().oncontextmenu = (e) => {
        // 取消默认右键事件
        e.preventDefault();
        this.showMenuPopup = true;
        // 设置弹窗位置
        let coordinates = this.openMap.getEventCoordinate(e);
        this.position = coordinates;
        this.menuPopup.setPosition(coordinates);
      };
    },
    resolutionChange() {
      // 监听缩放
      this.openMap.getView().on("change:resolution", () => {
        this.showPopup = false;
        this.showMenuPopup = false;
      });
    },
    pointermove() {
      this.openMap.on("pointermove", (e) => {
        if (this.openMap.hasFeatureAtPixel(e.pixel)) {
          this.openMap.getViewport().style.cursor = "pointer";
        } else {
          this.openMap.getViewport().style.cursor = "inherit";
        }
      });
    },
    // 切换地图
    setMapSource(e) {
      this.tileLayer.setSource(e.value);
      setMap(e.id);
    },
    // 展示围栏
    handleSelectFence(data) {
      if (this.fenceVector) {
        this.openMap.removeLayer(this.fenceVector);
      }
      if (!data) {
        this.fence = null;
        return false;
      }
      const area = this.areaFomart(data.area);
      this.setFenceSource(area);
    },
    // 围栏数据转换
    areaFomart(area) {
      // eslint-disable-next-line
      const point = area.match(/[^\(\)]+(?=\))/g)[0].split(", ");
      if (area.match("Circle")) {
        return {
          type: "Circle",
          center: olProj.fromLonLat(point[0].split(" ")),
          radius: Number(point[1]),
        };
      }
      if (area.match("Polygon")) {
        const path = [];
        point.forEach((item) => {
          path.push(olProj.fromLonLat(item.split(" ")));
        });
        return {
          type: "Polygon",
          path: path,
        };
      }
      if (area.match("MultiLineString")) {
        const path = [];
        point.forEach((item) => {
          path.push(olProj.fromLonLat(item.split(" ")));
        });
        return {
          type: "MultiLineString",
          path: path,
        };
      }
    },
    // 绘制围栏
    setFenceSource(area) {
      let feature;
      switch (area.type) {
        case "Circle": {
          feature = new Feature(new gCircle(area.center, area.radius));
          break;
        }
        case "Polygon": {
          feature = new Feature(new Polygon([area.path]));
          break;
        }
        case "MultiLineString": {
          feature = new Feature(new MultiLineString([area.path]));
          break;
        }
        default:
          break;
      }
      // 缩放到围栏区域
      this.mapFit(feature.getGeometry());
      //矢量图层
      let source = new VectorSource({
        features: [feature],
      });
      let vector = new VectorLayer({
        source,
        style: new Style({
          fill: new Fill({
            color: "rgba(49,173,252, 0.2)",
          }),
          stroke: new Stroke({
            color: "#0099FF",
            width: 3,
          }),
          image: new sCircle({
            radius: 7,
            fill: new Fill({
              color: "#0099FF",
            }),
          }),
        }),
      });
      this.fenceVector = vector;
      this.openMap.addLayer(vector);
    },
    // 按边界缩放
    mapFit(extent) {
      this.openMap
        .getView()
        .fit(extent, { duration: 1000, padding: [200, 200, 200, 200] });
    },
    // 打开弹窗
    handleOperate(component) {
      this.showMenuPopup = false;
      this.operateDialogVisible = true;
      this.currentComponent = component;
    },
    // 关闭弹窗
    handleOperateClose() {
      this.operateDialogVisible = false;
    },
    //实例化比例尺控件（ScaleLine）
    ScaleLine() {},
  },
};
</script>
<style lang="scss" scoped>
.map-home {
  width: 100vw;
  height: 100vh;
}
.popup {
  width: 200px;
  background-color: white;
  padding: 18px;
  border-radius: 10px;
  box-shadow: 0 0 15px rgb(177, 177, 177);
  .info {
    font-size: 14px;
    text-align: left;
    ul {
      padding-left: 0;
    }
  }
  .btns-box {
    display: flex;
    margin-top: 20px;
  }
}
.menus {
  border-radius: 5px;
  padding: 5px;
  background: #fff;
}

.map-toolbar {
  position: absolute;
  bottom: 7px;
  right: 20px;
}

#mouse-position {
  position: absolute;
  left: 20px;
  bottom: 20px;
  background-color: #fff;
}
#Full-Screen {
  position: absolute;
  top: 20px;
  right: 20px;
  ::v-deep .ol-full-screen-false {
    border-radius: 10px;
    background-color: #00aaff;
    font-size: 20px;
  }
}

#Overview-Map {
  position: absolute;
  top: 20px;
  right: 100px;

}
#Scale-Line {
  position: absolute;
  left: 20px;
  bottom: 100px;
  background-color: #fff;

}
#Zoom-Slider {
  position: absolute;
  top: 0;
  left: 20px;
}
#Zoom-ToExtent {
  position: absolute;
  top: 0;
  left: 100px;
}
::v-deep .ol-zoom {
  position: absolute;
  top: 40px;
  right: 200px;
  
  .ol-zoom-in {
    width: 30px;
    height: 30px;
    background-color: #00aaff;
    border-radius: 10px;
  }
  .ol-zoom-out{
    width: 30px;
    height: 30px;
    background-color: #00aaff;
    border-radius: 10px;
  }
}
</style>
