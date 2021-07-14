import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
/**
 * @desc 基于threejs做的3d地图，采用geo-json数据
 */
import util from './util';

const THREE = window.THREE;
class ThreejsMap {
    constructor(set) {
        this.set = Object.assign(
            {
                debug: true, // 调试模式
                amount: 2, // 地图厚度
                mapData: null, // 地图geo-json数据
                center: [108.372124, 34.296211], // 传入经纬度，中心操作点。结合http://api.map.baidu.com/lbsapi/getpoint/index.html查询
                light: {
                    // 光设置
                    color: 0xffffff,
                    intensity: 0.5
                },
                control: {
                    // 控制器设置
                    move: true,
                    scale: true,
                    rotate: true
                },
                lineStyle: {
                    color: '#6eb1ff' // 线条样式
                },
                mapStyle: {
                    color: '#2672cf', // 地图样式
                    opacity: 0.8
                },
                camera: {
                    // 相机位置
                    x: 200,
                    y: 0,
                    z: 100
                }
            },
            { ...set }
        );
        if (!this.set.container) {
            console.error('container不能为null');
            return;
        }
        if (!this.set.mapData) {
            console.error('mapData不能为null');
            return;
        }
        this.divpos = util.getElementPos(this.set.container);
        this.mapData = this.set.mapData;
        this.container = this.set.container;
        this.width = this.set.container.offsetWidth;
        this.height = this.set.container.offsetHeight;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.labelRenderer = null;

        this.group = new THREE.Group();
        this.lineGroup = new THREE.Group();
        // click事件用
        this.SELECTED = null;
        this.raycaster = new THREE.Raycaster();
        this.data = []; // 原始数据
        this.dataKey = {}; // name: data
        this.func = {};
        this.init();
    }

    /**
     * @desc 通过地名获取三维坐标
     */
    getVector3ByAreaName(name) {
        return { ...this.dataKey[name].areaVector3 };
    }

    /**
     * @desc 通过地名获取平面坐标
     */
    getPositionByAreaName(name) {
        const { x, y, z } = this.getVector3ByAreaName(name);
        return this.vector3ToPosition(new THREE.Vector3(x, y, z));
    }

    /**
     * @desc 设置模块选中
     */
    setAreaSelect(name) {
        this.recoverMapColor();
        const mesh = this.dataKey[name];
        if (mesh) {
            mesh.children.forEach(d => {
                d.material.color = new window.THREE.Color('#033577');
            });
        } else {
            console.warn('未找到', name, '对应的数据');
        }
    }

    /**
     * @desc 通过名称获取经纬度
     */
    getLngLatByAreaName(name) {
        return [...this.dataKey[name].data.properties.cp];
    }

    /**
     * @desc 三维坐标转平面坐标
     */
    vector3ToPosition(vector3) {
        const [left, top] = util.vector3ToPosition(vector3, this.camera, this.width, this.height);
        return { left, top };
    }

    /**
     * @desc 经纬度转化为平面坐标
     */
    lnglatToPosition(lnglat) {
        const vector3 = util.lnglatToVector32([...lnglat], '3d', this.set.center);
        return this.vector3ToPosition(vector3);
    }

    /**
     * @desc 设置标签的坐标
     * @param {*} points
     */
    setLabel() {
        this.group.children.forEach((d, i) => {
            const { x, y, z } = d.areaVector3;
            const { left, top } = this.vector3ToPosition(new THREE.Vector3(x, y, z));
            if (!this.hasBindLabelData) {
                this.data.push({ left, top, data: d.data, position: { x, y, z } });
            } else {
                this.data[i].left = left;
                this.data[i].top = top;
                this.data[i].position = { x, y, z };
            }
        });
        this.hasBindLabelData = true;
        this.seek && this.seek(this.data);

        // 柱状数据设置left, top 参数
        // this.nodeGroup &&
        //     this.nodeGroup.children.forEach(d => {
        //         const { x, y, z } = d.position;
        //         const { left, top } = this.vector3ToPosition(new THREE.Vector3(x, y, z * 2));
        //         d.data.coordinates = { left, top };
        //     });
    }

