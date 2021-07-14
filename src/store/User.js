import { action, observable, transaction } from 'mobx';

export default class User {
    // app 数据
    @observable
    data = {};

    // 初始化加载数据，获取用户信息
    @action
    getUser = async () => {
        await setTimeout(() => {
            transaction(() => {
                this.data = {
                    username: 'admin'
                };
            });
        }, 3000);
    };
}
