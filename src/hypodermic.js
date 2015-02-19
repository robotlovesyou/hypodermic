/* jshint -W097 */
'use strict';

class HypodermicError extends Error {

  constructor(message) {
    this.name = 'HypodermicError';
    this.message = message || 'Mysterious Hypodermic error message';
  }
}

class Container {

  constructor(map) {
    if(arguments.length === 0) {
      throw new HypodermicError('map argument is required');
    }

    if(typeof map !== 'object') {
      throw new HypodermicError('map argument must be an object');
    }

    this._registerModules(map);
  }


  _resetResolutionCountMap() {
    this._resolutionCountMap = new Map();
  }


  _getResolutionCount(name) {
    return this._resolutionCountMap.has(name) ?
      this._resolutionCountMap.get(name) : 0;
  }


  _incrementResolutionCount(name) {
    this._resolutionCountMap.set(name, this._getResolutionCount() + 1);
  }


  _registerModules(map) {
    this._modules = new Map();

    Object.keys(map).forEach((key) => {
      this._modules.set(key, new Module(key, map[key]));
    });
  }


  _getModule(name) {
    if(this._modules.has(name)) {
      return this._modules.get(name);
    }

    throw new HypodermicError('No module "' + name + '" found.');
  }


  _resolveFactory(module) {

    if(!module.isResolved) {
      module.setResolvedFactory(module.factory
      .apply(undefined, this._resolveDependencies(module.dependencies)));
    }

    return module.resolvedFactory;
  }


  _resolveDependencies(dependencies) {
    return dependencies.map(function(dependency) {
      return this._resolve(dependency);
    }.bind(this));
  }


  _resolve(name) {
    if(this._getResolutionCount(name) > 0) {
      throw new HypodermicError('Circular dependency detected resolving "' +
      name + '"');
    }

    this._incrementResolutionCount(name);

    if(this._getModule(name).isValueModule) {
      return this._getModule(name).value;
    }

    return this._resolveFactory(this._getModule(name));
  }


  run(dependencies, callback) {
    this._resetResolutionCountMap();
    return callback.apply(undefined, this._resolveDependencies(dependencies));
  }


  resolve(name) {
    this._resetResolutionCountMap();
    return this._resolve(name);
  }
  
}


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
