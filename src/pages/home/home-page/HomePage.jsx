import './style.less';

import React, { Component } from 'react';

import { ThreejsMapDrawData } from './threejsMap2';

export default class HomePage extends Component {
    constructor() {
        super();
        this.state = {
            data: [],
            datas: [],
            select: null
        };
        this.map = null;
        this.datas = [
            { name: '海南省', value: 60 },
            { name: '北京市', value: 100 },
            { name: '山东省', value: 80 },
            { name: '海南省', value: 100 },
            { name: '四川省', value: 100 },
            { name: '台湾', value: 70 },
            { name: '黑龙江省', value: 80 },
            { name: '湖北省', value: 70 },
            { name: '内蒙古自治区', value: 50 },
            { name: '西藏自治区', value: 50 },
            { name: '新疆维吾尔自治区', value: 63 },
            { name: '甘肃省', value: 63 },
            { name: '山西省', value: 83 },
            { name: '上海市', value: 73 },
            { name: '福建省', value: 63 },
            { name: '广东省', value: 53 },
            { name: '云南省', value: 43 },
            { name: '辽宁省', value: 63 },
            { name: '青海省', value: 90 }
        ];
        this.flyDatas = [
            { source: { name: '海南省' }, target: { name: '四川省' } },
            { source: { name: '北京市' }, target: { name: '四川省' } },
            { source: { name: '山东省' }, target: { name: '四川省' } },
            { source: { name: '台湾' }, target: { name: '四川省' } },
            { source: { name: '黑龙江省' }, target: { name: '四川省' } },
            { source: { name: '湖北省' }, target: { name: '四川省' } },
            { source: { name: '内蒙古自治区' }, target: { name: '四川省' } },
            { source: { name: '西藏自治区' }, target: { name: '四川省' } },
            { source: { name: '新疆维吾尔自治区' }, target: { name: '四川省' } },
            { source: { name: '青海省' }, target: { name: '四川省' } }
        ];
    }

    componentDidMount() {
        $.get('/assets/map/china.json').done(mapData => {
            this.map = new ThreejsMapDrawData({
                debug: false,
                control: {
                    // 控制器设置
                    move: true,
                    scale: true,
                    rotate: true
                },
                mapData,
                container: document.getElementById('GeoMap')
            });

            // 绘制飞线
            this.map.drawFly(this.flyDatas);

            // 绘制数据
            this.map.drawData(this.datas);

            // // 绑定点击事件
            // this.map.on('click', (e, mesh) => {
            //     console.log('....', mesh.data);
            // });

            // 监听视图变化
            this.map.on('seek', data => {
                this.setState({ data, datas: this.datas });
            });

            // hover事件
            this.map.on('hover', (e, mesh) => {
                if (mesh) {
                    this.hoverDo = true;
                    this.map.setAreaSelect(mesh.data.properties.name);
                    const select = {
                        name: mesh.data.properties.name,
                        cp: mesh.data.properties.cp,
                        data: this.map.getBindData(mesh.data.properties.name)
                    };
                    this.setState({ select });
                } else {
                    this.clearModal();
                }
            });

            // 自动播放
            // this.autoPlay();
        });
    }

    clearModal = () => {
        this.hoverDo = false;
        this.map.recoverMapColor();
        this.setState({
            select: null
        });
        // 移开自动播放
        // this.autoPlay();
    };

    autoPlay = async () => {
        let i = 0;
        if (this.settime) {
            clearTimeout(this.settime);
        }
        while (!this.hoverDo) {
            await new Promise(resolve => {
                const d = this.datas[i];
                this.settime = setTimeout(() => {
                    this.map.setAreaSelect(d.name);
                    const cp = this.map.getLngLatByAreaName(d.name);
                    this.setState({ select: { name: d.name, cp, data: this.map.getBindData(d.name) } });
                    resolve();
                }, 3000);
            });
            i++;
            if (i === this.datas.length) {
                i = 0;
            }
        }
    };

    componentWillUnmount() {
        this.map && this.map.destory();
    }

    render() {
        console.log(this.state.select);
        const { select, data, datas } = this.state;
        let pos = null;
        // if (select) {
        //     pos = this.map.lnglatToPosition(select.cp);
        // }
        return (
            <div className="map">
                <div id="GeoMap" style={{ width: '100%', height: '100%' }} />
                {/* {pos ? (
                    <div
                        style={{
                            transform: `translate(${pos.left - select.name.length * 6 - 40}px,${pos.top - 100}px)`
                        }}
                        className="map-modal"
                    >
                        {select.name}:{select.data ? select.data.value : 0}
                    </div>
                ) : null}
                {data.map((d, i) => {
                    const { left, top } = d;
                    return (
                        <div
                            key={i}
                            style={{
                                left: -d.data.properties.name.length * 6,
                                transform: `translate(${left}px, ${top}px) scale(0.8)`
                            }}
                            className="label"
                        >
                            {d.data.properties.name}
                        </div>
                    );
                })} */}
                {/* {datas &&
                    datas.map((d, i) => {
                        if (!d.coordinates) {
                            return null;
                        }
                        const { left, top } = d.coordinates;
                        return (
                            <div
                                key={i}
                                style={{
                                    fontWeight: 'bolder',
                                    color: 'red',
                                    transform: `translate(${left}px, ${top}px)`
                                }}
                                className="label"
                            >
                                {d.value}
                            </div>
                        );
                    })} */}
            </div>
        );
    }
}
