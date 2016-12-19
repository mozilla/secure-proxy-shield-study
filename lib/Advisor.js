const { Panel: panel } = require('sdk/panel');
const tabs = require('sdk/tabs');
const { emit } = require('sdk/event/core');

const { ToggleButton } = require('sdk/ui/button/toggle');
const { TelemetryLog } = require('lib/TelemetryLog.js');
const { EventTarget } = require('lib/EventTarget.js');

const panelWidth = 400;
const panelHeight = 192;

class Advisor extends EventTarget {
  constructor() {
    super();
    this.telemetryLog = new TelemetryLog();
    const methodsToBind = ['showPanel', 'showWarning', 'handlePanelHide',
                           'handlePanelShow', 'hidePanel'];
    for (let key of methodsToBind) { // eslint-disable-line prefer-const
      this[key] = this[key].bind(this);
    }
    this.panel = this.createPanel();
  }

  start() {
    this.button = ToggleButton({ // eslint-disable-line new-cap
      id: 'vpn-warn-button',
      label: 'Firefox vpn',
      icon: {
        16: './icon-16.png',
        32: './icon-32.png',
        64: './icon-64.png',
      },
      onClick: this.showPanel,
    });
    this.createRequestListeners();
    this.createWindowListeners();
  }

  cleanup() {
    this.panel.destroy();
    this.removeWindowListener();
  }

  createPanel() {
    return panel({
      width: panelWidth,
      height: panelHeight,
      contentURL: './panel.html',
      contentScriptFile: './panelScript.js',
      onShow: this.handlePanelShow,
      onHide: this.handlePanelHide,
    });
  }

  showPanel() {
    this.panel.show({
      position: this.button,
    });
  }

  hidePanel() {
    this.panel.hide();
  }

  handlePanelShow() {
    this.button.state('window', {
      checked: true,
    });
    this.telemetryLog.logUIEvent('panelShow', this.activeRecDomain);
  }

  handlePanelHide() {
    this.button.state('window', {
      checked: false,
    });
    this.telemetryLog.logUIEvent('panelHide', this.activeRecDomain);
  }

  showWarning() {
    this.telemetryLog.logUIEvent('buttonShow', this.activeRecDomain);
    this.panel.port.emit('newNetwork');
    this.button.state('window', {
      disabled: false,
    });
    this.showPanel();
  }

  createRequestListeners() {
    this.createSignupListener();
    this.createNoSignupListener();
    this.createDisableListener();
    this.createCloseListener();
  }

  createSignupListener() {
    this.panel.port.on('signup', () => {
      this.telemetryLog.logUIEvent('signup', this.activeRecDomain);
      this.panel.hide();
      this.button.state('window', {
        disabled: true,
      });
    });
  }

  createNoSignupListener() {
    this.panel.port.on('noSignup', () => {
      this.telemetryLog.logUIEvent('noSignup', this.activeRecDomain);
      this.panel.hide();
      this.button.state('window', {
        disabled: true,
      });
    });
  }

  createCloseListener() {
    this.panel.port.on('close', () => {
      this.panel.hide();
      this.button.state('window', {
        disabled: true,
      });
    });
  }

  createDisableListener() {
    this.panel.port.on('disable', () => {
      this.telemetryLog.logUIEvent('disable', this.activeRecDomain);
      this.panel.hide();
      this.button.state('window', {
        disabled: true,
      });
      emit(this, 'disable');
    });
  }

  createWindowListeners() {
    tabs.on('activate', this.showWarning);
    tabs.on('ready', this.showWarning);
    tabs.on('deactivate', this.hidePanel);
    tabs.on('close', this.hidePanel);
  }

  removeWindowListener() {
    tabs.off('activate', this.showWarning);
    tabs.off('ready', this.showWarning);
    tabs.off('deactivate', this.hidePanel);
    tabs.off('close', this.hidePanel);
  }
}

exports.Advisor = Advisor;
