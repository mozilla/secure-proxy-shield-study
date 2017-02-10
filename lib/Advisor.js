const tabs = require('sdk/tabs');
const { emit } = require('sdk/event/core');
const webExtension = require('sdk/webextension');

const { TelemetryLog } = require('lib/TelemetryLog.js');
const { EventTarget } = require('lib/EventTarget.js');

class Advisor extends EventTarget {
  constructor() {
    super();
    this.telemetryLog = new TelemetryLog();
    const methodsToBind = ['showPanel', 'showWarning', 'handlePanelHide',
                           'handlePanelShow', 'hidePanel'];
    for (let key of methodsToBind) { // eslint-disable-line prefer-const
      this[key] = this[key].bind(this);
    }
  }

  start() {
    webExtension.startup().then((api) => {
      this.browser = api;
      this.browser.runtime.onConnect.addListener((port) => {
        this.port = port;
        this.createRequestListeners();
        this.createWindowListeners();
      });
    });
  }

  cleanup() {
    this.removeWindowListeners();
  }

  showPanel() {
    this.port.sendMessage('showPanel');
    this.telemetryLog.logUIEvent('panelShow', this.activeRecDomain);
  }

  hidePanel() {
    this.port.sendMessage('hidePanel');
    this.telemetryLog.logUIEvent('panelHide', this.activeRecDomain);
  }

  showWarning() {
    this.telemetryLog.logUIEvent('buttonShow', this.activeRecDomain);
    this.port.sendMessage('newNetwork');
    this.showPanel();
  }

  createRequestListeners() {
    this.port.onMessage((message) => {
      this.telemetryLog.logUIEvent(message, this.activeRecDomain);
      if (message === 'disable') {
        emit(this, 'disable');
      }
    });
  }

  createWindowListeners() {
    tabs.on('activate', this.showWarning);
    tabs.on('ready', this.showWarning);
    tabs.on('deactivate', this.hidePanel);
    tabs.on('close', this.hidePanel);
  }

  removeWindowListeners() {
    tabs.off('activate', this.showWarning);
    tabs.off('ready', this.showWarning);
    tabs.off('deactivate', this.hidePanel);
    tabs.off('close', this.hidePanel);
  }
}

exports.Advisor = Advisor;
