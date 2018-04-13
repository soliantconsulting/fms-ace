"use strict";

import jQuery from "jquery";
import 'moment/moment.js';
import 'moment-timezone';
import '../../../node_modules/fullcalendar/dist/fullcalendar.css';
import 'fullcalendar';
import EveryNDaysEventSource from "./../Calendar/EveryNDaysEventSource";

export default class SchedulesToEvents {
    constructor(calendar, schedules) {
        this.buildBasicEvents(calendar, schedules);
        this.buildSpecialEvents(calendar, schedules);
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
                className: undefined === schedule.backupType ? 'script-event' : 'backup-event',
                data: {},
            };

            if (1 === schedule.freqType) {
                if (schedule.taskType === 'VERIFY') {
                    event.data.actionDelete = schedule.id
                    event.className = null;
                }

                // freqType = 1 : ONCE
                events.push(Object.assign(
                    {},
                    event,
                    {
                        start: startDatetime,
                        end: startDatetime.add(1, 'h'),
                    }
                ));
            } else if (2 === schedule.freqType && schedule.dailyDays === 1) {
                // freqType = 2 : DAILY
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

    buildSpecialEvents(calendar, schedules) {
        jQuery.each(schedules, (index, schedule) => {
            let startDatetime = moment(schedule.startDate);
            let endDatetime = undefined === schedule.endDate ? undefined : moment(schedule.endDate);
            let event = {
                title: schedule.name,
                objectID: schedule.id,
                textColor: 'black',
                allDay: false,
                className: undefined === schedule.backupType ? 'script-event' : 'backup-event',
            };

            if (2 === schedule.freqType && schedule.dailyDays > 1) {
                // freqType = 2 : DAILY
                // repeating every N Days - requires function based eventSource
                calendar.fullCalendar('addEventSource', (start, end, timezone, callback) => {
                    new EveryNDaysEventSource(start, end, schedule.dailyDays, startDatetime, endDatetime, event, callback);
                });
            }
        });
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
