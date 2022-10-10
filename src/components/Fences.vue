<!--
 * @Author: Shao Tao
 * @Date: 2021-11-05 15:50:09
 * @LastEditTime: 2021-11-09 16:12:25
 * @LastEditors: Shao Tao
 * @Description: 
 * @FilePath: \vue-openlayers\src\components\Fences.vue
-->
<template>
  <el-dialog
    title="编辑围栏"
    :visible="dialogVisible"
    custom-class="fence"
    append-to-body
    @close="handleClose"
    width="1200px"
    destroy-on-close
  >
    <div id="fence-map" class="map-box"></div>
    <div class="map-area">
      <el-card class="tool-window" style="width: 380px">
        <el-form label-width="80px">
          <el-form-item label="围栏名称">
            <el-input
              size="small"
              v-model="name"
              placeholder="请输入围栏名称"
            ></el-input>
          </el-form-item>
          <el-form-item label="围栏样式">
            <el-radio-group v-model="tool" size="small" @change="setType">
              <el-radio-button label="Circle">圆形</el-radio-button>
              <el-radio-button label="Polygon">多边形</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button type="warning" size="small" @click="handleClear"
              >清除</el-button
            >
            <el-button type="primary" size="small" @click="handleSave"
              >保存</el-button
            >
            <el-button size="small" @click="handleClose">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </el-dialog>
</template>

<script>
import { Map, View } from "ol";
import { Draw } from "ol/interaction";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Style, Fill, Stroke, Circle as sCircle } from "ol/style";
import * as olProj from "ol/proj";
import { mapActions } from "vuex";

import { getMap } from "@/utils/webStorage";
import mapType from "@/utils/openlayers/maptype";
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
      fenceSource: null,
      fenceDraw: null,
      tool: "Circle",
      name: "",
      circleInfo: null,
      polygonPath: [],
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
  },
  mounted() {},
  methods: {
    ...mapActions(["addFences"]),
    initMap() {
      const _maplist = mapType;
      const _tileLayer = new TileLayer({
        source: _maplist.find((e) => e.id === this.locaMap).value,
      });
      this.fenceSource = new VectorSource({ wrapX: false });

      const _vector = new VectorLayer({
        source: this.fenceSource,
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
      console.log(this.location);
      this.openMap = new Map({
        target: "fence-map",
        layers: [_tileLayer, _vector],
        view: new View({
          center: this.location,
          zoom: 10,
        }),
        controls: [],
      });
      this.addInteraction();
    },
    handleClose() {
      this.$emit("close");
    },
    // 设置类型
    setType() {
      this.fenceSource.clear();
      this.openMap.removeInteraction(this.fenceDraw);
      this.addInteraction();
    },
    addInteraction() {
      this.fenceDraw = new Draw({
        source: this.fenceSource,
        type: this.tool,
      });
      this.openMap.addInteraction(this.fenceDraw);
      this.fenceDraw.on("drawend", (e) => {
        // 绘制完成的回调
        this.drawEnd(e);
      });
      this.mapOnly();
    },
    // 绘制完成解析结构
    drawEnd(evt) {
      let geo = evt.feature.getGeometry();
      let type = geo.getType(); //获取类型
      const handle = {
        Circle: () => {
          //获取中心点和半径
          let center = geo.getCenter();
          let radius = geo.getRadius();
          this.circleInfo = {
            center: center,
            radius: parseInt(radius),
          };
        },
        Polygon: () => {
          //获取坐标点
          let points = geo.getCoordinates();
          console.log(points);
          this.polygonPath = points[0];
        },
      };
      if (handle[type]) handle[type]();
    },
    // 数据处理
    formatFenceData() {
      const handle = {
        Circle: () => {
          if (!this.circleInfo) {
            this.$message.error(this.$t("lan_map.lan_map_fences.pdrwf"));
            return;
          }
          const center = this.circleInfo.center;
          const radius = this.circleInfo.radius;
          const p = olProj.toLonLat(center);
          return `Circle (${p[0]} ${p[1]}, ${radius})`;
        },
        Polygon: () => {
          if (this.polygonPath.length === 0) {
            this.$message.error(this.$t("lan_map.lan_map_fences.pdrwf"));
            return;
          }
          const path = this.polygonPath;
          console.log(path);
          const pathArr = [];
          path.forEach((item) => {
            const p = olProj.toLonLat(item);
            pathArr.push(`${p[0]} ${p[1]}`);
          });
          return `Polygon (${pathArr.join(", ")})`;
        },
      };
      const type = this.tool;
      if (handle[type]) {
        return handle[type]();
      }
    },
    // 检测是否重复绘制
    mapOnly() {
      this.fenceDraw.on("drawstart", () => {
        if (this.tool === "Polygon") {
          // 如果已经存在则删除上一个几何
          if (this.polygonPath)
            this.fenceSource.clear() && (this.polygonPath = []);
        } else {
          if (this.circleInfo)
            this.fenceSource.clear() && (this.circleInfo = null);
        }
      });
    },
    handleClear() {
      this.fenceSource.clear();
    },
    handleSave() {
      // 保存
      if (!this.name) {
        this.$message.error("请输入围栏名称");
        return;
      }
      const area = this.formatFenceData();
      console.log(area);
      if (area) {
        let data = {
          name: this.name,
          area: area,
        };
        // 可调用后端api进行保存，本文直接就存本地vuex中了
        this.addFences(data);
        // 清空输入框
        this.name = "";
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.fence {
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
        .step {
          font-size: 16px;
          padding-top: 13px;
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
