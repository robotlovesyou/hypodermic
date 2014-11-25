/* jshint -W097, -W030 */
'use strict';
var Container = require('../src/hypodermic').Container;
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.use(sinonChai);
var expect = chai.expect;

function isInBrowser() {
  return typeof window !== 'undefined';
}

function setup() {
  if (isInBrowser()) {
    mocha.setup('bdd');
  }
}

function runTests() {
  if (isInBrowser()) {
    if (window.mochaPhantomJS) {
      mochaPhantomJS.run();
    } else {
      mocha.run();
    }
  }
}

setup();

describe('module', function () {

  it('exports Container', function () {
    expect(Container).to.exist;
  });
});

runTests();
