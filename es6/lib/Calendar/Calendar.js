"use strict";

import jQuery from "jquery";
import 'moment/moment.js';
import 'moment-timezone';
import '../../../node_modules/fullcalendar/dist/fullcalendar.css';
import '../../../node_modules/bootstrap-toggle/css/bootstrap-toggle.min.css';
import '../../../node_modules/bootstrap-toggle/js/bootstrap-toggle.min';
import 'fullcalendar';
import SchedulesToEvents from "./SchedulesToEvents";
import CalendarHtml from '../../html/Calendar.html';
import SplashHtml from '../../html/Splash.html';
import ConnectToFilemakerModalHtml from '../../html/ConnectToFilemakerModal.html';
import EventDetailsModalHtml from '../../html/EventDetailsModal.html';
import AddVerifyScheduleHtml from '../../html/AddVerifySchedule.html';
import AddMessageScheduleHtml from '../../html/AddMessageSchedule.html';
import ConfirmModalHtml from '../../html/ConfirmModal.html';
import '../../../node_modules/jquery.cookie/src/jquery.cookie'
import 'eonasdan-bootstrap-datetimepicker';
import 'eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.css';
import ShowHideEvents from "./ShowHideEvents";
import Proxy from "./Proxy";

export default class Calendar {
    constructor(selector) {
        // calendar wrapper (user given)
        this.calendarWrapper = jQuery(selector);
        this.calendarWrapper.html(SplashHtml);
        this.addVerifyScheduleModal = jQuery(AddVerifyScheduleHtml);
        this.addMessageScheduleModal = jQuery(AddMessageScheduleHtml);
        this.connectToServerModal = jQuery(ConnectToFilemakerModalHtml);
        this.eventDetailsModal = jQuery(EventDetailsModalHtml);
        this.storedButtons = null;

        // token
        this.tokenToken = jQuery.cookie('token');
        this.tokenServer = jQuery.cookie('server');
        this.setupFmConnectModal(this.connectToServerModal);

        // get optional config and boot the app
        jQuery.ajax({
            url: 'fms-ace-config.json',
            cache: false,
            type: 'GET',
            dataType: 'json',
            complete: () => {
                this.finishSetup();

                if (this.hasServerInfo()) {
                    if (this.calendarConfig.useProxy) {
                        this.proxy = new Proxy();
                        this.proxy.tokenToken = this.tokenToken;
                    }
                    this.initCalendar();
                }
            }
        }).done((calendarConfig) => {
            this.calendarConfig = calendarConfig;
        }).fail(() => {
            this.calendarConfig = {
                useProxy: false,
                fmsHosts: [],
            };
        });
    }

    finishSetup() {
        if (this.calendarConfig.useProxy) {
            this.proxy = new Proxy();
        }

        this.calendarWrapper.find('input.connectToServer').on("click", (e) => {
            if (this.calendarConfig.useProxy) {
                jQuery.each(this.calendarConfig.fmsHosts, (i, serverConfig) => {
                    if (undefined === serverConfig.scheme) {
                        serverConfig.scheme = 'http';
                    }

                    if (undefined === serverConfig.port) {
                        serverConfig.port = 'https' === serverConfig.scheme ? 443 : 80;
                    }

                    this.connectToServerModal.find('#server').append(jQuery('<option>', {
                        value: serverConfig.scheme + '://' + serverConfig.host + ':' + serverConfig.port,
                        text: serverConfig.scheme + '://' + serverConfig.host + ':' + serverConfig.port
                    }));
                });
            } else {
                this.connectToServerModal.find('#server').closest('.form-group').hide();
            }


            this.connectToServerModal.modal('show');
        });
    }

    refreshDisplay() {
        if (this.hasServerInfo()) {
            this.showHideEvents.showHideEvents('#event-backup', 'a.event-backup');
            this.showHideEvents.showHideEvents('#event-verify', 'a.event-verify');
            this.showHideEvents.showHideEvents('#event-filemaker-script', 'a.event-filemaker-script');
            this.showHideEvents.showHideEvents('#event-system-script', 'a.event-system-script');
            this.showHideEvents.showHideEvents('#event-script-sequence', 'a.event-script-sequence');
            this.showHideEvents.showHideEvents('#event-message', 'a.event-message');
        }
    }

