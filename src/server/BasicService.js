import axios from 'axios';
import { history } from '../utils';

const globalOptions = {
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Basic 123456'
    }
};

export default class BasicService {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
    }

    get(url, options) {
        return this._request('get', url, null, options);
    }

    post(url, data, options) {
        return this._request('post', url, data, options);
    }

    put(url, data, options) {
        return this._request('put', url, data, options);
    }

    delete(url, options) {
        return this._request('delete', url, null, options);
    }

    setToken(token) {
        globalOptions.headers['Authorization'] = `Basic ${token}`;
    }

    _request(method, url, data, options = {}) {
        const headers = Object.assign({}, globalOptions.headers, options.headers);
        const opt = {
            baseURL: this.baseURL,
            withCredentials: true,
            method,
            url,
            data,
            params: options.params || {},
            headers
        };
        return axios(opt)
            .then(res => {
                return res;
            })
            .catch(err => {
                const { response } = err;
                if (!response) {
                    console.error(err);
                    // location.href = '/login';
                    return;
                }
                if (response.status === 401) {
                    history.push('/login');
                    return Promise.reject(err);
                }
                const message = response.data.error;
                if (message && options.disablErrorHandler !== true) {
                    //   messageBox.error(message);
                    console.error(message);
                }
                return Promise.reject(err);
            });
    }
}
