(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.XTracker = {}));
})(this, (function (exports) { 'use strict';

  function getLSCache(key) {
    const cacheVal = window.localStorage.getItem(key);
    if (cacheVal) {
      try {
        return JSON.parse(cacheVal);
      } catch (error) {
        //
      }
    }
  }
  function setLSCache(key, val) {
    window.localStorage.setItem(key, JSON.stringify(val));
  }

  /* eslint-disable camelcase */
  /**
   * 埋点新增 2 个参数
   * sequence 取值 1,100000000 循环取值
   * seq_salt 6位随机 自增序列重新开始取值时，变化该值
   * sequence 和 seq_salt 放 LS
   */
  function initSalt() {
    let salt = '';
    for (let i = 0; i < 6; i++) {
      salt += Math.ceil(Math.random() * 10);
    }
    return Number(salt);
  }
  const _CACHE_KEY = '_X_STAT';
  function setCache$1(key, cache) {
    const {
      sequence,
      seq_salt
    } = cache;
    if (sequence >= 100000000) {
      setLSCache(key, {
        sequence: 1,
        seq_salt: initSalt()
      });
    } else {
      setLSCache(key, {
        sequence: sequence + 1,
        seq_salt
      });
    }
  }
  // 获取 sequence
  function getSequence() {
    let key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _CACHE_KEY;
    const cache = getLSCache(key);
    if (cache) {
      setCache$1(key, cache);
      return cache;
    }
    const init = {
      sequence: 1,
      seq_salt: initSalt()
    };
    setCache$1(key, init);
    return init;
  }

  function _defineProperty(obj, key, value) {
    key = _toPropertyKey(key);
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function _toPrimitive(input, hint) {
    if (typeof input !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== undefined) {
      var res = prim.call(input, hint || "default");
      if (typeof res !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (hint === "string" ? String : Number)(input);
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");
    return typeof key === "symbol" ? key : String(key);
  }

  function bind(fn, thisArg) {
    return function wrap() {
      return fn.apply(thisArg, arguments);
    };
  }

  // utils is a library of generic helper functions non-specific to axios

  const {toString} = Object.prototype;
  const {getPrototypeOf} = Object;

  const kindOf = (cache => thing => {
      const str = toString.call(thing);
      return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
  })(Object.create(null));

  const kindOfTest = (type) => {
    type = type.toLowerCase();
    return (thing) => kindOf(thing) === type
  };

  const typeOfTest = type => thing => typeof thing === type;

  /**
   * Determine if a value is an Array
   *
   * @param {Object} val The value to test
   *
   * @returns {boolean} True if value is an Array, otherwise false
   */
  const {isArray} = Array;

  /**
   * Determine if a value is undefined
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if the value is undefined, otherwise false
   */
  const isUndefined = typeOfTest('undefined');

  /**
   * Determine if a value is a Buffer
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a Buffer, otherwise false
   */
  function isBuffer(val) {
    return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
      && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
  }

  /**
   * Determine if a value is an ArrayBuffer
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is an ArrayBuffer, otherwise false
   */
  const isArrayBuffer = kindOfTest('ArrayBuffer');


  /**
   * Determine if a value is a view on an ArrayBuffer
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
   */
  function isArrayBufferView(val) {
    let result;
    if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
      result = ArrayBuffer.isView(val);
    } else {
      result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
    }
    return result;
  }

  /**
   * Determine if a value is a String
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a String, otherwise false
   */
  const isString = typeOfTest('string');

  /**
   * Determine if a value is a Function
   *
   * @param {*} val The value to test
   * @returns {boolean} True if value is a Function, otherwise false
   */
  const isFunction = typeOfTest('function');

  /**
   * Determine if a value is a Number
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a Number, otherwise false
   */
  const isNumber = typeOfTest('number');

  /**
   * Determine if a value is an Object
   *
   * @param {*} thing The value to test
   *
   * @returns {boolean} True if value is an Object, otherwise false
   */
  const isObject = (thing) => thing !== null && typeof thing === 'object';

  /**
   * Determine if a value is a Boolean
   *
   * @param {*} thing The value to test
   * @returns {boolean} True if value is a Boolean, otherwise false
   */
  const isBoolean = thing => thing === true || thing === false;

  /**
   * Determine if a value is a plain Object
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a plain Object, otherwise false
   */
  const isPlainObject = (val) => {
    if (kindOf(val) !== 'object') {
      return false;
    }

    const prototype = getPrototypeOf(val);
    return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
  };

  /**
   * Determine if a value is a Date
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a Date, otherwise false
   */
  const isDate = kindOfTest('Date');

  /**
   * Determine if a value is a File
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a File, otherwise false
   */
  const isFile = kindOfTest('File');

  /**
   * Determine if a value is a Blob
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a Blob, otherwise false
   */
  const isBlob = kindOfTest('Blob');

  /**
   * Determine if a value is a FileList
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a File, otherwise false
   */
  const isFileList = kindOfTest('FileList');

  /**
   * Determine if a value is a Stream
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a Stream, otherwise false
   */
  const isStream = (val) => isObject(val) && isFunction(val.pipe);

  /**
   * Determine if a value is a FormData
   *
   * @param {*} thing The value to test
   *
   * @returns {boolean} True if value is an FormData, otherwise false
   */
  const isFormData = (thing) => {
    let kind;
    return thing && (
      (typeof FormData === 'function' && thing instanceof FormData) || (
        isFunction(thing.append) && (
          (kind = kindOf(thing)) === 'formdata' ||
          // detect form-data instance
          (kind === 'object' && isFunction(thing.toString) && thing.toString() === '[object FormData]')
        )
      )
    )
  };

  /**
   * Determine if a value is a URLSearchParams object
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a URLSearchParams object, otherwise false
   */
  const isURLSearchParams = kindOfTest('URLSearchParams');

  /**
   * Trim excess whitespace off the beginning and end of a string
   *
   * @param {String} str The String to trim
   *
   * @returns {String} The String freed of excess whitespace
   */
  const trim = (str) => str.trim ?
    str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');

  /**
   * Iterate over an Array or an Object invoking a function for each item.
   *
   * If `obj` is an Array callback will be called passing
   * the value, index, and complete array for each item.
   *
   * If 'obj' is an Object callback will be called passing
   * the value, key, and complete object for each property.
   *
   * @param {Object|Array} obj The object to iterate
   * @param {Function} fn The callback to invoke for each item
   *
   * @param {Boolean} [allOwnKeys = false]
   * @returns {any}
   */
  function forEach(obj, fn, {allOwnKeys = false} = {}) {
    // Don't bother if no value provided
    if (obj === null || typeof obj === 'undefined') {
      return;
    }

    let i;
    let l;

    // Force an array if not already something iterable
    if (typeof obj !== 'object') {
      /*eslint no-param-reassign:0*/
      obj = [obj];
    }

    if (isArray(obj)) {
      // Iterate over array values
      for (i = 0, l = obj.length; i < l; i++) {
        fn.call(null, obj[i], i, obj);
      }
    } else {
      // Iterate over object keys
      const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
      const len = keys.length;
      let key;

      for (i = 0; i < len; i++) {
        key = keys[i];
        fn.call(null, obj[key], key, obj);
      }
    }
  }

  function findKey(obj, key) {
    key = key.toLowerCase();
    const keys = Object.keys(obj);
    let i = keys.length;
    let _key;
    while (i-- > 0) {
      _key = keys[i];
      if (key === _key.toLowerCase()) {
        return _key;
      }
    }
    return null;
  }

  const _global = (() => {
    /*eslint no-undef:0*/
    if (typeof globalThis !== "undefined") return globalThis;
    return typeof self !== "undefined" ? self : (typeof window !== 'undefined' ? window : global)
  })();

  const isContextDefined = (context) => !isUndefined(context) && context !== _global;

  /**
   * Accepts varargs expecting each argument to be an object, then
   * immutably merges the properties of each object and returns result.
   *
   * When multiple objects contain the same key the later object in
   * the arguments list will take precedence.
   *
   * Example:
   *
   * ```js
   * var result = merge({foo: 123}, {foo: 456});
   * console.log(result.foo); // outputs 456
   * ```
   *
   * @param {Object} obj1 Object to merge
   *
   * @returns {Object} Result of all merge properties
   */
  function merge(/* obj1, obj2, obj3, ... */) {
    const {caseless} = isContextDefined(this) && this || {};
    const result = {};
    const assignValue = (val, key) => {
      const targetKey = caseless && findKey(result, key) || key;
      if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
        result[targetKey] = merge(result[targetKey], val);
      } else if (isPlainObject(val)) {
        result[targetKey] = merge({}, val);
      } else if (isArray(val)) {
        result[targetKey] = val.slice();
      } else {
        result[targetKey] = val;
      }
    };

    for (let i = 0, l = arguments.length; i < l; i++) {
      arguments[i] && forEach(arguments[i], assignValue);
    }
    return result;
  }

  /**
   * Extends object a by mutably adding to it the properties of object b.
   *
   * @param {Object} a The object to be extended
   * @param {Object} b The object to copy properties from
   * @param {Object} thisArg The object to bind function to
   *
   * @param {Boolean} [allOwnKeys]
   * @returns {Object} The resulting value of object a
   */
  const extend = (a, b, thisArg, {allOwnKeys}= {}) => {
    forEach(b, (val, key) => {
      if (thisArg && isFunction(val)) {
        a[key] = bind(val, thisArg);
      } else {
        a[key] = val;
      }
    }, {allOwnKeys});
    return a;
  };

  /**
   * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
   *
   * @param {string} content with BOM
   *
   * @returns {string} content value without BOM
   */
  const stripBOM = (content) => {
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    return content;
  };

  /**
   * Inherit the prototype methods from one constructor into another
   * @param {function} constructor
   * @param {function} superConstructor
   * @param {object} [props]
   * @param {object} [descriptors]
   *
   * @returns {void}
   */
  const inherits = (constructor, superConstructor, props, descriptors) => {
    constructor.prototype = Object.create(superConstructor.prototype, descriptors);
    constructor.prototype.constructor = constructor;
    Object.defineProperty(constructor, 'super', {
      value: superConstructor.prototype
    });
    props && Object.assign(constructor.prototype, props);
  };

  /**
   * Resolve object with deep prototype chain to a flat object
   * @param {Object} sourceObj source object
   * @param {Object} [destObj]
   * @param {Function|Boolean} [filter]
   * @param {Function} [propFilter]
   *
   * @returns {Object}
   */
  const toFlatObject = (sourceObj, destObj, filter, propFilter) => {
    let props;
    let i;
    let prop;
    const merged = {};

    destObj = destObj || {};
    // eslint-disable-next-line no-eq-null,eqeqeq
    if (sourceObj == null) return destObj;

    do {
      props = Object.getOwnPropertyNames(sourceObj);
      i = props.length;
      while (i-- > 0) {
        prop = props[i];
        if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
          destObj[prop] = sourceObj[prop];
          merged[prop] = true;
        }
      }
      sourceObj = filter !== false && getPrototypeOf(sourceObj);
    } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);

    return destObj;
  };

  /**
   * Determines whether a string ends with the characters of a specified string
   *
   * @param {String} str
   * @param {String} searchString
   * @param {Number} [position= 0]
   *
   * @returns {boolean}
   */
  const endsWith = (str, searchString, position) => {
    str = String(str);
    if (position === undefined || position > str.length) {
      position = str.length;
    }
    position -= searchString.length;
    const lastIndex = str.indexOf(searchString, position);
    return lastIndex !== -1 && lastIndex === position;
  };


  /**
   * Returns new array from array like object or null if failed
   *
   * @param {*} [thing]
   *
   * @returns {?Array}
   */
  const toArray = (thing) => {
    if (!thing) return null;
    if (isArray(thing)) return thing;
    let i = thing.length;
    if (!isNumber(i)) return null;
    const arr = new Array(i);
    while (i-- > 0) {
      arr[i] = thing[i];
    }
    return arr;
  };

  /**
   * Checking if the Uint8Array exists and if it does, it returns a function that checks if the
   * thing passed in is an instance of Uint8Array
   *
   * @param {TypedArray}
   *
   * @returns {Array}
   */
  // eslint-disable-next-line func-names
  const isTypedArray = (TypedArray => {
    // eslint-disable-next-line func-names
    return thing => {
      return TypedArray && thing instanceof TypedArray;
    };
  })(typeof Uint8Array !== 'undefined' && getPrototypeOf(Uint8Array));

  /**
   * For each entry in the object, call the function with the key and value.
   *
   * @param {Object<any, any>} obj - The object to iterate over.
   * @param {Function} fn - The function to call for each entry.
   *
   * @returns {void}
   */
  const forEachEntry = (obj, fn) => {
    const generator = obj && obj[Symbol.iterator];

    const iterator = generator.call(obj);

    let result;

    while ((result = iterator.next()) && !result.done) {
      const pair = result.value;
      fn.call(obj, pair[0], pair[1]);
    }
  };

  /**
   * It takes a regular expression and a string, and returns an array of all the matches
   *
   * @param {string} regExp - The regular expression to match against.
   * @param {string} str - The string to search.
   *
   * @returns {Array<boolean>}
   */
  const matchAll = (regExp, str) => {
    let matches;
    const arr = [];

    while ((matches = regExp.exec(str)) !== null) {
      arr.push(matches);
    }

    return arr;
  };

  /* Checking if the kindOfTest function returns true when passed an HTMLFormElement. */
  const isHTMLForm = kindOfTest('HTMLFormElement');

  const toCamelCase = str => {
    return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g,
      function replacer(m, p1, p2) {
        return p1.toUpperCase() + p2;
      }
    );
  };

  /* Creating a function that will check if an object has a property. */
  const hasOwnProperty = (({hasOwnProperty}) => (obj, prop) => hasOwnProperty.call(obj, prop))(Object.prototype);

  /**
   * Determine if a value is a RegExp object
   *
   * @param {*} val The value to test
   *
   * @returns {boolean} True if value is a RegExp object, otherwise false
   */
  const isRegExp = kindOfTest('RegExp');

  const reduceDescriptors = (obj, reducer) => {
    const descriptors = Object.getOwnPropertyDescriptors(obj);
    const reducedDescriptors = {};

    forEach(descriptors, (descriptor, name) => {
      if (reducer(descriptor, name, obj) !== false) {
        reducedDescriptors[name] = descriptor;
      }
    });

    Object.defineProperties(obj, reducedDescriptors);
  };

  /**
   * Makes all methods read-only
   * @param {Object} obj
   */

  const freezeMethods = (obj) => {
    reduceDescriptors(obj, (descriptor, name) => {
      // skip restricted props in strict mode
      if (isFunction(obj) && ['arguments', 'caller', 'callee'].indexOf(name) !== -1) {
        return false;
      }

      const value = obj[name];

      if (!isFunction(value)) return;

      descriptor.enumerable = false;

      if ('writable' in descriptor) {
        descriptor.writable = false;
        return;
      }

      if (!descriptor.set) {
        descriptor.set = () => {
          throw Error('Can not rewrite read-only method \'' + name + '\'');
        };
      }
    });
  };

  const toObjectSet = (arrayOrString, delimiter) => {
    const obj = {};

    const define = (arr) => {
      arr.forEach(value => {
        obj[value] = true;
      });
    };

    isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));

    return obj;
  };

  const noop = () => {};

  const toFiniteNumber = (value, defaultValue) => {
    value = +value;
    return Number.isFinite(value) ? value : defaultValue;
  };

  const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

  const DIGIT = '0123456789';

  const ALPHABET = {
    DIGIT,
    ALPHA,
    ALPHA_DIGIT: ALPHA + ALPHA.toUpperCase() + DIGIT
  };

  const generateString = (size = 16, alphabet = ALPHABET.ALPHA_DIGIT) => {
    let str = '';
    const {length} = alphabet;
    while (size--) {
      str += alphabet[Math.random() * length|0];
    }

    return str;
  };

  /**
   * If the thing is a FormData object, return true, otherwise return false.
   *
   * @param {unknown} thing - The thing to check.
   *
   * @returns {boolean}
   */
  function isSpecCompliantForm(thing) {
    return !!(thing && isFunction(thing.append) && thing[Symbol.toStringTag] === 'FormData' && thing[Symbol.iterator]);
  }

  const toJSONObject = (obj) => {
    const stack = new Array(10);

    const visit = (source, i) => {

      if (isObject(source)) {
        if (stack.indexOf(source) >= 0) {
          return;
        }

        if(!('toJSON' in source)) {
          stack[i] = source;
          const target = isArray(source) ? [] : {};

          forEach(source, (value, key) => {
            const reducedValue = visit(value, i + 1);
            !isUndefined(reducedValue) && (target[key] = reducedValue);
          });

          stack[i] = undefined;

          return target;
        }
      }

      return source;
    };

    return visit(obj, 0);
  };

  const isAsyncFn = kindOfTest('AsyncFunction');

  const isThenable = (thing) =>
    thing && (isObject(thing) || isFunction(thing)) && isFunction(thing.then) && isFunction(thing.catch);

  var utils = {
    isArray,
    isArrayBuffer,
    isBuffer,
    isFormData,
    isArrayBufferView,
    isString,
    isNumber,
    isBoolean,
    isObject,
    isPlainObject,
    isUndefined,
    isDate,
    isFile,
    isBlob,
    isRegExp,
    isFunction,
    isStream,
    isURLSearchParams,
    isTypedArray,
    isFileList,
    forEach,
    merge,
    extend,
    trim,
    stripBOM,
    inherits,
    toFlatObject,
    kindOf,
    kindOfTest,
    endsWith,
    toArray,
    forEachEntry,
    matchAll,
    isHTMLForm,
    hasOwnProperty,
    hasOwnProp: hasOwnProperty, // an alias to avoid ESLint no-prototype-builtins detection
    reduceDescriptors,
    freezeMethods,
    toObjectSet,
    toCamelCase,
    noop,
    toFiniteNumber,
    findKey,
    global: _global,
    isContextDefined,
    ALPHABET,
    generateString,
    isSpecCompliantForm,
    toJSONObject,
    isAsyncFn,
    isThenable
  };

  /**
   * Create an Error with the specified message, config, error code, request and response.
   *
   * @param {string} message The error message.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [config] The config.
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   *
   * @returns {Error} The created error.
   */
  function AxiosError(message, code, config, request, response) {
    Error.call(this);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error()).stack;
    }

    this.message = message;
    this.name = 'AxiosError';
    code && (this.code = code);
    config && (this.config = config);
    request && (this.request = request);
    response && (this.response = response);
  }

  utils.inherits(AxiosError, Error, {
    toJSON: function toJSON() {
      return {
        // Standard
        message: this.message,
        name: this.name,
        // Microsoft
        description: this.description,
        number: this.number,
        // Mozilla
        fileName: this.fileName,
        lineNumber: this.lineNumber,
        columnNumber: this.columnNumber,
        stack: this.stack,
        // Axios
        config: utils.toJSONObject(this.config),
        code: this.code,
        status: this.response && this.response.status ? this.response.status : null
      };
    }
  });

  const prototype$1 = AxiosError.prototype;
  const descriptors = {};

  [
    'ERR_BAD_OPTION_VALUE',
    'ERR_BAD_OPTION',
    'ECONNABORTED',
    'ETIMEDOUT',
    'ERR_NETWORK',
    'ERR_FR_TOO_MANY_REDIRECTS',
    'ERR_DEPRECATED',
    'ERR_BAD_RESPONSE',
    'ERR_BAD_REQUEST',
    'ERR_CANCELED',
    'ERR_NOT_SUPPORT',
    'ERR_INVALID_URL'
  // eslint-disable-next-line func-names
  ].forEach(code => {
    descriptors[code] = {value: code};
  });

  Object.defineProperties(AxiosError, descriptors);
  Object.defineProperty(prototype$1, 'isAxiosError', {value: true});

  // eslint-disable-next-line func-names
  AxiosError.from = (error, code, config, request, response, customProps) => {
    const axiosError = Object.create(prototype$1);

    utils.toFlatObject(error, axiosError, function filter(obj) {
      return obj !== Error.prototype;
    }, prop => {
      return prop !== 'isAxiosError';
    });

    AxiosError.call(axiosError, error.message, code, config, request, response);

    axiosError.cause = error;

    axiosError.name = error.name;

    customProps && Object.assign(axiosError, customProps);

    return axiosError;
  };

  // eslint-disable-next-line strict
  var httpAdapter = null;

  /**
   * Determines if the given thing is a array or js object.
   *
   * @param {string} thing - The object or array to be visited.
   *
   * @returns {boolean}
   */
  function isVisitable(thing) {
    return utils.isPlainObject(thing) || utils.isArray(thing);
  }

  /**
   * It removes the brackets from the end of a string
   *
   * @param {string} key - The key of the parameter.
   *
   * @returns {string} the key without the brackets.
   */
  function removeBrackets(key) {
    return utils.endsWith(key, '[]') ? key.slice(0, -2) : key;
  }

  /**
   * It takes a path, a key, and a boolean, and returns a string
   *
   * @param {string} path - The path to the current key.
   * @param {string} key - The key of the current object being iterated over.
   * @param {string} dots - If true, the key will be rendered with dots instead of brackets.
   *
   * @returns {string} The path to the current key.
   */
  function renderKey(path, key, dots) {
    if (!path) return key;
    return path.concat(key).map(function each(token, i) {
      // eslint-disable-next-line no-param-reassign
      token = removeBrackets(token);
      return !dots && i ? '[' + token + ']' : token;
    }).join(dots ? '.' : '');
  }

  /**
   * If the array is an array and none of its elements are visitable, then it's a flat array.
   *
   * @param {Array<any>} arr - The array to check
   *
   * @returns {boolean}
   */
  function isFlatArray(arr) {
    return utils.isArray(arr) && !arr.some(isVisitable);
  }

  const predicates = utils.toFlatObject(utils, {}, null, function filter(prop) {
    return /^is[A-Z]/.test(prop);
  });

  /**
   * Convert a data object to FormData
   *
   * @param {Object} obj
   * @param {?Object} [formData]
   * @param {?Object} [options]
   * @param {Function} [options.visitor]
   * @param {Boolean} [options.metaTokens = true]
   * @param {Boolean} [options.dots = false]
   * @param {?Boolean} [options.indexes = false]
   *
   * @returns {Object}
   **/

  /**
   * It converts an object into a FormData object
   *
   * @param {Object<any, any>} obj - The object to convert to form data.
   * @param {string} formData - The FormData object to append to.
   * @param {Object<string, any>} options
   *
   * @returns
   */
  function toFormData(obj, formData, options) {
    if (!utils.isObject(obj)) {
      throw new TypeError('target must be an object');
    }

    // eslint-disable-next-line no-param-reassign
    formData = formData || new (FormData)();

    // eslint-disable-next-line no-param-reassign
    options = utils.toFlatObject(options, {
      metaTokens: true,
      dots: false,
      indexes: false
    }, false, function defined(option, source) {
      // eslint-disable-next-line no-eq-null,eqeqeq
      return !utils.isUndefined(source[option]);
    });

    const metaTokens = options.metaTokens;
    // eslint-disable-next-line no-use-before-define
    const visitor = options.visitor || defaultVisitor;
    const dots = options.dots;
    const indexes = options.indexes;
    const _Blob = options.Blob || typeof Blob !== 'undefined' && Blob;
    const useBlob = _Blob && utils.isSpecCompliantForm(formData);

    if (!utils.isFunction(visitor)) {
      throw new TypeError('visitor must be a function');
    }

    function convertValue(value) {
      if (value === null) return '';

      if (utils.isDate(value)) {
        return value.toISOString();
      }

      if (!useBlob && utils.isBlob(value)) {
        throw new AxiosError('Blob is not supported. Use a Buffer instead.');
      }

      if (utils.isArrayBuffer(value) || utils.isTypedArray(value)) {
        return useBlob && typeof Blob === 'function' ? new Blob([value]) : Buffer.from(value);
      }

      return value;
    }

    /**
     * Default visitor.
     *
     * @param {*} value
     * @param {String|Number} key
     * @param {Array<String|Number>} path
     * @this {FormData}
     *
     * @returns {boolean} return true to visit the each prop of the value recursively
     */
    function defaultVisitor(value, key, path) {
      let arr = value;

      if (value && !path && typeof value === 'object') {
        if (utils.endsWith(key, '{}')) {
          // eslint-disable-next-line no-param-reassign
          key = metaTokens ? key : key.slice(0, -2);
          // eslint-disable-next-line no-param-reassign
          value = JSON.stringify(value);
        } else if (
          (utils.isArray(value) && isFlatArray(value)) ||
          ((utils.isFileList(value) || utils.endsWith(key, '[]')) && (arr = utils.toArray(value))
          )) {
          // eslint-disable-next-line no-param-reassign
          key = removeBrackets(key);

          arr.forEach(function each(el, index) {
            !(utils.isUndefined(el) || el === null) && formData.append(
              // eslint-disable-next-line no-nested-ternary
              indexes === true ? renderKey([key], index, dots) : (indexes === null ? key : key + '[]'),
              convertValue(el)
            );
          });
          return false;
        }
      }

      if (isVisitable(value)) {
        return true;
      }

      formData.append(renderKey(path, key, dots), convertValue(value));

      return false;
    }

    const stack = [];

    const exposedHelpers = Object.assign(predicates, {
      defaultVisitor,
      convertValue,
      isVisitable
    });

    function build(value, path) {
      if (utils.isUndefined(value)) return;

      if (stack.indexOf(value) !== -1) {
        throw Error('Circular reference detected in ' + path.join('.'));
      }

      stack.push(value);

      utils.forEach(value, function each(el, key) {
        const result = !(utils.isUndefined(el) || el === null) && visitor.call(
          formData, el, utils.isString(key) ? key.trim() : key, path, exposedHelpers
        );

        if (result === true) {
          build(el, path ? path.concat(key) : [key]);
        }
      });

      stack.pop();
    }

    if (!utils.isObject(obj)) {
      throw new TypeError('data must be an object');
    }

    build(obj);

    return formData;
  }

  /**
   * It encodes a string by replacing all characters that are not in the unreserved set with
   * their percent-encoded equivalents
   *
   * @param {string} str - The string to encode.
   *
   * @returns {string} The encoded string.
   */
  function encode$1(str) {
    const charMap = {
      '!': '%21',
      "'": '%27',
      '(': '%28',
      ')': '%29',
      '~': '%7E',
      '%20': '+',
      '%00': '\x00'
    };
    return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
      return charMap[match];
    });
  }

  /**
   * It takes a params object and converts it to a FormData object
   *
   * @param {Object<string, any>} params - The parameters to be converted to a FormData object.
   * @param {Object<string, any>} options - The options object passed to the Axios constructor.
   *
   * @returns {void}
   */
  function AxiosURLSearchParams(params, options) {
    this._pairs = [];

    params && toFormData(params, this, options);
  }

  const prototype = AxiosURLSearchParams.prototype;

  prototype.append = function append(name, value) {
    this._pairs.push([name, value]);
  };

  prototype.toString = function toString(encoder) {
    const _encode = encoder ? function(value) {
      return encoder.call(this, value, encode$1);
    } : encode$1;

    return this._pairs.map(function each(pair) {
      return _encode(pair[0]) + '=' + _encode(pair[1]);
    }, '').join('&');
  };

  /**
   * It replaces all instances of the characters `:`, `$`, `,`, `+`, `[`, and `]` with their
   * URI encoded counterparts
   *
   * @param {string} val The value to be encoded.
   *
   * @returns {string} The encoded value.
   */
  function encode(val) {
    return encodeURIComponent(val).
      replace(/%3A/gi, ':').
      replace(/%24/g, '$').
      replace(/%2C/gi, ',').
      replace(/%20/g, '+').
      replace(/%5B/gi, '[').
      replace(/%5D/gi, ']');
  }

  /**
   * Build a URL by appending params to the end
   *
   * @param {string} url The base of the url (e.g., http://www.google.com)
   * @param {object} [params] The params to be appended
   * @param {?object} options
   *
   * @returns {string} The formatted url
   */
  function buildURL(url, params, options) {
    /*eslint no-param-reassign:0*/
    if (!params) {
      return url;
    }
    
    const _encode = options && options.encode || encode;

    const serializeFn = options && options.serialize;

    let serializedParams;

    if (serializeFn) {
      serializedParams = serializeFn(params, options);
    } else {
      serializedParams = utils.isURLSearchParams(params) ?
        params.toString() :
        new AxiosURLSearchParams(params, options).toString(_encode);
    }

    if (serializedParams) {
      const hashmarkIndex = url.indexOf("#");

      if (hashmarkIndex !== -1) {
        url = url.slice(0, hashmarkIndex);
      }
      url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
    }

    return url;
  }

  class InterceptorManager {
    constructor() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    use(fulfilled, rejected, options) {
      this.handlers.push({
        fulfilled,
        rejected,
        synchronous: options ? options.synchronous : false,
        runWhen: options ? options.runWhen : null
      });
      return this.handlers.length - 1;
    }

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     *
     * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
     */
    eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    }

    /**
     * Clear all interceptors from the stack
     *
     * @returns {void}
     */
    clear() {
      if (this.handlers) {
        this.handlers = [];
      }
    }

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     *
     * @returns {void}
     */
    forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    }
  }

  var InterceptorManager$1 = InterceptorManager;

  var transitionalDefaults = {
    silentJSONParsing: true,
    forcedJSONParsing: true,
    clarifyTimeoutError: false
  };

  var URLSearchParams$1 = typeof URLSearchParams !== 'undefined' ? URLSearchParams : AxiosURLSearchParams;

  var FormData$1 = typeof FormData !== 'undefined' ? FormData : null;

  var Blob$1 = typeof Blob !== 'undefined' ? Blob : null;

  /**
   * Determine if we're running in a standard browser environment
   *
   * This allows axios to run in a web worker, and react-native.
   * Both environments support XMLHttpRequest, but not fully standard globals.
   *
   * web workers:
   *  typeof window -> undefined
   *  typeof document -> undefined
   *
   * react-native:
   *  navigator.product -> 'ReactNative'
   * nativescript
   *  navigator.product -> 'NativeScript' or 'NS'
   *
   * @returns {boolean}
   */
  const isStandardBrowserEnv = (() => {
    let product;
    if (typeof navigator !== 'undefined' && (
      (product = navigator.product) === 'ReactNative' ||
      product === 'NativeScript' ||
      product === 'NS')
    ) {
      return false;
    }

    return typeof window !== 'undefined' && typeof document !== 'undefined';
  })();

  /**
   * Determine if we're running in a standard browser webWorker environment
   *
   * Although the `isStandardBrowserEnv` method indicates that
   * `allows axios to run in a web worker`, the WebWorker will still be
   * filtered out due to its judgment standard
   * `typeof window !== 'undefined' && typeof document !== 'undefined'`.
   * This leads to a problem when axios post `FormData` in webWorker
   */
   const isStandardBrowserWebWorkerEnv = (() => {
    return (
      typeof WorkerGlobalScope !== 'undefined' &&
      // eslint-disable-next-line no-undef
      self instanceof WorkerGlobalScope &&
      typeof self.importScripts === 'function'
    );
  })();


  var platform = {
    isBrowser: true,
    classes: {
      URLSearchParams: URLSearchParams$1,
      FormData: FormData$1,
      Blob: Blob$1
    },
    isStandardBrowserEnv,
    isStandardBrowserWebWorkerEnv,
    protocols: ['http', 'https', 'file', 'blob', 'url', 'data']
  };

  function toURLEncodedForm(data, options) {
    return toFormData(data, new platform.classes.URLSearchParams(), Object.assign({
      visitor: function(value, key, path, helpers) {
        if (platform.isNode && utils.isBuffer(value)) {
          this.append(key, value.toString('base64'));
          return false;
        }

        return helpers.defaultVisitor.apply(this, arguments);
      }
    }, options));
  }

  /**
   * It takes a string like `foo[x][y][z]` and returns an array like `['foo', 'x', 'y', 'z']
   *
   * @param {string} name - The name of the property to get.
   *
   * @returns An array of strings.
   */
  function parsePropPath(name) {
    // foo[x][y][z]
    // foo.x.y.z
    // foo-x-y-z
    // foo x y z
    return utils.matchAll(/\w+|\[(\w*)]/g, name).map(match => {
      return match[0] === '[]' ? '' : match[1] || match[0];
    });
  }

  /**
   * Convert an array to an object.
   *
   * @param {Array<any>} arr - The array to convert to an object.
   *
   * @returns An object with the same keys and values as the array.
   */
  function arrayToObject(arr) {
    const obj = {};
    const keys = Object.keys(arr);
    let i;
    const len = keys.length;
    let key;
    for (i = 0; i < len; i++) {
      key = keys[i];
      obj[key] = arr[key];
    }
    return obj;
  }

  /**
   * It takes a FormData object and returns a JavaScript object
   *
   * @param {string} formData The FormData object to convert to JSON.
   *
   * @returns {Object<string, any> | null} The converted object.
   */
  function formDataToJSON(formData) {
    function buildPath(path, value, target, index) {
      let name = path[index++];
      const isNumericKey = Number.isFinite(+name);
      const isLast = index >= path.length;
      name = !name && utils.isArray(target) ? target.length : name;

      if (isLast) {
        if (utils.hasOwnProp(target, name)) {
          target[name] = [target[name], value];
        } else {
          target[name] = value;
        }

        return !isNumericKey;
      }

      if (!target[name] || !utils.isObject(target[name])) {
        target[name] = [];
      }

      const result = buildPath(path, value, target[name], index);

      if (result && utils.isArray(target[name])) {
        target[name] = arrayToObject(target[name]);
      }

      return !isNumericKey;
    }

    if (utils.isFormData(formData) && utils.isFunction(formData.entries)) {
      const obj = {};

      utils.forEachEntry(formData, (name, value) => {
        buildPath(parsePropPath(name), value, obj, 0);
      });

      return obj;
    }

    return null;
  }

  const DEFAULT_CONTENT_TYPE = {
    'Content-Type': undefined
  };

  /**
   * It takes a string, tries to parse it, and if it fails, it returns the stringified version
   * of the input
   *
   * @param {any} rawValue - The value to be stringified.
   * @param {Function} parser - A function that parses a string into a JavaScript object.
   * @param {Function} encoder - A function that takes a value and returns a string.
   *
   * @returns {string} A stringified version of the rawValue.
   */
  function stringifySafely(rawValue, parser, encoder) {
    if (utils.isString(rawValue)) {
      try {
        (parser || JSON.parse)(rawValue);
        return utils.trim(rawValue);
      } catch (e) {
        if (e.name !== 'SyntaxError') {
          throw e;
        }
      }
    }

    return (encoder || JSON.stringify)(rawValue);
  }

  const defaults = {

    transitional: transitionalDefaults,

    adapter: ['xhr', 'http'],

    transformRequest: [function transformRequest(data, headers) {
      const contentType = headers.getContentType() || '';
      const hasJSONContentType = contentType.indexOf('application/json') > -1;
      const isObjectPayload = utils.isObject(data);

      if (isObjectPayload && utils.isHTMLForm(data)) {
        data = new FormData(data);
      }

      const isFormData = utils.isFormData(data);

      if (isFormData) {
        if (!hasJSONContentType) {
          return data;
        }
        return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
      }

      if (utils.isArrayBuffer(data) ||
        utils.isBuffer(data) ||
        utils.isStream(data) ||
        utils.isFile(data) ||
        utils.isBlob(data)
      ) {
        return data;
      }
      if (utils.isArrayBufferView(data)) {
        return data.buffer;
      }
      if (utils.isURLSearchParams(data)) {
        headers.setContentType('application/x-www-form-urlencoded;charset=utf-8', false);
        return data.toString();
      }

      let isFileList;

      if (isObjectPayload) {
        if (contentType.indexOf('application/x-www-form-urlencoded') > -1) {
          return toURLEncodedForm(data, this.formSerializer).toString();
        }

        if ((isFileList = utils.isFileList(data)) || contentType.indexOf('multipart/form-data') > -1) {
          const _FormData = this.env && this.env.FormData;

          return toFormData(
            isFileList ? {'files[]': data} : data,
            _FormData && new _FormData(),
            this.formSerializer
          );
        }
      }

      if (isObjectPayload || hasJSONContentType ) {
        headers.setContentType('application/json', false);
        return stringifySafely(data);
      }

      return data;
    }],

    transformResponse: [function transformResponse(data) {
      const transitional = this.transitional || defaults.transitional;
      const forcedJSONParsing = transitional && transitional.forcedJSONParsing;
      const JSONRequested = this.responseType === 'json';

      if (data && utils.isString(data) && ((forcedJSONParsing && !this.responseType) || JSONRequested)) {
        const silentJSONParsing = transitional && transitional.silentJSONParsing;
        const strictJSONParsing = !silentJSONParsing && JSONRequested;

        try {
          return JSON.parse(data);
        } catch (e) {
          if (strictJSONParsing) {
            if (e.name === 'SyntaxError') {
              throw AxiosError.from(e, AxiosError.ERR_BAD_RESPONSE, this, null, this.response);
            }
            throw e;
          }
        }
      }

      return data;
    }],

    /**
     * A timeout in milliseconds to abort a request. If set to 0 (default) a
     * timeout is not created.
     */
    timeout: 0,

    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',

    maxContentLength: -1,
    maxBodyLength: -1,

    env: {
      FormData: platform.classes.FormData,
      Blob: platform.classes.Blob
    },

    validateStatus: function validateStatus(status) {
      return status >= 200 && status < 300;
    },

    headers: {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    }
  };

  utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
    defaults.headers[method] = {};
  });

  utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
    defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
  });

  var defaults$1 = defaults;

  // RawAxiosHeaders whose duplicates are ignored by node
  // c.f. https://nodejs.org/api/http.html#http_message_headers
  const ignoreDuplicateOf = utils.toObjectSet([
    'age', 'authorization', 'content-length', 'content-type', 'etag',
    'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
    'last-modified', 'location', 'max-forwards', 'proxy-authorization',
    'referer', 'retry-after', 'user-agent'
  ]);

  /**
   * Parse headers into an object
   *
   * ```
   * Date: Wed, 27 Aug 2014 08:58:49 GMT
   * Content-Type: application/json
   * Connection: keep-alive
   * Transfer-Encoding: chunked
   * ```
   *
   * @param {String} rawHeaders Headers needing to be parsed
   *
   * @returns {Object} Headers parsed into an object
   */
  var parseHeaders = rawHeaders => {
    const parsed = {};
    let key;
    let val;
    let i;

    rawHeaders && rawHeaders.split('\n').forEach(function parser(line) {
      i = line.indexOf(':');
      key = line.substring(0, i).trim().toLowerCase();
      val = line.substring(i + 1).trim();

      if (!key || (parsed[key] && ignoreDuplicateOf[key])) {
        return;
      }

      if (key === 'set-cookie') {
        if (parsed[key]) {
          parsed[key].push(val);
        } else {
          parsed[key] = [val];
        }
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    });

    return parsed;
  };

  const $internals = Symbol('internals');

  function normalizeHeader(header) {
    return header && String(header).trim().toLowerCase();
  }

  function normalizeValue(value) {
    if (value === false || value == null) {
      return value;
    }

    return utils.isArray(value) ? value.map(normalizeValue) : String(value);
  }

  function parseTokens(str) {
    const tokens = Object.create(null);
    const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
    let match;

    while ((match = tokensRE.exec(str))) {
      tokens[match[1]] = match[2];
    }

    return tokens;
  }

  const isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());

  function matchHeaderValue(context, value, header, filter, isHeaderNameFilter) {
    if (utils.isFunction(filter)) {
      return filter.call(this, value, header);
    }

    if (isHeaderNameFilter) {
      value = header;
    }

    if (!utils.isString(value)) return;

    if (utils.isString(filter)) {
      return value.indexOf(filter) !== -1;
    }

    if (utils.isRegExp(filter)) {
      return filter.test(value);
    }
  }

  function formatHeader(header) {
    return header.trim()
      .toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
        return char.toUpperCase() + str;
      });
  }

  function buildAccessors(obj, header) {
    const accessorName = utils.toCamelCase(' ' + header);

    ['get', 'set', 'has'].forEach(methodName => {
      Object.defineProperty(obj, methodName + accessorName, {
        value: function(arg1, arg2, arg3) {
          return this[methodName].call(this, header, arg1, arg2, arg3);
        },
        configurable: true
      });
    });
  }

  class AxiosHeaders {
    constructor(headers) {
      headers && this.set(headers);
    }

    set(header, valueOrRewrite, rewrite) {
      const self = this;

      function setHeader(_value, _header, _rewrite) {
        const lHeader = normalizeHeader(_header);

        if (!lHeader) {
          throw new Error('header name must be a non-empty string');
        }

        const key = utils.findKey(self, lHeader);

        if(!key || self[key] === undefined || _rewrite === true || (_rewrite === undefined && self[key] !== false)) {
          self[key || _header] = normalizeValue(_value);
        }
      }

      const setHeaders = (headers, _rewrite) =>
        utils.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));

      if (utils.isPlainObject(header) || header instanceof this.constructor) {
        setHeaders(header, valueOrRewrite);
      } else if(utils.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
        setHeaders(parseHeaders(header), valueOrRewrite);
      } else {
        header != null && setHeader(valueOrRewrite, header, rewrite);
      }

      return this;
    }

    get(header, parser) {
      header = normalizeHeader(header);

      if (header) {
        const key = utils.findKey(this, header);

        if (key) {
          const value = this[key];

          if (!parser) {
            return value;
          }

          if (parser === true) {
            return parseTokens(value);
          }

          if (utils.isFunction(parser)) {
            return parser.call(this, value, key);
          }

          if (utils.isRegExp(parser)) {
            return parser.exec(value);
          }

          throw new TypeError('parser must be boolean|regexp|function');
        }
      }
    }

    has(header, matcher) {
      header = normalizeHeader(header);

      if (header) {
        const key = utils.findKey(this, header);

        return !!(key && this[key] !== undefined && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
      }

      return false;
    }

    delete(header, matcher) {
      const self = this;
      let deleted = false;

      function deleteHeader(_header) {
        _header = normalizeHeader(_header);

        if (_header) {
          const key = utils.findKey(self, _header);

          if (key && (!matcher || matchHeaderValue(self, self[key], key, matcher))) {
            delete self[key];

            deleted = true;
          }
        }
      }

      if (utils.isArray(header)) {
        header.forEach(deleteHeader);
      } else {
        deleteHeader(header);
      }

      return deleted;
    }

    clear(matcher) {
      const keys = Object.keys(this);
      let i = keys.length;
      let deleted = false;

      while (i--) {
        const key = keys[i];
        if(!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
          delete this[key];
          deleted = true;
        }
      }

      return deleted;
    }

    normalize(format) {
      const self = this;
      const headers = {};

      utils.forEach(this, (value, header) => {
        const key = utils.findKey(headers, header);

        if (key) {
          self[key] = normalizeValue(value);
          delete self[header];
          return;
        }

        const normalized = format ? formatHeader(header) : String(header).trim();

        if (normalized !== header) {
          delete self[header];
        }

        self[normalized] = normalizeValue(value);

        headers[normalized] = true;
      });

      return this;
    }

    concat(...targets) {
      return this.constructor.concat(this, ...targets);
    }

    toJSON(asStrings) {
      const obj = Object.create(null);

      utils.forEach(this, (value, header) => {
        value != null && value !== false && (obj[header] = asStrings && utils.isArray(value) ? value.join(', ') : value);
      });

      return obj;
    }

    [Symbol.iterator]() {
      return Object.entries(this.toJSON())[Symbol.iterator]();
    }

    toString() {
      return Object.entries(this.toJSON()).map(([header, value]) => header + ': ' + value).join('\n');
    }

    get [Symbol.toStringTag]() {
      return 'AxiosHeaders';
    }

    static from(thing) {
      return thing instanceof this ? thing : new this(thing);
    }

    static concat(first, ...targets) {
      const computed = new this(first);

      targets.forEach((target) => computed.set(target));

      return computed;
    }

    static accessor(header) {
      const internals = this[$internals] = (this[$internals] = {
        accessors: {}
      });

      const accessors = internals.accessors;
      const prototype = this.prototype;

      function defineAccessor(_header) {
        const lHeader = normalizeHeader(_header);

        if (!accessors[lHeader]) {
          buildAccessors(prototype, _header);
          accessors[lHeader] = true;
        }
      }

      utils.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);

      return this;
    }
  }

  AxiosHeaders.accessor(['Content-Type', 'Content-Length', 'Accept', 'Accept-Encoding', 'User-Agent', 'Authorization']);

  utils.freezeMethods(AxiosHeaders.prototype);
  utils.freezeMethods(AxiosHeaders);

  var AxiosHeaders$1 = AxiosHeaders;

  /**
   * Transform the data for a request or a response
   *
   * @param {Array|Function} fns A single function or Array of functions
   * @param {?Object} response The response object
   *
   * @returns {*} The resulting transformed data
   */
  function transformData(fns, response) {
    const config = this || defaults$1;
    const context = response || config;
    const headers = AxiosHeaders$1.from(context.headers);
    let data = context.data;

    utils.forEach(fns, function transform(fn) {
      data = fn.call(config, data, headers.normalize(), response ? response.status : undefined);
    });

    headers.normalize();

    return data;
  }

  function isCancel(value) {
    return !!(value && value.__CANCEL__);
  }

  /**
   * A `CanceledError` is an object that is thrown when an operation is canceled.
   *
   * @param {string=} message The message.
   * @param {Object=} config The config.
   * @param {Object=} request The request.
   *
   * @returns {CanceledError} The created error.
   */
  function CanceledError(message, config, request) {
    // eslint-disable-next-line no-eq-null,eqeqeq
    AxiosError.call(this, message == null ? 'canceled' : message, AxiosError.ERR_CANCELED, config, request);
    this.name = 'CanceledError';
  }

  utils.inherits(CanceledError, AxiosError, {
    __CANCEL__: true
  });

  /**
   * Resolve or reject a Promise based on response status.
   *
   * @param {Function} resolve A function that resolves the promise.
   * @param {Function} reject A function that rejects the promise.
   * @param {object} response The response.
   *
   * @returns {object} The response.
   */
  function settle(resolve, reject, response) {
    const validateStatus = response.config.validateStatus;
    if (!response.status || !validateStatus || validateStatus(response.status)) {
      resolve(response);
    } else {
      reject(new AxiosError(
        'Request failed with status code ' + response.status,
        [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
        response.config,
        response.request,
        response
      ));
    }
  }

  var cookies = platform.isStandardBrowserEnv ?

  // Standard browser envs support document.cookie
    (function standardBrowserEnv() {
      return {
        write: function write(name, value, expires, path, domain, secure) {
          const cookie = [];
          cookie.push(name + '=' + encodeURIComponent(value));

          if (utils.isNumber(expires)) {
            cookie.push('expires=' + new Date(expires).toGMTString());
          }

          if (utils.isString(path)) {
            cookie.push('path=' + path);
          }

          if (utils.isString(domain)) {
            cookie.push('domain=' + domain);
          }

          if (secure === true) {
            cookie.push('secure');
          }

          document.cookie = cookie.join('; ');
        },

        read: function read(name) {
          const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        remove: function remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      };
    })() :

  // Non standard browser env (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return {
        write: function write() {},
        read: function read() { return null; },
        remove: function remove() {}
      };
    })();

  /**
   * Determines whether the specified URL is absolute
   *
   * @param {string} url The URL to test
   *
   * @returns {boolean} True if the specified URL is absolute, otherwise false
   */
  function isAbsoluteURL(url) {
    // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
    // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
    // by any combination of letters, digits, plus, period, or hyphen.
    return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
  }

  /**
   * Creates a new URL by combining the specified URLs
   *
   * @param {string} baseURL The base URL
   * @param {string} relativeURL The relative URL
   *
   * @returns {string} The combined URL
   */
  function combineURLs(baseURL, relativeURL) {
    return relativeURL
      ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
      : baseURL;
  }

  /**
   * Creates a new URL by combining the baseURL with the requestedURL,
   * only when the requestedURL is not already an absolute URL.
   * If the requestURL is absolute, this function returns the requestedURL untouched.
   *
   * @param {string} baseURL The base URL
   * @param {string} requestedURL Absolute or relative URL to combine
   *
   * @returns {string} The combined full path
   */
  function buildFullPath(baseURL, requestedURL) {
    if (baseURL && !isAbsoluteURL(requestedURL)) {
      return combineURLs(baseURL, requestedURL);
    }
    return requestedURL;
  }

  var isURLSameOrigin = platform.isStandardBrowserEnv ?

  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
    (function standardBrowserEnv() {
      const msie = /(msie|trident)/i.test(navigator.userAgent);
      const urlParsingNode = document.createElement('a');
      let originURL;

      /**
      * Parse a URL to discover it's components
      *
      * @param {String} url The URL to be parsed
      * @returns {Object}
      */
      function resolveURL(url) {
        let href = url;

        if (msie) {
          // IE needs attribute set twice to normalize properties
          urlParsingNode.setAttribute('href', href);
          href = urlParsingNode.href;
        }

        urlParsingNode.setAttribute('href', href);

        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
        return {
          href: urlParsingNode.href,
          protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
          host: urlParsingNode.host,
          search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
          hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
          hostname: urlParsingNode.hostname,
          port: urlParsingNode.port,
          pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
            urlParsingNode.pathname :
            '/' + urlParsingNode.pathname
        };
      }

      originURL = resolveURL(window.location.href);

      /**
      * Determine if a URL shares the same origin as the current location
      *
      * @param {String} requestURL The URL to test
      * @returns {boolean} True if URL shares the same origin, otherwise false
      */
      return function isURLSameOrigin(requestURL) {
        const parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
        return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
      };
    })() :

    // Non standard browser envs (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return function isURLSameOrigin() {
        return true;
      };
    })();

  function parseProtocol(url) {
    const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
    return match && match[1] || '';
  }

  /**
   * Calculate data maxRate
   * @param {Number} [samplesCount= 10]
   * @param {Number} [min= 1000]
   * @returns {Function}
   */
  function speedometer(samplesCount, min) {
    samplesCount = samplesCount || 10;
    const bytes = new Array(samplesCount);
    const timestamps = new Array(samplesCount);
    let head = 0;
    let tail = 0;
    let firstSampleTS;

    min = min !== undefined ? min : 1000;

    return function push(chunkLength) {
      const now = Date.now();

      const startedAt = timestamps[tail];

      if (!firstSampleTS) {
        firstSampleTS = now;
      }

      bytes[head] = chunkLength;
      timestamps[head] = now;

      let i = tail;
      let bytesCount = 0;

      while (i !== head) {
        bytesCount += bytes[i++];
        i = i % samplesCount;
      }

      head = (head + 1) % samplesCount;

      if (head === tail) {
        tail = (tail + 1) % samplesCount;
      }

      if (now - firstSampleTS < min) {
        return;
      }

      const passed = startedAt && now - startedAt;

      return passed ? Math.round(bytesCount * 1000 / passed) : undefined;
    };
  }

  function progressEventReducer(listener, isDownloadStream) {
    let bytesNotified = 0;
    const _speedometer = speedometer(50, 250);

    return e => {
      const loaded = e.loaded;
      const total = e.lengthComputable ? e.total : undefined;
      const progressBytes = loaded - bytesNotified;
      const rate = _speedometer(progressBytes);
      const inRange = loaded <= total;

      bytesNotified = loaded;

      const data = {
        loaded,
        total,
        progress: total ? (loaded / total) : undefined,
        bytes: progressBytes,
        rate: rate ? rate : undefined,
        estimated: rate && total && inRange ? (total - loaded) / rate : undefined,
        event: e
      };

      data[isDownloadStream ? 'download' : 'upload'] = true;

      listener(data);
    };
  }

  const isXHRAdapterSupported = typeof XMLHttpRequest !== 'undefined';

  var xhrAdapter = isXHRAdapterSupported && function (config) {
    return new Promise(function dispatchXhrRequest(resolve, reject) {
      let requestData = config.data;
      const requestHeaders = AxiosHeaders$1.from(config.headers).normalize();
      const responseType = config.responseType;
      let onCanceled;
      function done() {
        if (config.cancelToken) {
          config.cancelToken.unsubscribe(onCanceled);
        }

        if (config.signal) {
          config.signal.removeEventListener('abort', onCanceled);
        }
      }

      if (utils.isFormData(requestData)) {
        if (platform.isStandardBrowserEnv || platform.isStandardBrowserWebWorkerEnv) {
          requestHeaders.setContentType(false); // Let the browser set it
        } else {
          requestHeaders.setContentType('multipart/form-data;', false); // mobile/desktop app frameworks
        }
      }

      let request = new XMLHttpRequest();

      // HTTP basic authentication
      if (config.auth) {
        const username = config.auth.username || '';
        const password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
        requestHeaders.set('Authorization', 'Basic ' + btoa(username + ':' + password));
      }

      const fullPath = buildFullPath(config.baseURL, config.url);

      request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

      // Set the request timeout in MS
      request.timeout = config.timeout;

      function onloadend() {
        if (!request) {
          return;
        }
        // Prepare the response
        const responseHeaders = AxiosHeaders$1.from(
          'getAllResponseHeaders' in request && request.getAllResponseHeaders()
        );
        const responseData = !responseType || responseType === 'text' || responseType === 'json' ?
          request.responseText : request.response;
        const response = {
          data: responseData,
          status: request.status,
          statusText: request.statusText,
          headers: responseHeaders,
          config,
          request
        };

        settle(function _resolve(value) {
          resolve(value);
          done();
        }, function _reject(err) {
          reject(err);
          done();
        }, response);

        // Clean up request
        request = null;
      }

      if ('onloadend' in request) {
        // Use onloadend if available
        request.onloadend = onloadend;
      } else {
        // Listen for ready state to emulate onloadend
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }
          // readystate handler is calling before onerror or ontimeout handlers,
          // so we should call onloadend on the next 'tick'
          setTimeout(onloadend);
        };
      }

      // Handle browser request cancellation (as opposed to a manual cancellation)
      request.onabort = function handleAbort() {
        if (!request) {
          return;
        }

        reject(new AxiosError('Request aborted', AxiosError.ECONNABORTED, config, request));

        // Clean up request
        request = null;
      };

      // Handle low level network errors
      request.onerror = function handleError() {
        // Real errors are hidden from us by the browser
        // onerror should only fire if it's a network error
        reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request));

        // Clean up request
        request = null;
      };

      // Handle timeout
      request.ontimeout = function handleTimeout() {
        let timeoutErrorMessage = config.timeout ? 'timeout of ' + config.timeout + 'ms exceeded' : 'timeout exceeded';
        const transitional = config.transitional || transitionalDefaults;
        if (config.timeoutErrorMessage) {
          timeoutErrorMessage = config.timeoutErrorMessage;
        }
        reject(new AxiosError(
          timeoutErrorMessage,
          transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
          config,
          request));

        // Clean up request
        request = null;
      };

      // Add xsrf header
      // This is only done if running in a standard browser environment.
      // Specifically not if we're in a web worker, or react-native.
      if (platform.isStandardBrowserEnv) {
        // Add xsrf header
        const xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath))
          && config.xsrfCookieName && cookies.read(config.xsrfCookieName);

        if (xsrfValue) {
          requestHeaders.set(config.xsrfHeaderName, xsrfValue);
        }
      }

      // Remove Content-Type if data is undefined
      requestData === undefined && requestHeaders.setContentType(null);

      // Add headers to the request
      if ('setRequestHeader' in request) {
        utils.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
          request.setRequestHeader(key, val);
        });
      }

      // Add withCredentials to request if needed
      if (!utils.isUndefined(config.withCredentials)) {
        request.withCredentials = !!config.withCredentials;
      }

      // Add responseType to request if needed
      if (responseType && responseType !== 'json') {
        request.responseType = config.responseType;
      }

      // Handle progress if needed
      if (typeof config.onDownloadProgress === 'function') {
        request.addEventListener('progress', progressEventReducer(config.onDownloadProgress, true));
      }

      // Not all browsers support upload events
      if (typeof config.onUploadProgress === 'function' && request.upload) {
        request.upload.addEventListener('progress', progressEventReducer(config.onUploadProgress));
      }

      if (config.cancelToken || config.signal) {
        // Handle cancellation
        // eslint-disable-next-line func-names
        onCanceled = cancel => {
          if (!request) {
            return;
          }
          reject(!cancel || cancel.type ? new CanceledError(null, config, request) : cancel);
          request.abort();
          request = null;
        };

        config.cancelToken && config.cancelToken.subscribe(onCanceled);
        if (config.signal) {
          config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
        }
      }

      const protocol = parseProtocol(fullPath);

      if (protocol && platform.protocols.indexOf(protocol) === -1) {
        reject(new AxiosError('Unsupported protocol ' + protocol + ':', AxiosError.ERR_BAD_REQUEST, config));
        return;
      }


      // Send the request
      request.send(requestData || null);
    });
  };

  const knownAdapters = {
    http: httpAdapter,
    xhr: xhrAdapter
  };

  utils.forEach(knownAdapters, (fn, value) => {
    if(fn) {
      try {
        Object.defineProperty(fn, 'name', {value});
      } catch (e) {
        // eslint-disable-next-line no-empty
      }
      Object.defineProperty(fn, 'adapterName', {value});
    }
  });

  var adapters = {
    getAdapter: (adapters) => {
      adapters = utils.isArray(adapters) ? adapters : [adapters];

      const {length} = adapters;
      let nameOrAdapter;
      let adapter;

      for (let i = 0; i < length; i++) {
        nameOrAdapter = adapters[i];
        if((adapter = utils.isString(nameOrAdapter) ? knownAdapters[nameOrAdapter.toLowerCase()] : nameOrAdapter)) {
          break;
        }
      }

      if (!adapter) {
        if (adapter === false) {
          throw new AxiosError(
            `Adapter ${nameOrAdapter} is not supported by the environment`,
            'ERR_NOT_SUPPORT'
          );
        }

        throw new Error(
          utils.hasOwnProp(knownAdapters, nameOrAdapter) ?
            `Adapter '${nameOrAdapter}' is not available in the build` :
            `Unknown adapter '${nameOrAdapter}'`
        );
      }

      if (!utils.isFunction(adapter)) {
        throw new TypeError('adapter is not a function');
      }

      return adapter;
    },
    adapters: knownAdapters
  };

  /**
   * Throws a `CanceledError` if cancellation has been requested.
   *
   * @param {Object} config The config that is to be used for the request
   *
   * @returns {void}
   */
  function throwIfCancellationRequested(config) {
    if (config.cancelToken) {
      config.cancelToken.throwIfRequested();
    }

    if (config.signal && config.signal.aborted) {
      throw new CanceledError(null, config);
    }
  }

  /**
   * Dispatch a request to the server using the configured adapter.
   *
   * @param {object} config The config that is to be used for the request
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  function dispatchRequest(config) {
    throwIfCancellationRequested(config);

    config.headers = AxiosHeaders$1.from(config.headers);

    // Transform request data
    config.data = transformData.call(
      config,
      config.transformRequest
    );

    if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
      config.headers.setContentType('application/x-www-form-urlencoded', false);
    }

    const adapter = adapters.getAdapter(config.adapter || defaults$1.adapter);

    return adapter(config).then(function onAdapterResolution(response) {
      throwIfCancellationRequested(config);

      // Transform response data
      response.data = transformData.call(
        config,
        config.transformResponse,
        response
      );

      response.headers = AxiosHeaders$1.from(response.headers);

      return response;
    }, function onAdapterRejection(reason) {
      if (!isCancel(reason)) {
        throwIfCancellationRequested(config);

        // Transform response data
        if (reason && reason.response) {
          reason.response.data = transformData.call(
            config,
            config.transformResponse,
            reason.response
          );
          reason.response.headers = AxiosHeaders$1.from(reason.response.headers);
        }
      }

      return Promise.reject(reason);
    });
  }

  const headersToObject = (thing) => thing instanceof AxiosHeaders$1 ? thing.toJSON() : thing;

  /**
   * Config-specific merge-function which creates a new config-object
   * by merging two configuration objects together.
   *
   * @param {Object} config1
   * @param {Object} config2
   *
   * @returns {Object} New object resulting from merging config2 to config1
   */
  function mergeConfig(config1, config2) {
    // eslint-disable-next-line no-param-reassign
    config2 = config2 || {};
    const config = {};

    function getMergedValue(target, source, caseless) {
      if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
        return utils.merge.call({caseless}, target, source);
      } else if (utils.isPlainObject(source)) {
        return utils.merge({}, source);
      } else if (utils.isArray(source)) {
        return source.slice();
      }
      return source;
    }

    // eslint-disable-next-line consistent-return
    function mergeDeepProperties(a, b, caseless) {
      if (!utils.isUndefined(b)) {
        return getMergedValue(a, b, caseless);
      } else if (!utils.isUndefined(a)) {
        return getMergedValue(undefined, a, caseless);
      }
    }

    // eslint-disable-next-line consistent-return
    function valueFromConfig2(a, b) {
      if (!utils.isUndefined(b)) {
        return getMergedValue(undefined, b);
      }
    }

    // eslint-disable-next-line consistent-return
    function defaultToConfig2(a, b) {
      if (!utils.isUndefined(b)) {
        return getMergedValue(undefined, b);
      } else if (!utils.isUndefined(a)) {
        return getMergedValue(undefined, a);
      }
    }

    // eslint-disable-next-line consistent-return
    function mergeDirectKeys(a, b, prop) {
      if (prop in config2) {
        return getMergedValue(a, b);
      } else if (prop in config1) {
        return getMergedValue(undefined, a);
      }
    }

    const mergeMap = {
      url: valueFromConfig2,
      method: valueFromConfig2,
      data: valueFromConfig2,
      baseURL: defaultToConfig2,
      transformRequest: defaultToConfig2,
      transformResponse: defaultToConfig2,
      paramsSerializer: defaultToConfig2,
      timeout: defaultToConfig2,
      timeoutMessage: defaultToConfig2,
      withCredentials: defaultToConfig2,
      adapter: defaultToConfig2,
      responseType: defaultToConfig2,
      xsrfCookieName: defaultToConfig2,
      xsrfHeaderName: defaultToConfig2,
      onUploadProgress: defaultToConfig2,
      onDownloadProgress: defaultToConfig2,
      decompress: defaultToConfig2,
      maxContentLength: defaultToConfig2,
      maxBodyLength: defaultToConfig2,
      beforeRedirect: defaultToConfig2,
      transport: defaultToConfig2,
      httpAgent: defaultToConfig2,
      httpsAgent: defaultToConfig2,
      cancelToken: defaultToConfig2,
      socketPath: defaultToConfig2,
      responseEncoding: defaultToConfig2,
      validateStatus: mergeDirectKeys,
      headers: (a, b) => mergeDeepProperties(headersToObject(a), headersToObject(b), true)
    };

    utils.forEach(Object.keys(Object.assign({}, config1, config2)), function computeConfigValue(prop) {
      const merge = mergeMap[prop] || mergeDeepProperties;
      const configValue = merge(config1[prop], config2[prop], prop);
      (utils.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
    });

    return config;
  }

  const VERSION = "1.4.0";

  const validators$1 = {};

  // eslint-disable-next-line func-names
  ['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach((type, i) => {
    validators$1[type] = function validator(thing) {
      return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
    };
  });

  const deprecatedWarnings = {};

  /**
   * Transitional option validator
   *
   * @param {function|boolean?} validator - set to false if the transitional option has been removed
   * @param {string?} version - deprecated version / removed since version
   * @param {string?} message - some message with additional info
   *
   * @returns {function}
   */
  validators$1.transitional = function transitional(validator, version, message) {
    function formatMessage(opt, desc) {
      return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
    }

    // eslint-disable-next-line func-names
    return (value, opt, opts) => {
      if (validator === false) {
        throw new AxiosError(
          formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')),
          AxiosError.ERR_DEPRECATED
        );
      }

      if (version && !deprecatedWarnings[opt]) {
        deprecatedWarnings[opt] = true;
        // eslint-disable-next-line no-console
        console.warn(
          formatMessage(
            opt,
            ' has been deprecated since v' + version + ' and will be removed in the near future'
          )
        );
      }

      return validator ? validator(value, opt, opts) : true;
    };
  };

  /**
   * Assert object's properties type
   *
   * @param {object} options
   * @param {object} schema
   * @param {boolean?} allowUnknown
   *
   * @returns {object}
   */

  function assertOptions(options, schema, allowUnknown) {
    if (typeof options !== 'object') {
      throw new AxiosError('options must be an object', AxiosError.ERR_BAD_OPTION_VALUE);
    }
    const keys = Object.keys(options);
    let i = keys.length;
    while (i-- > 0) {
      const opt = keys[i];
      const validator = schema[opt];
      if (validator) {
        const value = options[opt];
        const result = value === undefined || validator(value, opt, options);
        if (result !== true) {
          throw new AxiosError('option ' + opt + ' must be ' + result, AxiosError.ERR_BAD_OPTION_VALUE);
        }
        continue;
      }
      if (allowUnknown !== true) {
        throw new AxiosError('Unknown option ' + opt, AxiosError.ERR_BAD_OPTION);
      }
    }
  }

  var validator = {
    assertOptions,
    validators: validators$1
  };

  const validators = validator.validators;

  /**
   * Create a new instance of Axios
   *
   * @param {Object} instanceConfig The default config for the instance
   *
   * @return {Axios} A new instance of Axios
   */
  class Axios {
    constructor(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager$1(),
        response: new InterceptorManager$1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
     * @param {?Object} config
     *
     * @returns {Promise} The Promise to be fulfilled
     */
    request(configOrUrl, config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof configOrUrl === 'string') {
        config = config || {};
        config.url = configOrUrl;
      } else {
        config = configOrUrl || {};
      }

      config = mergeConfig(this.defaults, config);

      const {transitional, paramsSerializer, headers} = config;

      if (transitional !== undefined) {
        validator.assertOptions(transitional, {
          silentJSONParsing: validators.transitional(validators.boolean),
          forcedJSONParsing: validators.transitional(validators.boolean),
          clarifyTimeoutError: validators.transitional(validators.boolean)
        }, false);
      }

      if (paramsSerializer != null) {
        if (utils.isFunction(paramsSerializer)) {
          config.paramsSerializer = {
            serialize: paramsSerializer
          };
        } else {
          validator.assertOptions(paramsSerializer, {
            encode: validators.function,
            serialize: validators.function
          }, true);
        }
      }

      // Set config.method
      config.method = (config.method || this.defaults.method || 'get').toLowerCase();

      let contextHeaders;

      // Flatten headers
      contextHeaders = headers && utils.merge(
        headers.common,
        headers[config.method]
      );

      contextHeaders && utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        (method) => {
          delete headers[method];
        }
      );

      config.headers = AxiosHeaders$1.concat(contextHeaders, headers);

      // filter out skipped interceptors
      const requestInterceptorChain = [];
      let synchronousRequestInterceptors = true;
      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
          return;
        }

        synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      const responseInterceptorChain = [];
      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
      });

      let promise;
      let i = 0;
      let len;

      if (!synchronousRequestInterceptors) {
        const chain = [dispatchRequest.bind(this), undefined];
        chain.unshift.apply(chain, requestInterceptorChain);
        chain.push.apply(chain, responseInterceptorChain);
        len = chain.length;

        promise = Promise.resolve(config);

        while (i < len) {
          promise = promise.then(chain[i++], chain[i++]);
        }

        return promise;
      }

      len = requestInterceptorChain.length;

      let newConfig = config;

      i = 0;

      while (i < len) {
        const onFulfilled = requestInterceptorChain[i++];
        const onRejected = requestInterceptorChain[i++];
        try {
          newConfig = onFulfilled(newConfig);
        } catch (error) {
          onRejected.call(this, error);
          break;
        }
      }

      try {
        promise = dispatchRequest.call(this, newConfig);
      } catch (error) {
        return Promise.reject(error);
      }

      i = 0;
      len = responseInterceptorChain.length;

      while (i < len) {
        promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
      }

      return promise;
    }

    getUri(config) {
      config = mergeConfig(this.defaults, config);
      const fullPath = buildFullPath(config.baseURL, config.url);
      return buildURL(fullPath, config.params, config.paramsSerializer);
    }
  }

  // Provide aliases for supported request methods
  utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
    /*eslint func-names:0*/
    Axios.prototype[method] = function(url, config) {
      return this.request(mergeConfig(config || {}, {
        method,
        url,
        data: (config || {}).data
      }));
    };
  });

  utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
    /*eslint func-names:0*/

    function generateHTTPMethod(isForm) {
      return function httpMethod(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method,
          headers: isForm ? {
            'Content-Type': 'multipart/form-data'
          } : {},
          url,
          data
        }));
      };
    }

    Axios.prototype[method] = generateHTTPMethod();

    Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
  });

  var Axios$1 = Axios;

  /**
   * A `CancelToken` is an object that can be used to request cancellation of an operation.
   *
   * @param {Function} executor The executor function.
   *
   * @returns {CancelToken}
   */
  class CancelToken {
    constructor(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      let resolvePromise;

      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      const token = this;

      // eslint-disable-next-line func-names
      this.promise.then(cancel => {
        if (!token._listeners) return;

        let i = token._listeners.length;

        while (i-- > 0) {
          token._listeners[i](cancel);
        }
        token._listeners = null;
      });

      // eslint-disable-next-line func-names
      this.promise.then = onfulfilled => {
        let _resolve;
        // eslint-disable-next-line func-names
        const promise = new Promise(resolve => {
          token.subscribe(resolve);
          _resolve = resolve;
        }).then(onfulfilled);

        promise.cancel = function reject() {
          token.unsubscribe(_resolve);
        };

        return promise;
      };

      executor(function cancel(message, config, request) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new CanceledError(message, config, request);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `CanceledError` if cancellation has been requested.
     */
    throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    }

    /**
     * Subscribe to the cancel signal
     */

    subscribe(listener) {
      if (this.reason) {
        listener(this.reason);
        return;
      }

      if (this._listeners) {
        this._listeners.push(listener);
      } else {
        this._listeners = [listener];
      }
    }

    /**
     * Unsubscribe from the cancel signal
     */

    unsubscribe(listener) {
      if (!this._listeners) {
        return;
      }
      const index = this._listeners.indexOf(listener);
      if (index !== -1) {
        this._listeners.splice(index, 1);
      }
    }

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    static source() {
      let cancel;
      const token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token,
        cancel
      };
    }
  }

  var CancelToken$1 = CancelToken;

  /**
   * Syntactic sugar for invoking a function and expanding an array for arguments.
   *
   * Common use case would be to use `Function.prototype.apply`.
   *
   *  ```js
   *  function f(x, y, z) {}
   *  var args = [1, 2, 3];
   *  f.apply(null, args);
   *  ```
   *
   * With `spread` this example can be re-written.
   *
   *  ```js
   *  spread(function(x, y, z) {})([1, 2, 3]);
   *  ```
   *
   * @param {Function} callback
   *
   * @returns {Function}
   */
  function spread(callback) {
    return function wrap(arr) {
      return callback.apply(null, arr);
    };
  }

  /**
   * Determines whether the payload is an error thrown by Axios
   *
   * @param {*} payload The value to test
   *
   * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
   */
  function isAxiosError(payload) {
    return utils.isObject(payload) && (payload.isAxiosError === true);
  }

  const HttpStatusCode = {
    Continue: 100,
    SwitchingProtocols: 101,
    Processing: 102,
    EarlyHints: 103,
    Ok: 200,
    Created: 201,
    Accepted: 202,
    NonAuthoritativeInformation: 203,
    NoContent: 204,
    ResetContent: 205,
    PartialContent: 206,
    MultiStatus: 207,
    AlreadyReported: 208,
    ImUsed: 226,
    MultipleChoices: 300,
    MovedPermanently: 301,
    Found: 302,
    SeeOther: 303,
    NotModified: 304,
    UseProxy: 305,
    Unused: 306,
    TemporaryRedirect: 307,
    PermanentRedirect: 308,
    BadRequest: 400,
    Unauthorized: 401,
    PaymentRequired: 402,
    Forbidden: 403,
    NotFound: 404,
    MethodNotAllowed: 405,
    NotAcceptable: 406,
    ProxyAuthenticationRequired: 407,
    RequestTimeout: 408,
    Conflict: 409,
    Gone: 410,
    LengthRequired: 411,
    PreconditionFailed: 412,
    PayloadTooLarge: 413,
    UriTooLong: 414,
    UnsupportedMediaType: 415,
    RangeNotSatisfiable: 416,
    ExpectationFailed: 417,
    ImATeapot: 418,
    MisdirectedRequest: 421,
    UnprocessableEntity: 422,
    Locked: 423,
    FailedDependency: 424,
    TooEarly: 425,
    UpgradeRequired: 426,
    PreconditionRequired: 428,
    TooManyRequests: 429,
    RequestHeaderFieldsTooLarge: 431,
    UnavailableForLegalReasons: 451,
    InternalServerError: 500,
    NotImplemented: 501,
    BadGateway: 502,
    ServiceUnavailable: 503,
    GatewayTimeout: 504,
    HttpVersionNotSupported: 505,
    VariantAlsoNegotiates: 506,
    InsufficientStorage: 507,
    LoopDetected: 508,
    NotExtended: 510,
    NetworkAuthenticationRequired: 511,
  };

  Object.entries(HttpStatusCode).forEach(([key, value]) => {
    HttpStatusCode[value] = key;
  });

  var HttpStatusCode$1 = HttpStatusCode;

  /**
   * Create an instance of Axios
   *
   * @param {Object} defaultConfig The default config for the instance
   *
   * @returns {Axios} A new instance of Axios
   */
  function createInstance(defaultConfig) {
    const context = new Axios$1(defaultConfig);
    const instance = bind(Axios$1.prototype.request, context);

    // Copy axios.prototype to instance
    utils.extend(instance, Axios$1.prototype, context, {allOwnKeys: true});

    // Copy context to instance
    utils.extend(instance, context, null, {allOwnKeys: true});

    // Factory for creating new instances
    instance.create = function create(instanceConfig) {
      return createInstance(mergeConfig(defaultConfig, instanceConfig));
    };

    return instance;
  }

  // Create the default instance to be exported
  const axios = createInstance(defaults$1);

  // Expose Axios class to allow class inheritance
  axios.Axios = Axios$1;

  // Expose Cancel & CancelToken
  axios.CanceledError = CanceledError;
  axios.CancelToken = CancelToken$1;
  axios.isCancel = isCancel;
  axios.VERSION = VERSION;
  axios.toFormData = toFormData;

  // Expose AxiosError class
  axios.AxiosError = AxiosError;

  // alias for CanceledError for backward compatibility
  axios.Cancel = axios.CanceledError;

  // Expose all/spread
  axios.all = function all(promises) {
    return Promise.all(promises);
  };

  axios.spread = spread;

  // Expose isAxiosError
  axios.isAxiosError = isAxiosError;

  // Expose mergeConfig
  axios.mergeConfig = mergeConfig;

  axios.AxiosHeaders = AxiosHeaders$1;

  axios.formToJSON = thing => formDataToJSON(utils.isHTMLForm(thing) ? new FormData(thing) : thing);

  axios.HttpStatusCode = HttpStatusCode$1;

  axios.default = axios;

  // this module should only have a default export
  var axios$1 = axios;

  // 是否被 app 内嵌
  const isInApp = window.Bridge && window.navigator.userAgent.indexOf('SmartCanWebView') !== -1;
  function loadQuickTrackSDK(serverUrl) {
    var _$scriptInDOM$parentN;
    const $scriptInDOM = document.getElementsByTagName('script')[0];
    const $script = document.createElement('script');
    $script.async = true;
    $script.id = 'beacon-aplus';
    $script.src = serverUrl;
    $scriptInDOM === null || $scriptInDOM === void 0 ? void 0 : (_$scriptInDOM$parentN = $scriptInDOM.parentNode) === null || _$scriptInDOM$parentN === void 0 ? void 0 : _$scriptInDOM$parentN.insertBefore($script, $scriptInDOM);
  }
  // 页面头部通过 script src 的方式引入
  const sensorSdkUrl = 'https://topic.ykt.cbern.com.cn/web/ncet-xedu/tracker/sensorsdata.min.js';
  // 加载神策 sdk
  function loadSensorsSDK() {
    return new Promise(resolve => {
      const $scriptInDOM = document.querySelector('head');
      const $script = document.createElement('script');
      $script.src = sensorSdkUrl;
      $script.onload = () => {
        window.sensors = window['sensorsDataAnalytic201505'];
        resolve(true);
      };
      $scriptInDOM === null || $scriptInDOM === void 0 ? void 0 : $scriptInDOM.appendChild($script);
    });
  }
  // 是否在PC端内使用，当页面在`智慧中小学`PC端内打开时，会自动注入下面函数
  const isInPC = !!window.xElectron;
  // 获取`智慧中小学`PC端的安装包版本号 
  function getPcVersion() {
    return new Promise(resolve => {
      var _window$xElectron;
      (_window$xElectron = window.xElectron) === null || _window$xElectron === void 0 ? void 0 : _window$xElectron.window.getVersion().then(version => {
        resolve(version);
      }).catch(e => {
        console.error(e);
        resolve('');
      });
    });
  }
  let setPublicParamsResolve;
  const setPublicParamsReady = new Promise(resolve => {
    setPublicParamsResolve = resolve;
  });
  // 设置环境相关的公共参数（由sdk统一处理，目前只有 pcVersion）
  function setPublicParams() {
    getPcVersion().then(version => {
      if (window.aplus_queue) {
        window.aplus_queue.push({
          action: 'aplus.appendMetaInfo',
          arguments: ['globalproperty', {
            pcVersion: version
          }]
        });
      }
      if (window.sensors) {
        window.sensors.registerPage({
          pcVersion: version
        });
      }
      setPublicParamsResolve();
    });
  }
  let getEventParamsResolve;
  const getEventParamsReady = new Promise(resolve => {
    getEventParamsResolve = resolve;
  });
  // 获取事件编码和参数的映射关系
  async function getEventParams() {
    const response = await axios$1.get('https://x-api.ykt.eduyun.cn/proxy/data/api/v1/common/event/params');
    let res = null;
    if (response.status === 200) {
      var _data$data;
      const {
        data
      } = response;
      if (data !== null && data !== void 0 && (_data$data = data.data) !== null && _data$data !== void 0 && _data$data.length) {
        res = data === null || data === void 0 ? void 0 : data.data;
      }
    }
    getEventParamsResolve(res);
  }
  // 去除对象中的空字段
  function filterParams(params) {
    const filtered = Object.keys(params).filter(key => params[key]).reduce((obj, key) => ({
      ...obj,
      [key]: params[key]
    }), {});
    return filtered;
  }
  /**
   * 根据映射关系获取当前事件需要上报的额外参数
   * @param eventName 事件名
   * @param data 事件编码和参数的映射关系数组
   */
  function getExtraParams(_ref) {
    let {
      eventName,
      data
    } = _ref;
    if (!(data !== null && data !== void 0 && data.length)) {
      return {};
    }
    // 映射关系中必须有 event_code 字段，否则无法匹配事件名
    const filterMaps = data.filter(_ => _.event_code);
    const event = filterMaps.find(_ => _.event_code === eventName);
    let extraParams = {};
    if (event) {
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        event_code: eventCode,
        ...restParams
      } = event;
      extraParams = filterParams(restParams);
    }
    return extraParams;
  }
  // 线上配置文件
  const configUrl = 'https://topic.ykt.cbern.com.cn/web/ncet-xedu/tracker/track_default_config.js';
  // 加载配置文件
  function loadTrackConfig() {
    return new Promise(resolve => {
      const $scriptInDOM = document.querySelector('head');
      const $script = document.createElement('script');
      $script.src = configUrl;
      $script.onload = () => {
        resolve(true);
      };
      $scriptInDOM === null || $scriptInDOM === void 0 ? void 0 : $scriptInDOM.appendChild($script);
    });
  }
  // 从线上配置获取指定路径的属性值。如果该路径的属性值存在，那么返回该值；否则，返回默认值
  function getConfigValue(config, propertyPath, defaultValue) {
    const properties = propertyPath.split('.');
    let value = config;
    for (const property of properties) {
      if (value && typeof value[property] !== 'undefined') {
        value = value[property];
      } else {
        return defaultValue;
      }
    }
    return value;
  }
  /**
   * 1. 获取qt的serverUrl、trackHost
   * 2. 神策的serverUrl
   * 3. 神策、qt是否开启上报
   * 4. 神策会话超时时间
   * @param {
   *   env: string, // 环境（test/preproduction/product/ncet-xedu）
   *   config: any, // 线上配置
   *   qt: QtParams, // QT 初始化配置参数（优先级最高）
   *   sensors: SensorsParams // 神策初始化配置参数（优先级最高）
   * }
   * @return {
   *   qtServerUrl: string, // qt的SDK地址
   *   qtTrackHost: string, // qt的收数域名
   *   sensorsServerUrl: string, // 神策的数据上报地址
   *   qtEnable: boolean, // 是否开启qt上报
   *   sensorsEnable: boolean // 是否开启神策上报
   *   sessionTimeout: number // 神策会话超时时间，单位 ms（取线上配置），超过该时间会重新生成 event_session_id
   * }
   */
  function getConfigInfo(_ref2) {
    var _curConfig$qt, _curConfig$qt2, _curConfig$sensors3;
    let {
      env,
      config,
      qt,
      sensors
    } = _ref2;
    // 最终返回的配置（qt的serverUrl、trackHost；神策的 serverUrl）
    const info = {
      qtServerUrl: '',
      qtTrackHost: '',
      sensorsServerUrl: '',
      qtEnable: qt.enable,
      sensorsEnable: sensors.enable,
      sessionTimeout: 0
    };
    // 当前环境配置，找不到环境用 ncet-xedu
    const curConfig = env && config[env] ? config[env] : config['ncet-xedu'];
    // 神策、qt是否开启上报（优先级：线上配置 > 初始化配置）
    info.qtEnable = getConfigValue(curConfig, 'qt.enable', qt.enable);
    info.sensorsEnable = getConfigValue(curConfig, 'sensors.enable', sensors.enable);
    // qt的serverUrl、trackHost（优先级：初始化配置 > 线上配置）
    info.qtServerUrl = (qt === null || qt === void 0 ? void 0 : qt.serverUrl) || (curConfig === null || curConfig === void 0 ? void 0 : (_curConfig$qt = curConfig.qt) === null || _curConfig$qt === void 0 ? void 0 : _curConfig$qt.serverUrl);
    info.qtTrackHost = (qt === null || qt === void 0 ? void 0 : qt.trackHost) || (curConfig === null || curConfig === void 0 ? void 0 : (_curConfig$qt2 = curConfig.qt) === null || _curConfig$qt2 === void 0 ? void 0 : _curConfig$qt2.trackHost);
    // 神策的 serverUrl（优先级：初始化配置 > 线上配置）
    if (sensors !== null && sensors !== void 0 && sensors.serverUrl && sensors !== null && sensors !== void 0 && sensors.appKey) {
      // 做个兼容处理，防止传入的serverUrl不以“/”结尾，导致拼接错误
      info.sensorsServerUrl = `${sensors === null || sensors === void 0 ? void 0 : sensors.serverUrl}${sensors !== null && sensors !== void 0 && sensors.serverUrl.endsWith('/') ? '' : '/'}${sensors === null || sensors === void 0 ? void 0 : sensors.appKey}`;
    } else {
      var _curConfig$sensors, _curConfig$sensors2;
      const sensorsAppKey = curConfig === null || curConfig === void 0 ? void 0 : (_curConfig$sensors = curConfig.sensors) === null || _curConfig$sensors === void 0 ? void 0 : _curConfig$sensors[`${isInPC ? 'pcAppKey' : 'appKey'}`];
      info.sensorsServerUrl = `${curConfig === null || curConfig === void 0 ? void 0 : (_curConfig$sensors2 = curConfig.sensors) === null || _curConfig$sensors2 === void 0 ? void 0 : _curConfig$sensors2.serverUrl}${sensorsAppKey}`;
    }
    // 神策会话超时时间（只取线上配置）
    info.sessionTimeout = curConfig === null || curConfig === void 0 ? void 0 : (_curConfig$sensors3 = curConfig.sensors) === null || _curConfig$sensors3 === void 0 ? void 0 : _curConfig$sensors3.sessionTimeout;
    return info;
  }

  // https://help.aliyun.com/document_detail/252737.html
  // Qt 事件类型（目前只用到点击）
  const QtEventType = {
    Exp: 'EXP',
    Click: 'CLK',
    Other: 'OTHER' // 其他
  };
  // Qt
  class QtStat {
    constructor(_ref) {
      let {
        version = 1,
        serverUrl,
        bridge,
        appKey,
        trackHost = ''
      } = _ref;
      if (!window.aplus_queue) {
        initQueue$1({
          appKey,
          trackHost,
          version
        });
        loadQuickTrackSDK(serverUrl);
        // h5 桥接 app 上报
        let jsBridge = bridge;
        if (typeof bridge === 'function') {
          jsBridge = bridge();
        }
        if (isInApp && jsBridge) {
          // H5 设置aplus-jsbridge-only为true，则为禁止 H5 SDK上报埋点事件
          window.aplus_queue.push({
            action: 'aplus.setMetaInfo',
            arguments: ['aplus-jsbridge-only', true]
          });
        }
      }
    }
    /**
     * 点击事件
     * @param eventName 事件名
     * @param pageName 页面名
     * @param eventType 事件类型
     * @param params 事件参数
     */
    track(_ref2) {
      let {
        eventName,
        pageName = eventName,
        eventType = QtEventType.Click,
        params
      } = _ref2;
      window.aplus_queue.push({
        action: 'aplus.record',
        arguments: [eventName, eventType, {
          ...params,
          page_name: pageName
        }]
      });
      console.log('qt track', eventName, pageName, eventType, params);
    }
    /**
    * PV 埋点
    * @param eventName 事件名
    * @param pageName 页面名
    * @param params 事件参数
    */
    pv(_ref3) {
      let {
        eventName,
        pageName = eventName,
        params
      } = _ref3;
      window.aplus_queue.push({
        action: 'aplus.sendPV',
        arguments: [{
          is_auto: false
        }, {
          page_name: pageName,
          ...params
        }]
      });
      console.log('qt pv', eventName, pageName, params);
    }
  }
  function initQueue$1(_ref4) {
    let {
      appKey,
      trackHost,
      version
    } = _ref4;
    window.aplus_queue = [];
    // 手动 PV
    window.aplus_queue.push({
      action: 'aplus.setMetaInfo',
      arguments: ['aplus-disable-apv', true]
    });
    // 集成应用的appKey
    window.aplus_queue.push({
      action: 'aplus.setMetaInfo',
      arguments: ['appKey', appKey]
    });
    // 如果是私有云部署还需要在上面那段JS后面紧接着添加日志域名埋点
    if (trackHost) {
      // 收数域名 1.x版本：aplus-rhost-v 2.x版本：trackDomain
      const key = version === 1 ? 'aplus-rhost-v' : 'trackDomain';
      window.aplus_queue.push({
        action: 'aplus.setMetaInfo',
        arguments: [key, trackHost]
      });
    }
    // 关闭全埋点
    window.aplus_queue.push({
      action: 'aplus.setMetaInfo',
      arguments: ['aplus-autotrack-enabled', false]
    });
    window.aplus_queue.push({
      action: 'aplus.setMetaInfo',
      arguments: ['_hold', 'BLOCK']
    });
    // window.aplus_queue.push({
    //   action: 'aplus.setMetaInfo',
    //   arguments: ['DEBUG', true] // 控制台打印sdk日志
    // })
  }

  // Unique ID creation requires a high quality random # generator. In the browser we therefore
  // require the crypto API and do not support built-in fallback to lower quality random number
  // generators (like Math.random()).
  let getRandomValues;
  const rnds8 = new Uint8Array(16);
  function rng() {
    // lazy load so that environments that need to polyfill have a chance to do so
    if (!getRandomValues) {
      // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
      getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);

      if (!getRandomValues) {
        throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
      }
    }

    return getRandomValues(rnds8);
  }

  /**
   * Convert array of 16 byte values to UUID string format of the form:
   * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
   */

  const byteToHex = [];

  for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).slice(1));
  }

  function unsafeStringify(arr, offset = 0) {
    // Note: Be careful editing this code!  It's been tuned for performance
    // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
    return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
  }

  const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
  var native = {
    randomUUID
  };

  function v4(options, buf, offset) {
    if (native.randomUUID && !buf && !options) {
      return native.randomUUID();
    }

    options = options || {};
    const rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

    rnds[6] = rnds[6] & 0x0f | 0x40;
    rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

    if (buf) {
      offset = offset || 0;

      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = rnds[i];
      }

      return buf;
    }

    return unsafeStringify(rnds);
  }

  // 缓存 session 的 key
  const SESSION_CACHE_KEY = '_X_STAT_EVENT_SESSION';
  // 最后一次事件上报的时间戳
  const LAST_EVENT_TIME = '_X_STAT_LAST_EVENT_TIME';
  const UUID_CACHE_KEY = '_X_STAT_UUID';
  function setCache(key, val) {
    window.localStorage.setItem(key, val.toString());
  }
  function getCache(key) {
    const cacheVal = window.localStorage.getItem(key);
    if (cacheVal) {
      return Number(cacheVal);
    }
    return null;
  }
  function getUUid() {
    let {
      regenerate = false // 是否重新生成
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const lastUuid = window.localStorage.getItem(UUID_CACHE_KEY);
    // 生成新的 uuid
    if (!lastUuid || regenerate) {
      const newUuid = v4();
      setCache(UUID_CACHE_KEY, newUuid);
      return newUuid;
    }
    return lastUuid;
  }
  // 获取 event_session_id（为了给所有事件新增 event_session_id 属性，标记当前事件属于哪个 session）
  function getEventSessionId(_ref) {
    let {
      key = SESSION_CACHE_KEY,
      timeout = 0 // 会话超时时间，单位 ms（取线上配置），超过该时间会重新生成 event_session_id
    } = _ref;
    // 如果为 0，则不设置 event_session_id
    if (!timeout) {
      return '';
    }
    // 最后一次事件上报的时间戳
    const lastEventTime = getCache(LAST_EVENT_TIME);
    // 当前事件上报的时间戳
    const curEventTime = new Date().getTime();
    setCache(LAST_EVENT_TIME, curEventTime);
    // uuid 用于标记当前设备/浏览器的唯一性
    let uuid = getUUid();
    // 如果不存在最后一次事件上报的时间戳或两次事件上报的间隔超过了 timeout，则重新生成
    if (!lastEventTime || curEventTime - lastEventTime > timeout) {
      uuid = getUUid({
        regenerate: true
      });
      setCache(key, curEventTime);
      return `${uuid}-${curEventTime}`;
    }
    const sessionCache = getCache(key);
    return `${uuid}-${sessionCache}`;
  }

  function generateAk(auth) {
    const s = window.btoa(`${auth}--${String(Date.now()).slice(0, 10)}`);
    return s;
  }

  // https://manual.sensorsdata.cn/sa/latest/tech_sdk_client_web-1573905.html
  // 神策事件类型
  const SensorsEventType = {
    Click: 'clickEvent',
    Page: 'pageEvent',
    Business: 'businessEvent' // 业务
  };
  // 神策
  class SensorsStat {
    constructor(_ref, sensors) {
      let {
        serverUrl,
        bridge,
        auth,
        cacheKey,
        sessionTimeout,
        heatmap
      } = _ref;
      _defineProperty(this, "cacheKey", void 0);
      _defineProperty(this, "sensors", void 0);
      _defineProperty(this, "sessionTimeout", void 0);
      this.cacheKey = cacheKey;
      this.sensors = sensors;
      this.sessionTimeout = sessionTimeout;
      // h5 桥接 app 上报
      let jsBridge = bridge;
      if (typeof bridge === 'function') {
        jsBridge = bridge();
      }
      let url = serverUrl;
      if (auth) {
        const s = `zxxauth=${generateAk(auth)}`;
        if (serverUrl.indexOf('?') > -1) {
          url = `${url}?${s}`;
        } else {
          url = `${url}&${s}`;
        }
      }
      this.sensors.init({
        server_url: url,
        is_track_single_page: false,
        use_client_time: true,
        send_type: 'ajax',
        heatmap: {
          // 是否开启点击图，default 表示开启，自动采集 $WebClick 事件，可以设置 'not_collect' 表示关闭。
          clickmap: 'not_collect',
          // 是否开启触达图，not_collect 表示关闭，不会自动采集 $WebStay 事件，可以设置 'default' 表示开启。
          scroll_notice_map: 'not_collect',
          ...heatmap
        },
        show_log: false,
        is_track_device_id: true,
        app_js_bridge: isInApp ? jsBridge : false
      });
    }
    /**
     * 注册公共属性，等同 sensors.registerPage
     * @param {object} params 属性键值对
     */
    registerPage(params) {
      this.sensors.registerPage(params);
    }
    /**
     * 自定义事件，会自动注入 sequence 和 seq_salt
     * @param eventName 事件名
     * @param params 事件参数
     */
    track(_ref2) {
      let {
        eventName,
        params
      } = _ref2;
      const cache = getSequence(this.cacheKey);
      const eventSessionId = getEventSessionId({
        timeout: this.sessionTimeout
      });
      this.sensors.track(eventName, {
        ...params,
        ...cache,
        ...(eventSessionId ? {
          event_session_id: eventSessionId
        } : {})
      });
      console.log('sensors event', eventName, params);
    }
  }

  let initSensorsResolve;
  const initSensorsReady = new Promise(resolve => {
    initSensorsResolve = resolve;
  });
  let initResolve;
  const initReady = new Promise(resolve => {
    initResolve = resolve;
  });
  // 默认 qt 配置
  const defaultQt = {
    version: 1,
    serverUrl: '',
    trackHost: '',
    appKey: '',
    bridge: true,
    enable: true,
    sensorsPvEnable: true,
    sensorsClickEnable: true // qt的点击类事件上报时，是否双埋到神策
  };
  // 默认神策配置
  const defaultSensors = {
    serverUrl: '',
    appKey: '',
    bridge: true,
    enable: true,
    qtPvEnable: true,
    qtClickEnable: true,
    heatmap: {} // 神策全埋点和点击图 https://manual.sensorsdata.cn/sa/latest/zh_cn/tech_sdk_client_web_all_use-7545310.html
  };
  /**
   * @class XTracker
   * 1. 满足神策、QT 双埋
   * 2. 可通过配置关闭神策、QT 埋点
   * 3. 支持 H5 桥接 app 上报配置
   */
  class XTracker {
    // qt 初始化完成后的实例

    // qt的页面事件上报时，是否双埋到神策

    // qt的点击类事件上报时，是否双埋到神策

    // 神策的页面事件上报时，是否双埋到qt

    // 神策的点击类事件上报时，是否双埋到qt

    // 完成 SDK 加载，以及 qt 和神策对应的初始化功能，SDK 加载完成后的业务相关内容请放在 callback 中
    static init(_ref) {
      let {
        env = window.__global_env,
        // 环境：test/preproduction/product/ncet-xedu。不传时，默认取 window.__global_env（不存在该变量时，env = 'ncet-xedu'）
        // QT 初始化配置参数
        qt: propsQt,
        // 神策初始化配置参数（神策最终的上报地址由 serverUrl 和 appKey 拼接）
        sensors: propsSensors,
        // 完成 SDK 加载后的回调
        callback = _ref2 => {
        },
        // qt是否开启（没传：线上配置 > 初始化配置；传了：_qt > 线上配置 > 初始化配置）
        _qt
      } = _ref;
      const qt = {
        ...defaultQt,
        ...propsQt
      };
      const sensors = {
        ...defaultSensors,
        ...propsSensors
      };
      loadTrackConfig().then(() => {
        // 获取配置信息（与初始化信息结合）
        const config = getConfigInfo({
          env,
          config: window.__track_config,
          qt,
          sensors
        });
        this.sensorsPvEnable = qt.sensorsPvEnable;
        this.sensorsClickEnable = qt.sensorsClickEnable;
        this.qtPvEnable = sensors.qtPvEnable;
        this.qtClickEnable = sensors.qtClickEnable;
        // 获取事件编码和参数的映射关系
        getEventParams();
        // sensors 初始化、加载sdk（serverUrl 必传）
        if (config.sensorsEnable && config !== null && config !== void 0 && config.sensorsServerUrl) {
          loadSensorsSDK().then(() => {
            const sensorsStat = new SensorsStat({
              ...sensors,
              serverUrl: config === null || config === void 0 ? void 0 : config.sensorsServerUrl,
              sessionTimeout: (config === null || config === void 0 ? void 0 : config.sessionTimeout) || 0
            }, window.sensors);
            // 神策初始化完成
            initSensorsResolve(sensorsStat);
          });
        } else {
          // 不开启神策上报，没有实例对象
          initSensorsResolve();
        }
        // 没传_qt时，线上配置 > 初始化配置；传了_qt时，_qt > 线上配置 > 初始化配置
        const qtEnable = typeof _qt !== 'undefined' ? _qt : config.qtEnable;
        // qt 初始化、加载sdk（serverUrl、appKey 必传）
        if (qtEnable && config !== null && config !== void 0 && config.qtServerUrl && qt.appKey) {
          const qtStat = new QtStat({
            ...qt,
            serverUrl: config === null || config === void 0 ? void 0 : config.qtServerUrl,
            trackHost: config === null || config === void 0 ? void 0 : config.qtTrackHost
          });
          this.qtStat = qtStat;
        }
        // sensors 初始化就绪
        initSensorsReady.then(() => {
          if (callback) {
            callback({
              qt: window.aplus_queue,
              sensors: window.sensors // 神策对象
            });
          }

          if (isInPC) {
            setPublicParams();
            setPublicParamsReady.then(() => {
              initResolve(true);
            });
          } else {
            initResolve(true);
          }
        });
      });
    }
    // 获取实例化后的神策对象（window.sensors）
    static async getSensors() {
      const sensorsInstance = await initSensorsReady;
      if (sensorsInstance) {
        return sensorsInstance === null || sensorsInstance === void 0 ? void 0 : sensorsInstance.sensors;
      } else {
        // 不开启（使用）神策上报
        return null;
      }
    }
    // 获取 window.aplus_queue
    static async getAplusQueue() {
      const initState = await this.getInitState();
      if (initState) {
        return window.aplus_queue || null;
      }
    }
    // 获取 sdk 初始化的完成状态
    static async getInitState() {
      const state = await initReady;
      return state || false;
    }
    /**
    * 点击事件
    * @param eventName 事件名
    * @param pageName 页面名，默认等于事件名（用于qt埋点）
    * @param statType 数据统计类型：'sensors' | 'qt'，默认'sensors'。
    * sensors：神策上报（根据配置确定是否需要双埋到qt），qt：Qt上报（根据配置确定是否需要双埋到神策）
    * @param params 事件参数（神策事件类型 event_type：默认事件类型为 clickEvent；qt事件类型 qt_event_type：默认为 CLK）
    */
    static track(_ref3) {
      let {
        eventName,
        pageName = eventName,
        statType = 'sensors',
        params = {}
      } = _ref3;
      // init 就绪
      initReady.then(() => {
        const sendSensors = statType === 'sensors' || statType === 'qt' && this.sensorsClickEnable;
        const sendQt = statType === 'qt' || statType === 'sensors' && this.qtClickEnable;
        getEventParamsReady.then(data => {
          const extraParams = getExtraParams({
            eventName,
            data
          });
          initSensorsReady.then(sensorsStat => {
            if (sensorsStat && sendSensors) {
              let restParams = params;
              // 注：qt_event_type 是qt的事件类型
              if (params !== null && params !== void 0 && params.qt_event_type) {
                const {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  qt_event_type: qtEventType,
                  ...rest
                } = params;
                restParams = rest;
              }
              // 注：sendQt 只是用于标识当前点位是否上报到 qt
              if (typeof params.sendQt !== 'undefined') {
                const {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  sendQt,
                  ...rest
                } = restParams;
                restParams = rest;
              }
              sensorsStat.track({
                eventName,
                params: {
                  event_type: SensorsEventType.Click,
                  ...restParams,
                  ...extraParams
                }
              });
            }
          });
          // 即使开启了 qt 上报，事件参数中如果带上 sendQt: false，也依然不上报到 qt；sendQt: true，就正常上报
          const paramSendQt = typeof params.sendQt !== 'undefined' ? params.sendQt : sendQt;
          if (this.qtStat && sendQt && paramSendQt) {
            let restParams = params;
            // 注：event_type 是神策的事件类型
            if (params !== null && params !== void 0 && params.event_type) {
              const {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                event_type: eventType,
                ...rest
              } = params;
              restParams = rest;
            }
            // 注：qt_event_type 是qt的事件类型
            if (params !== null && params !== void 0 && params.qt_event_type) {
              const {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                qt_event_type: qtEventType,
                ...rest
              } = restParams;
              restParams = rest;
            }
            // 注：sendQt 只是用于标识当前点位是否上报到 qt
            if (typeof params.sendQt !== 'undefined') {
              const {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                sendQt,
                ...rest
              } = restParams;
              restParams = rest;
            }
            this.qtStat.track({
              eventName,
              pageName,
              eventType: (params === null || params === void 0 ? void 0 : params.qt_event_type) || QtEventType.Click,
              params: {
                ...restParams,
                ...extraParams
              }
            });
          }
        });
      });
    }
    /**
    * PV 埋点
    * @param eventName 事件名
    * @param pageName 页面名，默认等于事件名（用于qt埋点）
    * @param statType 数据统计类型：'sensors' | 'qt'，默认'sensors'。
    * sensors：神策上报（根据配置确定是否需要双埋到qt），qt：Qt上报（根据配置确定是否需要双埋到神策）
    * @param params 事件参数
    */
    static pv(_ref4) {
      let {
        eventName,
        pageName = eventName,
        statType = 'sensors',
        params = {}
      } = _ref4;
      // init 就绪
      initReady.then(() => {
        const sendSensors = statType === 'sensors' || statType === 'qt' && this.sensorsPvEnable;
        const sendQt = statType === 'qt' || statType === 'sensors' && this.qtPvEnable;
        getEventParamsReady.then(data => {
          const extraParams = getExtraParams({
            eventName,
            data
          });
          initSensorsReady.then(sensorsStat => {
            if (sensorsStat && sendSensors) {
              let restParams = params;
              // 注：sendQt 只是用于标识当前点位是否上报到 qt
              if (typeof params.sendQt !== 'undefined') {
                const {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  sendQt,
                  ...rest
                } = restParams;
                restParams = rest;
              }
              sensorsStat.track({
                eventName,
                params: {
                  event_type: SensorsEventType.Page,
                  ...restParams,
                  ...extraParams
                }
              });
            }
          });
          // 即使开启了 qt 上报，事件参数中如果带上 sendQt: false，也依然不上报到 qt；sendQt: true，就正常上报
          const paramSendQt = typeof params.sendQt !== 'undefined' ? params.sendQt : sendQt;
          if (this.qtStat && sendQt && paramSendQt) {
            let restParams = params;
            // 注：event_type 是神策的事件类型
            if (params !== null && params !== void 0 && params.event_type) {
              const {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                event_type: eventType,
                ...rest
              } = params;
              restParams = rest;
            }
            // 注：sendQt 只是用于标识当前点位是否上报到 qt
            if (typeof params.sendQt !== 'undefined') {
              const {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                sendQt,
                ...rest
              } = restParams;
              restParams = rest;
            }
            this.qtStat.pv({
              eventName,
              pageName,
              params: {
                ...restParams,
                ...extraParams
              }
            });
          }
        });
      });
    }
  }
  _defineProperty(XTracker, "qtStat", null);
  _defineProperty(XTracker, "sensorsPvEnable", void 0);
  _defineProperty(XTracker, "sensorsClickEnable", void 0);
  _defineProperty(XTracker, "qtPvEnable", void 0);
  _defineProperty(XTracker, "qtClickEnable", void 0);

  /**
   * iframe 双埋
   * @param {CreateTrackIframeParams} {
   *   subSdkUrl,
   *   subAppkey,
   *   subTrackingHost
   * }
   */
  function createTrackIframe(_ref) {
    var _$iframe$contentWindo;
    let {
      subSdkUrl,
      subAppkey,
      subTrackingHost
    } = _ref;
    const $iframe = createIframe();
    const iframeDocument = (_$iframe$contentWindo = $iframe.contentWindow) === null || _$iframe$contentWindo === void 0 ? void 0 : _$iframe$contentWindo.document;
    if (iframeDocument) {
      initQueue({
        iframeDocument,
        subAppkey,
        subTrackingHost
      });
      loadScriptInFrame(iframeDocument, subSdkUrl).then(() => {
        bindIframeEvent($iframe);
      });
    }
  }
  function createIframe() {
    let $iframe = document.querySelector('#quick-tracking-iframe');
    if (!$iframe) {
      $iframe = document.createElement('iframe');
      // $iframe.setAttribute('src', '/empty.html')
      $iframe.setAttribute('name', 'quick-tracking-iframe');
      $iframe.setAttribute('id', 'quick-tracking-iframe');
      $iframe.setAttribute('style', 'display: none;');
      document.body.appendChild($iframe);
    }
    return $iframe;
  }
  function initQueue(_ref2) {
    let {
      iframeDocument,
      subAppkey,
      subTrackingHost
    } = _ref2;
    execScriptInFrame(iframeDocument, `
      window.aplus_queue = []
      // 手动 PV
      window.aplus_queue.push({
        action: 'aplus.setMetaInfo',
        arguments: ['aplus-disable-apv', true]
      })
      // 集成应用的appKey
      window.aplus_queue.push({
        action: 'aplus.setMetaInfo',
        arguments: ['appKey', '${subAppkey}']
      })
      window.aplus_queue.push({
        action: 'aplus.setMetaInfo',
        arguments: ['aplus-rhost-v', '${subTrackingHost}']
      })
      // 关闭全埋点
      window.aplus_queue.push({
        action: 'aplus.setMetaInfo',
        arguments: ['aplus-autotrack-enabled', false]
      })

      // window.aplus_queue.push({
      //   action: 'aplus.setMetaInfo',
      //   arguments: ['DEBUG', true] // 控制台打印sdk日志
      // })

      window.addEventListener('message', function(event) {
        var content = event && event.data && event.data;
        var message = content.message;
        // 转发pv日志
        if (message === 'qt_pv' && content.page_name && content.page_title && content.data) {
          aplus_queue.push({
            action: 'aplus.sendPV',
            arguments: [{is_auto: false}, {
              fromEdu: true,
              page_name: content.page_name,
              page_title: content.page_title
            }]
          });
        }
      })
  `);
  }
  function execScriptInFrame(iframeDocument, scriptContent) {
    const script = iframeDocument.createElement('script');
    script.appendChild(document.createTextNode(scriptContent));
    script.type = 'text/javascript';
    iframeDocument.body.appendChild(script);
  }
  function loadScriptInFrame(iframeDocument, scriptUrl) {
    return new Promise(resolve => {
      const script = iframeDocument.createElement('script');
      script.async = true;
      script.src = scriptUrl;
      script.type = 'text/javascript';
      script.onload = () => {
        resolve(true);
      };
      iframeDocument.body.appendChild(script);
    });
  }
  function bindIframeEvent($iframe) {
    window.aplus_queue.push({
      action: 'aplus.aplus_pubsub.subscribe',
      arguments: ['mw_change_pv', content => {
        var _$iframe$contentWindo2;
        const data = content && content.what_to_send && content.what_to_send.logdata && content.what_to_send.logdata.gokey;
        const userdata = content && content.userdata;
        const sdkData = content && content.what_to_send && content.what_to_send.pvdataToUmNative && content.what_to_send.pvdataToUmNative.sdkArgs;
        (_$iframe$contentWindo2 = $iframe.contentWindow) === null || _$iframe$contentWindo2 === void 0 ? void 0 : _$iframe$contentWindo2.postMessage({
          message: 'qt_pv',
          data,
          page_name: userdata.page_name || sdkData.page_name || sdkData.url,
          page_title: userdata.page_title || document.title
        }, '*'); // 这里第二个参数为了保证安全性，可以按需配置
      }]
    });

    window.aplus_queue.push({
      action: 'aplus.aplus_pubsub.subscribe',
      arguments: ['mw_change_hjlj', content => {
        var _$iframe$contentWindo3;
        const data = content && content.userdata;
        (_$iframe$contentWindo3 = $iframe.contentWindow) === null || _$iframe$contentWindo3 === void 0 ? void 0 : _$iframe$contentWindo3.postMessage({
          message: 'qt_event',
          data: data.gokey,
          logkey: data.logkey,
          eventType: data.gmkey
        }, '*'); // 这里第二个参数为了保证安全性，可以按需配置
      }]
    });
  }

  /**
   * qt默认的回调方法（放业务相关的代码），目前是指 iframe 双埋，调用方可以直接在 callback 中调用该方法
   * @param {CreateTrackIframeParams} {
   *   subSdkUrl,
   *   subAppkey,
   *   subTrackingHost
   * }
   */
  function qtDefaultCallback(_ref) {
    let {
      subSdkUrl,
      subAppkey,
      subTrackingHost
    } = _ref;
    if (subSdkUrl && subAppkey && subTrackingHost) {
      createTrackIframe({
        subSdkUrl,
        subAppkey,
        subTrackingHost
      });
    }
  }
  // 暂无 sensors 默认的回调方法
  function sensorsDefaultCallback() {}
  const defaultCallback = {
    qt: qtDefaultCallback,
    sensors: sensorsDefaultCallback
  };

  exports.XTracker = XTracker;
  exports.defaultCallback = defaultCallback;
  exports.getSequence = getSequence;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
