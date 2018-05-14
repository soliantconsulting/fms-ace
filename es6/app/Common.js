"use strict";

import Calendar from '../lib/Calendar/Calendar';
import '../css/common.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap';
import Version from '../config/version.local';
import 'font-awesome/css/font-awesome.css';

jQuery(function () {
    let calendar = new Calendar('#calendar');
    jQuery(calendar.calendarWrapper.find('span.version-number').html(new Version().getVersion()));
});