    hasServerInfo() {
        return undefined !== this.tokenToken && undefined !== this.tokenServer;
    }

    fetchSchedules() {
        let urlConfig = {
            url: '/fmi/admin/api/v1/schedules',
            cache: false,
            type: 'GET',
            headers: this.getHeaders(),
        };

        if (undefined !== this.proxy) {
            urlConfig.url = this.tokenServer + urlConfig.url;
            urlConfig = this.proxy.applyProxyWithHeaders(urlConfig);
        }

        jQuery.ajax(urlConfig)
            .done((data) => {
                this.calendar.fullCalendar('removeEventSources');
                new SchedulesToEvents(
                    this.calendar,
                    data.schedules
                );
                this.refreshDisplay();
                this.message('Schedules Fetched', 'bg-success');
            })
            .fail((e) => {
                if (undefined !== e.responseJSON) {
                    let response = e.responseJSON;
                    let errorCode = response.result;

                    if (9 === errorCode) {
                        this.disconnect();
                    }

                    this.message(errorCode + ': ' + response.errorMessage, 'bg-danger');
                } else if (undefined !== e.responseText) {
                    this.message(e.responseText, 'bg-danger');
                }
            });
    }

    deleteSchedule(deleteId) {
        if (undefined === deleteId) {
            this.message('Event has no id.', 'bg-danger');
            return;
        }

        let confirmButton = this.confirmModal.find('[name="confirm"]');
        confirmButton.html('Delete');
        confirmButton.removeClass('btn-success').addClass('btn-danger').html('Delete');
        this.confirmModal.find('.modal-title').html('Delete Schedule?');
        this.confirmModal.find('div.message').html('Are you sure you want to delete this schedule?');
        confirmButton.off('click').on('click', (e) => {
            let urlConfig = {
                url: '/fmi/admin/api/v1/schedules/' + deleteId,
                cache: false,
                type: 'DELETE',
                headers: this.getHeaders(),
            };

            if (undefined !== this.proxy) {
                urlConfig.url = this.tokenServer + urlConfig.url;
                urlConfig = this.proxy.applyProxyWithHeaders(urlConfig);
            }

            jQuery.ajax(urlConfig)
                .done((data) => {
                    if (0 === data.result) {
                        this.message('Schedule Removed', 'bg-success');
                        this.fetchSchedules();
                    }

                    this.confirmModal.modal('hide');
                    this.eventDetailsModal.modal('hide');
                })
                .fail((e) => {
                    if (undefined !== e.responseJSON) {
                        let response = e.responseJSON;
                        let errorCode = response.result;

                        if (9 === errorCode) {
                            this.disconnect();
                        }

                        this.message(errorCode + ': ' + response.errorMessage, 'bg-danger');
                    } else if (undefined !== e.responseText) {
                        this.message(e.responseText, 'bg-danger');
                    }
                });
        });

        this.confirmModal.modal();
    }

    getHeaders() {
        return {
            'Authorization': 'Bearer ' + this.tokenToken,
            'Content-Type': 'application/json',
        };
    }

    clearToken() {
        this.tokenToken = undefined;
        this.tokenServer = undefined;
        jQuery.removeCookie('server');
        jQuery.removeCookie('token');
    }

    setToken(tokenToken, tokenServer) {
        this.tokenServer = tokenServer;
        this.tokenToken = tokenToken;
        jQuery.cookie('server', tokenServer);
        jQuery.cookie('token', tokenToken);
    }

