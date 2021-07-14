// import THREE from 'three';
import ThreejsMap from './ThreejsMap';
import img1 from '../../../../assets/images/lightray.jpg';
import img2 from '../../../../assets/images/lightray_yellow.jpg';
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
        this.textures = [];
        this.textures.push(new THREE.TextureLoader().load(img1));
        this.textures.push(new THREE.TextureLoader().load(img2));
        this.colors = [0xffffff, 0xffff00];
        this.cricleLines = new THREE.Group();
        this.scale = 1;
        this.opacity = 1;
    }

    /**
     * @desc 飞线动画
     */
    doAnimate = throttle(() => {
        const lightLinelen = 10; // 光效线条长度
        const color1 = new THREE.Color('#00e2ff');
        const color2 = new THREE.Color('#003fab');
        this.flyGroup.children.forEach(d => {
            d.geometry.colors = d.geometry.colors.map((d, i) => {
                const indexs = new Array(lightLinelen).fill(1).map((d, j) => j + i);
                if (indexs.indexOf(this.index) !== -1) {
                    return color1;
                } else {
                    return color2;
                }
            });
            d.geometry.colorsNeedUpdate = true;
        });
        this.index++;
        if (this.index > this.lineCount + lightLinelen) {
            this.index = 0;
        }

        this.cricleLines.children.forEach(d => {
            d.scale.set(this.scale, this.scale, d.scale.z);
            d.material.opacity = this.opacity;
        });
        this.scale += 0.02;
        if (this.scale > 2) {
            this.scale = 1;
        }
        this.opacity -= 0.02;
        if (this.opacity < 0) {
            this.opacity = 1;
        }
    }, 10);

    /**
     * @desc 控制器变化
     */
    controlChange() {
        console.log(this.datas);
    }

    /**
     * @desc 绘制飞行线
     */
    drawFly(data) {
        this.lineCount = 30; // 线段数量
        data.forEach(d => {
            const { source, target } = d;
            const start = this.getVector3ByAreaName(source.name);
            const end = this.getVector3ByAreaName(target.name);
            const curve = new THREE.QuadraticBezierCurve3(
                new THREE.Vector3(start.x, start.y, start.z),
                new THREE.Vector3((start.x + end.x) / 2, (start.y + end.y) / 2, 10),
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
            const material = new THREE.LineBasicMaterial({
                vertexColors: THREE.VertexColors,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            const line = new THREE.Line(geometry, material); // THREE.LinePieces 虚线
            this.flyGroup.add(line);
        });

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
     * @desc 绘制射光
     * @param {} zVal
     */
    _drawLightray(d, max, i) {
        const zVal = -(d.value / max) * 5;
        const material = new THREE.MeshBasicMaterial({
            map: this.textures[i % 2],
            transparent: true,
            side: THREE.DoubleSide,
            depthTest: false,
            blending: THREE.AdditiveBlending
        });
        const geometry = new THREE.PlaneGeometry(1, zVal * 2);
        const plane1 = new THREE.Mesh(geometry, material);
        const plane2 = new THREE.Mesh(geometry, material);
        plane1.rotation.x = Math.PI / 2;
        plane2.rotation.y = Math.PI / 2;
        plane1.add(plane2);
        const { x, y, z } = d.position;
        plane1.position.set(x, y, z - zVal + 0.1);
        plane1.data = d;
        this.nodeGroup.add(plane1);
    }

    /**
     * @desc 绘制地盘
     * @param {object} d
     */
    _drawCricle(d, max, i) {
        const color = this.colors[i % 2];
        const size = max / 200;
        const geometry1 = new THREE.CircleGeometry(size, 6);
        const material1 = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
        const circle1 = new THREE.Mesh(geometry1, material1);

        const geometry2 = new THREE.CircleGeometry(size + size / 3, 6);
        geometry2.vertices.shift();
        const material2 = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            depthTest: false,
            side: THREE.DoubleSide,
            opacity: 0.5
        });
        const circle2 = new THREE.LineLoop(geometry2, material2);

        const { x, y, z } = d.position;
        circle1.position.set(x, y, z + 0.1);
        circle2.position.set(x, y, z + 0.1);
        this.nodeGroup.add(circle1);
        this.nodeGroup.add(circle2);
        this.cricleLines.add(circle2.clone());
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

        datas.forEach((d, i) => {
            // 绘制射光
            this._drawLightray(d, max, i);

            // 绘制圆底
            this._drawCricle(d, max, i);
            // const geometry = new THREE.BoxBufferGeometry(1, 1, zVal);
            // const material = new THREE.MeshBasicMaterial({
            //     color: '#ffeb3b',
            //     transparent: true,
            //     opacity: 0.6,
            //     side: THREE.DoubleSide,
            //     wireframe: false
            // });
            // const cube = new THREE.Mesh(geometry, material);
            // const { x, y, z } = d.position;
            // cube.position.set(x, y, z - zVal / 2 + 0.1);
            // cube.data = d;
            // this.nodeGroup.add(cube);
        });
        this.datas = datas;
        this.scene.add(this.nodeGroup);
        this.scene.add(this.cricleLines);
    }
}

export default ThreejsMapDrawData;