    /**
     * @desc 绘制线条
     */
    drawLine(vector3s) {
        const { color } = this.set.lineStyle;
        const mater = new THREE.LineBasicMaterial({ color });
        const geometry = new THREE.Geometry();
        vector3s.forEach(({ x, y }) => {
            geometry.vertices.push(new THREE.Vector3(x, y, 0));
        });

        const line = new THREE.Line(geometry, mater);
        // 底部线
        const lineBottom = line.clone();
        lineBottom.translateZ(-this.set.amount);
        this.lineGroup.add(lineBottom);

        // 上面的线
        line.translateZ(0 + 0.01);
        this.lineGroup.add(line);
        // this.lineGroup.add(line.clone().translateY(0.02));
        // this.lineGroup.add(line.clone().translateY(0.01));
        // this.lineGroup.add(line.clone().translateY(-0.01));
        // this.lineGroup.add(line.clone().translateY(-0.02));
        this.scene.add(this.lineGroup);
    }

    /**
     * @desc 绘制shape
     */
    drawShape(points) {
        const { color, opacity } = this.set.mapStyle; // util.getRandomColor(); // 颜色
        const shape = new THREE.Shape();
        points.forEach((d, i) => {
            const { x, y } = d;
            if (i === 0) {
                shape.moveTo(x, y);
            } else if (i === points.length - 1) {
                shape.quadraticCurveTo(x, y, points[0].x, points[0].y);
            } else {
                shape.lineTo(x, y);
            }
        });

        // 网格模型
        const geometry = new THREE.ExtrudeGeometry(
            shape, //拉伸参数
            {
                amount: -this.set.amount, //拉伸长度
                bevelEnabled: false //无倒角
            }
        );
        // 材质
        const mater = new THREE.MeshLambertMaterial({
            color,
            transparent: true,
            opacity,
            side: THREE.DoubleSide,
            wireframe: false
        });
        const meshline = new THREE.Mesh(geometry, mater);
        return meshline;
    }

    /**
     * @desc 绘制地图
     */
    drawMap() {
        if(!this.mapData) {
            return;
        }
        const { features } = util.decode(this.mapData);
        // 计算省会坐标
        features.forEach(d => {
            d.vertor3 = [];
            d.geometry.coordinates.forEach((coordinate, i) => {
                d.vertor3[i] = [];
                coordinate.forEach((p, j) => {
                    if (p[0] instanceof Array) {
                        d.vertor3[i][j] = [];
                        p.forEach(e => {
                            d.vertor3[i][j].push(util.lnglatToVector32(e, '2d', this.set.center));
                        });
                    } else {
                        d.vertor3[i].push(util.lnglatToVector32(p, '2d', this.set.center));
                    }
                });
            });
        });

        // 绘制省会地图
        features.forEach(d => {
            const g = new THREE.Group();
            d.vertor3.forEach(v1 => {
                if (v1[0] instanceof Array) {
                    v1.forEach(v2 => {
                        g.add(this.drawShape(v2));
                        this.drawLine(v2);
                    });
                } else {
                    g.add(this.drawShape(v1));
                    this.drawLine(v1);
                }
            });
            g.data = d;
            g.areaVector3 = util.lnglatToVector32([...d.properties.cp], '3d', this.set.center);
            this.dataKey[d.properties.name] = g;
            this.group.add(g);
        });

        this.scene.add(this.group);
    }

    /**
     * @desc 初始化threejs
     */
    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(10, this.width / this.height, 1, 1000);
        this.setCamera();
        this.setLight();
        this.setRender();

        // 绘制地图
        this.drawMap();

        if (this.set.debug) {
            this.setStats();
            this.setHelper();
        }
        this.setAnimate();
        this.setControl();

