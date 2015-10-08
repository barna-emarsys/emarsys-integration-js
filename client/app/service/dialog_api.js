'use strict';

var extend = require('extend');
var ConfirmComponent = require('./components/confirm');
var ModalComponent = require('./components/modal');

class DialogApi {

  get params() {
    return JSON.parse(document.getElementsByTagName('e-modal')[0].getAttribute('data-params'));
  }

  constructor(api) {
    this.api = api;
    this.global = api.global;

    this.deferreds = {};
    this.confirmParams = {};
  }

  submit(success, data) {
    data = data || {};
    var message = this.generateMessageData(success, data);

    if (this.deferreds[this.params.dialogId]) {
      if (success) {
        this.deferreds[this.params.dialogId].resolve(message);
      } else {
        this.deferreds[this.params.dialogId].reject(message);
      }
    } else {
      this.api.messageToService('dialog:submit', message, this.params.openerIntegrationInstanceId);
    }
  }

  generateMessageData(success, data = {}) {
    var message = extend({
      dialogId: this.params.dialogId,
      success: success
    }, data);

    if (this.confirmParams[this.params.dialogId]) {
      message = extend(message, this.confirmParams[this.params.dialogId]);
    }

    return message;
  }

  generateDialogId() {
    return Math.floor(Math.random() * 10000000);
  }

  confirm(message) {
    if (!message.data.dialogId) {
      message.data.dialogId = this.generateDialogId();
    }

    if (message.data.params) {
      this.confirmParams[message.data.dialogId] = message.data.params;
    }

    this.getConfirmComponent(message).render();

    if (message.source.integration_id === 'EMARSYS') {
      this.deferreds[message.data.dialogId] = this.global.$.Deferred();
      return this.deferreds[message.data.dialogId].promise();
    }
  }

  getConfirmComponent(message) {
    return new ConfirmComponent(this.global, message);
  }

  confirmNavigation(url, message) {
    var confirmPromise = this.confirm(message);

    confirmPromise.then(() => {
      this.global.$(this.global).off('beforeunload');
      this.global.location.href = url;
    }).fail(() => {
      this.close();
    });

    return confirmPromise;
  }

  modal(message) {
    new ModalComponent(this.global, message).render();
  }

  close() {
    this.global.$('e-modal').remove();
  }

}

module.exports = DialogApi;
