import React, { Component } from 'react';
import { Route, Router, Switch } from 'react-router-dom'; // 路由

import { LocaleProvider } from 'antd';
import { history } from './utils';
import { routes } from './config';
import zhCN from 'antd/lib/locale-provider/zh_CN';

export default class Routers extends Component {
    render() {
        return (
            <LocaleProvider locale={zhCN}>
                <Router history={history}>
                    <Switch>
                        {routes.map((route, index) => (
                            <Route
                                key={index}
                                path={route.path}
                                exact={route.exact}
                                render={props => (
                                    <route.component {...props} routes={route.routes} parentRoute={route} />
                                )}
                            />
                        ))}
                    </Switch>
                </Router>
            </LocaleProvider>
        );
    }
}
