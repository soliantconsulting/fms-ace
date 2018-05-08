"use strict";

import jQuery from "jquery";
import 'moment/moment.js';
import 'moment-timezone';
import '../../../node_modules/fullcalendar/dist/fullcalendar.css';
import 'fullcalendar';
import EveryNDaysEventSource from "./../Calendar/EveryNDaysEventSource";
import EveryNIntervalEventSource from "./EveryNIntervalEventSource";

export default class SchedulesToEvents {
    constructor(calendar, schedules) {
        this.buildBasicEvents(calendar, schedules);
    }

    buildBasicEvents(calendar, schedules) {
        let events = [];

        jQuery.each(schedules, (index, schedule) => {
            let startDatetime = moment(schedule.startDate);
            let endDatetime = undefined === schedule.endDate ? undefined : moment(schedule.endDate);
            let range = {start: startDatetime, end: schedule.enableEndDate ? endDatetime : undefined};
            let event = {
                title: schedule.name,
                objectID: schedule.id,
                textColor: 'black',
                allDay: false,
                className: this.buildClassName(schedule),
                data: this.setData(schedule),
            };

            if (1 === schedule.freqType) {
                // freqType = 1 : ONCE
                events.push(Object.assign(
                    {},
                    event,
                    {
                        start: startDatetime.format('YYYY-MM-DDTHH:mm'),
                        end: startDatetime.add(1, 'h').format('YYYY-MM-DDTHH:mm'),
                    }
                ));
            } else if (2 === schedule.freqType && schedule.dailyDays === 1) {
                // freqType = 2 : DAILY
                if ('true' === schedule.repeatTask) {
                    // delaying release
                    // calendar.fullCalendar('addEventSource', (start, end, timezone, callback) => {
                    //     new EveryNIntervalEventSource(start, end, schedule.repeatInterval, schedule.repeatFrequency, schedule.dailyDays, startDatetime, endDatetime, event, callback);
                    // });
                } else {
                    events.push(Object.assign(
                        {},
                        event,
                        {
                            start: startDatetime.format('HH:mm'),
                            end: startDatetime.add(1, 'h').format('HH:mm'),
                            dow: [0, 1, 2, 3, 4, 5, 6],
                            ranges: [range],
                        }
                    ));
                }
            } else if (2 === schedule.freqType && schedule.dailyDays > 1) {
                // freqType = 2 : DAILY
                // repeating every N Days - requires function based eventSource
                calendar.fullCalendar('addEventSource', (start, end, timezone, callback) => {
                    new EveryNDaysEventSource(start, end, schedule, startDatetime, endDatetime, event, callback);
                });
            } else if (3 === schedule.freqType) {
                // freqType = 3 : WEEKLY
                events.push(Object.assign(
                    {},
                    event,
                    {
                        start: startDatetime.format('HH:mm'),
                        end: startDatetime.add(1, 'h').format('HH:mm'),
                        dow: this.buildDow(schedule.daysOfTheWeek),
                        ranges: [range],
                    }
                ));
            }
        });

        calendar.fullCalendar('addEventSource', events);
    }

    setData(schedule) {
        return {
            startDate: schedule.startDate,
            endDate: schedule.endDate,
            lastRun: schedule.lastRun,
            lastError: schedule.lastError,
        };
    }
    buildClassName(schedule) {
        return 'event-' + schedule.taskType.toLowerCase().replace(' ', '-');
    }

    buildDow(daysOfTheWeek) {
        let dow = [];
        jQuery.each(daysOfTheWeek.split(''), (index, day) => {
            if (1 === parseInt(day)) {
                dow.push(index);
            }
        });
        return dow;
    }
};
