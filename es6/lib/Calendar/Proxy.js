"use strict";

import 'moment/moment.js';
import 'moment-timezone';
import '../../../node_modules/fullcalendar/dist/fullcalendar.css';
import 'fullcalendar';
import '../../../node_modules/jquery.cookie/src/jquery.cookie'
import 'eonasdan-bootstrap-datetimepicker';
import 'eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.css';

export default class Proxy {
    constructor() {
        this._tokenServer = null;
        this._tokenToken = null;
    }

    applyProxy(urlObject) {
        urlObject.headers = {
            'X-Proxy-URL': urlObject.url,
        };
        urlObject.url = 'proxy.php';

        return urlObject;
    }

    applyProxyWithHeaders(urlObject) {
        urlObject.headers = this.getHeaders(urlObject.url);
        urlObject.url = 'proxy.php';

        return urlObject;
    }

    getHeaders(url) {
        return {
            'X-Proxy-URL': url,
            'Authorization': 'Bearer ' + this._tokenToken,
            'Content-Type': 'application/json',
        };
    }

    set tokenServer(value) {
        this._tokenServer = value;
    }

    set tokenToken(value) {
        this._tokenToken = value;
    }
};
