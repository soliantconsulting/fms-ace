"use strict";

export default class EveryNDaysEventSource {
    constructor(start, end, schedule, startDatetime, endDatetime, eventPrototype, callback) {
        let events = [];
        let currDate = start.clone();
        let lastDate = end.clone();

        while (currDate.add(1, 'days').diff(lastDate) < 0) {
            let currDateCopy = currDate.clone();
            let diffInDays = Math.round(currDateCopy.clone().startOf('day').diff(startDatetime.clone().startOf('day'), 'days', true));

            if (0 === Math.abs(diffInDays % schedule.dailyDays) &&
                currDateCopy.isSameOrAfter(startDatetime.clone().startOf('day'), 'day') &&
                (undefined === endDatetime ||  currDateCopy.isSameOrBefore(endDatetime.clone().startOf('day'), 'day'))
            ) {
                let event = Object.assign(
                    {},
                    eventPrototype,
                    {
                        start: currDateCopy.format('YYYY-MM-DD') + 'T' + startDatetime.format('HH:mm'),
                        end: currDateCopy.format('YYYY-MM-DD') + 'T' + startDatetime.clone().add(1, 'hours').format('HH:mm'),
                    }
                );
                events.push(event);
            }
        }

        callback(events);
    }
};
