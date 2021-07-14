import './index-layout.less';

import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';

export default class IndexLayout extends Component {
    render() {
        const { match, routes = [] } = this.props;
        const parentPath = match.path;
        console.log(this.props);
        return (
            <div className="index-layout">
                <Switch>
                    {routes.map(route => {
                        console.log(route)
                        const routeKey = parentPath + route.path;
                        return (
                            <Route
                                key={routeKey}
                                path={routeKey}
                                render={props => <route.component {...props} routes={route.routes || []} />}
                            />
                        );
                    })}
                </Switch>
            </div>
        );
    }
}
