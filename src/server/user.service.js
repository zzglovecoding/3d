import BasicService from './BasicService';
import config from '../config';
import { message } from 'antd';

/**
 * @desc 测试用
 */
class UserService extends BasicService {
    constructor() {
        super(config.apiUrl);
    }

    // 获取APP列表
    getUserApps(params) {
        return this.get(`/user/`, { params }).then(res => {
            let data = null;
            if (res) {
                data = res.data;
            } else {
                message.error('获取数据失败，请重新登录');
                return false;
            }
            return data;
        });
    }
}

export const appService = new UserService();
