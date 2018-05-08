"use strict";

import moment from'moment';

export default class EveryNIntervalEventSource {
    constructor(start, end, interval, freq, dailyDays, startDatetime, endDatetime, eventPrototype, callback) {
        let events = [];

        let unit = 'day';
        let units = 'days';

        if (interval = 1) {
            unit = 'minute';
            units = 'minutes';
        } else if (interval = 2) {
            unit = 'hour';
            units = 'hours';
        }
        let utcOffset = moment().utcOffset();

        for (let m = start; m.isBefore(end); m.add(freq, units)) {
            if ( m.isBetween(startDatetime, endDatetime, units) || m.isSame(startDatetime) || m.isSame(endDatetime)) {
                let event = Object.assign(
                    {},
                    eventPrototype,
                    {
                        start: m.clone().add(utcOffset, "minutes").format(),
                        end: m.clone().add(freq, units).add(utcOffset, "minutes").format(),
                    }
                );
                events.push(event);
            }
        }

        callback(events);
    }
};
