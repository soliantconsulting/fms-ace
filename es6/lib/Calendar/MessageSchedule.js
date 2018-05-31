"use strict";

import AddMessageScheduleHtml from '../../html/AddMessageSchedule.html';
import jQuery from "jquery";

export default class MessageSchedule {
    constructor(calendar) {
        this.addMessageScheduleModal = jQuery(AddMessageScheduleHtml);
        this.calendar = calendar;
        jQuery('body').append(AddMessageScheduleHtml);

        this.setupAddMessageScheduleModal();
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

            if (!this.calendar.isValid(form)) {
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
                headers: this.calendar.getHeaders(),
            };

            if (undefined !== this.calendar.proxy) {
                urlConfig.url = this.calendar.tokenServer + urlConfig.url;
                urlConfig = this.calendar.proxy.applyProxyWithHeaders(urlConfig);
            }

            jQuery.ajax(urlConfig).done((data) => {
                this.addMessageScheduleModal.modal('hide');
                this.calendar.fetchSchedules();
                form.trigger("reset");
            }).fail((data) => {
                this.calendar.modalMessage(this.addMessageScheduleModal, data.responseJSON.errorMessage, 'bg-danger');
            });
        });
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

    showModal() {
        this.addMessageScheduleModal.modal();
    }
};
