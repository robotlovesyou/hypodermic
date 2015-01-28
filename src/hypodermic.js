/* jshint -W097 */
'use strict';

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


Container.prototype._registerModules = function (map) {
  this._modules = {};

  Object.keys(map).forEach(function(key) {
    this._modules[key] = new Module(key, map[key]);
  }.bind(this));
};

Container.prototype._getModule = function(name) {
  if(this._modules.hasOwnProperty(name)) {
    return this._modules[name];
  }

  throw new HypodermicError('No module "' + name + '" found.');
};

Container.prototype._resolveFactory = function (module) {
  return module.factory
  .call(undefined, this._resolveDependencies(module.dependencies));
};

Container.prototype._resolveDependencies = function (dependencies) {
  return dependencies.map(function(dependency) {
    return this.resolve(dependency);
  }.bind(this));
};


Container.prototype.run = function () {
};

Container.prototype.resolve = function (name) {
  if(this._getModule(name).isValueModule) {
    return this._getModule(name).value;
  }

  return this._resolveFactory(this._getModule(name));
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
  this._resoltionDepth = 0;
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

Module.prototype._factoryIsResolved = function () {
  return this.hasOwnProperty('_resolvedFactory');
};


// Module.prototype.resolve = function () {
//   if (this._isValueModule()) {
//     return this._originalValue;
//   }
//
//   if
//
//   if (this._resolutionDepth > 0) {
//     throw new HypodermicError('Circular Dependency detected in:' + this._name);
//   }
//
//
//
//   this._resolutionDepth += 1;
//
//   this._resolutionDepth = 0;
// };


module.exports = {
  Container: Container,
  HypodermicError: HypodermicError,
  Module: Module
};