    setupAddVerifyScheduleModal() {
        this.addVerifyScheduleModal.find('#freqType').on('change', () => {
            this.showHideVerifyFields();
        });

        this.addVerifyScheduleModal.find('#enableEndDate').on('change', () => {
            this.showHideVerifyFields();
        });

        this.addVerifyScheduleModal.find('#sendEmail').on('change', () => {
            this.showHideVerifyFields();
        });

        this.addVerifyScheduleModal.find('#target').on('change', () => {
            this.showHideVerifyFields();
        });

        this.addVerifyScheduleModal.find('#repeatTask').on('change', () => {
            this.showHideVerifyFields();
        });

        this.showHideVerifyFields();

        this.addVerifyScheduleModal.find('#startDate').datetimepicker({
            showClear: true,
            timeZone: window.timeZone
        });

        this.addVerifyScheduleModal.find('#endDate').datetimepicker({
            showClear: true,
            timeZone: window.timeZone
        });

        this.addVerifyScheduleModal.find('button.btn-success').on('click', () => {
            let form = this.addVerifyScheduleModal.find('form');
            let timeout = form.find('#timeout').val();

            if (!this.isValid(form)) {
                return;
            }

            let data = {
                taskType: 4,
                name: form.find('#name').val(),
                freqType: parseInt(form.find('#freqType').val()),
                startDate: form.find('#startDate').data("DateTimePicker").date().format('YYYY-MM-DD-HH-mm' + '-00'),
                target: parseInt(form.find('#target').val()),
                messageText: form.find('#messageText').val(),
                enableEndDate: form.find('#enableEndDate').prop('checked'),
                sendEmail: form.find('#sendEmail').prop('checked'),
                enabled: form.find('#enabled').prop('checked'),
            };

            if (3 === data.target || 4 === data.target) {
                data.fromTarget = form.find('#fromTarget').val();
            }

            if ('' !== timeout) {
                data.timeout = parseInt(timeout);
            }

            if (form.find('#repeatTask').prop('checked')) {
                data.repeatTask = true;
                data.repeatInterval = parseInt(form.find('#repeatInterval').val());
                data.repeatFrequency = parseInt(form.find('#repeatFrequency').val());
            }

            if (3 === data.freqType) {
                let binaryDays = '';
                jQuery.each(form.find('input[name="daysOfTheWeek[]"]'), (index, element) => {
                    binaryDays += jQuery(element).prop('checked') ? '1' : '0';
                });
                data.daysOfTheWeek = binaryDays;
            }

            if (2 === data.freqType) {
                data.dailyDays = parseInt(form.find('#dailyDays').val());
            }

            if (data.enableEndDate) {
                data.endDate = form.find('#endDate').data("DateTimePicker").date().format('YYYY-MM-DD-HH-mm' + '-00');
            }

            if (data.sendEmail) {
                data.emailAddresses = form.find('#emailAddresses').val();
            }

            let urlConfig = {
                url: '/fmi/admin/api/v1/schedules',
                cache: false,
                type: 'post',
                data: JSON.stringify(data),
                headers: this.getHeaders(),
            };

            if (undefined !== this.proxy) {
                urlConfig.url = this.tokenServer + urlConfig.url;
                urlConfig = this.proxy.applyProxyWithHeaders(urlConfig);
            }

            jQuery.ajax(urlConfig).done((data) => {
                this.addVerifyScheduleModal.modal('hide');
                this.fetchSchedules();
            }).fail((data) => {
                this.modalMessage(this.addVerifyScheduleModal, data.responseJSON.errorMessage, 'bg-danger');
            });
        });
    }

