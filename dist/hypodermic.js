/* jshint -W097 */
"use strict";

var _babelHelpers = require("babel-runtime/helpers")["default"];
var _core = require("babel-runtime/core-js")["default"];
var HypodermicError = (function (Error) {
  function HypodermicError(message) {
    _babelHelpers.classCallCheck(this, HypodermicError);

    this.name = "HypodermicError";
    this.message = message || "Mysterious Hypodermic error message";
  }

  _babelHelpers.inherits(HypodermicError, Error);

  return HypodermicError;
})(Error);

var Container = (function () {
  function Container(map) {
    _babelHelpers.classCallCheck(this, Container);

    if (arguments.length === 0) {
      throw new HypodermicError("map argument is required");
    }

    if (typeof map !== "object") {
      throw new HypodermicError("map argument must be an object");
    }

    this._registerModules(map);
  }

  _babelHelpers.prototypeProperties(Container, null, {
    _resetResolutionCountMap: {
      value: function _resetResolutionCountMap() {
        this._resolutionCountMap = new _core.Map();
      },
      writable: true,
      configurable: true
    },
    _getResolutionCount: {
      value: function _getResolutionCount(name) {
        return this._resolutionCountMap.has(name) ? this._resolutionCountMap.get(name) : 0;
      },
      writable: true,
      configurable: true
    },
    _incrementResolutionCount: {
      value: function _incrementResolutionCount(name) {
        this._resolutionCountMap.set(name, this._getResolutionCount() + 1);
      },
      writable: true,
      configurable: true
    },
    _registerModules: {
      value: function _registerModules(map) {
        var _this = this;
        this._modules = new _core.Map();

        _core.Object.keys(map).forEach(function (key) {
          _this._modules.set(key, new Module(key, map[key]));
        });
      },
      writable: true,
      configurable: true
    },
    _getModule: {
      value: function _getModule(name) {
        if (this._modules.has(name)) {
          return this._modules.get(name);
        }

        throw new HypodermicError("No module \"" + name + "\" found.");
      },
      writable: true,
      configurable: true
    },
    _resolveFactory: {
      value: function _resolveFactory(module) {
        if (!module.isResolved) {
          module.setResolvedFactory(module.factory.apply(undefined, this._resolveDependencies(module.dependencies)));
        }

        return module.resolvedFactory;
      },
      writable: true,
      configurable: true
    },
    _resolveDependencies: {
      value: function _resolveDependencies(dependencies) {
        return dependencies.map((function (dependency) {
          return this._resolve(dependency);
        }).bind(this));
      },
      writable: true,
      configurable: true
    },
    _resolve: {
      value: function _resolve(name) {
        if (this._getResolutionCount(name) > 0) {
          throw new HypodermicError("Circular dependency detected resolving \"" + name + "\"");
        }

        this._incrementResolutionCount(name);

        if (this._getModule(name).isValueModule) {
          return this._getModule(name).value;
        }

        return this._resolveFactory(this._getModule(name));
      },
      writable: true,
      configurable: true
    },
    run: {
      value: function run(dependencies, callback) {
        this._resetResolutionCountMap();
        return callback.apply(undefined, this._resolveDependencies(dependencies));
      },
      writable: true,
      configurable: true
    },
    resolve: {
      value: function resolve(name) {
        this._resetResolutionCountMap();
        return this._resolve(name);
      },
      writable: true,
      configurable: true
    }
  });

  return Container;
})();

var Module = (function () {
  function Module(name, moduleObject) {
    _babelHelpers.classCallCheck(this, Module);

    if (typeof name !== "string") {
      throw new HypodermicError("Module constructor requires name of type string");
    }

    if (typeof moduleObject !== "object") {
      throw new HypodermicError("Module constructor requires a moduleObject of type object");
    }

    if (!this._validateModuleObject(moduleObject)) {
      throw new HypodermicError("moduleObjectRequires either " + "a value property {any} or a dependencies property {[string]} AND" + "a factory property {function}");
    }

    if (moduleObject.hasOwnProperty("value")) {
      this._originalValue = this._copyValue(moduleObject.value);
    } else {
      this._dependencies = moduleObject.dependencies.slice();
      this._factory = moduleObject.factory;
    }

    this._name = name;
  }

  _babelHelpers.prototypeProperties(Module, null, {
    name: {
      get: function () {
        return this._name;
      },
      configurable: true
    },
    value: {
      get: function () {
        return this._originalValue;
      },
      configurable: true
    },
    dependencies: {
      get: function () {
        if (this._dependencies && Array.isArray(this._dependencies)) {
          return this._dependencies.slice();
        }
      },
      configurable: true
    },
    factory: {
      get: function () {
        return this._factory;
      },
      configurable: true
    },
    isValueModule: {
      get: function () {
        return this._isValueModule();
      },
      configurable: true
    },
    isFactoryModule: {
      get: function () {
        return this._isFactoryModule();
      },
      configurable: true
    },
    isResolved: {
      get: function () {
        return this.hasOwnProperty("_resolvedFactory");
      },
      configurable: true
    },
    resolvedFactory: {
      get: function () {
        return this._resolvedFactory;
      },
      configurable: true
    },
    _isValueModule: {
      value: function _isValueModule() {
        return this.hasOwnProperty("_originalValue");
      },
      writable: true,
      configurable: true
    },
    _isFactoryModule: {
      value: function _isFactoryModule() {
        return !this._isValueModule();
      },
      writable: true,
      configurable: true
    },
    _validateModuleObject: {
      value: function _validateModuleObject(moduleObject) {
        //the module object has a value property
        return moduleObject.hasOwnProperty("value") || moduleObject.hasOwnProperty("dependencies") && Array.isArray(moduleObject.dependencies) && moduleObject.hasOwnProperty("factory") && typeof moduleObject.factory === "function";
      },
      writable: true,
      configurable: true
    },
    _copyValue: {
      value: function _copyValue(value) {
        if (this._isPlainObject(value)) {
          return this._deepCopyObject(value);
        }

        return value;
      },
      writable: true,
      configurable: true
    },
    _deepCopyObject: {
      value: function _deepCopyObject(object) {
        var _this = this;
        var copy = {};

        _core.Object.keys(object).forEach(function (key) {
          copy[key] = _this._deepCopyValue(object[key]);
        });

        return copy;
      },
      writable: true,
      configurable: true
    },
    _deepCopyValue: {
      value: function _deepCopyValue(value) {
        if (this._isPlainObject(value)) {
          return this._deepCopyObject(value);
        } else if (Array.isArray(value)) {
          return value.slice();
        }

        return value;
      },
      writable: true,
      configurable: true
    },
    _isPlainObject: {
      value: function _isPlainObject(object) {
        return typeof object === "object" && object.constructor === Object;
      },
      writable: true,
      configurable: true
    },
    setResolvedFactory: {
      value: function setResolvedFactory(value) {
        this._resolvedFactory = value;
      },
      writable: true,
      configurable: true
    }
  });

  return Module;
})();

module.exports = {
  Container: Container,
  HypodermicError: HypodermicError,
  Module: Module
};


//or the module object has a dependencies array AND a factory function