// import THREE from 'three';

import ThreejsMap from './ThreejsMap';
import img1 from '../../../../assets/images/bg1.png';
import img2 from '../../../../assets/images/bg2.png';
import img3 from '../../../../assets/images/bg3.png';
import img4 from '../../../../assets/images/bg4.png';
import texture from '../../../../assets/images/texture-atlas.jpg';
import throttle from 'lodash.throttle';
// import gradient from 'color-gradient';

/**
 * @desc 绘制数据模块
 */
const THREE = window.THREE;
class ThreejsMapDrawData extends ThreejsMap {
    constructor(props) {
        super(props);
        this.flyGroup = new THREE.Group();
        this.nodeGroup = new THREE.Group();
        this.index = 0;
    }

    /**
     * @desc 飞线动画
     */
    doAnimate = throttle(() => {
        if (!this.scene) {
            return;
        }
        if (this.flyGroup) {
            const len = 10;
            const color1 = new THREE.Color('#00e2ff');
            const color2 = new THREE.Color('#003fab');
            this.flyGroup.children.forEach(d => {
                d.geometry.colors = d.geometry.colors.map((d, i) => {
                    const indexs = new Array(len).fill(1).map((d, j) => j + i);
                    if (indexs.indexOf(this.index) !== -1) {
                        return color1;
                    } else {
                        return color2;
                    }
                });
                d.geometry.colorsNeedUpdate = true;
            });
            this.index++;
            if (this.index > this.lineCount + len) {
                this.index = 0;
            }
        }
    }, 20);

    /**
     * @desc 绘制飞行线
     */
    drawFly(data) {
        this.lineCount = 30; // 线段数量
        data.forEach(d => {
            const { source, target } = d;
            const start = this.getVector3ByAreaName(source.name);
            const end = this.getVector3ByAreaName(target.name);
            if (!start || !end) {
                return;
            }
            const curve = new THREE.QuadraticBezierCurve3(
                new THREE.Vector3(start.x, start.y, start.z),
                new THREE.Vector3((start.x + end.x) / 2, (start.y + end.y) / 2, 8),
                new THREE.Vector3(end.x, end.y, end.z)
            );
            const points = curve.getPoints(this.lineCount);
            const geometry = new THREE.Geometry();
            // const colors = gradient('#00e2ff', '#00e2ff', points.length - 2, { has_heads: true, output: 'rgb' }).map(
            //     d => new THREE.Color(d)
            // );
            const colors = new Array(points.length).fill('#00e2ff');
            geometry.vertices = points;
            geometry.colors = colors;
            const material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
            const line = new THREE.Line(geometry, material); // THREE.LinePieces 虚线
            this.flyGroup.add(line);
        });

        // console.log(this.flyGroup);

        this.scene.add(this.flyGroup);
    }

    /**
     * @desc 清空data
     */
    clearData() {
        for (let key in this.dataKey) {
            if (this.dataKey[key]) {
                delete this.dataKey[key].bindData;
            }
        }
        this.nodeGroup.children = [];
    }

    /**
     * @desc 获取绑定数据
     */
    getBindData(name) {
        return this.dataKey[name].bindData;
    }

    /**
     * @desc 绘制数据模块
     */
    drawData(data) {
        const datas = [];
        let max = 0;
        this.data.forEach(d => {
            let val = data.find(e => {
                let mark = e.name === d.data.properties.name;
                if (mark) {
                    this.dataKey[e.name].bindData = e;
                    e.position = { ...d.position };
                }
                return mark;
            });
            if (val) {
                if (val.value > max) {
                    max = val.value;
                }
                datas.push(val);
            }
        });
        if (max === 0) {
            max = 1;
        }
        datas.forEach(d => {
            const zVal = -(d.value / max) * 5;
            const geometry = new THREE.BoxBufferGeometry(1.6, 1.6, zVal);
            const faceMaterial = new THREE.MeshFaceMaterial([
                new THREE.MeshPhongMaterial({
                    // 前
                    emissive: new THREE.Color('#ffed87'),
                    emissiveIntensity: 0.5,
                    side: THREE.DoubleSide,
                    map: THREE.ImageUtils.loadTexture(img2)
                }),
                new THREE.MeshPhongMaterial({
                    // 后
                    emissive: new THREE.Color('#333'),
                    transparent: true,
                    side: THREE.DoubleSide,
                    opacity: 1,
                    map: THREE.ImageUtils.loadTexture(img3)
                }),
                new THREE.MeshPhongMaterial({
                    // 右
                    emissive: new THREE.Color('#333'),
                    transparent: true,
                    side: THREE.DoubleSide,
                    opacity: 1,
                    map: THREE.ImageUtils.loadTexture(img1)
                }),
                new THREE.MeshPhongMaterial({
                    // 左
                    emissive: new THREE.Color('#ffed87'),
                    emissiveIntensity: 0.4,
                    side: THREE.DoubleSide,
                    map: THREE.ImageUtils.loadTexture(img4)
                }),
                new THREE.MeshPhongMaterial({
                    // 下
                    color: '#ffeb3b',
                    transparent: false,
                    opacity: 1,
                    side: THREE.DoubleSide
                }),
                new THREE.MeshBasicMaterial({
                    // 上
                    color: '#fad35c',
                    transparent: false,
                    opacity: 1,
                    side: THREE.DoubleSide
                })
            ]);
            geometry.rotateZ(Math.PI / 4);
            geometry.rotateY(-Math.PI / 6);
            const cube = new THREE.Mesh(geometry, faceMaterial);
            const { x, y, z } = d.position;
            cube.position.set(x, y, z - zVal / 2 + 0.1);
            this.nodeGroup.add(cube);
        });
        this.scene.add(this.nodeGroup);
    }
}

export default ThreejsMapDrawData;
