/* jshint -W097, -W030 */
'use strict';

/**
 * Polyfill for bind because phantomjs is running a version of webkit
 * from some time before dinosaurs went extinct...
 */
if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
    fToBind = this,
    fNOP    = function() {},
    fBound  = function() {
      return fToBind.apply(this instanceof fNOP && oThis ? this: oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
    };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP(); //jshint ignore: line

    return fBound;
  };
}


var hypodermic = require('../dist/hypodermic');
var Container = hypodermic.Container;
var HypodermicError = hypodermic.HypodermicError;
var Module = hypodermic.Module;
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

  it('exports HypodermicError', function () {
    expect(HypodermicError).to.exist;
  });
});

describe('HypodermicError', function () {
  it('is a custom error object', function () {
    var errorMessage = 'The error message';

    try {
      throw new HypodermicError(errorMessage);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});


describe('Container', function () {
  var valueModuleString = {
    value: 'This is the value'
  };

  var valueModuleBool = {
    value: true
  };

  it('is a constructor', function () {
    expect(Container).to.be.a('function');
    expect(new Container({}).constructor).to.equal(Container);
  });

  it('requires one parameter', function () {
    expect(Container).to.have.length(1);
  });

  it('throws an error if the argument to Container is missing', function () {
    expect(Container.bind(this)).to.throw();
  });

  it('throws an error if the argument to Container is not an object', function () {
    expect(Container.bind(this, 123)).to.throw();
  });

  it('registers a module object for each module mapped in the' +
  ' container arguments', function () {
    var container = new Container(
      {'str': valueModuleString, 'bool': valueModuleBool});

    expect(container._modules.has('str')).to.be.true;
    expect(container._modules.has('bool')).to.be.true;
  });
});

describe('Container Instance', function () {
  it('exposes a function "run"', function () {
    expect((new Container({})).run).to.exist;
    expect((new Container({})).run).to.be.a.function;
  });

  it('exposes a function "resolve"', function () {
    expect((new Container({})).resolve).to.exist;
    expect((new Container({})).resolve).to.be.a.function;
  });
});

describe('Container#run', function () {
  var container, wibble, wobble, wobbleFactory, stub;

  beforeEach(function () {
    wibble = 'wibble';
    wobble = 'wobble';
    wobbleFactory = function (wobble) {return 'I like to ' + wobble;};

    container = new Container({
      wibble: {
        value: wibble
      },
      wobble: {
        value: wobble
      },
      wobbleFactory: {
        dependencies: ['wobble'],
        factory: wobbleFactory
      }
    });

    stub = sinon.stub();
  });

  it('should take two arguments', function () {
    expect(container.run).to.have.length(2);
  });

  it('runs the provided function', function () {
    container.run([], stub);
    expect(stub).to.have.been.called;
  });

  it('supplies the requested dependencies to the function', function () {
    container.run(['wibble', 'wobbleFactory'], stub);
    expect(stub).to.have.been.calledWith(wibble, 'I like to wobble');
  });

});

describe('Container#resolve', function () {
  var valueModule, value, container, counter;

  beforeEach(function () {
    value = 'wibble';
    counter = 0;
    container = new Container({
      myValue: {
        value: value
      },
      myFactory: {
        dependencies: [],
        factory: function () {return 'factoryWibble';}
      },
      myFactoryWithDependencies: {
        dependencies: ['myValue'],
        factory: function (myValue) {
          return 'The value is ' + myValue;
        }
      },
      myFactoryWithFactoryDependencies: {
        dependencies: ['myFactoryWithDependencies'],
        factory: function (myFactoryWithDependencies) {
          return 'I say "' + myFactoryWithDependencies + '".';
        }
      },
      counterFactory: {
        dependencies: [],
        factory: function () { return (counter += 1);}
      },
      circularOne: {
        dependencies: ['circularTwo'],
        factory: function (circularTwo) {}
      },
      circularTwo: {
        dependencies: ['circularOne'],
        factory: function (circularOne) {}
      }
    });
  });

  it('takes a single argument', function () {
    expect(container.resolve).to.have.length(1);
  });

  describe('Value Modules', function () {
    it('returns a copy of the value supplied to the module', function () {
      expect(container.resolve('myValue')).to.equal(value);
    });
  });

  describe('Factory Modules', function () {
    it('returns the result of running the factory function', function () {
      expect(container.resolve('myFactory')).to.equal('factoryWibble');
    });

    it('supplies the dependcy values to the factory function', function () {
      expect(container.resolve('myFactoryWithDependencies'))
      .to.equal('The value is wibble');
    });

    it('supplies the dependencies to the dependencies of the factory',
    function () {
      expect(container.resolve('myFactoryWithFactoryDependencies'))
      .to.equal('I say "The value is wibble".');
    });

    it('only resolves the dependency once', function () {
      expect(container.resolve('counterFactory')).to.equal(1);
      expect(container.resolve('counterFactory')).to.equal(1);
    });

    it('thows a hypodermic error for circular dependencies', function () {
      var throws = function () {
        container.resolve('circularOne');
      };

      expect(throws).to.throw(HypodermicError);
    });
  });
});

describe('Module', function () {

  it('is a constructor', function () {
    expect(Module).to.be.a('function');
    expect(new Module('aname', {value: 'wibble'}).constructor).to.equal(Module);
  });

  it('takes two arguments', function () {
    var throws = function () {return new Module();};

    expect(Module).to.have.length(2);
    expect(throws).to.throw(HypodermicError);
  });

  it('throws a HypodermicError if the name argument is not a string',
  function () {
      var throws = function () {return new Module(false, {value: 'wibble'});};

      expect(throws).to.throw(HypodermicError);
  });

  it('throws a HypodermicError if the moduleObject ' +
  'argument is not an object', function () {
    var throws = function () {return new Module('aName', false);};

    expect(throws).to.throw(HypodermicError);
  });

  it('throws a HypodermicError if the moduleObject does not have either ' +
  'a value property or a dependencies and a factory property', function () {
    var throws1 = function () {return new Module('aName', {meep: true});};
    var throws2 = function () {return new Module('aName', {dependencies: []});};
    var throws3 = function () {return new Module('aName',
    {factory: function () {}});};

    expect(throws1).to.throw(HypodermicError);
    expect(throws2).to.throw(HypodermicError);
    expect(throws3).to.throw(HypodermicError);
  });

  it('throws a HypodermicError if the dependencies property is not an array',
  function () {
    var throws = function () {
      return new Module('aName', {dependencies: true, factory: function () {}});
    };

    expect(throws).to.throw(HypodermicError);

  });

  it('throws a HypodermicError if the factory property is not a function',
  function () {
    var throws = function () {
      return new Module('aName', {dependencies:[], factory: true});
    };

    expect(throws).to.throw(HypodermicError);
  });

  it('constructs a module object if value is any type', function () {

    new Module('aName', {value: 123});
    new Module('aName', {value: 'hello'});
    new Module('aName', {value: true});
    new Module('aName', {value: new Date()});
    new Module('aName', {value: new HypodermicError()});
  });

  it('constructs a module if dependencies is an array and ' +
  'factory is a function', function () {
    new Module('aName', {dependencies:[], factory: function () {}});
  });

});

describe('Module instances', function () {
  var module, factoryModule;

  beforeEach(function () {
    module = new Module('aName', {value: 'wibble'});
  });

  it('exposes a property "value"', function () {
    expect(module.hasOwnProperty('value')).to.equal(true);
  });

  it('exposes a property "dependencies"', function () {
    expect(module.hasOwnProperty('dependencies')).to.equal(true);
  });

  it('exposes a property "factory"', function () {
    expect(module.hasOwnProperty('factory')).to.equal(true);
  });

});

describe('Module#value', function () {

  var stringValueModule, numberValueModule, boolValueModule,
  functionValueModule, objectValueModule, objectModuleValue,
  constructedObjectValueModule, constructedObjectModuleValue;

  beforeEach(function () {
    stringValueModule = new Module('aName', {value: 'hello'});

    numberValueModule = new Module('aName', {value: 123});

    boolValueModule = new Module('aName', {value: true});

    functionValueModule = new Module('aName', {
      value: function () { return 'hello function';}
    });

    objectModuleValue = {
      property1: 'Hello',
      property2: 'Goodbye',
      property3: {
        monday: 'Monday',
        tuesday: 'Tuesday'
      }
    };

    objectValueModule = new Module('aName', {value: objectModuleValue});

    constructedObjectModuleValue = new HypodermicError('hello error');

    constructedObjectValueModule = new Module('aName', {
      value: constructedObjectModuleValue
    });

  });

  it('returns a copy of the value for a value module', function () {
    expect(stringValueModule.value).to.equal('hello');
    expect(numberValueModule.value).to.equal(123);
    expect(boolValueModule.value).to.equal(true);
    expect((functionValueModule.value)()).to.equal('hello function');
    expect(objectValueModule.value).to.deep.equal(objectModuleValue);
    expect(constructedObjectValueModule.value).to.equal(
      constructedObjectModuleValue);
  });

  it('returns a deep copy of the value if it is a plan object', function () {
    objectModuleValue.property1 = 'wibble';
    objectModuleValue.property3.monday = 'Nope';

    expect(objectValueModule.value.property1).to.equal('Hello');
    expect(objectValueModule.value.property3.monday).to.equal('Monday');
  });
});

describe('Module#dependencies', function () {
  var dependencies, factoryModule;

  beforeEach(function () {
    dependencies = ['a', 'b', 'c', 'd'];

    factoryModule = new Module('aName',
      {
        dependencies: dependencies,
        factory: function () {}
      }
    );

  });

  it('returns a list of dependencies provided to the constructor', function () {
    expect(factoryModule.dependencies[0]).to.equal('a');
    expect(factoryModule.dependencies[1]).to.equal('b');
  });

  it('returns a copy and not the original list', function () {
    dependencies[2] = 'x';
    dependencies[3] = 'y';

    expect(factoryModule.dependencies).not.to.deep.equal(dependencies);
  });

  it('returns a fresh copy each time', function () {
    expect(factoryModule.dependencies).not.to.equal(dependencies);
  });
});

describe('Module#factory', function () {

  it('returns the factory function supplied to the constructor', function () {
    var factoryFunction = function () {};
    var module = new Module('aName',
    {dependencies: [], factory: factoryFunction});

    expect(module.factory).to.equal(factoryFunction);
  });

});

runTests();
