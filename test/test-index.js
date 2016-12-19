const { Advisor } = require('../lib/Advisor.js');
const { before, after } = require('sdk/test/utils');

let advisor;

exports['test main'] = (assert) => {
  assert.pass('Unit test running!');
};

exports['test main async'] = (assert, done) => {
  assert.pass('async Unit test running!');
  done();
};

before(exports, () => {
  advisor = new Advisor();
});

require('sdk/test').run(exports);

after(exports, () => {
  advisor.cleanup();
  advisor = null;
});