    setupAddMessageScheduleModal() {
        this.addMessageScheduleModal.find('#freqType').on('change', () => {
            this.showHideMessageFields();
        });

        this.addMessageScheduleModal.find('#enableEndDate').on('change', () => {
            this.showHideMessageFields();
        });

        this.addMessageScheduleModal.find('#sendEmail').on('change', () => {
            this.showHideMessageFields();
        });

        this.addMessageScheduleModal.find('#target').on('change', () => {
            this.showHideMessageFields();
        });

        this.addMessageScheduleModal.find('#repeatTask').on('change', () => {
            this.showHideMessageFields();
        });

        this.showHideMessageFields();

        this.addMessageScheduleModal.find('#startDate').datetimepicker({
            showClear: true,
            timeZone: window.timeZone
        });

        this.addMessageScheduleModal.find('#endDate').datetimepicker({
            showClear: true,
            timeZone: window.timeZone
        });

        this.addMessageScheduleModal.find('button.btn-success').on('click', () => {
            let form = this.addMessageScheduleModal.find('form');

            if (!this.isValid(form)) {
                return;
            }

            let data = {
                taskType: 3,
                name: form.find('#name').val(),
                freqType: parseInt(form.find('#freqType').val()),
                startDate: form.find('#startDate').data("DateTimePicker").date().format('YYYY-MM-DD-HH-mm' + '-00'),
                target: parseInt(form.find('#target').val()),
                messageText: form.find('#messageText').val(),
                enableEndDate: form.find('#enableEndDate').prop('checked'),
                sendEmail: form.find('#sendEmail').prop('checked'),
                enabled: form.find('#enabled').prop('checked'),
            };

            if (3 === data.target || 4 === data.target) {
                data.fromTarget = form.find('#fromTarget').val();
            }

            if (form.find('#repeatTask').prop('checked')) {
                data.repeatTask = true;
                data.repeatInterval = parseInt(form.find('#repeatInterval').val());
                data.repeatFrequency = parseInt(form.find('#repeatFrequency').val());
            }

            if (3 === data.freqType) {
                let binaryDays = '';
                jQuery.each(form.find('input[name="daysOfTheWeek[]"]'), (index, element) => {
                    binaryDays += jQuery(element).prop('checked') ? '1' : '0';
                });
                data.daysOfTheWeek = binaryDays;
            }

            if (2 === data.freqType) {
                data.dailyDays = parseInt(form.find('#dailyDays').val());
            }

            if (data.enableEndDate) {
                data.endDate = form.find('#endDate').data("DateTimePicker").date().format('YYYY-MM-DD-HH-mm' + '-00');
            }

            if (data.sendEmail) {
                data.emailAddresses = form.find('#emailAddresses').val();
            }

            let urlConfig = {
                url: '/fmi/admin/api/v1/schedules',
                cache: false,
                type: 'post',
                data: JSON.stringify(data),
                headers: this.getHeaders(),
            };

            if (undefined !== this.proxy) {
                urlConfig.url = this.tokenServer + urlConfig.url;
                urlConfig = this.proxy.applyProxyWithHeaders(urlConfig);
            }

            jQuery.ajax(urlConfig).done((data) => {
                this.addMessageScheduleModal.modal('hide');
                this.fetchSchedules();
            }).fail((data) => {
                this.modalMessage(this.addMessageScheduleModal, data.responseJSON.errorMessage, 'bg-danger');
            });
        });
    }

    isValid(form) {
        let isValid = true;
        let requiredFields = form.find(':input:visible[required="required"]');

        requiredFields.closest('.form-group').removeClass('has-error');

        requiredFields.each((index, element) => {
            if (!element.validity.valid) {
                jQuery(element).closest('.form-group').addClass('has-error');
            }
        });

        requiredFields.each((index, element) => {
            if (!element.validity.valid) {
                jQuery(element).focus();
                isValid = false;
                return false;
            }
        });

        return isValid;
    }

    showHideVerifyFields() {
        let form = this.addVerifyScheduleModal.find('form');
        let targetValue = form.find('#target').val();
        let freqType = form.find('#freqType').val();
        let repeatTask = form.find('#repeatTask').prop('checked');
        let enableEndDate = form.find('#enableEndDate').prop('checked');
        let sendEmail = form.find('#sendEmail').prop('checked');

        let repeatInterval = form.find('#repeatInterval').closest('.form-group');
        let repeatFrequency = form.find('#repeatFrequency').closest('.form-group');
        let fromTarget = form.find('#fromTarget').closest('.form-group');
        let dailyDays = form.find('#dailyDays').closest('.form-group');
        let daysOfTheWeek = form.find('input[name="daysOfTheWeek[]"]').closest('.form-group');
        let endDate = form.find('#endDate').closest('.form-group');
        let emailAddresses = form.find('#emailAddresses').closest('.form-group');
        let enableEndDateWrapper = form.find('#enableEndDate').closest('.form-group');

        if ('3' === targetValue || '4' === targetValue) {
            fromTarget.show();
        } else {
            fromTarget.hide();
        }

        if (repeatTask) {
            repeatInterval.show();
            repeatFrequency.show();
        } else {
            repeatInterval.hide();
            repeatFrequency.hide();
        }

        if ('1' === freqType) {
            enableEndDateWrapper.hide();
        } else {
            enableEndDateWrapper.show();
        }

        if ('2' === freqType) {
            dailyDays.show();
        } else {
            dailyDays.hide();
        }

        if ('3' === freqType) {
            daysOfTheWeek.show();
        } else {
            daysOfTheWeek.hide();
        }

        if (enableEndDate || repeatTask) {
            endDate.show();
        } else {
            endDate.hide();
        }

        if (sendEmail) {
            emailAddresses.show();
        } else {
            emailAddresses.hide();
        }
    }

