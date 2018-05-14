"use strict";

import jQuery from "jquery";
import 'moment/moment.js';
import 'moment-timezone';
import '../../../node_modules/fullcalendar/dist/fullcalendar.css';
import 'fullcalendar';
import SchedulesToEvents from "./SchedulesToEvents";
import CalendarHtml from '../../html/Calendar.html';
import SplashHtml from '../../html/Splash.html';
import ConnectToFilemakerModalHtml from '../../html/ConnectToFilemakerModal.html';
import AddVerifyScheduleHtml from '../../html/AddVerifySchedule.html';
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
        this.connectToServerModal = jQuery(ConnectToFilemakerModalHtml);
        this.setupFmConnectModal(this.connectToServerModal);

        // get optional config and boot the app
        jQuery.ajax({
            url: 'fms-ace-config.json',
            cache: false,
            type: 'GET',
            dataType: 'json',
            complete: () => {
                this.finishSetup();
            }
        }).done((calendarConfig) => {
            this.calendarConfig = calendarConfig;
        }).fail(() => {
            this.calendarConfig = {
                useProxy: false,
                proxyServers: [],
            };
        });
    }

    finishSetup() {
        if (this.calendarConfig.useProxy) {
            this.proxy = new Proxy();
        }

        this.calendarWrapper.find('input.connectToServer').on("click", (e) => {
            if (this.calendarConfig.useProxy) {
                jQuery.each(this.calendarConfig.proxyServers, (i, serverConfig) => {
                    this.connectToServerModal.find('#server').append(jQuery('<option>', {
                        value: serverConfig.host,
                        text: serverConfig.host
                    }));
                });
            } else {
                this.connectToServerModal.find('#server').closest('.form-group').hide();
            }

            this.connectToServerModal.modal('show');
        });
    }

    prepCalendarActions() {
        jQuery(document).find('a').filter(function () {
            return jQuery(this).data('actionDelete');
        }).on("click", (e) => {
            this.deleteSchedule(jQuery(e.currentTarget))
        });
    }

    refreshDisplay() {
        let calendarWrapper = jQuery('.calendar-outer').fadeOut(400);
        let disconnectButton = jQuery('button.fc-disconnectFromFileMaker-button').fadeOut(400);
        let addVerifySchedule = jQuery('button.fc-addVerifySchedule-button').fadeOut(400);

        if (this.hasServerInfo()) {
            let schedulesCheckboxes = this.calendar.find('div.checkboxContainer').fadeOut(400);
            calendarWrapper.slideDown('slow');
            schedulesCheckboxes.fadeIn(400);

            this.showHideEvents.showHideEvents('#backups', 'a.backup-event');
            this.showHideEvents.showHideEvents('#scripts', 'a.script-event');

            disconnectButton.fadeIn(400);
            addVerifySchedule.fadeIn(400);
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

        console.debug('urlConfig', urlConfig);

        if (undefined !== this.proxy) {
            urlConfig.url = 'https://' + this.tokenServer + urlConfig.url;
            urlConfig = this.proxy.applyProxyWithHeaders(urlConfig);
        }

        console.debug('fetchSchedules', urlConfig);

        jQuery.ajax(urlConfig)
            .done((data) => {
                this.calendar.fullCalendar('removeEventSources');
                new SchedulesToEvents(
                    this.calendar,
                    data.schedules
                );
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

    deleteSchedule(element) {
        let deleteId = element.data('actionDelete');

        if (undefined === deleteId) {
            this.message('Event has no id.', 'bg-danger');
            return;
        }

        let confirmButton = this.confirmModal.find('[name="confirm"]');
        confirmButton.html('Delete');
        confirmButton.removeClass('btn-success').addClass('btn-danger').html('Delete');
        this.confirmModal.find('.modal-title').html('Delete Schedule?');
        this.confirmModal.find('div.message').html('Are you sure you want to delete this schedule?');
        confirmButton.on('click', (e) => {
            let urlConfig = {
                url: '/fmi/admin/api/v1/schedules/' + deleteId,
                cache: false,
                type: 'DELETE',
                headers: this.getHeaders(),
            };

            console.debug('urlConfig 12', urlConfig);

            if (undefined !== this.proxy) {
                urlConfig.url = 'https://' + this.tokenServer + urlConfig.url;
                urlConfig = this.proxy.applyProxyWithHeaders(urlConfig);
                console.debug('urlConfig proxied', urlConfig);
            }

            console.debug('deleteSchedule', urlConfig);

            jQuery.ajax(urlConfig)
                .done((data) => {
                    if (0 === data.result) {
                        element.hide();
                        this.message('Schedule Removed', 'bg-success');
                    }
                    this.confirmModal.modal('hide');
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
            this.showHideFields();
        });

        this.addVerifyScheduleModal.find('#enableEndDate').on('change', () => {
            this.showHideFields();
        });

        this.addVerifyScheduleModal.find('#sendEmail').on('change', () => {
            this.showHideFields();
        });

        this.addVerifyScheduleModal.find('#target').on('change', () => {
            this.showHideFields();
        });

        this.addVerifyScheduleModal.find('#repeatTask').on('change', () => {
            this.showHideFields();
        });

        this.showHideFields();

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
                startDate: form.find('#startDate').data("DateTimePicker").date().format('YYYY-MM-DD-HH-mm-ss'),
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
                data.endDate = form.find('#endDate').data("DateTimePicker").date().format('YYYY-MM-DD-HH-mm-ss');
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
            console.debug('urlConfig 12', urlConfig);

            if (undefined !== this.proxy) {
                urlConfig.url = 'https://' + this.tokenServer + urlConfig.url;
                urlConfig = this.proxy.applyProxyWithHeaders(urlConfig);
                console.debug('urlConfig proxied', urlConfig);
            }

            console.debug('create verify schedule', urlConfig);

            jQuery.ajax(urlConfig).done((data) => {
                this.addVerifyScheduleModal.modal('hide');
                console.debug('add refresh');
                this.refreshDisplay();
                this.fetchSchedules();
            }).fail((data) => {
                // console.debug('data', data.responseJSON.errorMessage);
                this.modalMessage(this.addVerifyScheduleModal, data.responseJSON.errorMessage, 'bg-danger');
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

    showHideFields() {
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
            urlConfig.url = 'https://' + this.tokenServer + urlConfig.url;
            urlConfig = this.proxy.applyProxy(urlConfig);
        }

        console.debug('disconnect', urlConfig);

        jQuery.ajax(urlConfig)
            .done((data) => {
                this.clearToken();
                this.refreshDisplay();
                this.calendar.fullCalendar('removeEventSources');
                this.message('Disconnected', 'bg-success');
            })
            .fail((e) => {
                this.clearToken();
                this.refreshDisplay();
                this.message(e.responseText, 'bg-danger');
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

        // modal
        let body = jQuery('body');
        body.append(ConnectToFilemakerModalHtml);
        body.append(AddVerifyScheduleHtml);
        body.append(ConfirmModalHtml);
        this.confirmModal = jQuery(ConfirmModalHtml);

        // token
        this.tokenToken = jQuery.cookie('token');
        this.tokenServer = jQuery.cookie('server');

        this.initialLoad = true;

        this.calendar.fullCalendar({
            defaultView: 'agendaWeek',
            customButtons: {
                disconnectFromFileMaker: {
                    text: 'Disconnect',
                    click: (e) => {
                        this.disconnect();
                    }
                },
                addVerifySchedule: {
                    text: 'Add Verify Schedule',
                    click: (e) => {
                        this.addVerifyScheduleModal.modal();
                    }
                },
                refreshSchedule: {
                    text: 'Refresh',
                    click: (e) => {
                        this.fetchSchedules();
                    }
                }
            },
            viewRender: () => {
                this.showHideEvents.showHideEvents('#backups', 'a.backup-event');
                this.showHideEvents.showHideEvents('#scripts', 'a.script-event');
            },
            eventAfterAllRender: () => {
                this.prepCalendarActions();

                if (this.initialLoad) {
                    this.initialLoad = false;

                    jQuery(".fc-disconnectFromFileMaker-button").after(
                        "<div class='checkboxContainer' style='display:none'>" +
                        "<label for='backups'>Backups:</label><input type='checkbox' id='backups' name='backups' checked> " +
                        "<label for='scripts'>Scripts:</label><input type='checkbox' id='scripts' name='scripts' checked>" +
                        "</div>"
                    );
                    this.refreshDisplay();
                    this.fetchSchedules();

                    this.showHideEvents.setupCalendarAction('#backups', 'a.backup-event');
                    this.showHideEvents.setupCalendarAction('#scripts', 'a.script-event');
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
                left: 'prev,next today disconnectFromFileMaker addVerifySchedule,refreshSchedule',
                center: 'title',
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
                urlConfig.url = 'https://' + serverUrl + urlConfig.url;
                urlConfig = this.proxy.applyProxy(urlConfig);
            }

            jQuery.ajax(urlConfig)
                .done((data) => {
                    if (undefined !== this.proxy) {
                        this.proxy.tokenServer = serverUrl;
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