        // 设置标签数据
        this.setLabel();
        this.correctLabel();
    }

    /**
     * @desc 设置光效
     */
    setLight() {
        const { intensity, color } = this.set.light;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.x = 0;
        light.position.y = 0;
        light.position.z = 50;
        this.scene.add(light);

        const light2 = new THREE.AmbientLight(0x404040); // soft white light
        this.scene.add(light2);
    }

    /**
     * @desc 设置辅助线
     */
    setHelper() {
        const helpers = new THREE.AxisHelper(100);
        this.scene.add(helpers);
    }

    /**
     * @desc 性能测试
     */
    setStats() {
        this.stats = new window.Stats();
        $('body').append(this.stats.dom);
    }

    /**
     * @desc 动画，有动画才可以执行控制器
     */
    deg = 0;
    setAnimate() {
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.setAnimate.bind(this));
        this.stats && this.stats.update();

        // this.setLabel();

        // 在继承方法中使用
        this.doAnimate && this.doAnimate();
    }

    /**
     * @desc 设置渲染器
     */
    setRender() {
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            logarithmicDepthBuffer: true,
            preserveDrawingBuffer: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        // this.renderer.localClippingEnabled = true;
        this.container.appendChild(this.renderer.domElement);
    }

    /**
     * @desc 使用防抖函数矫正label
     */
    correctLabel = debounce(() => {
        this.setLabel();
    }, 50);

    /**
     * @desc 设置控制器
     */
    setControl() {
        this.orbitControl = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControl.enableZoom = this.set.control.scale;
        this.orbitControl.enableRotate = this.set.control.rotate;
        this.orbitControl.enablePan = this.set.control.move;
        this.orbitControl.addEventListener('change', () => {
            this.setLabel();
            this.correctLabel();
            this.controlChange && this.controlChange();
        });
    }

    /**
     * @desc 销毁
     */
    destory() {
        // 事件解除
        this.container.removeEventListener('click', this.clickArea.bind(this));
        this.container.removeEventListener('mousemove', this.mouseMoveArea.bind(this));
        this.orbitControl && this.orbitControl.dispose();
        this.mapData = null;
        this.container = null;
        this.width = null;
        this.height = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;

        this.group = null;
        this.SELECTED = null;
        this.raycaster = null;
        this.scene.dispose();
    }

    /**
     * @desc 设置相机
     */
    setCamera() {
        const { x, y, z } = this.set.camera;
        this.camera.up.x = 0;
        this.camera.up.y = 0;
        this.camera.up.z = 1;
        this.camera.position.set(x, y, z);
        this.camera.lookAt(0, 0, 0);
        // const helper = new THREE.CameraHelper(this.camera);
        // this.scene.add(helper);
    }

    /**
     * @desc 鼠标事件，设置交互对象
     */
    setMouseObject(e, callback) {
        e.preventDefault();
        const mouse = new THREE.Vector2();
        // 转化raycaster的角度和camrea的角度一样。
        mouse.x = ((e.pageX - this.divpos.left) / this.width) * 2 - 1;
        mouse.y = -((e.pageY - this.divpos.top) / this.height) * 2 + 1;
        this.raycaster.setFromCamera(mouse, this.camera); // 设置相机射线

        // 获取点击的对象
        const meshs = [];
        this.group.children.forEach(d => {
            d.children.map(m => {
                meshs.push(m);
            });
        });
        const intersects = this.raycaster.intersectObjects(meshs);
        if (intersects.length > 0) {
            this.SELECTED = intersects[0].object.parent;
            callback && callback(e);
        } else {
            this.SELECTED = null;
        }
        return this.SELECTED;
    }

    /**
     * @desc 恢复原来颜色
     */
    recoverMapColor() {
        this.group.children.forEach(d => {
            d.children.forEach(mesh => {
                mesh.material.color = new THREE.Color(this.set.mapStyle.color);
            });
        });
    }

    /**
     * @desc 地区交互触发
     * @param {object} e
     */
    clickArea(id, e) {
        console.log('id', id);
        this.setMouseObject(e, () => {
            this.func[id] && this.func[id](e, this.SELECTED);
        });
    }

    /**
     * @desc 模拟hover事件的
     */
    mouseMoveArea = throttle((id, e) => {
        const { uuid } = this.setMouseObject(e) || {};
        if (this.nextUuid !== uuid) {
            this.nextUuid = uuid;
            this.func[id] && this.func[id](e, this.SELECTED);
        }
    }, 50);

    /**
     * @desc 事件绑定
     */
    on(eventName, func) {
        const id = util.randomID();
        if (eventName === 'seek') {
            this.seek = func;
        } else if (eventName === 'hover') {
            this.func[id] = func;
            this.container.addEventListener('mousemove', this.mouseMoveArea.bind(this, id));
        } else {
            this.func[id] = func;
            this.container.addEventListener(eventName, this.clickArea.bind(this, id));
        }
    }
}

export default ThreejsMap;