    showHideMessageFields() {
        let form = this.addMessageScheduleModal.find('form');
        let targetValue = form.find('#target').val();
        let freqType = form.find('#freqType').val();
        let repeatTask = form.find('#repeatTask').prop('checked');
        let enableEndDate = form.find('#enableEndDate').prop('checked');
        let sendEmail = form.find('#sendEmail').prop('checked');

        let repeatInterval = form.find('#repeatInterval').closest('.form-group');
        let repeatFrequency = form.find('#repeatFrequency').closest('.form-group');
        let fromTarget = form.find('#fromTarget').closest('.form-group');
        let dailyDays = form.find('#dailyDays').closest('.form-group');
        let daysOfTheWeek = form.find('input[name="daysOfTheWeek[]"]').closest('.form-group');
        let endDate = form.find('#endDate').closest('.form-group');
        let emailAddresses = form.find('#emailAddresses').closest('.form-group');
        let repeatTaskWrapper = form.find('#repeatTask').closest('.form-group');
        let enableEndDateWrapper = form.find('#enableEndDate').closest('.form-group');

        if ('3' === targetValue || '4' === targetValue) {
            fromTarget.show();
        } else {
            fromTarget.hide();
        }

        if ('1' === freqType) {
            repeatTaskWrapper.hide();
            enableEndDateWrapper.hide();
        } else {
            // repeatTaskWrapper.show();
            enableEndDateWrapper.show();
        }

        if (repeatTask) {
            repeatInterval.show();
            repeatFrequency.show();
        } else {
            repeatInterval.hide();
            repeatFrequency.hide();
        }

        if ('2' === freqType) {
            dailyDays.show();
        } else {
            dailyDays.hide();
        }

        if ('3' === freqType) {
            daysOfTheWeek.show();
        } else {
            daysOfTheWeek.hide();
        }

        if (enableEndDate || repeatTask) {
            endDate.show();
        } else {
            endDate.hide();
        }

        if (sendEmail) {
            emailAddresses.show();
        } else {
            emailAddresses.hide();
        }
    }

    disconnect() {
        let urlConfig = {
            url: '/fmi/admin/api/v1/user/logout',
            cache: false,
            type: 'POST',
            headers: this.getHeaders(),
        };

        if (undefined !== this.proxy) {
            urlConfig.url = this.tokenServer + urlConfig.url;
            urlConfig = this.proxy.applyProxyWithHeaders(urlConfig);
            urlConfig.headers['Content-Length'] = 0;
        }

        jQuery.ajax(urlConfig)
            .done((data) => {
                this.clearToken();
                this.refreshDisplay();
                this.calendar.fullCalendar('removeEventSources');
                this.message('Disconnected', 'bg-success');
                location.reload();
            })
            .fail((e) => {
                this.clearToken();
                this.refreshDisplay();
                this.message(e.responseText, 'bg-danger');
                location.reload();
            });
    }

    message(message, bgClass) {
        this.calendarWrapper
            .find('div.message')
            .addClass(bgClass)
            .hide()
            .html('<span>' + message + '</span>')
            .fadeIn(400)
            .delay(4000)
            .fadeOut(400);
    }

