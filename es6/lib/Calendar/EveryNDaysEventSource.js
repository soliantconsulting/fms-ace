"use strict";

export default class EveryNDaysEventSource {
    constructor(start, end, dailyDays, startDatetime, endDatetime, eventPrototype, callback) {
        let events = [];
        let currDate = start.clone();
        let lastDate = end.clone();

        while (currDate.add(1, 'days').diff(lastDate) < 0) {
            let currDateCopy = currDate.clone();
            if (currDateCopy.diff(start, 'days') % dailyDays &&
                !currDateCopy.isBefore(startDatetime, 'day') &&
                !currDateCopy.isAfter(endDatetime, 'day')
            ) {
                let event = Object.assign(
                    {},
                    eventPrototype,
                    {
                        start: currDateCopy,
                        end: currDateCopy.add(1, 'hours'),
                    }
                );
                events.push(event);
            }
        }

        callback(events);
    }
};
