(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* jshint -W097 */
'use strict';

function makeEmptyMap() {
  return Object.create(null);
}

function HypodermicError(message) {
  this.name = 'HypodermicError';
  this.message = message || 'Mysterious Hypodermic error message';
}


HypodermicError.prototype = new Error();
HypodermicError.prototype.constructor = HypodermicError;


function Container(map) {
  if(arguments.length === 0) {
    throw new HypodermicError('map argument is required');
  }

  if(typeof map !== 'object') {
    throw new HypodermicError('map argument must be an object');
  }

  this._registerModules(map);
}

Container.prototype._resetResolutionCountMap = function () {
  this._resolutionCountMap = makeEmptyMap();
};

Container.prototype._getResolutionCount = function(name) {
  if (typeof this._resolutionCountMap[name] !== 'undefined') {
    return this._resolutionCountMap[name];
  }
};

Container.prototype._incrementResolutionCount = function(name) {
  if(typeof this._resolutionCountMap[name] === 'undefined') {
    this._resolutionCountMap[name] = 0;
  }

  this._resolutionCountMap[name] += 1;
};

Container.prototype._registerModules = function (map) {
  this._modules = makeEmptyMap();

  Object.keys(map).forEach(function(key) {
    this._modules[key] = new Module(key, map[key]);
  }.bind(this));
};

Container.prototype._getModule = function(name) {
  if(typeof this._modules[name] !== 'undefined') {
    return this._modules[name];
  }

  throw new HypodermicError('No module "' + name + '" found.');
};

Container.prototype._resolveFactory = function (module) {

  if(!module.isResolved) {
    module.setResolvedFactory(module.factory
    .apply(undefined, this._resolveDependencies(module.dependencies)));
  }

  return module.resolvedFactory;
};

Container.prototype._resolveDependencies = function (dependencies) {
  return dependencies.map(function(dependency) {
    return this._resolve(dependency);
  }.bind(this));
};

Container.prototype._resolve = function(name) {
  if(this._getResolutionCount(name) > 0) {
    throw new HypodermicError('Circular dependency detected resolving "' +
    name + '"');
  }

  this._incrementResolutionCount(name);

  if(this._getModule(name).isValueModule) {
    return this._getModule(name).value;
  }

  return this._resolveFactory(this._getModule(name));
};


Container.prototype.run = function (dependencies, callback) {
  this._resetResolutionCountMap();
  return callback.apply(undefined, this._resolveDependencies(dependencies));
};

Container.prototype.resolve = function (name) {
  this._resetResolutionCountMap();
  return this._resolve(name);
};


function Module(name, moduleObject) {
  if(typeof name !== 'string') {
    throw new HypodermicError('Module constructor requires name of type string');
  }

  if(typeof moduleObject !== 'object') {
    throw new HypodermicError(
        'Module constructor requires a moduleObject of type object');
  }

  if(!this._validateModuleObject(moduleObject)) {
    throw new HypodermicError('moduleObjectRequires either ' +
    'a value property {any} or a dependencies property {[string]} AND' +
    'a factory property {function}');
  }

  if(moduleObject.hasOwnProperty('value')) {
    this._originalValue = this._copyValue(moduleObject.value);
  } else {
    this._dependencies = moduleObject.dependencies.slice();
    this._factory = moduleObject.factory;
  }

  this._name = name;
  this._defineProperties();


}

Module.prototype._defineProperties = function () {
  Object.defineProperties(this, {
    name: {
      get: function () {
        return this._name;
      }
    },
    value: {
      get: function () {
        return this._originalValue;
      }
    },
    dependencies: {
      get: function () {
        return this._dependencies.slice();
      }
    },
    factory: {
      get: function () {
        return this._factory;
      }
    },
    isValueModule: {
      get: function () {
        return this._isValueModule();
      }
    },
    isFactoryModule: {
      get: function () {
        return this._isFactoryModule();
      }
    },
    isResolved: {
      get: function () {
        return this.hasOwnProperty('_resolvedFactory');
      }
    },
    resolvedFactory: {
      get: function () {
        return this._resolvedFactory;
      }
    }
  });
};


Module.prototype._isValueModule = function () {
  return this.hasOwnProperty('_originalValue');
};


Module.prototype._isFactoryModule = function () {
  return !this._isValueModule();
};


Module.prototype._validateModuleObject = function (moduleObject) {
  //the module object has a value property
  return moduleObject.hasOwnProperty('value') ||

  //or the module object has a dependencies array AND a factory function
  (
    moduleObject.hasOwnProperty('dependencies') &&
    Array.isArray(moduleObject.dependencies) &&
    moduleObject.hasOwnProperty('factory') &&
    typeof moduleObject.factory === 'function'
  );
};


Module.prototype._copyValue = function (value) {
  if(this._isPlainObject(value)) {
    return this._deepCopyObject(value);
  }

  return value;
};


Module.prototype._deepCopyObject = function (object) {
  var copy = {};

  Object.keys(object).forEach(function (key) {
    copy[key] = this._deepCopyValue(object[key]);
  }.bind(this));

  return copy;
};


Module.prototype._deepCopyValue = function(value) {
  if(this._isPlainObject(value)) {
    return this._deepCopyObject(value);
  } else if (Array.isArray(value)) {
    return value.slice();
  }

  return value;

};


Module.prototype._isPlainObject = function (object) {
  return typeof object === 'object' && object.constructor === Object;
};

Module.prototype.setResolvedFactory = function (value) {
  this._resolvedFactory = value;
};

module.exports = {
  Container: Container,
  HypodermicError: HypodermicError,
  Module: Module
};

},{}]},{},[1]);