    initCalendar() {
        this.calendarWrapper.html(CalendarHtml);
        this.calendar = this.calendarWrapper.find('#full-calendar');
        this.showHideEvents = new ShowHideEvents(this.calendar);

        this.setupAddVerifyScheduleModal();
        this.setupAddMessageScheduleModal();

        // modal
        let body = jQuery('body');
        body.append(ConnectToFilemakerModalHtml);
        body.append(AddVerifyScheduleHtml);
        body.append(ConfirmModalHtml);
        this.confirmModal = jQuery(ConfirmModalHtml);

        this.initialLoad = true;

        this.calendar.fullCalendar({
            height: 'parent',
            defaultView: 'agendaWeek',
            defaultTimedEventDuration: '01:00:00',
            customButtons: {
                disconnectFromFileMaker: {
                    text: 'Disconnect',
                },
                addVerifySchedule: {
                    text: 'Add Verify Schedule',
                },
                addMessageSchedule: {
                    text: 'Add Message Schedule',
                },
                refreshSchedule: {
                    text: 'Refresh',
                }
            },
            eventClick: (calEvent, jsEvent, view) => {
                if (undefined !== calEvent.data.endDate) {
                    this.eventDetailsModal.find('#end').html(calEvent.data.endDate);
                }

                if (undefined !== calEvent.data.lastRun) {
                    this.eventDetailsModal.find('#lastRun').html(calEvent.data.lastRun);
                }

                if (undefined !== calEvent.data.startDate) {
                    this.eventDetailsModal.find('#start').html(calEvent.data.startDate);
                }

                this.eventDetailsModal.find('#lastError').html(calEvent.data.lastError);
                this.eventDetailsModal.find('.modal-title').html(calEvent.title);
                this.eventDetailsModal.find('#delete').off('click').on('click', () => {
                    this.deleteSchedule(calEvent.objectID);
                });
                this.eventDetailsModal.modal();

            },
            viewRender: (view) => {
                this.showHideEvents.showHideEvents('#event-backup', 'a.event-backup');
                this.showHideEvents.showHideEvents('#event-verify', 'a.event-verify');
                this.showHideEvents.showHideEvents('#event-filemaker-script', 'a.event-filemaker-script');
                this.showHideEvents.showHideEvents('#event-system-script', 'a.event-system-script');
                this.showHideEvents.showHideEvents('#event-script-sequence', 'a.event-script-sequence');
                this.showHideEvents.showHideEvents('#event-message', 'a.event-message');

                let fcCenter = this.calendarWrapper.find(".fc-center");

                if (null === this.storedButtons) {
                    this.storedButtons = fcCenter.html();
                }

                this.calendarWrapper.find(".customButtons").remove();
                this.calendarWrapper.find(".fc-toolbar").after("<div class='customButtons text-center'>" + this.storedButtons + "</div>")

                this.calendarWrapper.find(".titleBar").remove();
                fcCenter.html('<div class="titleBar"><h2>' + view.title + '</h2></div>');
            },
            eventAfterAllRender: () => {
                this.calendarWrapper.find(".fc-disconnectFromFileMaker-button").off('click').on('click', () => {
                    this.disconnect();
                });

                this.calendarWrapper.find(".fc-addVerifySchedule-button").off('click').on('click', () => {
                    this.addVerifyScheduleModal.modal();
                });

                this.calendarWrapper.find(".fc-addMessageSchedule-button").off('click').on('click', () => {
                    this.addMessageScheduleModal.modal();
                });

                this.calendarWrapper.find(".fc-refreshSchedule-button").off('click').on('click', () => {
                    this.fetchSchedules();
                });

                if (this.initialLoad) {
                    this.initialLoad = false;

                    this.calendarWrapper.find(".fc-view-container").before(
                        "<div class='checkboxContainer text-center'>" +
                        "<input data-onstyle='event-backup' data-width='83' data-on='Backup' data-off='Backup' class='toggle' data-toggle='toggle'  type='checkbox' id='event-backup' name='event-backup' checked> " +
                        "<input data-onstyle='event-verify' data-width='78' data-on='Verify' data-off='Verify'  class='toggle' data-toggle='toggle' type='checkbox' id='event-verify' name='event-verify' checked> " +
                        "<input data-onstyle='event-filemaker-script' data-width='140' data-on='FileMaker Script' data-off='FileMaker Script'  class='toggle' data-toggle='toggle' type='checkbox' id='event-filemaker-script' name='event-filemaker-script' checked> " +
                        "<input data-onstyle='event-system-script' data-width='130' data-on='System Script' data-off='System Script'  class='toggle' data-toggle='toggle' type='checkbox' id='event-system-script' name='event-system-script' checked> " +
                        "<input data-onstyle='event-script-sequence' data-width='140' data-on='Script Sequence' data-off='Script Sequence'  class='toggle' data-toggle='toggle' type='checkbox' id='event-script-sequence' name='event-script-sequence' checked> " +
                        "<input data-onstyle='event-message' data-width='92' data-on='Message' data-off='Message'  class='toggle' data-toggle='toggle' type='checkbox' id='event-message' name='event-message' checked> " +
                        "</div>"
                    );

                    this.calendarWrapper.find(".toggle").bootstrapToggle();

                    this.fetchSchedules();

                    this.showHideEvents.setupCalendarAction('#event-backup', 'a.event-backup');
                    this.showHideEvents.setupCalendarAction('#event-verify', 'a.event-verify');
                    this.showHideEvents.setupCalendarAction('#event-filemaker-script', 'a.event-filemaker-script');
                    this.showHideEvents.setupCalendarAction('#event-system-script', 'a.event-system-script');
                    this.showHideEvents.setupCalendarAction('#event-script-sequence', 'a.event-script-sequence');
                    this.showHideEvents.setupCalendarAction('#event-message', 'a.event-message');
                }
            },
            eventRender: function (event, element) {
                if (undefined !== event.data) {
                    jQuery.each(event.data, (index, value) => {
                        jQuery(element).data(index, value);
                    });
                }

                jQuery(element).find(".fc-title").prepend("<i class='fa fa-fw fa-circle'></i>");

                if (undefined === event.ranges) {
                    return true;
                }

                return (event.ranges.filter(function (range) {
                    return (
                        (undefined === range.end || event.start.isSameOrBefore(range.end, 'day')) &&
                        (undefined === range.start || event.end.isSameOrAfter(range.start, 'day'))
                    );
                }).length) > 0;
            },
            header: {
                left: 'prev,next today',
                center: 'disconnectFromFileMaker,addVerifySchedule,addMessageSchedule,refreshSchedule',
                right: 'month,agendaWeek,agendaDay'
            }
        });

    }

