"use strict";

import jQuery from "jquery";

export default class ShowHideEvents {
    constructor(calendar) {
        this.calendar = calendar;
    }

    setupCalendarAction(selector, className) {
        this.calendar.find(selector).on("change", (e) => {
            this.showHideEvents(jQuery(e.currentTarget), className);
        });
    }

    showHideEvents(selector, className) {
        let element = this.calendar.find(selector);
        if (element.prop('checked')) {
            this.calendar.find(className).show();
        } else {
            this.calendar.find(className).hide();
        }
    }
};
