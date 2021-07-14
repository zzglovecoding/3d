import * as d3 from 'd3-geo';

import EventEmitter from 'events';

class Utils {
    /**
     * @desc 事件
     */
    event = new EventEmitter();

    /**
     * @desc 获取当前位置
     */
    getElementPos(target) {
        const pos = {
            left: target.offsetLeft,
            top: target.offsetTop
        };
        target = target.offsetParent;
        while (target) {
            pos.left += target.offsetLeft;
            pos.top += target.offsetTop;

            target = target.offsetParent;
        }
        console.log('>>>>>', pos);
        return pos;
    }

    /**
     * @desc 经纬度转换成3D 坐标
     * @param lng 经度
     * @param lat 纬度
     */
    lnglatToVector32(lnglat, type = '3d', center) {
        if (!this.projection) {
            this.projection = this.defineProjection(center);
        }
        const [y, x] = this.projection([...lnglat]);
        let vector = null;
        if (type === '2d') {
            vector = new window.THREE.Vector2(x, y);
        } else {
            vector = new window.THREE.Vector3(x, y, 0);
        }
        return vector;
    }

    /**
     * @desc vector3 to 屏幕坐标
     */
    vector3ToPosition(vector3, camera, width, height) {
        const vector = vector3.project(camera);
        var halfWidth = width / 2;
        var halfHeight = height / 2;
        const x = Math.round(vector.x * halfWidth + halfWidth);
        const y = Math.round(-vector.y * halfHeight + halfHeight);
        return [x, y];
    }

    /**
     * @desc 设置随机颜色
     */
    getRandomColor() {
        return '#' + ('00000' + ((Math.random() * 16777215 + 0.5) >> 0).toString(16)).slice(-6);
    }

    /**
     * 生成随机数字
     * @param {number} min 最小值（包含）
     * @param {number} max 最大值（不包含）
     */
    randomNumber(min = 0, max = 100) {
        return Math.min(Math.floor(min + Math.random() * (max - min)), max);
    }

    /*
     *定义投影函数
     */
    defineProjection(center) {
        // 定义投影函数
        const projection = d3
            .geoMercator()
            .center([...center])
            .scale(80)
            .rotate(Math.PI / 4)
            .translate([0, 0]);
        return projection;
    }

    /**
     * 地图数据解码
     */
    decode(json) {
        if (!json.UTF8Encoding) {
            return json;
        }
        let encodeScale = json.UTF8Scale;
        if (!encodeScale) {
            encodeScale = 1024;
        }
        let features = json.features;

        features.forEach(feature => {
            let geometry = feature.geometry;
            let coordinates = geometry.coordinates;
            let encodeOffsets = geometry.encodeOffsets;
            coordinates.forEach((coordinate, c) => {
                if (geometry.type === 'Polygon') {
                    coordinates[c] = this.decodePolygon(coordinate, encodeOffsets[c], encodeScale);
                } else if (geometry.type === 'MultiPolygon') {
                    coordinate.forEach((polygon, c2) => {
                        coordinate[c2] = this.decodePolygon(polygon, encodeOffsets[c][c2], encodeScale);
                    });
                }
            });
        });
        // Has been decoded
        json.UTF8Encoding = false;
        return json;
    }

    /**
     * @desc 解码
     */
    decodePolygon(coordinate, encodeOffsets, encodeScale) {
        const result = [];
        let prevX = encodeOffsets[0];
        let prevY = encodeOffsets[1];

        for (let i = 0; i < coordinate.length; i += 2) {
            let x = coordinate.charCodeAt(i) - 64;
            let y = coordinate.charCodeAt(i + 1) - 64;
            // ZigZag decoding
            x = (x >> 1) ^ -(x & 1);
            y = (y >> 1) ^ -(y & 1);
            // Delta deocding
            x += prevX;
            y += prevY;

            prevX = x;
            prevY = y;
            // Dequantize
            result.push([x / encodeScale, y / encodeScale]);
        }
        return result;
    }

    /**
     * 随机id ,长度默认是8
     */
    randomID(randomLength = 8) {
        return Number(
            Math.random()
                .toString()
                .substr(3, randomLength) + Date.now()
        ).toString(36);
    }
}

export default new Utils();
