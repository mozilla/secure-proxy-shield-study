const self = require('sdk/self');
const shield = require('shield-studies-addon-utils');
const { when: unload } = require('sdk/system/unload');

const { Advisor } = require('./Advisor');

let advisor = null;
let thisStudy = null;

function createAdvisor(study) {
  const newAdvisor = new Advisor();

  newAdvisor.on('disable-', () => {
    study.uninstall('user-ended-study');
  });

  return newAdvisor;
}

const surveyUrl = 'https://mozilla.org/';
const studyConfig = {
  name: self.addonId,
  duration: 14,
  surveyUrls: {
    'end-of-study': surveyUrl,
    'user-ended-study': surveyUrl,
    ineligible: null,
  },
  variations: {
    'regular'() {
      advisor = createAdvisor(thisStudy);
      advisor.start();
    },
    // 'observe-only'() {},
  },
};

class VPNStudy extends shield.Study {
  uninstall(reason) {
    this.flags.dying = true;
    this.report({
      study_name: this.config.name,
      branch: this.config.variation,
      study_state: reason,
    });
    shield.generateTelemetryIdIfNeeded().then(() => {
      this.showSurvey(reason);
    });
    shield.die();
  }

  cleanup() {
    if (this.variation !== 'observe-only') {
      advisor.cleanup();
      advisor = null;
    }
    super.cleanup();  // cleanup simple-prefs, simple-storage
  }
}

thisStudy = new VPNStudy(studyConfig);

// for testing / linting
exports.studyConfig = studyConfig;

// for use by index.js
exports.study = thisStudy;

unload((reason) => thisStudy.shutdown(reason));
