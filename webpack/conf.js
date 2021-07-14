import path from 'path';

export default {
    dist: '../dist', // 打包目录
    src: '../src', // 源码目录
    port: 8085, // 服务器端口
    host: '127.0.0.1',
    resolve: url => path.resolve(__dirname, url)
};
