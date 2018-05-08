"use strict";

import Calendar from '../lib/Calendar/Calendar';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap';
import Version from '../config/version.local';
import 'font-awesome/css/font-awesome.css';
import '../css/common.css';

jQuery(function () {
    let calendar = new Calendar('#calendar');
    jQuery(calendar.calendarWrapper.find('span.version-number').html(new Version().getVersion()));
    jQuery('span.version-number').html('v' + new Version().getVersion());
});
