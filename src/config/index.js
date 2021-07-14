// api 请求服务器
const DEV_API = 'http://api.com/v1/api/';
const PRO_API = 'http://api.com/v1/api/';

let apiUrl = DEV_API;
if (process.env.NODE_ENV !== 'development') {
    apiUrl = PRO_API;
}

import routes from './routes';

export default { apiUrl, routes };
