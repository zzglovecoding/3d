import './style.less';

import React, { Component } from 'react';

import { Link } from 'react-router-dom';

export default class HomeChildPage extends Component {
    render() {
        return <div className="child">childs...<Link to="/">HOME</Link></div>;
    }
}