    setupFmConnectModal(modal) {
        let connectButton = modal.find('button.btn-success');
        connectButton.on('click', (e) => {
            let serverUrl = modal.find('#server').val();
            let urlConfig = {
                url: '/fmi/admin/api/v1/user/login',
                cache: false,
                type: 'POST',
                contentType: "application/json",
                data: JSON.stringify({
                    username: modal.find('input[name="username"]').val(),
                    password: modal.find('input[name="password"]').val()
                }),
                beforeSend: () => {
                    connectButton.html('<span class="glyphicon glyphicon-refresh spinning"></span> Loading...');
                },
                complete: () => {
                    connectButton.html('Connect');
                },
            };

            if (undefined !== this.proxy) {
                urlConfig.url = serverUrl + urlConfig.url;
                urlConfig = this.proxy.applyProxy(urlConfig);
            }

            jQuery.ajax(urlConfig)
                .done((data) => {
                    if (undefined !== this.proxy) {
                        this.proxy.tokenToken = data.token;
                    }

                    this.setToken(data.token, serverUrl);
                    this.initCalendar();
                    modal.modal('hide');
                })
                .fail((e) => {
                    this.modalMessage(this.connectToServerModal, e.responseText, 'bg-danger');
                });
        });
    }

    modalMessage(modal, message, bgClass) {
        modal.find('div.message')
            .addClass(bgClass)
            .hide()
            .html('<span>' + message + '</span>')
            .fadeIn(400)
            .delay(4000)
            .fadeOut(400);
    }
};
