/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 5183:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.req = exports.json = exports.toBuffer = void 0;
const http = __importStar(__nccwpck_require__(8611));
const https = __importStar(__nccwpck_require__(5692));
async function toBuffer(stream) {
    let length = 0;
    const chunks = [];
    for await (const chunk of stream) {
        length += chunk.length;
        chunks.push(chunk);
    }
    return Buffer.concat(chunks, length);
}
exports.toBuffer = toBuffer;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function json(stream) {
    const buf = await toBuffer(stream);
    const str = buf.toString('utf8');
    try {
        return JSON.parse(str);
    }
    catch (_err) {
        const err = _err;
        err.message += ` (input: ${str})`;
        throw err;
    }
}
exports.json = json;
function req(url, opts = {}) {
    const href = typeof url === 'string' ? url : url.href;
    const req = (href.startsWith('https:') ? https : http).request(url, opts);
    const promise = new Promise((resolve, reject) => {
        req
            .once('response', resolve)
            .once('error', reject)
            .end();
    });
    req.then = promise.then.bind(promise);
    return req;
}
exports.req = req;
//# sourceMappingURL=helpers.js.map

/***/ }),

/***/ 8894:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Agent = void 0;
const net = __importStar(__nccwpck_require__(9278));
const http = __importStar(__nccwpck_require__(8611));
const https_1 = __nccwpck_require__(5692);
__exportStar(__nccwpck_require__(5183), exports);
const INTERNAL = Symbol('AgentBaseInternalState');
class Agent extends http.Agent {
    constructor(opts) {
        super(opts);
        this[INTERNAL] = {};
    }
    /**
     * Determine whether this is an `http` or `https` request.
     */
    isSecureEndpoint(options) {
        if (options) {
            // First check the `secureEndpoint` property explicitly, since this
            // means that a parent `Agent` is "passing through" to this instance.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (typeof options.secureEndpoint === 'boolean') {
                return options.secureEndpoint;
            }
            // If no explicit `secure` endpoint, check if `protocol` property is
            // set. This will usually be the case since using a full string URL
            // or `URL` instance should be the most common usage.
            if (typeof options.protocol === 'string') {
                return options.protocol === 'https:';
            }
        }
        // Finally, if no `protocol` property was set, then fall back to
        // checking the stack trace of the current call stack, and try to
        // detect the "https" module.
        const { stack } = new Error();
        if (typeof stack !== 'string')
            return false;
        return stack
            .split('\n')
            .some((l) => l.indexOf('(https.js:') !== -1 ||
            l.indexOf('node:https:') !== -1);
    }
    // In order to support async signatures in `connect()` and Node's native
    // connection pooling in `http.Agent`, the array of sockets for each origin
    // has to be updated synchronously. This is so the length of the array is
    // accurate when `addRequest()` is next called. We achieve this by creating a
    // fake socket and adding it to `sockets[origin]` and incrementing
    // `totalSocketCount`.
    incrementSockets(name) {
        // If `maxSockets` and `maxTotalSockets` are both Infinity then there is no
        // need to create a fake socket because Node.js native connection pooling
        // will never be invoked.
        if (this.maxSockets === Infinity && this.maxTotalSockets === Infinity) {
            return null;
        }
        // All instances of `sockets` are expected TypeScript errors. The
        // alternative is to add it as a private property of this class but that
        // will break TypeScript subclassing.
        if (!this.sockets[name]) {
            // @ts-expect-error `sockets` is readonly in `@types/node`
            this.sockets[name] = [];
        }
        const fakeSocket = new net.Socket({ writable: false });
        this.sockets[name].push(fakeSocket);
        // @ts-expect-error `totalSocketCount` isn't defined in `@types/node`
        this.totalSocketCount++;
        return fakeSocket;
    }
    decrementSockets(name, socket) {
        if (!this.sockets[name] || socket === null) {
            return;
        }
        const sockets = this.sockets[name];
        const index = sockets.indexOf(socket);
        if (index !== -1) {
            sockets.splice(index, 1);
            // @ts-expect-error  `totalSocketCount` isn't defined in `@types/node`
            this.totalSocketCount--;
            if (sockets.length === 0) {
                // @ts-expect-error `sockets` is readonly in `@types/node`
                delete this.sockets[name];
            }
        }
    }
    // In order to properly update the socket pool, we need to call `getName()` on
    // the core `https.Agent` if it is a secureEndpoint.
    getName(options) {
        const secureEndpoint = this.isSecureEndpoint(options);
        if (secureEndpoint) {
            // @ts-expect-error `getName()` isn't defined in `@types/node`
            return https_1.Agent.prototype.getName.call(this, options);
        }
        // @ts-expect-error `getName()` isn't defined in `@types/node`
        return super.getName(options);
    }
    createSocket(req, options, cb) {
        const connectOpts = {
            ...options,
            secureEndpoint: this.isSecureEndpoint(options),
        };
        const name = this.getName(connectOpts);
        const fakeSocket = this.incrementSockets(name);
        Promise.resolve()
            .then(() => this.connect(req, connectOpts))
            .then((socket) => {
            this.decrementSockets(name, fakeSocket);
            if (socket instanceof http.Agent) {
                try {
                    // @ts-expect-error `addRequest()` isn't defined in `@types/node`
                    return socket.addRequest(req, connectOpts);
                }
                catch (err) {
                    return cb(err);
                }
            }
            this[INTERNAL].currentSocket = socket;
            // @ts-expect-error `createSocket()` isn't defined in `@types/node`
            super.createSocket(req, options, cb);
        }, (err) => {
            this.decrementSockets(name, fakeSocket);
            cb(err);
        });
    }
    createConnection() {
        const socket = this[INTERNAL].currentSocket;
        this[INTERNAL].currentSocket = undefined;
        if (!socket) {
            throw new Error('No socket was returned in the `connect()` function');
        }
        return socket;
    }
    get defaultPort() {
        return (this[INTERNAL].defaultPort ??
            (this.protocol === 'https:' ? 443 : 80));
    }
    set defaultPort(v) {
        if (this[INTERNAL]) {
            this[INTERNAL].defaultPort = v;
        }
    }
    get protocol() {
        return (this[INTERNAL].protocol ??
            (this.isSecureEndpoint() ? 'https:' : 'http:'));
    }
    set protocol(v) {
        if (this[INTERNAL]) {
            this[INTERNAL].protocol = v;
        }
    }
}
exports.Agent = Agent;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 6110:
/***/ ((module, exports, __nccwpck_require__) => {

/* eslint-env browser */

/**
 * This is the web browser implementation of `debug()`.
 */

exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();
exports.destroy = (() => {
	let warned = false;

	return () => {
		if (!warned) {
			warned = true;
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}
	};
})();

/**
 * Colors.
 */

exports.colors = [
	'#0000CC',
	'#0000FF',
	'#0033CC',
	'#0033FF',
	'#0066CC',
	'#0066FF',
	'#0099CC',
	'#0099FF',
	'#00CC00',
	'#00CC33',
	'#00CC66',
	'#00CC99',
	'#00CCCC',
	'#00CCFF',
	'#3300CC',
	'#3300FF',
	'#3333CC',
	'#3333FF',
	'#3366CC',
	'#3366FF',
	'#3399CC',
	'#3399FF',
	'#33CC00',
	'#33CC33',
	'#33CC66',
	'#33CC99',
	'#33CCCC',
	'#33CCFF',
	'#6600CC',
	'#6600FF',
	'#6633CC',
	'#6633FF',
	'#66CC00',
	'#66CC33',
	'#9900CC',
	'#9900FF',
	'#9933CC',
	'#9933FF',
	'#99CC00',
	'#99CC33',
	'#CC0000',
	'#CC0033',
	'#CC0066',
	'#CC0099',
	'#CC00CC',
	'#CC00FF',
	'#CC3300',
	'#CC3333',
	'#CC3366',
	'#CC3399',
	'#CC33CC',
	'#CC33FF',
	'#CC6600',
	'#CC6633',
	'#CC9900',
	'#CC9933',
	'#CCCC00',
	'#CCCC33',
	'#FF0000',
	'#FF0033',
	'#FF0066',
	'#FF0099',
	'#FF00CC',
	'#FF00FF',
	'#FF3300',
	'#FF3333',
	'#FF3366',
	'#FF3399',
	'#FF33CC',
	'#FF33FF',
	'#FF6600',
	'#FF6633',
	'#FF9900',
	'#FF9933',
	'#FFCC00',
	'#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

// eslint-disable-next-line complexity
function useColors() {
	// NB: In an Electron preload script, document will be defined but not fully
	// initialized. Since we know we're in Chrome, we'll just detect this case
	// explicitly
	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
		return true;
	}

	// Internet Explorer and Edge do not support colors.
	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
		return false;
	}

	let m;

	// Is webkit? http://stackoverflow.com/a/16459606/376773
	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	// eslint-disable-next-line no-return-assign
	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
		// Is firebug? http://stackoverflow.com/a/398120/376773
		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
		// Is firefox >= v31?
		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
		(typeof navigator !== 'undefined' && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31) ||
		// Double check webkit in userAgent just in case we are in a worker
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	args[0] = (this.useColors ? '%c' : '') +
		this.namespace +
		(this.useColors ? ' %c' : ' ') +
		args[0] +
		(this.useColors ? '%c ' : ' ') +
		'+' + module.exports.humanize(this.diff);

	if (!this.useColors) {
		return;
	}

	const c = 'color: ' + this.color;
	args.splice(1, 0, c, 'color: inherit');

	// The final "%c" is somewhat tricky, because there could be other
	// arguments passed either before or after the %c, so we need to
	// figure out the correct index to insert the CSS into
	let index = 0;
	let lastC = 0;
	args[0].replace(/%[a-zA-Z%]/g, match => {
		if (match === '%%') {
			return;
		}
		index++;
		if (match === '%c') {
			// We only are interested in the *last* %c
			// (the user may have provided their own)
			lastC = index;
		}
	});

	args.splice(lastC, 0, c);
}

/**
 * Invokes `console.debug()` when available.
 * No-op when `console.debug` is not a "function".
 * If `console.debug` is not available, falls back
 * to `console.log`.
 *
 * @api public
 */
exports.log = console.debug || console.log || (() => {});

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	try {
		if (namespaces) {
			exports.storage.setItem('debug', namespaces);
		} else {
			exports.storage.removeItem('debug');
		}
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
function load() {
	let r;
	try {
		r = exports.storage.getItem('debug') || exports.storage.getItem('DEBUG') ;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}

	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	if (!r && typeof process !== 'undefined' && 'env' in process) {
		r = process.env.DEBUG;
	}

	return r;
}

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
	try {
		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
		// The Browser also has localStorage in the global context.
		return localStorage;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

module.exports = __nccwpck_require__(897)(exports);

const {formatters} = module.exports;

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

formatters.j = function (v) {
	try {
		return JSON.stringify(v);
	} catch (error) {
		return '[UnexpectedJSONParseError]: ' + error.message;
	}
};


/***/ }),

/***/ 897:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {


/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */

function setup(env) {
	createDebug.debug = createDebug;
	createDebug.default = createDebug;
	createDebug.coerce = coerce;
	createDebug.disable = disable;
	createDebug.enable = enable;
	createDebug.enabled = enabled;
	createDebug.humanize = __nccwpck_require__(744);
	createDebug.destroy = destroy;

	Object.keys(env).forEach(key => {
		createDebug[key] = env[key];
	});

	/**
	* The currently active debug mode names, and names to skip.
	*/

	createDebug.names = [];
	createDebug.skips = [];

	/**
	* Map of special "%n" handling functions, for the debug "format" argument.
	*
	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	*/
	createDebug.formatters = {};

	/**
	* Selects a color for a debug namespace
	* @param {String} namespace The namespace string for the debug instance to be colored
	* @return {Number|String} An ANSI color code for the given namespace
	* @api private
	*/
	function selectColor(namespace) {
		let hash = 0;

		for (let i = 0; i < namespace.length; i++) {
			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}

		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
	}
	createDebug.selectColor = selectColor;

	/**
	* Create a debugger with the given `namespace`.
	*
	* @param {String} namespace
	* @return {Function}
	* @api public
	*/
	function createDebug(namespace) {
		let prevTime;
		let enableOverride = null;
		let namespacesCache;
		let enabledCache;

		function debug(...args) {
			// Disabled?
			if (!debug.enabled) {
				return;
			}

			const self = debug;

			// Set `diff` timestamp
			const curr = Number(new Date());
			const ms = curr - (prevTime || curr);
			self.diff = ms;
			self.prev = prevTime;
			self.curr = curr;
			prevTime = curr;

			args[0] = createDebug.coerce(args[0]);

			if (typeof args[0] !== 'string') {
				// Anything else let's inspect with %O
				args.unshift('%O');
			}

			// Apply any `formatters` transformations
			let index = 0;
			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
				// If we encounter an escaped % then don't increase the array index
				if (match === '%%') {
					return '%';
				}
				index++;
				const formatter = createDebug.formatters[format];
				if (typeof formatter === 'function') {
					const val = args[index];
					match = formatter.call(self, val);

					// Now we need to remove `args[index]` since it's inlined in the `format`
					args.splice(index, 1);
					index--;
				}
				return match;
			});

			// Apply env-specific formatting (colors, etc.)
			createDebug.formatArgs.call(self, args);

			const logFn = self.log || createDebug.log;
			logFn.apply(self, args);
		}

		debug.namespace = namespace;
		debug.useColors = createDebug.useColors();
		debug.color = createDebug.selectColor(namespace);
		debug.extend = extend;
		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

		Object.defineProperty(debug, 'enabled', {
			enumerable: true,
			configurable: false,
			get: () => {
				if (enableOverride !== null) {
					return enableOverride;
				}
				if (namespacesCache !== createDebug.namespaces) {
					namespacesCache = createDebug.namespaces;
					enabledCache = createDebug.enabled(namespace);
				}

				return enabledCache;
			},
			set: v => {
				enableOverride = v;
			}
		});

		// Env-specific initialization logic for debug instances
		if (typeof createDebug.init === 'function') {
			createDebug.init(debug);
		}

		return debug;
	}

	function extend(namespace, delimiter) {
		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
		newDebug.log = this.log;
		return newDebug;
	}

	/**
	* Enables a debug mode by namespaces. This can include modes
	* separated by a colon and wildcards.
	*
	* @param {String} namespaces
	* @api public
	*/
	function enable(namespaces) {
		createDebug.save(namespaces);
		createDebug.namespaces = namespaces;

		createDebug.names = [];
		createDebug.skips = [];

		const split = (typeof namespaces === 'string' ? namespaces : '')
			.trim()
			.replace(/\s+/g, ',')
			.split(',')
			.filter(Boolean);

		for (const ns of split) {
			if (ns[0] === '-') {
				createDebug.skips.push(ns.slice(1));
			} else {
				createDebug.names.push(ns);
			}
		}
	}

	/**
	 * Checks if the given string matches a namespace template, honoring
	 * asterisks as wildcards.
	 *
	 * @param {String} search
	 * @param {String} template
	 * @return {Boolean}
	 */
	function matchesTemplate(search, template) {
		let searchIndex = 0;
		let templateIndex = 0;
		let starIndex = -1;
		let matchIndex = 0;

		while (searchIndex < search.length) {
			if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === '*')) {
				// Match character or proceed with wildcard
				if (template[templateIndex] === '*') {
					starIndex = templateIndex;
					matchIndex = searchIndex;
					templateIndex++; // Skip the '*'
				} else {
					searchIndex++;
					templateIndex++;
				}
			} else if (starIndex !== -1) { // eslint-disable-line no-negated-condition
				// Backtrack to the last '*' and try to match more characters
				templateIndex = starIndex + 1;
				matchIndex++;
				searchIndex = matchIndex;
			} else {
				return false; // No match
			}
		}

		// Handle trailing '*' in template
		while (templateIndex < template.length && template[templateIndex] === '*') {
			templateIndex++;
		}

		return templateIndex === template.length;
	}

	/**
	* Disable debug output.
	*
	* @return {String} namespaces
	* @api public
	*/
	function disable() {
		const namespaces = [
			...createDebug.names,
			...createDebug.skips.map(namespace => '-' + namespace)
		].join(',');
		createDebug.enable('');
		return namespaces;
	}

	/**
	* Returns true if the given mode name is enabled, false otherwise.
	*
	* @param {String} name
	* @return {Boolean}
	* @api public
	*/
	function enabled(name) {
		for (const skip of createDebug.skips) {
			if (matchesTemplate(name, skip)) {
				return false;
			}
		}

		for (const ns of createDebug.names) {
			if (matchesTemplate(name, ns)) {
				return true;
			}
		}

		return false;
	}

	/**
	* Coerce `val`.
	*
	* @param {Mixed} val
	* @return {Mixed}
	* @api private
	*/
	function coerce(val) {
		if (val instanceof Error) {
			return val.stack || val.message;
		}
		return val;
	}

	/**
	* XXX DO NOT USE. This is a temporary stub function.
	* XXX It WILL be removed in the next major release.
	*/
	function destroy() {
		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
	}

	createDebug.enable(createDebug.load());

	return createDebug;
}

module.exports = setup;


/***/ }),

/***/ 2830:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * Detect Electron renderer / nwjs process, which is node, but we should
 * treat as a browser.
 */

if (typeof process === 'undefined' || process.type === 'renderer' || process.browser === true || process.__nwjs) {
	module.exports = __nccwpck_require__(6110);
} else {
	module.exports = __nccwpck_require__(5108);
}


/***/ }),

/***/ 5108:
/***/ ((module, exports, __nccwpck_require__) => {

/**
 * Module dependencies.
 */

const tty = __nccwpck_require__(2018);
const util = __nccwpck_require__(9023);

/**
 * This is the Node.js implementation of `debug()`.
 */

exports.init = init;
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.destroy = util.deprecate(
	() => {},
	'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.'
);

/**
 * Colors.
 */

exports.colors = [6, 2, 3, 4, 5, 1];

try {
	// Optional dependency (as in, doesn't need to be installed, NOT like optionalDependencies in package.json)
	// eslint-disable-next-line import/no-extraneous-dependencies
	const supportsColor = __nccwpck_require__(75);

	if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
		exports.colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		];
	}
} catch (error) {
	// Swallow - we only care if `supports-color` is available; it doesn't have to be.
}

/**
 * Build up the default `inspectOpts` object from the environment variables.
 *
 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
 */

exports.inspectOpts = Object.keys(process.env).filter(key => {
	return /^debug_/i.test(key);
}).reduce((obj, key) => {
	// Camel-case
	const prop = key
		.substring(6)
		.toLowerCase()
		.replace(/_([a-z])/g, (_, k) => {
			return k.toUpperCase();
		});

	// Coerce string value into JS value
	let val = process.env[key];
	if (/^(yes|on|true|enabled)$/i.test(val)) {
		val = true;
	} else if (/^(no|off|false|disabled)$/i.test(val)) {
		val = false;
	} else if (val === 'null') {
		val = null;
	} else {
		val = Number(val);
	}

	obj[prop] = val;
	return obj;
}, {});

/**
 * Is stdout a TTY? Colored output is enabled when `true`.
 */

function useColors() {
	return 'colors' in exports.inspectOpts ?
		Boolean(exports.inspectOpts.colors) :
		tty.isatty(process.stderr.fd);
}

/**
 * Adds ANSI color escape codes if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	const {namespace: name, useColors} = this;

	if (useColors) {
		const c = this.color;
		const colorCode = '\u001B[3' + (c < 8 ? c : '8;5;' + c);
		const prefix = `  ${colorCode};1m${name} \u001B[0m`;

		args[0] = prefix + args[0].split('\n').join('\n' + prefix);
		args.push(colorCode + 'm+' + module.exports.humanize(this.diff) + '\u001B[0m');
	} else {
		args[0] = getDate() + name + ' ' + args[0];
	}
}

function getDate() {
	if (exports.inspectOpts.hideDate) {
		return '';
	}
	return new Date().toISOString() + ' ';
}

/**
 * Invokes `util.formatWithOptions()` with the specified arguments and writes to stderr.
 */

function log(...args) {
	return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + '\n');
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	if (namespaces) {
		process.env.DEBUG = namespaces;
	} else {
		// If you set a process.env field to null or undefined, it gets cast to the
		// string 'null' or 'undefined'. Just delete instead.
		delete process.env.DEBUG;
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
	return process.env.DEBUG;
}

/**
 * Init logic for `debug` instances.
 *
 * Create a new `inspectOpts` object in case `useColors` is set
 * differently for a particular `debug` instance.
 */

function init(debug) {
	debug.inspectOpts = {};

	const keys = Object.keys(exports.inspectOpts);
	for (let i = 0; i < keys.length; i++) {
		debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
	}
}

module.exports = __nccwpck_require__(897)(exports);

const {formatters} = module.exports;

/**
 * Map %o to `util.inspect()`, all on a single line.
 */

formatters.o = function (v) {
	this.inspectOpts.colors = this.useColors;
	return util.inspect(v, this.inspectOpts)
		.split('\n')
		.map(str => str.trim())
		.join(' ');
};

/**
 * Map %O to `util.inspect()`, allowing multiple lines if needed.
 */

formatters.O = function (v) {
	this.inspectOpts.colors = this.useColors;
	return util.inspect(v, this.inspectOpts);
};


/***/ }),

/***/ 1970:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HttpProxyAgent = void 0;
const net = __importStar(__nccwpck_require__(9278));
const tls = __importStar(__nccwpck_require__(4756));
const debug_1 = __importDefault(__nccwpck_require__(2830));
const events_1 = __nccwpck_require__(4434);
const agent_base_1 = __nccwpck_require__(8894);
const url_1 = __nccwpck_require__(7016);
const debug = (0, debug_1.default)('http-proxy-agent');
/**
 * The `HttpProxyAgent` implements an HTTP Agent subclass that connects
 * to the specified "HTTP proxy server" in order to proxy HTTP requests.
 */
class HttpProxyAgent extends agent_base_1.Agent {
    constructor(proxy, opts) {
        super(opts);
        this.proxy = typeof proxy === 'string' ? new url_1.URL(proxy) : proxy;
        this.proxyHeaders = opts?.headers ?? {};
        debug('Creating new HttpProxyAgent instance: %o', this.proxy.href);
        // Trim off the brackets from IPv6 addresses
        const host = (this.proxy.hostname || this.proxy.host).replace(/^\[|\]$/g, '');
        const port = this.proxy.port
            ? parseInt(this.proxy.port, 10)
            : this.proxy.protocol === 'https:'
                ? 443
                : 80;
        this.connectOpts = {
            ...(opts ? omit(opts, 'headers') : null),
            host,
            port,
        };
    }
    addRequest(req, opts) {
        req._header = null;
        this.setRequestProps(req, opts);
        // @ts-expect-error `addRequest()` isn't defined in `@types/node`
        super.addRequest(req, opts);
    }
    setRequestProps(req, opts) {
        const { proxy } = this;
        const protocol = opts.secureEndpoint ? 'https:' : 'http:';
        const hostname = req.getHeader('host') || 'localhost';
        const base = `${protocol}//${hostname}`;
        const url = new url_1.URL(req.path, base);
        if (opts.port !== 80) {
            url.port = String(opts.port);
        }
        // Change the `http.ClientRequest` instance's "path" field
        // to the absolute path of the URL that will be requested.
        req.path = String(url);
        // Inject the `Proxy-Authorization` header if necessary.
        const headers = typeof this.proxyHeaders === 'function'
            ? this.proxyHeaders()
            : { ...this.proxyHeaders };
        if (proxy.username || proxy.password) {
            const auth = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`;
            headers['Proxy-Authorization'] = `Basic ${Buffer.from(auth).toString('base64')}`;
        }
        if (!headers['Proxy-Connection']) {
            headers['Proxy-Connection'] = this.keepAlive
                ? 'Keep-Alive'
                : 'close';
        }
        for (const name of Object.keys(headers)) {
            const value = headers[name];
            if (value) {
                req.setHeader(name, value);
            }
        }
    }
    async connect(req, opts) {
        req._header = null;
        if (!req.path.includes('://')) {
            this.setRequestProps(req, opts);
        }
        // At this point, the http ClientRequest's internal `_header` field
        // might have already been set. If this is the case then we'll need
        // to re-generate the string since we just changed the `req.path`.
        let first;
        let endOfHeaders;
        debug('Regenerating stored HTTP header string for request');
        req._implicitHeader();
        if (req.outputData && req.outputData.length > 0) {
            debug('Patching connection write() output buffer with updated header');
            first = req.outputData[0].data;
            endOfHeaders = first.indexOf('\r\n\r\n') + 4;
            req.outputData[0].data =
                req._header + first.substring(endOfHeaders);
            debug('Output buffer: %o', req.outputData[0].data);
        }
        // Create a socket connection to the proxy server.
        let socket;
        if (this.proxy.protocol === 'https:') {
            debug('Creating `tls.Socket`: %o', this.connectOpts);
            socket = tls.connect(this.connectOpts);
        }
        else {
            debug('Creating `net.Socket`: %o', this.connectOpts);
            socket = net.connect(this.connectOpts);
        }
        // Wait for the socket's `connect` event, so that this `callback()`
        // function throws instead of the `http` request machinery. This is
        // important for i.e. `PacProxyAgent` which determines a failed proxy
        // connection via the `callback()` function throwing.
        await (0, events_1.once)(socket, 'connect');
        return socket;
    }
}
HttpProxyAgent.protocols = ['http', 'https'];
exports.HttpProxyAgent = HttpProxyAgent;
function omit(obj, ...keys) {
    const ret = {};
    let key;
    for (key in obj) {
        if (!keys.includes(key)) {
            ret[key] = obj[key];
        }
    }
    return ret;
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 3669:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HttpsProxyAgent = void 0;
const net = __importStar(__nccwpck_require__(9278));
const tls = __importStar(__nccwpck_require__(4756));
const assert_1 = __importDefault(__nccwpck_require__(2613));
const debug_1 = __importDefault(__nccwpck_require__(2830));
const agent_base_1 = __nccwpck_require__(8894);
const url_1 = __nccwpck_require__(7016);
const parse_proxy_response_1 = __nccwpck_require__(7943);
const debug = (0, debug_1.default)('https-proxy-agent');
const setServernameFromNonIpHost = (options) => {
    if (options.servername === undefined &&
        options.host &&
        !net.isIP(options.host)) {
        return {
            ...options,
            servername: options.host,
        };
    }
    return options;
};
/**
 * The `HttpsProxyAgent` implements an HTTP Agent subclass that connects to
 * the specified "HTTP(s) proxy server" in order to proxy HTTPS requests.
 *
 * Outgoing HTTP requests are first tunneled through the proxy server using the
 * `CONNECT` HTTP request method to establish a connection to the proxy server,
 * and then the proxy server connects to the destination target and issues the
 * HTTP request from the proxy server.
 *
 * `https:` requests have their socket connection upgraded to TLS once
 * the connection to the proxy server has been established.
 */
class HttpsProxyAgent extends agent_base_1.Agent {
    constructor(proxy, opts) {
        super(opts);
        this.options = { path: undefined };
        this.proxy = typeof proxy === 'string' ? new url_1.URL(proxy) : proxy;
        this.proxyHeaders = opts?.headers ?? {};
        debug('Creating new HttpsProxyAgent instance: %o', this.proxy.href);
        // Trim off the brackets from IPv6 addresses
        const host = (this.proxy.hostname || this.proxy.host).replace(/^\[|\]$/g, '');
        const port = this.proxy.port
            ? parseInt(this.proxy.port, 10)
            : this.proxy.protocol === 'https:'
                ? 443
                : 80;
        this.connectOpts = {
            // Attempt to negotiate http/1.1 for proxy servers that support http/2
            ALPNProtocols: ['http/1.1'],
            ...(opts ? omit(opts, 'headers') : null),
            host,
            port,
        };
    }
    /**
     * Called when the node-core HTTP client library is creating a
     * new HTTP request.
     */
    async connect(req, opts) {
        const { proxy } = this;
        if (!opts.host) {
            throw new TypeError('No "host" provided');
        }
        // Create a socket connection to the proxy server.
        let socket;
        if (proxy.protocol === 'https:') {
            debug('Creating `tls.Socket`: %o', this.connectOpts);
            socket = tls.connect(setServernameFromNonIpHost(this.connectOpts));
        }
        else {
            debug('Creating `net.Socket`: %o', this.connectOpts);
            socket = net.connect(this.connectOpts);
        }
        const headers = typeof this.proxyHeaders === 'function'
            ? this.proxyHeaders()
            : { ...this.proxyHeaders };
        const host = net.isIPv6(opts.host) ? `[${opts.host}]` : opts.host;
        let payload = `CONNECT ${host}:${opts.port} HTTP/1.1\r\n`;
        // Inject the `Proxy-Authorization` header if necessary.
        if (proxy.username || proxy.password) {
            const auth = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`;
            headers['Proxy-Authorization'] = `Basic ${Buffer.from(auth).toString('base64')}`;
        }
        headers.Host = `${host}:${opts.port}`;
        if (!headers['Proxy-Connection']) {
            headers['Proxy-Connection'] = this.keepAlive
                ? 'Keep-Alive'
                : 'close';
        }
        for (const name of Object.keys(headers)) {
            payload += `${name}: ${headers[name]}\r\n`;
        }
        const proxyResponsePromise = (0, parse_proxy_response_1.parseProxyResponse)(socket);
        socket.write(`${payload}\r\n`);
        const { connect, buffered } = await proxyResponsePromise;
        req.emit('proxyConnect', connect);
        this.emit('proxyConnect', connect, req);
        if (connect.statusCode === 200) {
            req.once('socket', resume);
            if (opts.secureEndpoint) {
                // The proxy is connecting to a TLS server, so upgrade
                // this socket connection to a TLS connection.
                debug('Upgrading socket connection to TLS');
                return tls.connect({
                    ...omit(setServernameFromNonIpHost(opts), 'host', 'path', 'port'),
                    socket,
                });
            }
            return socket;
        }
        // Some other status code that's not 200... need to re-play the HTTP
        // header "data" events onto the socket once the HTTP machinery is
        // attached so that the node core `http` can parse and handle the
        // error status code.
        // Close the original socket, and a new "fake" socket is returned
        // instead, so that the proxy doesn't get the HTTP request
        // written to it (which may contain `Authorization` headers or other
        // sensitive data).
        //
        // See: https://hackerone.com/reports/541502
        socket.destroy();
        const fakeSocket = new net.Socket({ writable: false });
        fakeSocket.readable = true;
        // Need to wait for the "socket" event to re-play the "data" events.
        req.once('socket', (s) => {
            debug('Replaying proxy buffer for failed request');
            (0, assert_1.default)(s.listenerCount('data') > 0);
            // Replay the "buffered" Buffer onto the fake `socket`, since at
            // this point the HTTP module machinery has been hooked up for
            // the user.
            s.push(buffered);
            s.push(null);
        });
        return fakeSocket;
    }
}
HttpsProxyAgent.protocols = ['http', 'https'];
exports.HttpsProxyAgent = HttpsProxyAgent;
function resume(socket) {
    socket.resume();
}
function omit(obj, ...keys) {
    const ret = {};
    let key;
    for (key in obj) {
        if (!keys.includes(key)) {
            ret[key] = obj[key];
        }
    }
    return ret;
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 7943:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseProxyResponse = void 0;
const debug_1 = __importDefault(__nccwpck_require__(2830));
const debug = (0, debug_1.default)('https-proxy-agent:parse-proxy-response');
function parseProxyResponse(socket) {
    return new Promise((resolve, reject) => {
        // we need to buffer any HTTP traffic that happens with the proxy before we get
        // the CONNECT response, so that if the response is anything other than an "200"
        // response code, then we can re-play the "data" events on the socket once the
        // HTTP parser is hooked up...
        let buffersLength = 0;
        const buffers = [];
        function read() {
            const b = socket.read();
            if (b)
                ondata(b);
            else
                socket.once('readable', read);
        }
        function cleanup() {
            socket.removeListener('end', onend);
            socket.removeListener('error', onerror);
            socket.removeListener('readable', read);
        }
        function onend() {
            cleanup();
            debug('onend');
            reject(new Error('Proxy connection ended before receiving CONNECT response'));
        }
        function onerror(err) {
            cleanup();
            debug('onerror %o', err);
            reject(err);
        }
        function ondata(b) {
            buffers.push(b);
            buffersLength += b.length;
            const buffered = Buffer.concat(buffers, buffersLength);
            const endOfHeaders = buffered.indexOf('\r\n\r\n');
            if (endOfHeaders === -1) {
                // keep buffering
                debug('have not received end of HTTP headers yet...');
                read();
                return;
            }
            const headerParts = buffered
                .slice(0, endOfHeaders)
                .toString('ascii')
                .split('\r\n');
            const firstLine = headerParts.shift();
            if (!firstLine) {
                socket.destroy();
                return reject(new Error('No header received from proxy CONNECT response'));
            }
            const firstLineParts = firstLine.split(' ');
            const statusCode = +firstLineParts[1];
            const statusText = firstLineParts.slice(2).join(' ');
            const headers = {};
            for (const header of headerParts) {
                if (!header)
                    continue;
                const firstColon = header.indexOf(':');
                if (firstColon === -1) {
                    socket.destroy();
                    return reject(new Error(`Invalid header from proxy CONNECT response: "${header}"`));
                }
                const key = header.slice(0, firstColon).toLowerCase();
                const value = header.slice(firstColon + 1).trimStart();
                const current = headers[key];
                if (typeof current === 'string') {
                    headers[key] = [current, value];
                }
                else if (Array.isArray(current)) {
                    current.push(value);
                }
                else {
                    headers[key] = value;
                }
            }
            debug('got proxy server response: %o %o', firstLine, headers);
            cleanup();
            resolve({
                connect: {
                    statusCode,
                    statusText,
                    headers,
                },
                buffered,
            });
        }
        socket.on('error', onerror);
        socket.on('end', onend);
        read();
    });
}
exports.parseProxyResponse = parseProxyResponse;
//# sourceMappingURL=parse-proxy-response.js.map

/***/ }),

/***/ 744:
/***/ ((module) => {

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function (val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}


/***/ }),

/***/ 1860:
/***/ ((module) => {

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global global, define, Symbol, Reflect, Promise, SuppressedError, Iterator */
var __extends;
var __assign;
var __rest;
var __decorate;
var __param;
var __esDecorate;
var __runInitializers;
var __propKey;
var __setFunctionName;
var __metadata;
var __awaiter;
var __generator;
var __exportStar;
var __values;
var __read;
var __spread;
var __spreadArrays;
var __spreadArray;
var __await;
var __asyncGenerator;
var __asyncDelegator;
var __asyncValues;
var __makeTemplateObject;
var __importStar;
var __importDefault;
var __classPrivateFieldGet;
var __classPrivateFieldSet;
var __classPrivateFieldIn;
var __createBinding;
var __addDisposableResource;
var __disposeResources;
var __rewriteRelativeImportExtension;
(function (factory) {
    var root = typeof global === "object" ? global : typeof self === "object" ? self : typeof this === "object" ? this : {};
    if (typeof define === "function" && define.amd) {
        define("tslib", ["exports"], function (exports) { factory(createExporter(root, createExporter(exports))); });
    }
    else if ( true && typeof module.exports === "object") {
        factory(createExporter(root, createExporter(module.exports)));
    }
    else {
        factory(createExporter(root));
    }
    function createExporter(exports, previous) {
        if (exports !== root) {
            if (typeof Object.create === "function") {
                Object.defineProperty(exports, "__esModule", { value: true });
            }
            else {
                exports.__esModule = true;
            }
        }
        return function (id, v) { return exports[id] = previous ? previous(id, v) : v; };
    }
})
(function (exporter) {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };

    __extends = function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };

    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };

    __rest = function (s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    };

    __decorate = function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };

    __param = function (paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
    };

    __esDecorate = function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
        function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
        var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
        var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
        var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
        var _, done = false;
        for (var i = decorators.length - 1; i >= 0; i--) {
            var context = {};
            for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
            for (var p in contextIn.access) context.access[p] = contextIn.access[p];
            context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
            var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
            if (kind === "accessor") {
                if (result === void 0) continue;
                if (result === null || typeof result !== "object") throw new TypeError("Object expected");
                if (_ = accept(result.get)) descriptor.get = _;
                if (_ = accept(result.set)) descriptor.set = _;
                if (_ = accept(result.init)) initializers.unshift(_);
            }
            else if (_ = accept(result)) {
                if (kind === "field") initializers.unshift(_);
                else descriptor[key] = _;
            }
        }
        if (target) Object.defineProperty(target, contextIn.name, descriptor);
        done = true;
    };

    __runInitializers = function (thisArg, initializers, value) {
        var useValue = arguments.length > 2;
        for (var i = 0; i < initializers.length; i++) {
            value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
        }
        return useValue ? value : void 0;
    };

    __propKey = function (x) {
        return typeof x === "symbol" ? x : "".concat(x);
    };

    __setFunctionName = function (f, name, prefix) {
        if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
        return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
    };

    __metadata = function (metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    };

    __awaiter = function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };

    __generator = function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
        return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (g && (g = 0, op[0] && (_ = 0)), _) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };

    __exportStar = function(m, o) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
    };

    __createBinding = Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
            desc = { enumerable: true, get: function() { return m[k]; } };
        }
        Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    });

    __values = function (o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };

    __read = function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };

    /** @deprecated */
    __spread = function () {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    };

    /** @deprecated */
    __spreadArrays = function () {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    };

    __spreadArray = function (to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    };

    __await = function (v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    };

    __asyncGenerator = function (thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
        function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
        function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    };

    __asyncDelegator = function (o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
    };

    __asyncValues = function (o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
    };

    __makeTemplateObject = function (cooked, raw) {
        if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
        return cooked;
    };

    var __setModuleDefault = Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
        o["default"] = v;
    };

    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };

    __importStar = function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };

    __importDefault = function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };

    __classPrivateFieldGet = function (receiver, state, kind, f) {
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    };

    __classPrivateFieldSet = function (receiver, state, value, kind, f) {
        if (kind === "m") throw new TypeError("Private method is not writable");
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
        return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
    };

    __classPrivateFieldIn = function (state, receiver) {
        if (receiver === null || (typeof receiver !== "object" && typeof receiver !== "function")) throw new TypeError("Cannot use 'in' operator on non-object");
        return typeof state === "function" ? receiver === state : state.has(receiver);
    };

    __addDisposableResource = function (env, value, async) {
        if (value !== null && value !== void 0) {
            if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
            var dispose, inner;
            if (async) {
                if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
                dispose = value[Symbol.asyncDispose];
            }
            if (dispose === void 0) {
                if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
                dispose = value[Symbol.dispose];
                if (async) inner = dispose;
            }
            if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
            if (inner) dispose = function() { try { inner.call(this); } catch (e) { return Promise.reject(e); } };
            env.stack.push({ value: value, dispose: dispose, async: async });
        }
        else if (async) {
            env.stack.push({ async: true });
        }
        return value;
    };

    var _SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    __disposeResources = function (env) {
        function fail(e) {
            env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        var r, s = 0;
        function next() {
            while (r = env.stack.pop()) {
                try {
                    if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
                    if (r.dispose) {
                        var result = r.dispose.call(r.value);
                        if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                    }
                    else s |= 1;
                }
                catch (e) {
                    fail(e);
                }
            }
            if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
            if (env.hasError) throw env.error;
        }
        return next();
    };

    __rewriteRelativeImportExtension = function (path, preserveJsx) {
        if (typeof path === "string" && /^\.\.?\//.test(path)) {
            return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function (m, tsx, d, ext, cm) {
                return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : (d + ext + "." + cm.toLowerCase() + "js");
            });
        }
        return path;
    };

    exporter("__extends", __extends);
    exporter("__assign", __assign);
    exporter("__rest", __rest);
    exporter("__decorate", __decorate);
    exporter("__param", __param);
    exporter("__esDecorate", __esDecorate);
    exporter("__runInitializers", __runInitializers);
    exporter("__propKey", __propKey);
    exporter("__setFunctionName", __setFunctionName);
    exporter("__metadata", __metadata);
    exporter("__awaiter", __awaiter);
    exporter("__generator", __generator);
    exporter("__exportStar", __exportStar);
    exporter("__createBinding", __createBinding);
    exporter("__values", __values);
    exporter("__read", __read);
    exporter("__spread", __spread);
    exporter("__spreadArrays", __spreadArrays);
    exporter("__spreadArray", __spreadArray);
    exporter("__await", __await);
    exporter("__asyncGenerator", __asyncGenerator);
    exporter("__asyncDelegator", __asyncDelegator);
    exporter("__asyncValues", __asyncValues);
    exporter("__makeTemplateObject", __makeTemplateObject);
    exporter("__importStar", __importStar);
    exporter("__importDefault", __importDefault);
    exporter("__classPrivateFieldGet", __classPrivateFieldGet);
    exporter("__classPrivateFieldSet", __classPrivateFieldSet);
    exporter("__classPrivateFieldIn", __classPrivateFieldIn);
    exporter("__addDisposableResource", __addDisposableResource);
    exporter("__disposeResources", __disposeResources);
    exporter("__rewriteRelativeImportExtension", __rewriteRelativeImportExtension);
});

0 && (0);


/***/ }),

/***/ 2973:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.REQUIRES_API_URL = exports.PROVIDER_DEFAULT_TYPE = exports.PROVIDER_TYPE_BASES = exports.PROVIDER_BASES = exports.API_TYPE_PATHS = void 0;
exports.resolveApiType = resolveApiType;
exports.resolveApiUrl = resolveApiUrl;
exports.isCopilotUrl = isCopilotUrl;
exports.isAzureProvider = isAzureProvider;
exports.isGithubModelsProvider = isGithubModelsProvider;
exports.requiresApiUrl = requiresApiUrl;
exports.API_TYPE_PATHS = {
    chat: "/chat/completions",
    responses: "/responses",
    messages: "/messages",
    text: "/completions",
};
exports.PROVIDER_BASES = {
    "github-azure-models": "https://models.inference.ai.azure.com",
    "github-models": "https://models.github.ai/inference",
    copilot: "https://api.githubcopilot.com",
    openai: "https://api.openai.com/v1",
    anthropic: "https://api.anthropic.com/v1",
    openrouter: "https://openrouter.ai/api/v1",
    ollama: "http://localhost:11434/v1",
    xai: "https://api.x.ai/v1",
    zai: "https://api.z.ai/api/coding/paas/v4",
    // Qwen Cloud — OpenAI-compatible endpoint (base สำหรับ chat/responses/text)
    qwencloud: "https://ap-southeast-1.maas.qwencloudapi.com/compatible-mode/v1",
    "qwencloud-plan": "https://token-plan.maas.qwencloudapi.com/compatible-mode/v1",
    google: "https://generativelanguage.googleapis.com/v1beta/openai",
    // azure/aws/custom: must provide api_url
};
// Base URL แยกตาม api_type สำหรับ provider ที่มี endpoint ต่างกันในแต่ละโปรโตคอล
// (เช่น Qwen Cloud: OpenAI-compatible อยู่ที่ /compatible-mode/v1 แต่ Anthropic-compatible อยู่ที่ /apps/anthropic)
exports.PROVIDER_TYPE_BASES = {
    qwencloud: {
        messages: "https://ap-southeast-1.maas.qwencloudapi.com/apps/anthropic",
    },
    "qwencloud-plan": {
        messages: "https://token-plan.maas.qwencloudapi.com/apps/anthropic",
    },
};
exports.PROVIDER_DEFAULT_TYPE = {
    anthropic: "messages",
};
exports.REQUIRES_API_URL = ["custom", "azure", "aws"];
function resolveApiType(provider, envApiType) {
    return (envApiType ?? (provider && exports.PROVIDER_DEFAULT_TYPE[provider]) ?? "chat");
}
function resolveApiUrl(provider, apiType, override) {
    if (override)
        return override;
    const base = ((provider && exports.PROVIDER_TYPE_BASES[provider]?.[apiType]) ??
        (provider && exports.PROVIDER_BASES[provider]) ??
        "https://api.githubcopilot.com").replace(/\/$/, "");
    return base + exports.API_TYPE_PATHS[apiType];
}
function isCopilotUrl(url) {
    return url.includes("githubcopilot.com");
}
function isAzureProvider(provider, url) {
    return provider === "azure" || url.includes(".openai.azure.com");
}
function isGithubModelsProvider(provider, url) {
    return provider === "github-models" || url.includes(".inference.ai.azure.com");
}
function requiresApiUrl(provider) {
    return exports.REQUIRES_API_URL.includes(provider);
}


/***/ }),

/***/ 9407:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
const https = __importStar(__nccwpck_require__(5692));
const fs = __importStar(__nccwpck_require__(9896));
const path = __importStar(__nccwpck_require__(6928));
const config_1 = __nccwpck_require__(2973);
const ai_inference_1 = __importStar(__nccwpck_require__(5980));
const core_auth_1 = __nccwpck_require__(417);
// ดึงค่าจาก Environment Variables (รองรับทั้ง GitHub Actions inputs และ env vars ตรง)
const GH_PAT = process.env.INPUT_GH_PAT ?? process.env.GH_PAT;
const PR_NUMBER = process.env.INPUT_PR_NUMBER ?? process.env.PR_NUMBER;
const REPO = process.env.INPUT_REPO ?? process.env.REPO; // format: owner/repo
const MODEL = process.env.INPUT_MODEL ?? process.env.INPUT_COPILOT_MODEL ?? process.env.MODEL ?? process.env.COPILOT_MODEL ?? "gpt-4o";
const MAX_DIFF_CHARS = parseInt(process.env.INPUT_MAX_DIFF_CHARS ?? process.env.MAX_DIFF_CHARS ?? "30000", 10);
const MAX_TOKENS = parseInt(process.env.INPUT_MAX_TOKENS ?? process.env.MAX_TOKENS ?? "4096", 10);
const LANGUAGE = process.env.INPUT_LANGUAGE ?? process.env.LANGUAGE ?? "English";
const TITLE = process.env.INPUT_TITLE ?? process.env.TITLE ?? "AI Code Review";
const FILES_CHANGED = (process.env.INPUT_FILES_CHANGED ?? process.env.FILES_CHANGED ?? "false").toLowerCase() === "true";
const MAX_INLINE_COMMENTS = 20;
// "all" = review การเปลี่ยนแปลงของทุกคน, ไม่ระบุ = ใช้ user ที่ run workflow (GITHUB_ACTOR)
const USERNAME = ((process.env.INPUT_USERNAME ?? "").trim() || process.env.GITHUB_ACTOR || "all").toLowerCase();
// โหมด thinking/reasoning ของโมเดล (ใช้ได้เฉพาะโมเดล/ผู้ให้บริการที่รองรับ)
const MODE = (process.env.INPUT_MODE ?? process.env.MODE ?? "normal").trim().toLowerCase();
// "none" = ไม่ส่ง (ใช้เป็น default ใน dropdown ของ workflow)
const EFFORT_RAW = (process.env.INPUT_EFFORT ?? process.env.EFFORT ?? "").trim().toLowerCase();
const EFFORT = EFFORT_RAW === "none" ? "" : EFFORT_RAW;
const VALID_EFFORTS = ["low", "medium", "high", "max"];
if (EFFORT && !VALID_EFFORTS.includes(EFFORT)) {
    console.warn(`Invalid effort '${EFFORT}' — ignored (valid: ${VALID_EFFORTS.join(", ")}).`);
}
const AGENT_ORDER = ["author", "primary", "specialist", "checklist"];
const AGENT_PROFILES = {
    author: {
        label: "🧑‍💻 Author (Self-Review)",
        persona: "You are the Author of this change reviewing your own code before opening the pull request. " +
            "Explain how your code works: walk through the changed code and describe what each part does and why. " +
            "While explaining, self-review honestly and flag any leftover debug code or temporary artifacts " +
            "you should remove before asking teammates to review.",
    },
    primary: {
        label: "🔍 Primary Reviewer",
        persona: "You are the Primary Reviewer, a peer developer on the same team. " +
            "Check business logic and correctness, edge cases, error handling, and readability. " +
            "Verify whether unit/integration tests cover the real behavior — call out missing tests explicitly.",
    },
    specialist: {
        label: "🛡️ Specialist Reviewer",
        persona: "You are a Senior Specialist Reviewer (Tech Lead with Security and DBA expertise) holding final approval " +
            "authority for core/production systems. Check system architecture, scalability, and overall impact; " +
            "look for security vulnerabilities (injection, auth, secrets, unsafe input handling) " +
            "and database performance issues in critical paths.",
    },
    checklist: {
        label: "📋 Code Review Checklist",
        persona: "You are a systematic Checklist Reviewer. Go through the standard code review checklist below, one item at a time, " +
            "and give each item a status — ✅ pass, ⚠️ needs attention, ❌ fail, or ➖ not applicable — with a short note.\n" +
            "Checklist:\n" +
            "1. Correctness — logic matches the intent of the change\n" +
            "2. Naming and readability\n" +
            "3. Error handling — errors caught with meaningful messages\n" +
            "4. Edge cases — null/empty/boundary/large inputs\n" +
            "5. Security — input validation, injection, secrets, auth\n" +
            "6. Performance — N+1 queries, unnecessary loops, memory\n" +
            "7. Tests — unit/integration coverage for the changed behavior\n" +
            "8. Documentation/comments updated where needed\n" +
            "9. No leftover debug code or TODO markers\n" +
            "10. Backward compatibility — breaking changes flagged\n" +
            "11. Dependencies — no unnecessary new deps, versions pinned\n" +
            "12. Logging — appropriate level, no sensitive data logged",
    },
};
const AGENTS_RAW = (process.env.INPUT_AGENTS ?? process.env.AGENTS ?? "").trim().toLowerCase();
function parseCustomAgents(raw) {
    const cleaned = raw.trim().replace(/```(?:json)?/gi, "").trim();
    if (!cleaned)
        return [];
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start === -1 || end <= start) {
        console.warn("custom_agents: no JSON array found — ignored.");
        return [];
    }
    let parsed;
    try {
        parsed = JSON.parse(cleaned.slice(start, end + 1));
    }
    catch (err) {
        console.warn(`custom_agents: invalid JSON — ignored (${err.message}).`);
        return [];
    }
    if (!Array.isArray(parsed)) {
        console.warn("custom_agents: expected a JSON array — ignored.");
        return [];
    }
    const defs = [];
    for (const entry of parsed) {
        const record = entry;
        if (typeof record?.name !== "string" || !record.name.trim()) {
            console.warn("custom_agents: entry without a 'name' — skipped.");
            continue;
        }
        defs.push({
            name: record.name.trim(),
            label: typeof record.label === "string" && record.label.trim() ? record.label.trim() : undefined,
            persona: typeof record.persona === "string" && record.persona.trim() ? record.persona.trim() : undefined,
        });
    }
    return defs;
}
const CUSTOM_AGENTS = parseCustomAgents(process.env.INPUT_CUSTOM_AGENTS ?? process.env.CUSTOM_AGENTS ?? "");
// registry รวม built-in + custom (ชื่อซ้ำกับ built-in = override)
const AGENT_REGISTRY = new Map(AGENT_ORDER.map((a) => [a, AGENT_PROFILES[a]]));
for (const def of CUSTOM_AGENTS) {
    const existing = AGENT_REGISTRY.get(def.name);
    AGENT_REGISTRY.set(def.name, {
        label: def.label ?? existing?.label ?? def.name,
        persona: def.persona ?? existing?.persona ?? "You are a code reviewer reviewing this pull request.",
    });
}
const CUSTOM_AGENT_NAMES = CUSTOM_AGENTS.map((d) => d.name).filter((n) => !AGENT_ORDER.includes(n));
function resolveAgents() {
    const raw = AGENTS_RAW === "none" ? "" : AGENTS_RAW;
    const available = [...AGENT_ORDER, ...CUSTOM_AGENT_NAMES];
    const lowerMap = new Map(available.map((n) => [n.toLowerCase(), n]));
    if (!raw)
        return CUSTOM_AGENT_NAMES; // ไม่ระบุ agents → รันเฉพาะ agent ใหม่จาก custom_agents (ถ้ามี)
    if (raw === "all")
        return available;
    const selected = [];
    const unknown = [];
    for (const name of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
        const real = lowerMap.get(name);
        if (real) {
            if (!selected.includes(real))
                selected.push(real);
        }
        else {
            unknown.push(name);
        }
    }
    if (unknown.length)
        console.warn(`Unknown agents ignored: ${unknown.join(", ")}`);
    return selected;
}
const AGENTS = resolveAgents();
const BUILT_IN_SKILLS = [
    {
        name: "security",
        description: "OWASP-style security review of the changed code",
        content: "- Injection (SQL/NoSQL/command/template): flag string-concatenated queries and unescaped shell calls\n" +
            "- XSS: unescaped user input rendered in HTML/templates\n" +
            "- Auth: missing authorization checks on new endpoints; IDOR on user-scoped resources\n" +
            "- Secrets: hardcoded keys/tokens/passwords, secrets logged or sent to the client\n" +
            "- Validate input at trust boundaries; avoid unsafe deserialization and SSRF via user-controlled URLs",
    },
    {
        name: "testing",
        description: "Test coverage and test quality guidance",
        content: "- Identify behavior changed by this diff that lacks unit/integration coverage\n" +
            "- Tests should cover the happy path, key edge cases (empty/null/boundary), and error paths\n" +
            "- Flag tests that mock everything and assert nothing meaningful\n" +
            "- Non-deterministic tests (time, random, network) should be controlled or faked",
    },
    {
        name: "performance",
        description: "Performance and resource usage review",
        content: "- N+1 queries: queries or async calls inside loops\n" +
            "- Missing indexes for new query patterns; unbounded queries without LIMIT/pagination\n" +
            "- O(n^2) patterns and large in-memory payloads on hot paths\n" +
            "- Cache repeated expensive work; bound concurrency",
    },
    {
        name: "clean-code",
        description: "Readability and maintainability review",
        content: "- Names should reveal intent; flag abbreviations and misleading names\n" +
            "- Functions should do one thing; flag long functions and deep nesting (suggest guard clauses)\n" +
            "- DRY: duplicated logic to extract; dead code and commented-out blocks to remove\n" +
            "- Magic numbers/strings should become named constants",
    },
    {
        name: "error-handling",
        description: "Error handling and resilience review",
        content: "- Catch errors and handle them with meaningful messages; no silent swallowing\n" +
            "- External calls (HTTP/DB) need timeouts; retry with backoff where appropriate\n" +
            "- Distinguish expected failures (validation) from unexpected ones (bugs)\n" +
            "- Clean up resources on failure paths; keep error types consistent",
    },
    {
        name: "api-contract",
        description: "API design and backward compatibility review",
        content: "- REST conventions: resource naming, correct status codes, pagination\n" +
            "- Breaking changes (removed/renamed fields and endpoints) must be flagged loudly\n" +
            "- Validate request payloads; document new params/fields (e.g. OpenAPI) where applicable\n" +
            "- Use versioning for incompatible changes",
    },
];
const SKILLS_RAW = (process.env.INPUT_SKILLS ?? process.env.SKILLS ?? "").trim().toLowerCase();
const CUSTOM_SKILLS_RAW = (process.env.INPUT_CUSTOM_SKILLS ?? process.env.CUSTOM_SKILLS ?? "").trim();
const SKILLS_PATH = (process.env.INPUT_SKILLS_PATH ?? process.env.SKILLS_PATH ?? "").trim();
// custom_skills (JSON array) — name + content จำเป็น, description เป็นตัวเลือก
function parseCustomSkills(raw) {
    const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
    if (!cleaned)
        return [];
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start === -1 || end <= start) {
        console.warn("custom_skills: no JSON array found — ignored.");
        return [];
    }
    let parsed;
    try {
        parsed = JSON.parse(cleaned.slice(start, end + 1));
    }
    catch (err) {
        console.warn(`custom_skills: invalid JSON — ignored (${err.message}).`);
        return [];
    }
    if (!Array.isArray(parsed)) {
        console.warn("custom_skills: expected a JSON array — ignored.");
        return [];
    }
    const defs = [];
    for (const entry of parsed) {
        const record = entry;
        if (typeof record?.name !== "string" || !record.name.trim() || typeof record?.content !== "string" || !record.content.trim()) {
            console.warn("custom_skills: entry needs 'name' and 'content' — skipped.");
            continue;
        }
        defs.push({
            name: record.name.trim(),
            description: typeof record.description === "string" ? record.description.trim() : "",
            content: record.content.trim(),
        });
    }
    return defs;
}
// skills_path — import ไฟล์ *.md จากโฟลเดอร์ใน repo ทีละชุด (ชื่อ skill = ชื่อไฟล์,
// ถ้าบรรทัดแรกเป็น heading # จะใช้เป็น description)
function loadSkillsFromPath(dir) {
    if (!dir)
        return [];
    let files;
    try {
        files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".md"));
    }
    catch {
        console.warn(`skills_path: cannot read directory '${dir}' — skipped.`);
        return [];
    }
    const defs = [];
    for (const file of files) {
        try {
            const raw = fs.readFileSync(path.join(dir, file), "utf8").trim();
            if (!raw)
                continue;
            const lines = raw.split("\n");
            const heading = /^#\s+(.*)$/.exec(lines[0] ?? "");
            const description = heading ? heading[1].trim() : "";
            const content = heading ? lines.slice(1).join("\n").trim() : raw;
            defs.push({ name: file.replace(/\.md$/i, "").toLowerCase(), description, content });
        }
        catch (err) {
            console.warn(`skills_path: cannot read '${file}' — skipped (${err.message}).`);
        }
    }
    if (defs.length)
        console.log(`skills_path: imported ${defs.length} skill(s) from ${dir}`);
    return defs;
}
// registry: built-in + custom (JSON) + imported (folder) — ชื่อซ้ำ override ตัวเดิม
const SKILL_REGISTRY = new Map();
for (const skill of BUILT_IN_SKILLS)
    SKILL_REGISTRY.set(skill.name, skill);
for (const skill of parseCustomSkills(CUSTOM_SKILLS_RAW))
    SKILL_REGISTRY.set(skill.name, skill);
for (const skill of loadSkillsFromPath(SKILLS_PATH))
    SKILL_REGISTRY.set(skill.name, skill);
// เลือก skill ตามค่า input: "", "auto", "all" หรือรายชื่อคั่น comma
function resolveSkillNames(files) {
    if (!SKILLS_RAW)
        return [];
    if (SKILLS_RAW === "all")
        return [...SKILL_REGISTRY.keys()];
    if (SKILLS_RAW === "auto") {
        // heuristics: เลือกตามเนื้อหาของ diff (ชื่อไฟล์ + patch)
        const paths = files.map((f) => f.filename).join("\n").toLowerCase();
        const text = files.map((f) => f.patch ?? "").join("\n").toLowerCase();
        const picked = new Set(["security", "clean-code", "error-handling", "testing"]);
        if (/(select |insert |update |delete |sql|query|migration|schema|for\s*\(|while\s*\(|\.map\()/.test(text)) {
            picked.add("performance");
        }
        if (/(route|controller|api|endpoint|openapi|swagger|handler)/.test(paths)) {
            picked.add("api-contract");
        }
        return [...picked].filter((n) => SKILL_REGISTRY.has(n));
    }
    const lowerMap = new Map([...SKILL_REGISTRY.keys()].map((n) => [n.toLowerCase(), n]));
    const selected = [];
    const unknown = [];
    for (const name of SKILLS_RAW.split(",").map((s) => s.trim()).filter(Boolean)) {
        const real = lowerMap.get(name);
        if (real) {
            if (!selected.includes(real))
                selected.push(real);
        }
        else {
            unknown.push(name);
        }
    }
    if (unknown.length)
        console.warn(`Unknown skills ignored: ${unknown.join(", ")}`);
    return selected;
}
// แปลงรายชื่อ skill เป็นบล็อกข้อความที่จะแทรกต่อท้าย system prompt ของ agent
function skillsBlock(skillNames) {
    const parts = skillNames
        .map((n) => SKILL_REGISTRY.get(n))
        .filter((s) => !!s)
        .map((s) => `### Skill: ${s.name}${s.description ? ` — ${s.description}` : ""}\n${s.content}`);
    if (!parts.length)
        return "";
    return `\n\n--- Skills (apply when relevant) ---\n${parts.join("\n\n")}`;
}
// ให้ agent ค้นหาข้อมูลจากเว็บเองได้ระหว่าง review (opt-in เพราะ provider ต้องรองรับ tools)
const WEB_SEARCH = (process.env.INPUT_WEB_SEARCH ?? process.env.WEB_SEARCH ?? "false").toLowerCase() === "true";
const MAX_SEARCH_ROUNDS = 3;
const PROVIDER = (process.env.INPUT_PROVIDER ?? process.env.PROVIDER);
const API_TYPE = (0, config_1.resolveApiType)(PROVIDER, process.env.INPUT_API_TYPE ?? process.env.INPUT_COMPLETION_TYPE ?? process.env.API_TYPE ?? process.env.COMPLETION_TYPE);
const API_URL = (0, config_1.resolveApiUrl)(PROVIDER, API_TYPE, process.env.INPUT_API_URL ?? process.env.API_URL);
if ((0, config_1.requiresApiUrl)(PROVIDER) && !process.env.INPUT_API_URL && !process.env.API_URL) {
    console.error(`api_url is required when provider is '${PROVIDER}'.`);
    process.exit(1);
}
// EXPLICIT_API_KEY is the raw api_key input (personal PAT or provider key)
// For Copilot, api_key should be a personal GitHub PAT with Copilot subscription
// Use || (not ??) so empty strings (from unset GitHub Actions secrets) fall through
const EXPLICIT_API_KEY = process.env.INPUT_API_KEY || process.env.API_KEY || undefined;
let API_KEY = EXPLICIT_API_KEY ?? GH_PAT ?? "";
function fetchJson(url, options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let raw = "";
            res.on("data", (chunk) => (raw += chunk));
            res.on("end", () => {
                try {
                    resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw), text: raw });
                }
                catch {
                    resolve({ status: res.statusCode ?? 0, data: {}, text: raw });
                }
            });
        });
        req.on("error", reject);
        if (body)
            req.write(body);
        req.end();
    });
}
function githubApiGet(url) {
    const options = {
        method: "GET",
        headers: {
            Authorization: `token ${GH_PAT}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "ai-code-review",
        },
    };
    return fetchJson(url, options);
}
// 1. ดึงไฟล์ที่ถูกเปลี่ยนแปลง (Diff) จาก GitHub API
async function getPrFiles() {
    const { status, data, text } = await githubApiGet(`https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}/files`);
    if (status !== 200) {
        console.error(`GitHub API error: ${status} ${text.slice(0, 500)}`);
        return [];
    }
    if (!Array.isArray(data)) {
        console.error(`Unexpected GitHub API response: ${text.slice(0, 500)}`);
        return [];
    }
    return data;
}
// รวม mapping ชื่อไฟล์ → ชุด commit authors ของ PR นี้
// (ถ้าระบุ filterLogin จะดึงรายละเอียดเฉพาะ commits ของ user นั้นเพื่อประหยัด API calls)
async function getFileAuthors(filterLogin) {
    const fileAuthors = new Map();
    const target = filterLogin?.toLowerCase();
    let page = 1;
    while (page <= 3) { // รองรับสูงสุด 300 commits
        const { status, data, text } = await githubApiGet(`https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}/commits?per_page=100&page=${page}`);
        if (status !== 200 || !Array.isArray(data)) {
            console.error(`GitHub commits API error: ${status} ${text.slice(0, 500)}`);
            return fileAuthors;
        }
        for (const commit of data) {
            const login = commit.author?.login;
            if (!login)
                continue; // commit ที่ไม่ได้ผูกกับ GitHub account
            if (target && login.toLowerCase() !== target)
                continue;
            const detail = await githubApiGet(`https://api.github.com/repos/${REPO}/commits/${commit.sha}`);
            if (detail.status !== 200) {
                console.error(`Commit API error for ${commit.sha.slice(0, 7)}: ${detail.status}`);
                continue;
            }
            for (const file of detail.data.files ?? []) {
                const authors = fileAuthors.get(file.filename) ?? new Set();
                authors.add(login);
                fileAuthors.set(file.filename, authors);
            }
        }
        if (data.length < 100)
            break;
        page++;
    }
    return fileAuthors;
}
function filterFilesByUser(files, fileAuthors) {
    if (USERNAME === "all")
        return files;
    if (!fileAuthors.size) {
        console.log(`No commits authored by '${USERNAME}' found in this PR.`);
        return [];
    }
    const filtered = files.filter((f) => {
        const authors = [...(fileAuthors.get(f.filename) ?? [])];
        return authors.some((a) => a.toLowerCase() === USERNAME);
    });
    console.log(`${filtered.length} file(s) changed by '${USERNAME}': ${filtered.map((f) => f.filename).join(", ") || "(none)"}`);
    return filtered;
}
// สร้างบรรทัด scope พร้อม @mention:
// - ระบุ user  → "Reviewing changes by @user"
// - all        → "Reviewing changes by @a (file1, file2), @b (file3)" (tag เจ้าของ code เป็นรายคน)
function buildScopeLine(files, fileAuthors) {
    if (USERNAME !== "all")
        return `Reviewing changes by @${USERNAME}\n\n`;
    const byAuthor = new Map();
    for (const file of files) {
        for (const author of fileAuthors.get(file.filename) ?? []) {
            const list = byAuthor.get(author) ?? [];
            list.push(file.filename);
            byAuthor.set(author, list);
        }
    }
    if (!byAuthor.size)
        return "";
    const parts = [...byAuthor.entries()].map(([author, fileList]) => {
        const shown = fileList.slice(0, 3).map((f) => `\`${f}\``).join(", ");
        const more = fileList.length > 3 ? `, +${fileList.length - 3} more` : "";
        return `@${author} (${shown}${more})`;
    });
    return `Reviewing changes by ${parts.join(", ")}\n\n`;
}
// รวม diff ของทุกไฟล์เป็นข้อความเดียว (โหมด comment รวมทั้ง PR)
function buildDiffText(files) {
    let diffContent = "";
    for (const file of files) {
        if (file.patch) {
            diffContent += `File: ${file.filename}\n${file.patch}\n\n`;
            if (diffContent.length > MAX_DIFF_CHARS) {
                diffContent = diffContent.slice(0, MAX_DIFF_CHARS) + "\n\n... (diff truncated)";
                break;
            }
        }
    }
    return diffContent;
}
// นับบรรทัด +/- ของ diff (สำหรับเช็คขนาด PR ของ agent "author")
function computeDiffStats(files) {
    let added = 0;
    let removed = 0;
    for (const file of files) {
        for (const line of (file.patch ?? "").split("\n")) {
            if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@") || line.startsWith("\\"))
                continue;
            if (line.startsWith("+"))
                added++;
            else if (line.startsWith("-"))
                removed++;
        }
    }
    return { added, removed };
}
// บรรทัดสรุปขนาด PR ตาม guideline 200–400 บรรทัด
function prSizeLine(files) {
    const { added, removed } = computeDiffStats(files);
    const total = added + removed;
    const verdict = total > 400
        ? " ⚠️ exceeds the 200–400 line guideline — consider splitting this PR"
        : " ✅ within the 200–400 line guideline";
    return `**PR size:** +${added} / -${removed} (${total} changed lines, ${files.length} files)${verdict}`;
}
// --- โหมด files_changed: review ทีละไฟล์แล้วโพสต์ inline comment บน diff ---
// หมายเลขบรรทัดฝั่งไฟล์ใหม่ที่แปะ inline comment ได้ (เฉพาะบรรทัดที่อยู่ใน hunk ของ diff)
function commentableLines(patch) {
    const lines = [];
    let newLine = 0; // 0 = ยังไม่เข้า hunk แรก (ข้ามส่วน header +++/---)
    for (const raw of patch.split("\n")) {
        const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)/.exec(raw);
        if (hunk) {
            newLine = parseInt(hunk[1], 10);
            continue;
        }
        if (newLine === 0 || raw.startsWith("\\") || raw.startsWith("-"))
            continue;
        lines.push(newLine++);
    }
    return lines;
}
function snapToNearestLine(target, valid) {
    if (!valid.length)
        return null;
    let best = valid[0];
    let bestDist = Math.abs(target - best);
    for (const line of valid) {
        const dist = Math.abs(target - line);
        if (dist < bestDist) {
            best = line;
            bestDist = dist;
        }
    }
    return best;
}
// คาดหวัง JSON array [{"line": 123, "comment": "..."}] — parseแบบยืดหยุ่น
function parseInlineComments(raw) {
    const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start === -1 || end <= start)
        return [];
    let parsed;
    try {
        parsed = JSON.parse(cleaned.slice(start, end + 1));
    }
    catch {
        return [];
    }
    if (!Array.isArray(parsed))
        return [];
    const items = [];
    for (const entry of parsed) {
        const record = entry;
        const line = parseInt(String(record?.line), 10);
        const comment = record?.comment;
        if (!Number.isFinite(line) || typeof comment !== "string" || !comment.trim())
            continue;
        items.push({ line, comment: comment.trim() });
    }
    return items;
}
// เจ้าของไฟล์: ระบุ user → user นั้น, all → เจ้าของตาม commit authorship
function fileOwners(filename, fileAuthors) {
    if (USERNAME !== "all")
        return [USERNAME];
    return [...(fileAuthors.get(filename) ?? [])];
}
// link ไปหน้า profile GitHub — แสดงเป็น @username แต่ไม่ใช่ mention จริง
// (ไม่ส่ง notification ซ้ำทุก comment = ไม่ noise)
function ownerLinks(filename, fileAuthors) {
    return fileOwners(filename, fileAuthors)
        .map((o) => `[@${o}](https://github.com/${o})`)
        .join(" ");
}
// link ชื่อเจ้าของงานขึ้นหน้า section ของทุก agent — แสดงเป็น @username คลิกได้ แต่ไม่ใช่ mention จริง
function ownerGreeting(files, fileAuthors) {
    const owners = [];
    if (USERNAME !== "all") {
        owners.push(USERNAME);
    }
    else {
        for (const f of files) {
            for (const owner of fileAuthors.get(f.filename) ?? []) {
                if (!owners.includes(owner))
                    owners.push(owner);
            }
        }
    }
    return owners.length
        ? `${owners.map((o) => `[@${o}](https://github.com/${o})`).join(" ")} — `
        : "";
}
// คำสั่งให้ AI คุยกับเจ้าของโค้ดโดยตรง (แทนการพูดลอย ๆ)
// โหมดระบุ user → คุยกับ user เดี่ยว, โหมด all → แนบ mapping ไฟล์ → เจ้าของให้อ้างถูกคน
// (ใช้ชื่อล้วนไม่มี @ เพื่อไม่ให้เกิด mention จริงซ้ำในทุก section — link จริงอยู่ที่ prefix ของเรา)
function addresseePrompt(files, fileAuthors) {
    if (USERNAME !== "all") {
        return `\n\nAddress the code owner ${USERNAME} directly in your response — talk to them by name (plain username, no @), not about them.`;
    }
    const lines = files
        .map((f) => {
        const owners = [...(fileAuthors.get(f.filename) ?? [])];
        return owners.length ? `${f.filename} → ${owners.join(", ")}` : null;
    })
        .filter((l) => !!l)
        .slice(0, 30);
    if (!lines.length)
        return "";
    return (`\n\nFile owners — address the owner directly when commenting on their file ` +
        `(talk to them by name, plain username, no @):\n${lines.join("\n")}`);
}
async function reviewFilesInline(files, scopeLine = "", skillSuffix = "", fileAuthors = new Map()) {
    const inline = [];
    // 📋 Checklist ไม่ทำ inline — สรุปเป็นตารางลง review summary (tab Conversation) แทน
    let checklistSection = "";
    if (AGENTS.includes("checklist")) {
        const profile = AGENT_REGISTRY.get("checklist");
        const diff = buildDiffText(files);
        if (profile && diff) {
            console.log(`${profile.label} summarizing to conversation...`);
            const userPrompt = `Run your code review checklist against the diff below. Present the result as a markdown table ` +
                `with columns | # | Item | Status | Note | — one row per checklist item ` +
                `(✅ pass, ⚠️ needs attention, ❌ fail, ➖ not applicable). Respond in ${LANGUAGE}.\n\n${diff}` +
                addresseePrompt(files, fileAuthors);
            const result = await askAI(profile.persona + skillSuffix, userPrompt);
            checklistSection =
                `### ${profile.label}\n\n${ownerGreeting(files, fileAuthors)}` +
                    (closeUnbalancedFence(result.trim()) || "No findings.");
        }
    }
    // agent ที่จะรันแบบ inline: ตาม input (built-in + custom) ยกเว้น checklist หรือโปรไฟล์เดี่ยวเมื่อไม่ได้ระบุ
    const inlineAgentNames = AGENTS.filter((a) => a !== "checklist");
    const reviewers = [];
    for (const name of inlineAgentNames) {
        const p = AGENT_REGISTRY.get(name);
        if (!p)
            continue;
        reviewers.push({
            label: p.label,
            system: `${p.persona}${skillSuffix} ` +
                `Respond ONLY with a JSON array (no markdown fences, no extra text). Write comments in ${LANGUAGE}.`,
        });
    }
    if (!reviewers.length) {
        reviewers.push({
            label: "",
            system: `You are an expert Code Reviewer. You review one changed file and leave short, precise inline comments.${skillSuffix} ` +
                `Respond ONLY with a JSON array (no markdown fences, no extra text). Write comments in ${LANGUAGE}.`,
        });
    }
    for (const file of files) {
        let patch = file.patch ?? "";
        if (patch.length > MAX_DIFF_CHARS) {
            patch = patch.slice(0, MAX_DIFF_CHARS) + "\n... (patch truncated)";
        }
        const owners = fileOwners(file.filename, fileAuthors);
        const ownerLink = owners.length ? ownerLinks(file.filename, fileAuthors) : "";
        const userPrompt = `Review the diff below and list problems or improvements worth flagging.\n` +
            `Return a JSON array; each item must be {"line": <line number in the NEW version of the file>, "comment": "<concise review comment>"}.\n` +
            `Anchor each comment to the most relevant changed line. If nothing needs a comment, return [].\n\n` +
            `File: ${file.filename}\n${patch}` +
            (owners.length
                ? `\n\nYou are talking directly to ${owners.join(", ")}, the owner(s) of this file — ` +
                    `write your comment as if speaking to them by name (plain username, no @).`
                : "");
        for (const reviewer of reviewers) {
            console.log(`Reviewing ${file.filename} (${patch.length} chars)${reviewer.label ? ` — ${reviewer.label}` : ""}...`);
            const result = await askAI(reviewer.system, userPrompt);
            const valid = commentableLines(patch);
            const before = inline.length;
            for (const item of parseInlineComments(result)) {
                const line = snapToNearestLine(item.line, valid);
                if (line === null)
                    continue;
                // ทุก comment ขึ้นต้นด้วยชื่อเจ้าของไฟล์เป็น link ไป profile (แสดงเป็น @username แต่ไม่ใช่ mention จริง)
                inline.push({
                    path: file.filename,
                    line,
                    body: closeUnbalancedFence(`${reviewer.label ? `**${reviewer.label}:** ` : ""}${ownerLink ? `${ownerLink} — ` : ""}${item.comment}`),
                });
                if (inline.length >= MAX_INLINE_COMMENTS)
                    break;
            }
            if (inline.length === before) {
                console.log(`  ${reviewer.label || "reviewer"}: no inline comments parsed for ${file.filename}`);
            }
            if (inline.length >= MAX_INLINE_COMMENTS)
                break;
        }
        if (inline.length >= MAX_INLINE_COMMENTS) {
            console.log(`Reached inline comment cap (${MAX_INLINE_COMMENTS}); skipping remaining files.`);
            break;
        }
    }
    if (!inline.length) {
        if (checklistSection) {
            // ไม่มี inline comment แต่ checklist มีผล — โพสต์เป็น comment ลง Conversation เลย
            console.log("No inline comments — posting checklist summary as a PR comment...");
            await postCommentToPr(checklistSection, scopeLine);
        }
        else {
            console.log("AI left no inline comments.");
        }
        return;
    }
    await postInlineReview(inline, scopeLine, checklistSection);
}
// สร้าง PR review พร้อม inline comments ผูกกับบรรทัดใน tab Files changed
// (checklistSection = สรุปตาราง checklist ที่จะแนบลง review body ใน tab Conversation)
async function postInlineReview(comments, scopeLine = "", checklistSection = "") {
    const url = `https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}/reviews`;
    const provider = PROVIDER ?? "copilot";
    const payload = JSON.stringify({
        body: `## ${TITLE} — \`${MODEL}\` via \`${provider}\`\n\n${scopeLine}` +
            `Reviewed changed files: ${comments.length} inline comment(s).` +
            (checklistSection ? `\n\n${checklistSection}` : ""),
        event: "COMMENT",
        comments: comments.map((c) => ({ path: c.path, line: c.line, body: c.body })),
    });
    const options = {
        method: "POST",
        headers: {
            Authorization: `token ${GH_PAT}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
            "User-Agent": "ai-code-review",
        },
    };
    const { status, text } = await fetchJson(url, options, payload);
    if (status >= 200 && status < 300) {
        console.log(`Inline review posted successfully (${comments.length} comment(s)).`);
        return;
    }
    console.error(`Failed to post inline review: ${status} ${text.slice(0, 300)}`);
    console.log("Falling back to a single PR comment...");
    const fallback = comments.map((c) => `**\`${c.path}:${c.line}\`**\n\n${c.body}`).join("\n\n");
    await postCommentToPr(`${checklistSection ? `${checklistSection}\n\n` : ""}${fallback}`, scopeLine);
}
// ปิด code fence ที่ไม่สมดุลในคำตอบของ AI — fence ที่เปิดโดยไม่ปิดจะกลืน markdown
// ของ section ถัดไป (ทำให้ heading ของ agent ตัวถัดไปหายไป)
// ตรวจทีละบรรทัดแบบ track เปิด/ปิด รองรับทั้ง ``` ~~~ และ fence ยาว 4+ backticks
function closeUnbalancedFence(text) {
    const fenceRe = /^ {0,3}(`{3,}|~{3,})/gm;
    let openFence = null;
    let m;
    while ((m = fenceRe.exec(text))) {
        if (!openFence) {
            openFence = m[1];
        }
        else if (m[1].charAt(0) === openFence.charAt(0) && m[1].length >= openFence.length) {
            openFence = null;
        }
    }
    return openFence ? `${text}\n${openFence}` : text;
}
// --- Web search tool (ใช้เมื่อ web_search=true) ---
const WEB_SEARCH_TOOL = {
    type: "function",
    function: {
        name: "web_search",
        description: "Search the web for up-to-date information (docs, APIs, CVEs, best practices). Returns results with titles, URLs and snippets.",
        parameters: {
            type: "object",
            properties: { query: { type: "string", description: "Search query" } },
            required: ["query"],
        },
    },
};
// ค้นหาผ่าน DuckDuckGo HTML endpoint (ไม่ต้องใช้ API key) — คืนผลลัพธ์แบบข้อความให้ model
async function duckDuckGoSearch(query) {
    const { status, text } = await fetchJson(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: {
            "User-Agent": "Mozilla/5.0 (compatible; ai-code-review-action/1.0)",
            Accept: "text/html",
        },
    });
    if (status !== 200)
        return `(web search unavailable — HTTP ${status})`;
    const decode = (s) => s
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#x27;|&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&#x2F;/g, "/");
    const stripTags = (s) => decode(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    const realUrl = (href) => {
        const m = /[?&]uddg=([^&]+)/.exec(href);
        return m ? decodeURIComponent(m[1]) : href;
    };
    const results = [];
    const snippets = [];
    const linkRe = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    const snipRe = /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
    let m;
    while ((m = linkRe.exec(text)) && results.length < 5) {
        results.push({ title: stripTags(m[2]), url: realUrl(decode(m[1])) });
    }
    while ((m = snipRe.exec(text)) && snippets.length < 5)
        snippets.push(stripTags(m[1]));
    if (!results.length)
        return "(no results)";
    return results
        .map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}${snippets[i] ? `\n   ${snippets[i]}` : ""}`)
        .join("\n");
}
// ประมวลผล tool_calls ที่ได้จาก model — คืน messages ที่ต่อยอดแล้ว หรือ null ถ้าไม่มีการเรียก tool
async function handleWebSearchToolCalls(assistantMessage, messages) {
    const calls = WEB_SEARCH ? assistantMessage.tool_calls ?? [] : [];
    if (!calls.length)
        return false;
    messages.push({ role: "assistant", content: assistantMessage.content ?? "", tool_calls: calls });
    for (const call of calls) {
        if (call.function?.name !== "web_search") {
            messages.push({ role: "tool", tool_call_id: call.id, content: "unknown tool" });
            continue;
        }
        let query = "";
        try {
            query = String(JSON.parse(call.function?.arguments ?? "{}").query ?? "");
        }
        catch {
            // arguments ไม่ใช่ JSON ที่ถูกต้อง — ใช้ข้อความดิบไป search เลย
            query = call.function?.arguments ?? "";
        }
        console.log(`  🔎 agent web_search: ${query}`);
        const result = await duckDuckGoSearch(query);
        messages.push({ role: "tool", tool_call_id: call.id, content: result });
    }
    return true;
}
// 2. ส่งข้อมูลไปถาม AI
async function askAI(systemPrompt, userPrompt) {
    console.log(`Using api_type: ${API_TYPE} (${API_URL})`);
    if ((0, config_1.isGithubModelsProvider)(PROVIDER, API_URL) && API_TYPE === "chat") {
        return askGitHubModels(systemPrompt, userPrompt);
    }
    if (API_TYPE === "chat" || API_TYPE === "text") {
        return askOpenAICompat(systemPrompt, userPrompt);
    }
    if (API_TYPE === "messages") {
        return askAnthropic(systemPrompt, userPrompt);
    }
    if (API_TYPE === "responses") {
        return askResponses(systemPrompt, userPrompt);
    }
    return askOpenAICompat(systemPrompt, userPrompt);
}
// พารามิเตอร์เสริมสำหรับโหมด thinking/effort — ส่งเฉพาะเมื่อผู้ใช้ระบุเท่านั้น
// (ค่าเริ่มต้น mode=normal, effort="" จะไม่ส่งอะไรเพิ่ม จึงไม่กระทบการใช้งานเดิม)
function isEffortValid() {
    return !!EFFORT && VALID_EFFORTS.includes(EFFORT);
}
// OpenAI-compatible chat: enable_thinking (Qwen-style) + reasoning_effort (OpenAI o-series/GPT-5)
function chatThinkingParams() {
    const extras = {};
    if (isEffortValid())
        extras.reasoning_effort = EFFORT;
    if (MODE === "thinking")
        extras.enable_thinking = true;
    return extras;
}
// OpenAI Responses API: reasoning.effort
function responsesThinkingParams() {
    return isEffortValid() ? { reasoning: { effort: EFFORT } } : {};
}
// Anthropic Messages API: thinking ต้องมี budget_tokens และ max_tokens ต้องมากกว่า budget
function anthropicThinkingParams() {
    if (MODE !== "thinking")
        return {};
    const budgetByEffort = { low: 1024, medium: 2048, high: 4096, max: 16384 };
    let budget = (EFFORT && budgetByEffort[EFFORT]) || 1024;
    if (budget >= MAX_TOKENS) {
        budget = Math.max(1024, MAX_TOKENS - 1);
    }
    if (budget >= MAX_TOKENS) {
        console.warn(`Cannot enable thinking: max_tokens (${MAX_TOKENS}) must be greater than the thinking budget (min 1024).`);
        return {};
    }
    return { thinking: { type: "enabled", budget_tokens: budget } };
}
// 2b. GitHub Models — ใช้ @azure-rest/ai-inference SDK อย่างเป็นทางการ
async function askGitHubModels(systemPrompt, userPrompt) {
    const endpoint = API_URL.replace(/\/chat\/completions\/?$/, "");
    const token = GH_PAT ?? API_KEY;
    const client = (0, ai_inference_1.default)(endpoint, new core_auth_1.AzureKeyCredential(token));
    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
    ];
    for (let round = 0; round <= MAX_SEARCH_ROUNDS; round++) {
        const body = {
            messages,
            model: MODEL,
            max_tokens: MAX_TOKENS,
            ...chatThinkingParams(),
        };
        if (WEB_SEARCH)
            body.tools = [WEB_SEARCH_TOOL];
        // body มี fields แบบ dynamic (tools/thinking) จึงต้อง cast ให้ผ่าน type ของ SDK
        const response = await client.path("/chat/completions").post({ body: body });
        if ((0, ai_inference_1.isUnexpected)(response)) {
            const errText = JSON.stringify(response.body.error ?? response.body);
            console.error(`GitHub Models API error: ${response.status}`);
            console.error(`Response: ${errText.slice(0, 500)}`);
            return `⚠️ GitHub Models API returned status ${response.status}. Response: ${errText.slice(0, 200)}`;
        }
        const choice = response.body.choices?.[0];
        const msg = (choice?.message ?? {});
        if (await handleWebSearchToolCalls(msg, messages))
            continue;
        return msg.content ?? "";
    }
    return "⚠️ Reached the web-search round limit without a final answer.";
}
async function askOpenAICompat(systemPrompt, userPrompt) {
    const isChat = API_TYPE !== "text";
    const buildOptions = (payload) => {
        const headers = {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
            "User-Agent": "ai-code-review",
        };
        // Azure uses api-key header instead of Bearer
        if ((0, config_1.isAzureProvider)(PROVIDER, API_URL)) {
            delete headers["Authorization"];
            headers["api-key"] = API_KEY;
        }
        if ((0, config_1.isCopilotUrl)(API_URL)) {
            headers["editor-version"] = "vscode/1.95.0";
            headers["editor-plugin-version"] = "copilot-chat/0.22.0";
            headers["openai-organization"] = "github-copilot";
            headers["openai-intent"] = "copilot-ghost";
        }
        return { method: "POST", headers };
    };
    if (isChat) {
        // web_search=true: วน function-calling loop — model เรียก web_search เราไปหาผลให้แล้วส่งกลับ
        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ];
        for (let round = 0; round <= MAX_SEARCH_ROUNDS; round++) {
            const body = { model: MODEL, messages, ...chatThinkingParams() };
            if (WEB_SEARCH)
                body.tools = [WEB_SEARCH_TOOL];
            const payload = JSON.stringify(body);
            const { status, data, text } = await fetchJson(API_URL, buildOptions(payload), payload);
            if (status !== 200) {
                console.error(`AI API error: ${status}`);
                console.error(`Response: ${text.slice(0, 500)}`);
                return `⚠️ AI API returned status ${status}. Response: ${text.slice(0, 200)}`;
            }
            if (!data.choices?.length) {
                console.error(`Unexpected AI response: ${text.slice(0, 500)}`);
                return `⚠️ Unexpected AI API response format: ${text.slice(0, 200)}`;
            }
            const msg = data.choices[0].message;
            if (await handleWebSearchToolCalls(msg, messages))
                continue;
            return msg.content ?? "";
        }
        return "⚠️ Reached the web-search round limit without a final answer.";
    }
    const payload = JSON.stringify({
        model: MODEL,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        max_tokens: MAX_TOKENS,
    });
    const { status, data, text } = await fetchJson(API_URL, buildOptions(payload), payload);
    if (status !== 200) {
        console.error(`AI API error: ${status}`);
        console.error(`Response: ${text.slice(0, 500)}`);
        return `⚠️ AI API returned status ${status}. Response: ${text.slice(0, 200)}`;
    }
    if (!data.choices?.length) {
        console.error(`Unexpected AI response: ${text.slice(0, 500)}`);
        return `⚠️ Unexpected AI API response format: ${text.slice(0, 200)}`;
    }
    return data.choices[0].text ?? "";
}
async function askAnthropic(systemPrompt, userPrompt) {
    const payload = JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        ...anthropicThinkingParams(),
        // web_search=true: native server-side web search ของ Anthropic (model ค้นเอง)
        ...(WEB_SEARCH ? { tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }] } : {}),
    });
    const options = {
        method: "POST",
        headers: {
            "x-api-key": API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
            "User-Agent": "ai-code-review",
        },
    };
    const { status, data, text } = await fetchJson(API_URL, options, payload);
    if (status !== 200) {
        console.error(`Anthropic API error: ${status}`);
        console.error(`Response: ${text.slice(0, 500)}`);
        return `⚠️ Anthropic API returned status ${status}. Response: ${text.slice(0, 200)}`;
    }
    const textBlocks = (data.content ?? []).filter((c) => c.type === "text").map((c) => c.text);
    if (!textBlocks.length) {
        console.error(`Unexpected Anthropic response: ${text.slice(0, 500)}`);
        return `⚠️ Unexpected Anthropic API response format: ${text.slice(0, 200)}`;
    }
    return textBlocks.join("\n\n");
}
async function askResponses(systemPrompt, userPrompt) {
    const payload = JSON.stringify({
        model: MODEL,
        instructions: systemPrompt,
        input: userPrompt,
        ...responsesThinkingParams(),
        // web_search=true: native web search tool ของ OpenAI Responses API
        ...(WEB_SEARCH ? { tools: [{ type: "web_search" }] } : {}),
    });
    const options = {
        method: "POST",
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
            "User-Agent": "ai-code-review",
        },
    };
    const { status, data, text } = await fetchJson(API_URL, options, payload);
    if (status !== 200) {
        console.error(`Responses API error: ${status}`);
        console.error(`Response: ${text.slice(0, 500)}`);
        return `⚠️ Responses API returned status ${status}. Response: ${text.slice(0, 200)}`;
    }
    const message = data.output?.find((o) => o.type === "message");
    const textBlock = message?.content?.find((c) => c.type === "output_text");
    if (!textBlock) {
        console.error(`Unexpected Responses API response: ${text.slice(0, 500)}`);
        return `⚠️ Unexpected Responses API response format: ${text.slice(0, 200)}`;
    }
    return textBlock.text;
}
// 3. โพสต์คำตอบกลับลงใน GitHub PR (scopeLine = บรรทัด @mention ผู้เกี่ยวข้อง)
async function postCommentToPr(message, scopeLine = "") {
    const url = `https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments`;
    const provider = PROVIDER ?? "copilot";
    const payload = JSON.stringify({
        body: `## ${TITLE} — \`${MODEL}\` via \`${provider}\`\n\n${scopeLine}${message}`,
    });
    const options = {
        method: "POST",
        headers: {
            Authorization: `token ${GH_PAT}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
            "User-Agent": "ai-code-review",
        },
    };
    const { status, text } = await fetchJson(url, options, payload);
    if (status === 200 || status === 201) {
        console.log("Comment posted successfully.");
    }
    else {
        console.error(`Failed to post comment: ${status} ${text.slice(0, 300)}`);
    }
}
// --- Main Execution ---
async function getCopilotToken(ghPat) {
    const url = "https://api.github.com/copilot_internal/v2/token";
    const options = {
        method: "GET",
        headers: {
            Authorization: `token ${ghPat}`,
            Accept: "application/json",
            "User-Agent": "ai-code-review",
        },
    };
    const { status, data, text } = await fetchJson(url, options);
    if (status !== 200 || !data.token) {
        throw new Error(`Failed to get Copilot token: ${status} ${text.slice(0, 200)}`);
    }
    console.log("Copilot token obtained.");
    return data.token;
}
async function main() {
    if (!GH_PAT || !PR_NUMBER || !REPO) {
        console.error("Missing required environment variables. Set GH_PAT, PR_NUMBER, REPO.");
        process.exit(1);
    }
    console.log("Fetching PR diff...");
    // Exchange PAT for Copilot session token when using Copilot API.
    // Uses api_key (personal PAT with Copilot subscription) if provided,
    // otherwise falls back to gh_pat. Note: GITHUB_TOKEN will fail here — use a personal PAT.
    if ((0, config_1.isCopilotUrl)(API_URL)) {
        const patForExchange = EXPLICIT_API_KEY ?? GH_PAT ?? "";
        if (!patForExchange) {
            console.error("Copilot requires a GitHub personal PAT with Copilot subscription. Set api_key (preferred) or gh_pat.");
            process.exit(1);
        }
        console.log("Exchanging GitHub PAT for Copilot session token...");
        API_KEY = await getCopilotToken(patForExchange);
    }
    // mapping ไฟล์ → commit authors (โหมด all ต้องใช้ทั้งหมดเพื่อ tag รายคน,
    // โหมดระบุ user ดึงเฉพาะ commits ของ user นั้น)
    const fileAuthors = await getFileAuthors(USERNAME === "all" ? undefined : USERNAME);
    const files = filterFilesByUser(await getPrFiles(), fileAuthors);
    // เลือก skills ครั้งเดียวแล้วใช้กับทุก agent / ทุกโหมด
    const skillNames = resolveSkillNames(files);
    const skillSuffix = skillsBlock(skillNames);
    console.log(`Skills: ${skillNames.join(", ") || "(none)"}`);
    if (FILES_CHANGED) {
        const reviewable = files.filter((f) => f.patch);
        if (!reviewable.length) {
            console.log("No changed files with a diff to review.");
            return;
        }
        console.log(`files_changed mode: reviewing ${reviewable.length} changed file(s) inline...`);
        await reviewFilesInline(reviewable, buildScopeLine(reviewable, fileAuthors), skillSuffix, fileAuthors);
        console.log("Done!");
        return;
    }
    const diff = buildDiffText(files);
    if (!diff) {
        console.log("No diff found or diff is too large.");
        return;
    }
    const scopeLine = buildScopeLine(files.filter((f) => f.patch), fileAuthors);
    const addressee = addresseePrompt(files, fileAuthors);
    const ownerGreet = ownerGreeting(files, fileAuthors);
    if (AGENTS.length) {
        console.log(`Diff size: ${diff.length} chars. Multi-agent review: ${AGENTS.join(", ")}...`);
        const sections = [];
        for (const agent of AGENTS) {
            const profile = AGENT_REGISTRY.get(agent);
            if (!profile)
                continue;
            console.log(`${profile.label} reviewing...`);
            let agentUserPrompt = `Please review the following code diff and suggest improvements. Respond in ${LANGUAGE}.\n\n${diff}`;
            if (agent === "author") {
                agentUserPrompt = `This is your own code. Explain how it works (what each part does and why), self-review it, and point out any leftover debug code. Respond in ${LANGUAGE}.\n\n${diff}`;
                const stats = computeDiffStats(files);
                agentUserPrompt +=
                    `\n\nContext: PR size +${stats.added} / -${stats.removed} across ${files.length} files. ` +
                        `Guideline: keep PRs within 200–400 changed lines — if this exceeds the guideline, suggest how to split it.`;
            }
            if (agent === "checklist") {
                // สั่ง format ตรงนี้แทนใน persona — เพราะโหมด inline ต้องการ JSON (สั่งซ้อนใน persona จะชนกันแล้ว parser อ่านไม่ออก)
                agentUserPrompt =
                    `Run your code review checklist against the diff below. Present the result as a markdown table ` +
                        `with columns | # | Item | Status | Note | — one row per checklist item ` +
                        `(✅ pass, ⚠️ needs attention, ❌ fail, ➖ not applicable). Respond in ${LANGUAGE}.\n\n${diff}`;
            }
            agentUserPrompt += addressee;
            const result = await askAI(profile.persona + skillSuffix, agentUserPrompt);
            let section = `### ${profile.label}\n\n`;
            if (agent === "author")
                section += `${prSizeLine(files)}\n\n`;
            section += ownerGreet;
            sections.push(section + (closeUnbalancedFence(result.trim()) || "No findings."));
        }
        console.log("Posting comment to GitHub...");
        await postCommentToPr(sections.join("\n\n"), scopeLine);
        console.log("Done!");
        return;
    }
    console.log(`Diff size: ${diff.length} chars. Sending to AI...`);
    const systemPrompt = `You are an expert Code Reviewer. Review the code and respond in ${LANGUAGE}.`;
    const userPrompt = `Please review the following code diff and suggest improvements. Also point out any security vulnerabilities if present. Respond in ${LANGUAGE}.\n\n${diff}${addressee}`;
    const reviewResult = await askAI(systemPrompt + skillSuffix, userPrompt);
    console.log("Posting comment to GitHub...");
    await postCommentToPr(ownerGreet + closeUnbalancedFence(reviewResult), scopeLine);
    console.log("Done!");
}
main().catch((err) => {
    console.error("Unhandled error:", err);
    process.exit(1);
});


/***/ }),

/***/ 75:
/***/ ((module) => {

module.exports = eval("require")("supports-color");


/***/ }),

/***/ 2613:
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),

/***/ 4434:
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ 9896:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 8611:
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ 5692:
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ 9278:
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ 7598:
/***/ ((module) => {

"use strict";
module.exports = require("node:crypto");

/***/ }),

/***/ 7067:
/***/ ((module) => {

"use strict";
module.exports = require("node:http");

/***/ }),

/***/ 4708:
/***/ ((module) => {

"use strict";
module.exports = require("node:https");

/***/ }),

/***/ 8161:
/***/ ((module) => {

"use strict";
module.exports = require("node:os");

/***/ }),

/***/ 1708:
/***/ ((module) => {

"use strict";
module.exports = require("node:process");

/***/ }),

/***/ 7075:
/***/ ((module) => {

"use strict";
module.exports = require("node:stream");

/***/ }),

/***/ 7975:
/***/ ((module) => {

"use strict";
module.exports = require("node:util");

/***/ }),

/***/ 8522:
/***/ ((module) => {

"use strict";
module.exports = require("node:zlib");

/***/ }),

/***/ 6928:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 2203:
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ 4756:
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ 2018:
/***/ ((module) => {

"use strict";
module.exports = require("tty");

/***/ }),

/***/ 7016:
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ 9023:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ 2143:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
//# sourceMappingURL=clientDefinitions.js.map

/***/ }),

/***/ 5345:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SDK_VERSION = void 0;
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * THIS IS AN AUTO-GENERATED FILE - DO NOT EDIT!
 *
 * Any changes you make here may be lost.
 *
 * If you need to make changes, please do so in the original source file, \{project-root\}/sources/custom
 */
exports.SDK_VERSION = "1.0.0-beta.4";
//# sourceMappingURL=constants.js.map

/***/ }),

/***/ 5980:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __nccwpck_require__(1860);
/**
 * THIS IS AN AUTO-GENERATED FILE - DO NOT EDIT!
 *
 * Any changes you make here may be lost.
 *
 * If you need to make changes, please do so in the original source file, \{project-root\}/sources/custom
 */
const modelClient_js_1 = tslib_1.__importDefault(__nccwpck_require__(7998));
tslib_1.__exportStar(__nccwpck_require__(2143), exports);
tslib_1.__exportStar(__nccwpck_require__(6981), exports);
tslib_1.__exportStar(__nccwpck_require__(7998), exports);
tslib_1.__exportStar(__nccwpck_require__(4284), exports);
tslib_1.__exportStar(__nccwpck_require__(29), exports);
tslib_1.__exportStar(__nccwpck_require__(6846), exports);
tslib_1.__exportStar(__nccwpck_require__(4368), exports);
exports["default"] = modelClient_js_1.default;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 6981:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isUnexpected = isUnexpected;
const responseMap = {
    "POST /chat/completions": ["200"],
    "GET /info": ["200"],
    "POST /embeddings": ["200"],
    "POST /images/embeddings": ["200"],
};
function isUnexpected(response) {
    const lroOriginal = response.headers["x-ms-original-url"];
    const url = new URL(lroOriginal !== null && lroOriginal !== void 0 ? lroOriginal : response.request.url);
    const method = response.request.method;
    let pathDetails = responseMap[`${method} ${url.pathname}`];
    if (!pathDetails) {
        pathDetails = getParametrizedPathSuccess(method, url.pathname);
    }
    return !pathDetails.includes(response.status);
}
function getParametrizedPathSuccess(method, path) {
    var _a, _b, _c, _d;
    const pathParts = path.split("/");
    let matchedLen = -1, matchedValue = [];
    for (const [key, value] of Object.entries(responseMap)) {
        // Extracting the path from the map key which is in format
        // GET /path/foo
        if (!key.startsWith(method)) {
            continue;
        }
        const candidatePath = getPathFromMapKey(key);
        // Get each part of the url path
        const candidateParts = candidatePath.split("/");
        // track if we have found a match to return the values found.
        let found = true;
        for (let i = candidateParts.length - 1, j = pathParts.length - 1; i >= 1 && j >= 1; i--, j--) {
            if (((_a = candidateParts[i]) === null || _a === void 0 ? void 0 : _a.startsWith("{")) && ((_b = candidateParts[i]) === null || _b === void 0 ? void 0 : _b.indexOf("}")) !== -1) {
                const start = candidateParts[i].indexOf("}") + 1, end = (_c = candidateParts[i]) === null || _c === void 0 ? void 0 : _c.length;
                // If the current part of the candidate is a "template" part
                // Try to use the suffix of pattern to match the path
                // {guid} ==> $
                // {guid}:export ==> :export$
                const isMatched = new RegExp(`${(_d = candidateParts[i]) === null || _d === void 0 ? void 0 : _d.slice(start, end)}`).test(pathParts[j] || "");
                if (!isMatched) {
                    found = false;
                    break;
                }
                continue;
            }
            // If the candidate part is not a template and
            // the parts don't match mark the candidate as not found
            // to move on with the next candidate path.
            if (candidateParts[i] !== pathParts[j]) {
                found = false;
                break;
            }
        }
        // We finished evaluating the current candidate parts
        // Update the matched value if and only if we found the longer pattern
        if (found && candidatePath.length > matchedLen) {
            matchedLen = candidatePath.length;
            matchedValue = value;
        }
    }
    return matchedValue;
}
function getPathFromMapKey(mapKey) {
    const pathStart = mapKey.indexOf("/");
    return mapKey.slice(pathStart);
}
//# sourceMappingURL=isUnexpected.js.map

/***/ }),

/***/ 2354:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.logger = void 0;
/**
 * THIS IS AN AUTO-GENERATED FILE - DO NOT EDIT!
 *
 * Any changes you make here may be lost.
 *
 * If you need to make changes, please do so in the original source file, \{project-root\}/sources/custom
 */
const logger_1 = __nccwpck_require__(6515);
exports.logger = (0, logger_1.createClientLogger)("ai-inference");
//# sourceMappingURL=logger.js.map

/***/ }),

/***/ 7998:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports["default"] = createClient;
const tslib_1 = __nccwpck_require__(1860);
const core_client_1 = __nccwpck_require__(41);
const logger_js_1 = __nccwpck_require__(2354);
const core_auth_1 = __nccwpck_require__(417);
const tracingPolicy_js_1 = __nccwpck_require__(6420);
/**
 * Initialize a new instance of `ModelClient`
 * @param endpointParam - The parameter endpointParam
 * @param credentials - uniquely identify client credential
 * @param options - the parameter for all optional parameters
 */
function createClient(endpointParam, credentials, _a = {}) {
    var _b, _c, _d, _e, _f, _g, _h, _j;
    var { apiVersion = "2024-05-01-preview" } = _a, options = tslib_1.__rest(_a, ["apiVersion"]);
    const endpointUrl = (_c = (_b = options.endpoint) !== null && _b !== void 0 ? _b : options.baseUrl) !== null && _c !== void 0 ? _c : `${endpointParam}`;
    const userAgentInfo = `azsdk-js-ai-inference-rest/1.0.0-beta.6`;
    const userAgentPrefix = options.userAgentOptions && options.userAgentOptions.userAgentPrefix
        ? `${options.userAgentOptions.userAgentPrefix} ${userAgentInfo}`
        : `${userAgentInfo}`;
    options = Object.assign(Object.assign({}, options), { userAgentOptions: {
            userAgentPrefix,
        }, loggingOptions: {
            logger: (_e = (_d = options.loggingOptions) === null || _d === void 0 ? void 0 : _d.logger) !== null && _e !== void 0 ? _e : logger_js_1.logger.info,
        }, credentials: {
            scopes: (_g = (_f = options.credentials) === null || _f === void 0 ? void 0 : _f.scopes) !== null && _g !== void 0 ? _g : ["https://ml.azure.com/.default"],
            apiKeyHeaderName: (_j = (_h = options.credentials) === null || _h === void 0 ? void 0 : _h.apiKeyHeaderName) !== null && _j !== void 0 ? _j : "api-key",
        } });
    const client = (0, core_client_1.getClient)(endpointUrl, credentials, options);
    client.pipeline.removePolicy({ name: "ApiVersionPolicy" });
    client.pipeline.addPolicy({
        name: "InferenceTracingPolicy",
        sendRequest: (req, next) => {
            return (0, tracingPolicy_js_1.tracingPolicy)().sendRequest(req, next);
        },
    });
    client.pipeline.addPolicy({
        name: "ClientApiVersionPolicy",
        sendRequest: (req, next) => {
            // Use the apiVersion defined in request url directly
            // Append one if there is no apiVersion and we have one at client options
            const url = new URL(req.url);
            if (!url.searchParams.get("api-version") && apiVersion) {
                req.url = `${req.url}${Array.from(url.searchParams.keys()).length > 0 ? "&" : "?"}api-version=${apiVersion}`;
            }
            return next(req);
        },
    });
    if ((0, core_auth_1.isKeyCredential)(credentials)) {
        client.pipeline.addPolicy({
            name: "customKeyCredentialPolicy",
            async sendRequest(request, next) {
                request.headers.set("Authorization", "Bearer " + credentials.key);
                return next(request);
            },
        });
    }
    return client;
}
//# sourceMappingURL=modelClient.js.map

/***/ }),

/***/ 4284:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
//# sourceMappingURL=models.js.map

/***/ }),

/***/ 29:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
//# sourceMappingURL=outputModels.js.map

/***/ }),

/***/ 6846:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
//# sourceMappingURL=parameters.js.map

/***/ }),

/***/ 4368:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
//# sourceMappingURL=responses.js.map

/***/ }),

/***/ 158:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getRequestBody = getRequestBody;
exports.getSpanName = getSpanName;
exports.onStartTracing = onStartTracing;
exports.tryProcessResponse = tryProcessResponse;
exports.tryProcessError = tryProcessError;
const core_util_1 = __nccwpck_require__(7779);
/*
* Add event to span.  Sample:
    {
    name: 'gen_ai.user.message',
    attributes: {
      'gen_ai.system': 'INFERENCE_GEN_AI_SYSTEM_NAME',
      'gen_ai.event.content': `{"role":"user","content":"What's the weather like in Boston?"}`
    },
    time: [ 1725666879, 622695900 ],
    droppedAttributesCount: 0
  },
*/
/*
* Add event to span.  Sample:
{
  name: 'gen_ai.choice',
  attributes: {
    'gen_ai.system': 'INFERENCE_GEN_AI_SYSTEM_NAME',
    'gen_ai.event.content': '{"finish_reason":"tool_calls","index":0,"message":{"content":""}}'
  },
  time: [ 1725666881, 780608000 ],
  droppedAttributesCount: 0
}
*/
var TracingAttributesEnum;
(function (TracingAttributesEnum) {
    TracingAttributesEnum["Operation_Name"] = "gen_ai.operation.name";
    TracingAttributesEnum["Request_Model"] = "gen_ai.request.model";
    TracingAttributesEnum["System"] = "gen_ai.system";
    TracingAttributesEnum["Error_Type"] = "error.type";
    TracingAttributesEnum["Server_Port"] = "server.port";
    TracingAttributesEnum["Request_Frequency_Penalty"] = "gen_ai.request.frequency_penalty";
    TracingAttributesEnum["Request_Max_Tokens"] = "gen_ai.request.max_tokens";
    TracingAttributesEnum["Request_Presence_Penalty"] = "gen_ai.request.presence_penalty";
    TracingAttributesEnum["Request_Stop_Sequences"] = "gen_ai.request.stop_sequences";
    TracingAttributesEnum["Request_Temperature"] = "gen_ai.request.temperature";
    TracingAttributesEnum["Request_Top_P"] = "gen_ai.request.top_p";
    TracingAttributesEnum["Response_Finish_Reasons"] = "gen_ai.response.finish_reasons";
    TracingAttributesEnum["Response_Id"] = "gen_ai.response.id";
    TracingAttributesEnum["Response_Model"] = "gen_ai.response.model";
    TracingAttributesEnum["Usage_Input_Tokens"] = "gen_ai.usage.input_tokens";
    TracingAttributesEnum["Usage_Output_Tokens"] = "gen_ai.usage.output_tokens";
    TracingAttributesEnum["Server_Address"] = "server.address";
})(TracingAttributesEnum || (TracingAttributesEnum = {}));
const INFERENCE_GEN_AI_SYSTEM_NAME = "az.ai.inference";
const isContentRecordingEnabled = () => envVarToBoolean("AZURE_TRACING_GEN_AI_CONTENT_RECORDING_ENABLED");
function getRequestBody(request) {
    return { body: JSON.parse(request.body) };
}
function getSpanName(request) {
    var _a;
    const { body } = getRequestBody(request);
    return `chat ${(_a = body === null || body === void 0 ? void 0 : body.model) !== null && _a !== void 0 ? _a : ""}`.trim();
}
function onStartTracing(span, request, url) {
    if (!span.isRecording()) {
        return;
    }
    const urlObj = new URL(url);
    const port = Number(urlObj.port) || (urlObj.protocol === "https:" ? undefined : 80);
    if (port) {
        span.setAttribute(TracingAttributesEnum.Server_Port, port);
    }
    span.setAttribute(TracingAttributesEnum.Server_Address, urlObj.hostname);
    span.setAttribute(TracingAttributesEnum.Operation_Name, "chat");
    span.setAttribute(TracingAttributesEnum.System, "az.ai.inference");
    const { body } = getRequestBody(request);
    if (!body)
        return;
    span.setAttribute(TracingAttributesEnum.Request_Model, body.model);
    span.setAttribute(TracingAttributesEnum.Request_Frequency_Penalty, body.frequency_penalty);
    span.setAttribute(TracingAttributesEnum.Request_Max_Tokens, body.max_tokens);
    span.setAttribute(TracingAttributesEnum.Request_Presence_Penalty, body.presence_penalty);
    span.setAttribute(TracingAttributesEnum.Request_Stop_Sequences, body.stop);
    span.setAttribute(TracingAttributesEnum.Request_Temperature, body.temperature);
    span.setAttribute(TracingAttributesEnum.Request_Top_P, body.top_p);
    if (body.messages) {
        addRequestChatMessageEvent(span, body.messages);
    }
}
function tryProcessResponse(span, response) {
    var _a, _b, _c;
    if (!span.isRecording()) {
        return;
    }
    if (response === null || response === void 0 ? void 0 : response.bodyAsText) {
        const body = JSON.parse(response.bodyAsText);
        if ((_a = body.error) !== null && _a !== void 0 ? _a : body.message) {
            span.setAttribute(TracingAttributesEnum.Error_Type, `${(_b = body.status) !== null && _b !== void 0 ? _b : body.statusCode}`);
            span.setStatus({
                status: "error",
                error: (_c = body.error) !== null && _c !== void 0 ? _c : body.message, // message is not in the schema of the response, but it can present if there is crediential error
            });
        }
        span.setAttribute(TracingAttributesEnum.Response_Id, body.id);
        span.setAttribute(TracingAttributesEnum.Response_Model, body.model);
        if (body.choices) {
            span.setAttribute(TracingAttributesEnum.Response_Finish_Reasons, body.choices.map((choice) => choice.finish_reason).join(","));
        }
        if (body.usage) {
            span.setAttribute(TracingAttributesEnum.Usage_Input_Tokens, body.usage.prompt_tokens);
            span.setAttribute(TracingAttributesEnum.Usage_Output_Tokens, body.usage.completion_tokens);
        }
        addResponseChatMessageEvent(span, body);
    }
}
function tryProcessError(span, error) {
    span.setStatus({
        status: "error",
        error: (0, core_util_1.isError)(error) ? error : undefined,
    });
}
function addRequestChatMessageEvent(span, messages) {
    messages.forEach((message) => {
        var _a;
        if (message.role) {
            const content = {};
            const chatMsg = message;
            if (chatMsg.content) {
                content.content = chatMsg.content;
            }
            if (!isContentRecordingEnabled()) {
                content.content = "";
            }
            const assistantMsg = message;
            if (assistantMsg.tool_calls) {
                content.tool_calls = assistantMsg.tool_calls;
                if (!isContentRecordingEnabled()) {
                    const toolCalls = JSON.parse(JSON.stringify(content.tool_calls));
                    toolCalls.forEach((toolCall) => {
                        if (toolCall.function.arguments) {
                            toolCall.function.arguments = "";
                        }
                        toolCall.function.name = "";
                    });
                    content.tool_calls = toolCalls;
                }
            }
            const toolMsg = message;
            if (toolMsg.tool_call_id) {
                content.id = toolMsg.tool_call_id;
            }
            (_a = span.addEvent) === null || _a === void 0 ? void 0 : _a.call(span, `gen_ai.${message.role}.message`, {
                attributes: {
                    "gen_ai.system": INFERENCE_GEN_AI_SYSTEM_NAME,
                    "gen_ai.event.content": JSON.stringify(content),
                },
            });
        }
    });
}
function addResponseChatMessageEvent(span, body) {
    var _a;
    if (!span.addEvent) {
        return;
    }
    (_a = body === null || body === void 0 ? void 0 : body.choices) === null || _a === void 0 ? void 0 : _a.forEach((choice) => {
        var _a;
        let message = {};
        if (choice.message.content) {
            message.content = choice.message.content;
        }
        if (choice.message.tool_calls) {
            message.toolCalls = choice.message.tool_calls;
        }
        if (!isContentRecordingEnabled()) {
            message = JSON.parse(JSON.stringify(message));
            message.content = "";
            if (message.toolCalls) {
                message.toolCalls.forEach((toolCall) => {
                    if (toolCall.function.arguments) {
                        toolCall.function.arguments = "";
                    }
                    toolCall.function.name = "";
                });
            }
        }
        const response = {
            finish_reason: choice.finish_reason,
            index: choice.index,
            message,
        };
        const attributes = {
            "gen_ai.system": INFERENCE_GEN_AI_SYSTEM_NAME,
            "gen_ai.event.content": JSON.stringify(response),
        };
        (_a = span.addEvent) === null || _a === void 0 ? void 0 : _a.call(span, "gen_ai.choice", { attributes });
    });
}
function envVarToBoolean(key) {
    var _a;
    const value = (_a = process.env[key]) !== null && _a !== void 0 ? _a : process.env[key.toLowerCase()];
    return value !== "false" && value !== "0" && Boolean(value);
}
//# sourceMappingURL=tracingHelper.js.map

/***/ }),

/***/ 6420:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.tracingPolicyName = void 0;
exports.tracingPolicy = tracingPolicy;
const core_tracing_1 = __nccwpck_require__(623);
const core_util_1 = __nccwpck_require__(7779);
const constants_js_1 = __nccwpck_require__(5345);
const logger_js_1 = __nccwpck_require__(2354);
const tracingHelper_js_1 = __nccwpck_require__(158);
/**
 * The programmatic identifier of the tracingPolicy.
 */
exports.tracingPolicyName = "inferenceTracingPolicy";
/**
 * A simple policy to create OpenTelemetry Spans for each request made by the pipeline
 * that has SpanOptions with a parent.
 * Requests made without a parent Span will not be recorded.
 */
function tracingPolicy() {
    const tracingClient = (0, core_tracing_1.createTracingClient)({
        namespace: "Microsoft.CognitiveServices",
        packageName: "@azure/ai-inference-rest",
        packageVersion: constants_js_1.SDK_VERSION,
    });
    return {
        name: exports.tracingPolicyName,
        async sendRequest(request, next) {
            var _a, _b, _c, _d;
            const url = new URL(request.url);
            if (!tracingClient ||
                !url.href.endsWith("/chat/completions") ||
                ((_b = (_a = (0, tracingHelper_js_1.getRequestBody)(request)) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.stream)) {
                return next(request);
            }
            const { span, tracingContext } = (_c = tryCreateSpan(tracingClient, request)) !== null && _c !== void 0 ? _c : {};
            if (!span || !tracingContext) {
                return next(request);
            }
            try {
                (_d = request.tracingOptions) !== null && _d !== void 0 ? _d : (request.tracingOptions = {});
                request.tracingOptions.tracingContext = tracingContext;
                (0, tracingHelper_js_1.onStartTracing)(span, request, request.url);
                const response = await tracingClient.withContext(tracingContext, next, request);
                (0, tracingHelper_js_1.tryProcessResponse)(span, response);
                return response;
            }
            catch (err) {
                (0, tracingHelper_js_1.tryProcessError)(span, err);
                throw err;
            }
            finally {
                span.end();
            }
        },
    };
}
function tryCreateSpan(tracingClient, request) {
    try {
        // As per spec, we do not need to differentiate between HTTP and HTTPS in span name.
        const { span, updatedOptions } = tracingClient.startSpan((0, tracingHelper_js_1.getSpanName)(request), { tracingOptions: request.tracingOptions }, {
            spanKind: "client",
        });
        return { span, tracingContext: updatedOptions.tracingOptions.tracingContext };
    }
    catch (e) {
        logger_js_1.logger.warning(`Skipping creating a tracing span due to an error: ${(0, core_util_1.getErrorMessage)(e)}`);
        return undefined;
    }
}
//# sourceMappingURL=tracingPolicy.js.map

/***/ }),

/***/ 9243:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var apiVersionPolicy_exports = {};
__export(apiVersionPolicy_exports, {
  apiVersionPolicy: () => apiVersionPolicy,
  apiVersionPolicyName: () => apiVersionPolicyName
});
module.exports = __toCommonJS(apiVersionPolicy_exports);
const apiVersionPolicyName = "ApiVersionPolicy";
function apiVersionPolicy(options) {
  return {
    name: apiVersionPolicyName,
    sendRequest: (req, next) => {
      const url = new URL(req.url);
      if (!url.searchParams.get("api-version") && options.apiVersion) {
        req.url = `${req.url}${url.searchParams.size > 0 ? "&" : "?"}api-version=${options.apiVersion}`;
      }
      return next(req);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=apiVersionPolicy.js.map


/***/ }),

/***/ 4025:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var clientHelpers_exports = {};
__export(clientHelpers_exports, {
  addCredentialPipelinePolicy: () => addCredentialPipelinePolicy,
  createDefaultPipeline: () => createDefaultPipeline
});
module.exports = __toCommonJS(clientHelpers_exports);
var import_core_rest_pipeline = __nccwpck_require__(778);
var import_core_auth = __nccwpck_require__(417);
var import_apiVersionPolicy = __nccwpck_require__(9243);
var import_keyCredentialAuthenticationPolicy = __nccwpck_require__(1797);
function addCredentialPipelinePolicy(pipeline, endpoint, options = {}) {
  const { credential, clientOptions } = options;
  if (!credential) {
    return;
  }
  if ((0, import_core_auth.isTokenCredential)(credential)) {
    const tokenPolicy = (0, import_core_rest_pipeline.bearerTokenAuthenticationPolicy)({
      credential,
      scopes: clientOptions?.credentials?.scopes ?? `${endpoint}/.default`
    });
    pipeline.addPolicy(tokenPolicy);
  } else if (isKeyCredential(credential)) {
    if (!clientOptions?.credentials?.apiKeyHeaderName) {
      throw new Error(`Missing API Key Header Name`);
    }
    const keyPolicy = (0, import_keyCredentialAuthenticationPolicy.keyCredentialAuthenticationPolicy)(
      credential,
      clientOptions?.credentials?.apiKeyHeaderName
    );
    pipeline.addPolicy(keyPolicy);
  }
}
function createDefaultPipeline(endpoint, credential, options = {}) {
  const pipeline = (0, import_core_rest_pipeline.createPipelineFromOptions)(options);
  pipeline.addPolicy((0, import_apiVersionPolicy.apiVersionPolicy)(options));
  addCredentialPipelinePolicy(pipeline, endpoint, { credential, clientOptions: options });
  return pipeline;
}
function isKeyCredential(credential) {
  return typeof credential === "object" && credential !== null && "key" in credential && typeof credential.key === "string";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=clientHelpers.js.map


/***/ }),

/***/ 6627:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var getBinaryStreamResponse_exports = {};
__export(getBinaryStreamResponse_exports, {
  getBinaryStreamResponse: () => getBinaryStreamResponse
});
module.exports = __toCommonJS(getBinaryStreamResponse_exports);
async function getBinaryStreamResponse(streamableMethod) {
  const response = await streamableMethod.asNodeStream();
  return {
    ...response,
    blobBody: void 0,
    readableStreamBody: response.body
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=getBinaryStreamResponse.js.map


/***/ }),

/***/ 8694:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var getClient_exports = {};
__export(getClient_exports, {
  getClient: () => getClient
});
module.exports = __toCommonJS(getClient_exports);
var import_core_auth = __nccwpck_require__(417);
var import_clientHelpers = __nccwpck_require__(4025);
var import_ts_http_runtime = __nccwpck_require__(1958);
function wrapRequestParameters(parameters) {
  if (parameters.onResponse) {
    return {
      ...parameters,
      onResponse(rawResponse, error) {
        parameters.onResponse?.(rawResponse, error, error);
      }
    };
  }
  return parameters;
}
function getClient(endpoint, credentialsOrPipelineOptions, clientOptions = {}) {
  let credentials;
  if (credentialsOrPipelineOptions) {
    if (isCredential(credentialsOrPipelineOptions)) {
      credentials = credentialsOrPipelineOptions;
    } else {
      clientOptions = credentialsOrPipelineOptions ?? {};
    }
  }
  const pipeline = clientOptions.pipeline ?? (0, import_clientHelpers.createDefaultPipeline)(endpoint, credentials, clientOptions);
  const tspClient = (0, import_ts_http_runtime.getClient)(endpoint, {
    ...clientOptions,
    pipeline
  });
  const client = (path, ...args) => {
    return {
      get: (requestOptions = {}) => {
        return tspClient.path(path, ...args).get(wrapRequestParameters(requestOptions));
      },
      post: (requestOptions = {}) => {
        return tspClient.path(path, ...args).post(wrapRequestParameters(requestOptions));
      },
      put: (requestOptions = {}) => {
        return tspClient.path(path, ...args).put(wrapRequestParameters(requestOptions));
      },
      patch: (requestOptions = {}) => {
        return tspClient.path(path, ...args).patch(wrapRequestParameters(requestOptions));
      },
      delete: (requestOptions = {}) => {
        return tspClient.path(path, ...args).delete(wrapRequestParameters(requestOptions));
      },
      head: (requestOptions = {}) => {
        return tspClient.path(path, ...args).head(wrapRequestParameters(requestOptions));
      },
      options: (requestOptions = {}) => {
        return tspClient.path(path, ...args).options(wrapRequestParameters(requestOptions));
      },
      trace: (requestOptions = {}) => {
        return tspClient.path(path, ...args).trace(wrapRequestParameters(requestOptions));
      }
    };
  };
  return {
    path: client,
    pathUnchecked: client,
    pipeline: tspClient.pipeline
  };
}
function isCredential(param) {
  return (0, import_core_auth.isKeyCredential)(param) || (0, import_core_auth.isTokenCredential)(param);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=getClient.js.map


/***/ }),

/***/ 41:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var src_exports = {};
__export(src_exports, {
  addCredentialPipelinePolicy: () => import_clientHelpers.addCredentialPipelinePolicy,
  createRestError: () => import_restError.createRestError,
  getBinaryStreamResponse: () => import_getBinaryStreamResponse.getBinaryStreamResponse,
  operationOptionsToRequestParameters: () => import_operationOptionHelpers.operationOptionsToRequestParameters
});
module.exports = __toCommonJS(src_exports);
var import_restError = __nccwpck_require__(8065);
var import_clientHelpers = __nccwpck_require__(4025);
var import_operationOptionHelpers = __nccwpck_require__(6228);
var import_getBinaryStreamResponse = __nccwpck_require__(6627);
__reExport(src_exports, __nccwpck_require__(8694), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 1797:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var keyCredentialAuthenticationPolicy_exports = {};
__export(keyCredentialAuthenticationPolicy_exports, {
  keyCredentialAuthenticationPolicy: () => keyCredentialAuthenticationPolicy,
  keyCredentialAuthenticationPolicyName: () => keyCredentialAuthenticationPolicyName
});
module.exports = __toCommonJS(keyCredentialAuthenticationPolicy_exports);
const keyCredentialAuthenticationPolicyName = "keyCredentialAuthenticationPolicy";
function keyCredentialAuthenticationPolicy(credential, apiKeyHeaderName) {
  return {
    name: keyCredentialAuthenticationPolicyName,
    sendRequest(request, next) {
      request.headers.set(apiKeyHeaderName, credential.key);
      return next(request);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=keyCredentialAuthenticationPolicy.js.map


/***/ }),

/***/ 6228:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var operationOptionHelpers_exports = {};
__export(operationOptionHelpers_exports, {
  operationOptionsToRequestParameters: () => operationOptionsToRequestParameters
});
module.exports = __toCommonJS(operationOptionHelpers_exports);
var import_ts_http_runtime = __nccwpck_require__(1958);
function operationOptionsToRequestParameters(options) {
  const tspRequestParameters = (0, import_ts_http_runtime.operationOptionsToRequestParameters)(
    options
  );
  return {
    ...tspRequestParameters,
    tracingOptions: options.tracingOptions
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=operationOptionHelpers.js.map


/***/ }),

/***/ 8065:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var restError_exports = {};
__export(restError_exports, {
  createRestError: () => createRestError
});
module.exports = __toCommonJS(restError_exports);
var import_ts_http_runtime = __nccwpck_require__(1958);
function createRestError(messageOrResponse, response) {
  if (typeof messageOrResponse === "string") {
    return (0, import_ts_http_runtime.createRestError)(messageOrResponse, response);
  } else {
    return (0, import_ts_http_runtime.createRestError)(messageOrResponse);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=restError.js.map


/***/ }),

/***/ 9192:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AbortError = void 0;
/**
 * This error is thrown when an asynchronous operation has been aborted.
 * Check for this error by testing the `name` that the name property of the
 * error matches `"AbortError"`.
 *
 * @example
 * ```ts
 * const controller = new AbortController();
 * controller.abort();
 * try {
 *   doAsyncWork(controller.signal)
 * } catch (e) {
 *   if (e.name === 'AbortError') {
 *     // handle abort error here.
 *   }
 * }
 * ```
 */
class AbortError extends Error {
    constructor(message) {
        super(message);
        this.name = "AbortError";
    }
}
exports.AbortError = AbortError;
//# sourceMappingURL=AbortError.js.map

/***/ }),

/***/ 3134:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AbortError = void 0;
var AbortError_js_1 = __nccwpck_require__(9192);
Object.defineProperty(exports, "AbortError", ({ enumerable: true, get: function () { return AbortError_js_1.AbortError; } }));
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 198:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AzureKeyCredential = void 0;
/**
 * A static-key-based credential that supports updating
 * the underlying key value.
 */
class AzureKeyCredential {
    _key;
    /**
     * The value of the key to be used in authentication
     */
    get key() {
        return this._key;
    }
    /**
     * Create an instance of an AzureKeyCredential for use
     * with a service client.
     *
     * @param key - The initial value of the key to use in authentication
     */
    constructor(key) {
        if (!key) {
            throw new Error("key must be a non-empty string");
        }
        this._key = key;
    }
    /**
     * Change the value of the key.
     *
     * Updates will take effect upon the next request after
     * updating the key value.
     *
     * @param newKey - The new key value to be used
     */
    update(newKey) {
        this._key = newKey;
    }
}
exports.AzureKeyCredential = AzureKeyCredential;
//# sourceMappingURL=azureKeyCredential.js.map

/***/ }),

/***/ 1295:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AzureNamedKeyCredential = void 0;
exports.isNamedKeyCredential = isNamedKeyCredential;
const core_util_1 = __nccwpck_require__(7779);
/**
 * A static name/key-based credential that supports updating
 * the underlying name and key values.
 */
class AzureNamedKeyCredential {
    _key;
    _name;
    /**
     * The value of the key to be used in authentication.
     */
    get key() {
        return this._key;
    }
    /**
     * The value of the name to be used in authentication.
     */
    get name() {
        return this._name;
    }
    /**
     * Create an instance of an AzureNamedKeyCredential for use
     * with a service client.
     *
     * @param name - The initial value of the name to use in authentication.
     * @param key - The initial value of the key to use in authentication.
     */
    constructor(name, key) {
        if (!name || !key) {
            throw new TypeError("name and key must be non-empty strings");
        }
        this._name = name;
        this._key = key;
    }
    /**
     * Change the value of the key.
     *
     * Updates will take effect upon the next request after
     * updating the key value.
     *
     * @param newName - The new name value to be used.
     * @param newKey - The new key value to be used.
     */
    update(newName, newKey) {
        if (!newName || !newKey) {
            throw new TypeError("newName and newKey must be non-empty strings");
        }
        this._name = newName;
        this._key = newKey;
    }
}
exports.AzureNamedKeyCredential = AzureNamedKeyCredential;
/**
 * Tests an object to determine whether it implements NamedKeyCredential.
 *
 * @param credential - The assumed NamedKeyCredential to be tested.
 */
function isNamedKeyCredential(credential) {
    return ((0, core_util_1.isObjectWithProperties)(credential, ["name", "key"]) &&
        typeof credential.key === "string" &&
        typeof credential.name === "string");
}
//# sourceMappingURL=azureNamedKeyCredential.js.map

/***/ }),

/***/ 6608:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AzureSASCredential = void 0;
exports.isSASCredential = isSASCredential;
const core_util_1 = __nccwpck_require__(7779);
/**
 * A static-signature-based credential that supports updating
 * the underlying signature value.
 */
class AzureSASCredential {
    _signature;
    /**
     * The value of the shared access signature to be used in authentication
     */
    get signature() {
        return this._signature;
    }
    /**
     * Create an instance of an AzureSASCredential for use
     * with a service client.
     *
     * @param signature - The initial value of the shared access signature to use in authentication
     */
    constructor(signature) {
        if (!signature) {
            throw new Error("shared access signature must be a non-empty string");
        }
        this._signature = signature;
    }
    /**
     * Change the value of the signature.
     *
     * Updates will take effect upon the next request after
     * updating the signature value.
     *
     * @param newSignature - The new shared access signature value to be used
     */
    update(newSignature) {
        if (!newSignature) {
            throw new Error("shared access signature must be a non-empty string");
        }
        this._signature = newSignature;
    }
}
exports.AzureSASCredential = AzureSASCredential;
/**
 * Tests an object to determine whether it implements SASCredential.
 *
 * @param credential - The assumed SASCredential to be tested.
 */
function isSASCredential(credential) {
    return ((0, core_util_1.isObjectWithProperties)(credential, ["signature"]) && typeof credential.signature === "string");
}
//# sourceMappingURL=azureSASCredential.js.map

/***/ }),

/***/ 417:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isTokenCredential = exports.isSASCredential = exports.AzureSASCredential = exports.isNamedKeyCredential = exports.AzureNamedKeyCredential = exports.isKeyCredential = exports.AzureKeyCredential = void 0;
var azureKeyCredential_js_1 = __nccwpck_require__(198);
Object.defineProperty(exports, "AzureKeyCredential", ({ enumerable: true, get: function () { return azureKeyCredential_js_1.AzureKeyCredential; } }));
var keyCredential_js_1 = __nccwpck_require__(9155);
Object.defineProperty(exports, "isKeyCredential", ({ enumerable: true, get: function () { return keyCredential_js_1.isKeyCredential; } }));
var azureNamedKeyCredential_js_1 = __nccwpck_require__(1295);
Object.defineProperty(exports, "AzureNamedKeyCredential", ({ enumerable: true, get: function () { return azureNamedKeyCredential_js_1.AzureNamedKeyCredential; } }));
Object.defineProperty(exports, "isNamedKeyCredential", ({ enumerable: true, get: function () { return azureNamedKeyCredential_js_1.isNamedKeyCredential; } }));
var azureSASCredential_js_1 = __nccwpck_require__(6608);
Object.defineProperty(exports, "AzureSASCredential", ({ enumerable: true, get: function () { return azureSASCredential_js_1.AzureSASCredential; } }));
Object.defineProperty(exports, "isSASCredential", ({ enumerable: true, get: function () { return azureSASCredential_js_1.isSASCredential; } }));
var tokenCredential_js_1 = __nccwpck_require__(6881);
Object.defineProperty(exports, "isTokenCredential", ({ enumerable: true, get: function () { return tokenCredential_js_1.isTokenCredential; } }));
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 9155:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isKeyCredential = isKeyCredential;
const core_util_1 = __nccwpck_require__(7779);
/**
 * Tests an object to determine whether it implements KeyCredential.
 *
 * @param credential - The assumed KeyCredential to be tested.
 */
function isKeyCredential(credential) {
    return (0, core_util_1.isObjectWithProperties)(credential, ["key"]) && typeof credential.key === "string";
}
//# sourceMappingURL=keyCredential.js.map

/***/ }),

/***/ 6881:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isBearerToken = isBearerToken;
exports.isPopToken = isPopToken;
exports.isTokenCredential = isTokenCredential;
/**
 * @internal
 * @param accessToken - Access token
 * @returns Whether a token is bearer type or not
 */
function isBearerToken(accessToken) {
    return !accessToken.tokenType || accessToken.tokenType === "Bearer";
}
/**
 * @internal
 * @param accessToken - Access token
 * @returns Whether a token is Pop token or not
 */
function isPopToken(accessToken) {
    return accessToken.tokenType === "pop";
}
/**
 * Tests an object to determine whether it implements TokenCredential.
 *
 * @param credential - The assumed TokenCredential to be tested.
 */
function isTokenCredential(credential) {
    // Check for an object with a 'getToken' function and possibly with
    // a 'signRequest' function.  We do this check to make sure that
    // a ServiceClientCredentials implementor (like TokenClientCredentials
    // in ms-rest-nodeauth) doesn't get mistaken for a TokenCredential if
    // it doesn't actually implement TokenCredential also.
    const castCredential = credential;
    return (castCredential &&
        typeof castCredential.getToken === "function" &&
        (castCredential.signRequest === undefined || castCredential.getToken.length > 0));
}
//# sourceMappingURL=tokenCredential.js.map

/***/ }),

/***/ 6427:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var constants_exports = {};
__export(constants_exports, {
  DEFAULT_RETRY_POLICY_COUNT: () => DEFAULT_RETRY_POLICY_COUNT,
  SDK_VERSION: () => SDK_VERSION
});
module.exports = __toCommonJS(constants_exports);
const SDK_VERSION = "1.24.0";
const DEFAULT_RETRY_POLICY_COUNT = 3;
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=constants.js.map


/***/ }),

/***/ 862:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var createPipelineFromOptions_exports = {};
__export(createPipelineFromOptions_exports, {
  createPipelineFromOptions: () => createPipelineFromOptions
});
module.exports = __toCommonJS(createPipelineFromOptions_exports);
var import_logPolicy = __nccwpck_require__(3253);
var import_pipeline = __nccwpck_require__(9590);
var import_redirectPolicy = __nccwpck_require__(4087);
var import_userAgentPolicy = __nccwpck_require__(2799);
var import_multipartPolicy = __nccwpck_require__(5807);
var import_decompressResponsePolicy = __nccwpck_require__(9295);
var import_defaultRetryPolicy = __nccwpck_require__(8170);
var import_formDataPolicy = __nccwpck_require__(5497);
var import_core_util = __nccwpck_require__(7779);
var import_proxyPolicy = __nccwpck_require__(2815);
var import_setClientRequestIdPolicy = __nccwpck_require__(5686);
var import_agentPolicy = __nccwpck_require__(8554);
var import_tlsPolicy = __nccwpck_require__(5798);
var import_tracingPolicy = __nccwpck_require__(3237);
var import_wrapAbortSignalLikePolicy = __nccwpck_require__(7466);
function createPipelineFromOptions(options) {
  const pipeline = (0, import_pipeline.createEmptyPipeline)();
  if (import_core_util.isNodeLike) {
    if (options.agent) {
      pipeline.addPolicy((0, import_agentPolicy.agentPolicy)(options.agent));
    }
    if (options.tlsOptions) {
      pipeline.addPolicy((0, import_tlsPolicy.tlsPolicy)(options.tlsOptions));
    }
    pipeline.addPolicy((0, import_proxyPolicy.proxyPolicy)(options.proxyOptions));
    pipeline.addPolicy((0, import_decompressResponsePolicy.decompressResponsePolicy)());
  }
  pipeline.addPolicy((0, import_wrapAbortSignalLikePolicy.wrapAbortSignalLikePolicy)());
  pipeline.addPolicy((0, import_formDataPolicy.formDataPolicy)(), { beforePolicies: [import_multipartPolicy.multipartPolicyName] });
  pipeline.addPolicy((0, import_userAgentPolicy.userAgentPolicy)(options.userAgentOptions));
  pipeline.addPolicy((0, import_setClientRequestIdPolicy.setClientRequestIdPolicy)(options.telemetryOptions?.clientRequestIdHeaderName));
  pipeline.addPolicy((0, import_multipartPolicy.multipartPolicy)(), { afterPhase: "Deserialize" });
  pipeline.addPolicy((0, import_defaultRetryPolicy.defaultRetryPolicy)(options.retryOptions), { phase: "Retry" });
  pipeline.addPolicy((0, import_tracingPolicy.tracingPolicy)({ ...options.userAgentOptions, ...options.loggingOptions }), {
    afterPhase: "Retry"
  });
  if (import_core_util.isNodeLike) {
    pipeline.addPolicy((0, import_redirectPolicy.redirectPolicy)(options.redirectOptions), { afterPhase: "Retry" });
  }
  pipeline.addPolicy((0, import_logPolicy.logPolicy)(options.loggingOptions), { afterPhase: "Sign" });
  return pipeline;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=createPipelineFromOptions.js.map


/***/ }),

/***/ 7960:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var defaultHttpClient_exports = {};
__export(defaultHttpClient_exports, {
  createDefaultHttpClient: () => createDefaultHttpClient
});
module.exports = __toCommonJS(defaultHttpClient_exports);
var import_ts_http_runtime = __nccwpck_require__(1958);
var import_wrapAbortSignal = __nccwpck_require__(1297);
function createDefaultHttpClient() {
  const client = (0, import_ts_http_runtime.createDefaultHttpClient)();
  return {
    async sendRequest(request) {
      const { abortSignal, cleanup } = request.abortSignal ? (0, import_wrapAbortSignal.wrapAbortSignalLike)(request.abortSignal) : {};
      try {
        request.abortSignal = abortSignal;
        return await client.sendRequest(request);
      } finally {
        cleanup?.();
      }
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=defaultHttpClient.js.map


/***/ }),

/***/ 192:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var httpHeaders_exports = {};
__export(httpHeaders_exports, {
  createHttpHeaders: () => createHttpHeaders
});
module.exports = __toCommonJS(httpHeaders_exports);
var import_ts_http_runtime = __nccwpck_require__(1958);
function createHttpHeaders(rawHeaders) {
  return (0, import_ts_http_runtime.createHttpHeaders)(rawHeaders);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=httpHeaders.js.map


/***/ }),

/***/ 778:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var src_exports = {};
__export(src_exports, {
  RestError: () => import_restError.RestError,
  agentPolicy: () => import_agentPolicy.agentPolicy,
  agentPolicyName: () => import_agentPolicy.agentPolicyName,
  auxiliaryAuthenticationHeaderPolicy: () => import_auxiliaryAuthenticationHeaderPolicy.auxiliaryAuthenticationHeaderPolicy,
  auxiliaryAuthenticationHeaderPolicyName: () => import_auxiliaryAuthenticationHeaderPolicy.auxiliaryAuthenticationHeaderPolicyName,
  bearerTokenAuthenticationPolicy: () => import_bearerTokenAuthenticationPolicy.bearerTokenAuthenticationPolicy,
  bearerTokenAuthenticationPolicyName: () => import_bearerTokenAuthenticationPolicy.bearerTokenAuthenticationPolicyName,
  createDefaultHttpClient: () => import_defaultHttpClient.createDefaultHttpClient,
  createEmptyPipeline: () => import_pipeline.createEmptyPipeline,
  createFile: () => import_file.createFile,
  createFileFromStream: () => import_file.createFileFromStream,
  createHttpHeaders: () => import_httpHeaders.createHttpHeaders,
  createPipelineFromOptions: () => import_createPipelineFromOptions.createPipelineFromOptions,
  createPipelineRequest: () => import_pipelineRequest.createPipelineRequest,
  decompressResponsePolicy: () => import_decompressResponsePolicy.decompressResponsePolicy,
  decompressResponsePolicyName: () => import_decompressResponsePolicy.decompressResponsePolicyName,
  defaultRetryPolicy: () => import_defaultRetryPolicy.defaultRetryPolicy,
  exponentialRetryPolicy: () => import_exponentialRetryPolicy.exponentialRetryPolicy,
  exponentialRetryPolicyName: () => import_exponentialRetryPolicy.exponentialRetryPolicyName,
  formDataPolicy: () => import_formDataPolicy.formDataPolicy,
  formDataPolicyName: () => import_formDataPolicy.formDataPolicyName,
  getDefaultProxySettings: () => import_proxyPolicy.getDefaultProxySettings,
  isRestError: () => import_restError.isRestError,
  logPolicy: () => import_logPolicy.logPolicy,
  logPolicyName: () => import_logPolicy.logPolicyName,
  multipartPolicy: () => import_multipartPolicy.multipartPolicy,
  multipartPolicyName: () => import_multipartPolicy.multipartPolicyName,
  ndJsonPolicy: () => import_ndJsonPolicy.ndJsonPolicy,
  ndJsonPolicyName: () => import_ndJsonPolicy.ndJsonPolicyName,
  proxyPolicy: () => import_proxyPolicy.proxyPolicy,
  proxyPolicyName: () => import_proxyPolicy.proxyPolicyName,
  redirectPolicy: () => import_redirectPolicy.redirectPolicy,
  redirectPolicyName: () => import_redirectPolicy.redirectPolicyName,
  retryPolicy: () => import_retryPolicy.retryPolicy,
  setClientRequestIdPolicy: () => import_setClientRequestIdPolicy.setClientRequestIdPolicy,
  setClientRequestIdPolicyName: () => import_setClientRequestIdPolicy.setClientRequestIdPolicyName,
  systemErrorRetryPolicy: () => import_systemErrorRetryPolicy.systemErrorRetryPolicy,
  systemErrorRetryPolicyName: () => import_systemErrorRetryPolicy.systemErrorRetryPolicyName,
  throttlingRetryPolicy: () => import_throttlingRetryPolicy.throttlingRetryPolicy,
  throttlingRetryPolicyName: () => import_throttlingRetryPolicy.throttlingRetryPolicyName,
  tlsPolicy: () => import_tlsPolicy.tlsPolicy,
  tlsPolicyName: () => import_tlsPolicy.tlsPolicyName,
  tracingPolicy: () => import_tracingPolicy.tracingPolicy,
  tracingPolicyName: () => import_tracingPolicy.tracingPolicyName,
  userAgentPolicy: () => import_userAgentPolicy.userAgentPolicy,
  userAgentPolicyName: () => import_userAgentPolicy.userAgentPolicyName
});
module.exports = __toCommonJS(src_exports);
var import_pipeline = __nccwpck_require__(9590);
var import_createPipelineFromOptions = __nccwpck_require__(862);
var import_defaultHttpClient = __nccwpck_require__(7960);
var import_httpHeaders = __nccwpck_require__(192);
var import_pipelineRequest = __nccwpck_require__(5709);
var import_restError = __nccwpck_require__(8666);
var import_decompressResponsePolicy = __nccwpck_require__(9295);
var import_exponentialRetryPolicy = __nccwpck_require__(6708);
var import_setClientRequestIdPolicy = __nccwpck_require__(5686);
var import_logPolicy = __nccwpck_require__(3253);
var import_multipartPolicy = __nccwpck_require__(5807);
var import_proxyPolicy = __nccwpck_require__(2815);
var import_redirectPolicy = __nccwpck_require__(4087);
var import_systemErrorRetryPolicy = __nccwpck_require__(6518);
var import_throttlingRetryPolicy = __nccwpck_require__(7540);
var import_retryPolicy = __nccwpck_require__(6085);
var import_tracingPolicy = __nccwpck_require__(3237);
var import_defaultRetryPolicy = __nccwpck_require__(8170);
var import_userAgentPolicy = __nccwpck_require__(2799);
var import_tlsPolicy = __nccwpck_require__(5798);
var import_formDataPolicy = __nccwpck_require__(5497);
var import_bearerTokenAuthenticationPolicy = __nccwpck_require__(6925);
var import_ndJsonPolicy = __nccwpck_require__(6827);
var import_auxiliaryAuthenticationHeaderPolicy = __nccwpck_require__(2262);
var import_agentPolicy = __nccwpck_require__(8554);
var import_file = __nccwpck_require__(7073);
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 544:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var log_exports = {};
__export(log_exports, {
  logger: () => logger
});
module.exports = __toCommonJS(log_exports);
var import_logger = __nccwpck_require__(6515);
const logger = (0, import_logger.createClientLogger)("core-rest-pipeline");
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=log.js.map


/***/ }),

/***/ 9590:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var pipeline_exports = {};
__export(pipeline_exports, {
  createEmptyPipeline: () => createEmptyPipeline
});
module.exports = __toCommonJS(pipeline_exports);
var import_ts_http_runtime = __nccwpck_require__(1958);
function createEmptyPipeline() {
  return (0, import_ts_http_runtime.createEmptyPipeline)();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=pipeline.js.map


/***/ }),

/***/ 5709:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var pipelineRequest_exports = {};
__export(pipelineRequest_exports, {
  createPipelineRequest: () => createPipelineRequest
});
module.exports = __toCommonJS(pipelineRequest_exports);
var import_ts_http_runtime = __nccwpck_require__(1958);
function createPipelineRequest(options) {
  return (0, import_ts_http_runtime.createPipelineRequest)(options);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=pipelineRequest.js.map


/***/ }),

/***/ 8554:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var agentPolicy_exports = {};
__export(agentPolicy_exports, {
  agentPolicy: () => agentPolicy,
  agentPolicyName: () => agentPolicyName
});
module.exports = __toCommonJS(agentPolicy_exports);
var import_policies = __nccwpck_require__(4960);
const agentPolicyName = import_policies.agentPolicyName;
function agentPolicy(agent) {
  return (0, import_policies.agentPolicy)(agent);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=agentPolicy.js.map


/***/ }),

/***/ 2262:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var auxiliaryAuthenticationHeaderPolicy_exports = {};
__export(auxiliaryAuthenticationHeaderPolicy_exports, {
  auxiliaryAuthenticationHeaderPolicy: () => auxiliaryAuthenticationHeaderPolicy,
  auxiliaryAuthenticationHeaderPolicyName: () => auxiliaryAuthenticationHeaderPolicyName
});
module.exports = __toCommonJS(auxiliaryAuthenticationHeaderPolicy_exports);
var import_tokenCycler = __nccwpck_require__(9202);
var import_log = __nccwpck_require__(544);
const auxiliaryAuthenticationHeaderPolicyName = "auxiliaryAuthenticationHeaderPolicy";
const AUTHORIZATION_AUXILIARY_HEADER = "x-ms-authorization-auxiliary";
async function sendAuthorizeRequest(options) {
  const { scopes, getAccessToken, request } = options;
  const getTokenOptions = {
    abortSignal: request.abortSignal,
    tracingOptions: request.tracingOptions
  };
  return (await getAccessToken(scopes, getTokenOptions))?.token ?? "";
}
function auxiliaryAuthenticationHeaderPolicy(options) {
  const { credentials, scopes } = options;
  const logger = options.logger || import_log.logger;
  const tokenCyclerMap = /* @__PURE__ */ new WeakMap();
  return {
    name: auxiliaryAuthenticationHeaderPolicyName,
    async sendRequest(request, next) {
      if (!request.url.toLowerCase().startsWith("https://")) {
        throw new Error(
          "Bearer token authentication for auxiliary header is not permitted for non-TLS protected (non-https) URLs."
        );
      }
      if (!credentials || credentials.length === 0) {
        logger.info(
          `${auxiliaryAuthenticationHeaderPolicyName} header will not be set due to empty credentials.`
        );
        return next(request);
      }
      const tokenPromises = [];
      for (const credential of credentials) {
        let getAccessToken = tokenCyclerMap.get(credential);
        if (!getAccessToken) {
          getAccessToken = (0, import_tokenCycler.createTokenCycler)(credential);
          tokenCyclerMap.set(credential, getAccessToken);
        }
        tokenPromises.push(
          sendAuthorizeRequest({
            scopes: Array.isArray(scopes) ? scopes : [scopes],
            request,
            getAccessToken,
            logger
          })
        );
      }
      const auxiliaryTokens = (await Promise.all(tokenPromises)).filter((token) => Boolean(token));
      if (auxiliaryTokens.length === 0) {
        logger.warning(
          `None of the auxiliary tokens are valid. ${AUTHORIZATION_AUXILIARY_HEADER} header will not be set.`
        );
        return next(request);
      }
      request.headers.set(
        AUTHORIZATION_AUXILIARY_HEADER,
        auxiliaryTokens.map((token) => `Bearer ${token}`).join(", ")
      );
      return next(request);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=auxiliaryAuthenticationHeaderPolicy.js.map


/***/ }),

/***/ 6925:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var bearerTokenAuthenticationPolicy_exports = {};
__export(bearerTokenAuthenticationPolicy_exports, {
  bearerTokenAuthenticationPolicy: () => bearerTokenAuthenticationPolicy,
  bearerTokenAuthenticationPolicyName: () => bearerTokenAuthenticationPolicyName,
  parseChallenges: () => parseChallenges
});
module.exports = __toCommonJS(bearerTokenAuthenticationPolicy_exports);
var import_tokenCycler = __nccwpck_require__(9202);
var import_log = __nccwpck_require__(544);
var import_restError = __nccwpck_require__(8666);
const bearerTokenAuthenticationPolicyName = "bearerTokenAuthenticationPolicy";
async function trySendRequest(request, next) {
  try {
    return [await next(request), void 0];
  } catch (e) {
    if ((0, import_restError.isRestError)(e) && e.response) {
      return [e.response, e];
    } else {
      throw e;
    }
  }
}
async function defaultAuthorizeRequest(options) {
  const { scopes, getAccessToken, request } = options;
  const getTokenOptions = {
    abortSignal: request.abortSignal,
    tracingOptions: request.tracingOptions,
    enableCae: true
  };
  const accessToken = await getAccessToken(scopes, getTokenOptions);
  if (accessToken) {
    options.request.headers.set("Authorization", `Bearer ${accessToken.token}`);
  }
}
function isChallengeResponse(response) {
  return response.status === 401 && response.headers.has("WWW-Authenticate");
}
async function authorizeRequestOnCaeChallenge(onChallengeOptions, caeClaims) {
  const { scopes } = onChallengeOptions;
  const accessToken = await onChallengeOptions.getAccessToken(scopes, {
    enableCae: true,
    claims: caeClaims
  });
  if (!accessToken) {
    return false;
  }
  onChallengeOptions.request.headers.set(
    "Authorization",
    `${accessToken.tokenType ?? "Bearer"} ${accessToken.token}`
  );
  return true;
}
function bearerTokenAuthenticationPolicy(options) {
  const { credential, scopes, challengeCallbacks } = options;
  const logger = options.logger || import_log.logger;
  const callbacks = {
    authorizeRequest: challengeCallbacks?.authorizeRequest?.bind(challengeCallbacks) ?? defaultAuthorizeRequest,
    authorizeRequestOnChallenge: challengeCallbacks?.authorizeRequestOnChallenge?.bind(challengeCallbacks)
  };
  const getAccessToken = credential ? (0, import_tokenCycler.createTokenCycler)(
    credential
    /* , options */
  ) : () => Promise.resolve(null);
  return {
    name: bearerTokenAuthenticationPolicyName,
    /**
     * If there's no challenge parameter:
     * - It will try to retrieve the token using the cache, or the credential's getToken.
     * - Then it will try the next policy with or without the retrieved token.
     *
     * It uses the challenge parameters to:
     * - Skip a first attempt to get the token from the credential if there's no cached token,
     *   since it expects the token to be retrievable only after the challenge.
     * - Prepare the outgoing request if the `prepareRequest` method has been provided.
     * - Send an initial request to receive the challenge if it fails.
     * - Process a challenge if the response contains it.
     * - Retrieve a token with the challenge information, then re-send the request.
     */
    async sendRequest(request, next) {
      if (!request.url.toLowerCase().startsWith("https://")) {
        throw new Error(
          "Bearer token authentication is not permitted for non-TLS protected (non-https) URLs."
        );
      }
      await callbacks.authorizeRequest({
        scopes: Array.isArray(scopes) ? scopes : [scopes],
        request,
        getAccessToken,
        logger
      });
      let response;
      let error;
      let shouldSendRequest;
      [response, error] = await trySendRequest(request, next);
      if (isChallengeResponse(response)) {
        let claims = getCaeChallengeClaims(response.headers.get("WWW-Authenticate"));
        if (claims) {
          let parsedClaim;
          try {
            parsedClaim = atob(claims);
          } catch (e) {
            logger.warning(
              `The WWW-Authenticate header contains "claims" that cannot be parsed. Unable to perform the Continuous Access Evaluation authentication flow. Unparsable claims: ${claims}`
            );
            return response;
          }
          shouldSendRequest = await authorizeRequestOnCaeChallenge(
            {
              scopes: Array.isArray(scopes) ? scopes : [scopes],
              response,
              request,
              getAccessToken,
              logger
            },
            parsedClaim
          );
          if (shouldSendRequest) {
            [response, error] = await trySendRequest(request, next);
          }
        } else if (callbacks.authorizeRequestOnChallenge) {
          shouldSendRequest = await callbacks.authorizeRequestOnChallenge({
            scopes: Array.isArray(scopes) ? scopes : [scopes],
            request,
            response,
            getAccessToken,
            logger
          });
          if (shouldSendRequest) {
            [response, error] = await trySendRequest(request, next);
          }
          if (isChallengeResponse(response)) {
            claims = getCaeChallengeClaims(response.headers.get("WWW-Authenticate") ?? "");
            if (claims) {
              let parsedClaim;
              try {
                parsedClaim = atob(claims);
              } catch (e) {
                logger.warning(
                  `The WWW-Authenticate header contains "claims" that cannot be parsed. Unable to perform the Continuous Access Evaluation authentication flow. Unparsable claims: ${claims}`
                );
                return response;
              }
              shouldSendRequest = await authorizeRequestOnCaeChallenge(
                {
                  scopes: Array.isArray(scopes) ? scopes : [scopes],
                  response,
                  request,
                  getAccessToken,
                  logger
                },
                parsedClaim
              );
              if (shouldSendRequest) {
                [response, error] = await trySendRequest(request, next);
              }
            }
          }
        }
      }
      if (error) {
        throw error;
      } else {
        return response;
      }
    }
  };
}
function parseChallenges(challenges) {
  const challengeRegex = /(\w+)\s+((?:\w+=(?:"[^"]*"|[^,]*),?\s*)+)/g;
  const paramRegex = /(\w+)="([^"]*)"/g;
  const parsedChallenges = [];
  let match;
  while ((match = challengeRegex.exec(challenges)) !== null) {
    const scheme = match[1];
    const paramsString = match[2];
    const params = {};
    let paramMatch;
    while ((paramMatch = paramRegex.exec(paramsString)) !== null) {
      params[paramMatch[1]] = paramMatch[2];
    }
    parsedChallenges.push({ scheme, params });
  }
  return parsedChallenges;
}
function getCaeChallengeClaims(challenges) {
  if (!challenges) {
    return;
  }
  const parsedChallenges = parseChallenges(challenges);
  return parsedChallenges.find(
    (x) => x.scheme === "Bearer" && x.params.claims && x.params.error === "insufficient_claims"
  )?.params.claims;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=bearerTokenAuthenticationPolicy.js.map


/***/ }),

/***/ 9295:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var decompressResponsePolicy_exports = {};
__export(decompressResponsePolicy_exports, {
  decompressResponsePolicy: () => decompressResponsePolicy,
  decompressResponsePolicyName: () => decompressResponsePolicyName
});
module.exports = __toCommonJS(decompressResponsePolicy_exports);
var import_policies = __nccwpck_require__(4960);
const decompressResponsePolicyName = import_policies.decompressResponsePolicyName;
function decompressResponsePolicy() {
  return (0, import_policies.decompressResponsePolicy)();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=decompressResponsePolicy.js.map


/***/ }),

/***/ 8170:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var defaultRetryPolicy_exports = {};
__export(defaultRetryPolicy_exports, {
  defaultRetryPolicy: () => defaultRetryPolicy,
  defaultRetryPolicyName: () => defaultRetryPolicyName
});
module.exports = __toCommonJS(defaultRetryPolicy_exports);
var import_policies = __nccwpck_require__(4960);
const defaultRetryPolicyName = import_policies.defaultRetryPolicyName;
function defaultRetryPolicy(options = {}) {
  return (0, import_policies.defaultRetryPolicy)(options);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=defaultRetryPolicy.js.map


/***/ }),

/***/ 6708:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var exponentialRetryPolicy_exports = {};
__export(exponentialRetryPolicy_exports, {
  exponentialRetryPolicy: () => exponentialRetryPolicy,
  exponentialRetryPolicyName: () => exponentialRetryPolicyName
});
module.exports = __toCommonJS(exponentialRetryPolicy_exports);
var import_policies = __nccwpck_require__(4960);
const exponentialRetryPolicyName = import_policies.exponentialRetryPolicyName;
function exponentialRetryPolicy(options = {}) {
  return (0, import_policies.exponentialRetryPolicy)(options);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=exponentialRetryPolicy.js.map


/***/ }),

/***/ 5497:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var formDataPolicy_exports = {};
__export(formDataPolicy_exports, {
  formDataPolicy: () => formDataPolicy,
  formDataPolicyName: () => formDataPolicyName
});
module.exports = __toCommonJS(formDataPolicy_exports);
var import_policies = __nccwpck_require__(4960);
const formDataPolicyName = import_policies.formDataPolicyName;
function formDataPolicy() {
  return (0, import_policies.formDataPolicy)();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=formDataPolicy.js.map


/***/ }),

/***/ 3253:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var logPolicy_exports = {};
__export(logPolicy_exports, {
  logPolicy: () => logPolicy,
  logPolicyName: () => logPolicyName
});
module.exports = __toCommonJS(logPolicy_exports);
var import_log = __nccwpck_require__(544);
var import_policies = __nccwpck_require__(4960);
const logPolicyName = import_policies.logPolicyName;
function logPolicy(options = {}) {
  return (0, import_policies.logPolicy)({
    logger: import_log.logger.info,
    ...options
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=logPolicy.js.map


/***/ }),

/***/ 5807:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var multipartPolicy_exports = {};
__export(multipartPolicy_exports, {
  multipartPolicy: () => multipartPolicy,
  multipartPolicyName: () => multipartPolicyName
});
module.exports = __toCommonJS(multipartPolicy_exports);
var import_policies = __nccwpck_require__(4960);
var import_file = __nccwpck_require__(7073);
const multipartPolicyName = import_policies.multipartPolicyName;
function multipartPolicy() {
  const tspPolicy = (0, import_policies.multipartPolicy)();
  return {
    name: multipartPolicyName,
    sendRequest: async (request, next) => {
      if (request.multipartBody) {
        for (const part of request.multipartBody.parts) {
          if ((0, import_file.hasRawContent)(part.body)) {
            part.body = (0, import_file.getRawContent)(part.body);
          }
        }
      }
      return tspPolicy.sendRequest(request, next);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=multipartPolicy.js.map


/***/ }),

/***/ 6827:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var ndJsonPolicy_exports = {};
__export(ndJsonPolicy_exports, {
  ndJsonPolicy: () => ndJsonPolicy,
  ndJsonPolicyName: () => ndJsonPolicyName
});
module.exports = __toCommonJS(ndJsonPolicy_exports);
const ndJsonPolicyName = "ndJsonPolicy";
function ndJsonPolicy() {
  return {
    name: ndJsonPolicyName,
    async sendRequest(request, next) {
      if (typeof request.body === "string" && request.body.startsWith("[")) {
        const body = JSON.parse(request.body);
        request.body = body.map((item) => JSON.stringify(item) + "\n").join("");
      }
      return next(request);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=ndJsonPolicy.js.map


/***/ }),

/***/ 2815:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var proxyPolicy_exports = {};
__export(proxyPolicy_exports, {
  getDefaultProxySettings: () => getDefaultProxySettings,
  proxyPolicy: () => proxyPolicy,
  proxyPolicyName: () => proxyPolicyName
});
module.exports = __toCommonJS(proxyPolicy_exports);
var import_policies = __nccwpck_require__(4960);
const proxyPolicyName = import_policies.proxyPolicyName;
function getDefaultProxySettings(proxyUrl) {
  return (0, import_policies.getDefaultProxySettings)(proxyUrl);
}
function proxyPolicy(proxySettings, options) {
  return (0, import_policies.proxyPolicy)(proxySettings, options);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=proxyPolicy.js.map


/***/ }),

/***/ 4087:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var redirectPolicy_exports = {};
__export(redirectPolicy_exports, {
  redirectPolicy: () => redirectPolicy,
  redirectPolicyName: () => redirectPolicyName
});
module.exports = __toCommonJS(redirectPolicy_exports);
var import_policies = __nccwpck_require__(4960);
const redirectPolicyName = import_policies.redirectPolicyName;
function redirectPolicy(options = {}) {
  return (0, import_policies.redirectPolicy)(options);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=redirectPolicy.js.map


/***/ }),

/***/ 6085:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var retryPolicy_exports = {};
__export(retryPolicy_exports, {
  retryPolicy: () => retryPolicy
});
module.exports = __toCommonJS(retryPolicy_exports);
var import_logger = __nccwpck_require__(6515);
var import_constants = __nccwpck_require__(6427);
var import_policies = __nccwpck_require__(4960);
const retryPolicyLogger = (0, import_logger.createClientLogger)("core-rest-pipeline retryPolicy");
function retryPolicy(strategies, options = { maxRetries: import_constants.DEFAULT_RETRY_POLICY_COUNT }) {
  return (0, import_policies.retryPolicy)(strategies, {
    logger: retryPolicyLogger,
    ...options
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=retryPolicy.js.map


/***/ }),

/***/ 5686:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var setClientRequestIdPolicy_exports = {};
__export(setClientRequestIdPolicy_exports, {
  setClientRequestIdPolicy: () => setClientRequestIdPolicy,
  setClientRequestIdPolicyName: () => setClientRequestIdPolicyName
});
module.exports = __toCommonJS(setClientRequestIdPolicy_exports);
const setClientRequestIdPolicyName = "setClientRequestIdPolicy";
function setClientRequestIdPolicy(requestIdHeaderName = "x-ms-client-request-id") {
  return {
    name: setClientRequestIdPolicyName,
    async sendRequest(request, next) {
      if (!request.headers.has(requestIdHeaderName)) {
        request.headers.set(requestIdHeaderName, request.requestId);
      }
      return next(request);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=setClientRequestIdPolicy.js.map


/***/ }),

/***/ 6518:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var systemErrorRetryPolicy_exports = {};
__export(systemErrorRetryPolicy_exports, {
  systemErrorRetryPolicy: () => systemErrorRetryPolicy,
  systemErrorRetryPolicyName: () => systemErrorRetryPolicyName
});
module.exports = __toCommonJS(systemErrorRetryPolicy_exports);
var import_policies = __nccwpck_require__(4960);
const systemErrorRetryPolicyName = import_policies.systemErrorRetryPolicyName;
function systemErrorRetryPolicy(options = {}) {
  return (0, import_policies.systemErrorRetryPolicy)(options);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=systemErrorRetryPolicy.js.map


/***/ }),

/***/ 7540:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var throttlingRetryPolicy_exports = {};
__export(throttlingRetryPolicy_exports, {
  throttlingRetryPolicy: () => throttlingRetryPolicy,
  throttlingRetryPolicyName: () => throttlingRetryPolicyName
});
module.exports = __toCommonJS(throttlingRetryPolicy_exports);
var import_policies = __nccwpck_require__(4960);
const throttlingRetryPolicyName = import_policies.throttlingRetryPolicyName;
function throttlingRetryPolicy(options = {}) {
  return (0, import_policies.throttlingRetryPolicy)(options);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=throttlingRetryPolicy.js.map


/***/ }),

/***/ 5798:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var tlsPolicy_exports = {};
__export(tlsPolicy_exports, {
  tlsPolicy: () => tlsPolicy,
  tlsPolicyName: () => tlsPolicyName
});
module.exports = __toCommonJS(tlsPolicy_exports);
var import_policies = __nccwpck_require__(4960);
const tlsPolicyName = import_policies.tlsPolicyName;
function tlsPolicy(tlsSettings) {
  return (0, import_policies.tlsPolicy)(tlsSettings);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=tlsPolicy.js.map


/***/ }),

/***/ 3237:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var tracingPolicy_exports = {};
__export(tracingPolicy_exports, {
  tracingPolicy: () => tracingPolicy,
  tracingPolicyName: () => tracingPolicyName
});
module.exports = __toCommonJS(tracingPolicy_exports);
var import_core_tracing = __nccwpck_require__(623);
var import_constants = __nccwpck_require__(6427);
var import_userAgent = __nccwpck_require__(8431);
var import_log = __nccwpck_require__(544);
var import_core_util = __nccwpck_require__(7779);
var import_restError = __nccwpck_require__(8666);
var import_util = __nccwpck_require__(5750);
const tracingPolicyName = "tracingPolicy";
function tracingPolicy(options = {}) {
  const userAgentPromise = (0, import_userAgent.getUserAgentValue)(options.userAgentPrefix);
  const sanitizer = new import_util.Sanitizer({
    additionalAllowedQueryParameters: options.additionalAllowedQueryParameters
  });
  const tracingClient = tryCreateTracingClient();
  return {
    name: tracingPolicyName,
    async sendRequest(request, next) {
      if (!tracingClient) {
        return next(request);
      }
      const userAgent = await userAgentPromise;
      const spanAttributes = {
        "http.url": sanitizer.sanitizeUrl(request.url),
        "http.method": request.method,
        "http.user_agent": userAgent,
        requestId: request.requestId
      };
      if (userAgent) {
        spanAttributes["http.user_agent"] = userAgent;
      }
      const { span, tracingContext } = tryCreateSpan(tracingClient, request, spanAttributes) ?? {};
      if (!span || !tracingContext) {
        return next(request);
      }
      try {
        const response = await tracingClient.withContext(tracingContext, next, request);
        tryProcessResponse(span, response);
        return response;
      } catch (err) {
        tryProcessError(span, err);
        throw err;
      }
    }
  };
}
function tryCreateTracingClient() {
  try {
    return (0, import_core_tracing.createTracingClient)({
      namespace: "",
      packageName: "@azure/core-rest-pipeline",
      packageVersion: import_constants.SDK_VERSION
    });
  } catch (e) {
    import_log.logger.warning(`Error when creating the TracingClient: ${(0, import_core_util.getErrorMessage)(e)}`);
    return void 0;
  }
}
function tryCreateSpan(tracingClient, request, spanAttributes) {
  try {
    const { span, updatedOptions } = tracingClient.startSpan(
      `HTTP ${request.method}`,
      { tracingOptions: request.tracingOptions },
      {
        spanKind: "client",
        spanAttributes
      }
    );
    if (!span.isRecording()) {
      span.end();
      return void 0;
    }
    const headers = tracingClient.createRequestHeaders(
      updatedOptions.tracingOptions.tracingContext
    );
    for (const [key, value] of Object.entries(headers)) {
      request.headers.set(key, value);
    }
    return { span, tracingContext: updatedOptions.tracingOptions.tracingContext };
  } catch (e) {
    import_log.logger.warning(`Skipping creating a tracing span due to an error: ${(0, import_core_util.getErrorMessage)(e)}`);
    return void 0;
  }
}
function tryProcessError(span, error) {
  try {
    span.setStatus({
      status: "error",
      error: (0, import_core_util.isError)(error) ? error : void 0
    });
    if ((0, import_restError.isRestError)(error) && error.statusCode) {
      span.setAttribute("http.status_code", error.statusCode);
    }
    span.end();
  } catch (e) {
    import_log.logger.warning(`Skipping tracing span processing due to an error: ${(0, import_core_util.getErrorMessage)(e)}`);
  }
}
function tryProcessResponse(span, response) {
  try {
    span.setAttribute("http.status_code", response.status);
    const serviceRequestId = response.headers.get("x-ms-request-id");
    if (serviceRequestId) {
      span.setAttribute("serviceRequestId", serviceRequestId);
    }
    if (response.status >= 400) {
      span.setStatus({
        status: "error"
      });
    }
    span.end();
  } catch (e) {
    import_log.logger.warning(`Skipping tracing span processing due to an error: ${(0, import_core_util.getErrorMessage)(e)}`);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=tracingPolicy.js.map


/***/ }),

/***/ 2799:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var userAgentPolicy_exports = {};
__export(userAgentPolicy_exports, {
  userAgentPolicy: () => userAgentPolicy,
  userAgentPolicyName: () => userAgentPolicyName
});
module.exports = __toCommonJS(userAgentPolicy_exports);
var import_userAgent = __nccwpck_require__(8431);
const UserAgentHeaderName = (0, import_userAgent.getUserAgentHeaderName)();
const userAgentPolicyName = "userAgentPolicy";
function userAgentPolicy(options = {}) {
  const userAgentValue = (0, import_userAgent.getUserAgentValue)(options.userAgentPrefix);
  return {
    name: userAgentPolicyName,
    async sendRequest(request, next) {
      if (!request.headers.has(UserAgentHeaderName)) {
        request.headers.set(UserAgentHeaderName, await userAgentValue);
      }
      return next(request);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=userAgentPolicy.js.map


/***/ }),

/***/ 7466:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var wrapAbortSignalLikePolicy_exports = {};
__export(wrapAbortSignalLikePolicy_exports, {
  wrapAbortSignalLikePolicy: () => wrapAbortSignalLikePolicy,
  wrapAbortSignalLikePolicyName: () => wrapAbortSignalLikePolicyName
});
module.exports = __toCommonJS(wrapAbortSignalLikePolicy_exports);
var import_wrapAbortSignal = __nccwpck_require__(1297);
const wrapAbortSignalLikePolicyName = "wrapAbortSignalLikePolicy";
function wrapAbortSignalLikePolicy() {
  return {
    name: wrapAbortSignalLikePolicyName,
    sendRequest: async (request, next) => {
      if (!request.abortSignal) {
        return next(request);
      }
      const { abortSignal, cleanup } = (0, import_wrapAbortSignal.wrapAbortSignalLike)(request.abortSignal);
      request.abortSignal = abortSignal;
      try {
        return await next(request);
      } finally {
        cleanup?.();
      }
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=wrapAbortSignalLikePolicy.js.map


/***/ }),

/***/ 8666:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var restError_exports = {};
__export(restError_exports, {
  RestError: () => RestError,
  isRestError: () => isRestError
});
module.exports = __toCommonJS(restError_exports);
var import_ts_http_runtime = __nccwpck_require__(1958);
const RestError = import_ts_http_runtime.RestError;
function isRestError(e) {
  return (0, import_ts_http_runtime.isRestError)(e);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=restError.js.map


/***/ }),

/***/ 6141:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var createFile_exports = {};
__export(createFile_exports, {
  createFile: () => createFile
});
module.exports = __toCommonJS(createFile_exports);
var import_file = __nccwpck_require__(7073);
function createFile(content, name, options = {}) {
  return (0, import_file.createRawFile)(content, name, options);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=createFile.js.map


/***/ }),

/***/ 7073:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var file_exports = {};
__export(file_exports, {
  createFile: () => import_createFile.createFile,
  createFileFromStream: () => createFileFromStream,
  createRawFile: () => createRawFile,
  getRawContent: () => getRawContent,
  hasRawContent: () => hasRawContent
});
module.exports = __toCommonJS(file_exports);
var import_createFile = __nccwpck_require__(6141);
function isNodeReadableStream(x) {
  return typeof x === "object" && x !== null && "pipe" in x && typeof x.pipe === "function";
}
const unimplementedMethods = {
  arrayBuffer: () => {
    throw new Error("Not implemented");
  },
  bytes: () => {
    throw new Error("Not implemented");
  },
  slice: () => {
    throw new Error("Not implemented");
  },
  text: () => {
    throw new Error("Not implemented");
  }
};
const rawContent = /* @__PURE__ */ Symbol("rawContent");
function hasRawContent(x) {
  return typeof x[rawContent] === "function";
}
function getRawContent(blob) {
  if (hasRawContent(blob)) {
    return blob[rawContent]();
  } else {
    return blob;
  }
}
function createRawFile(content, name, options = {}) {
  return {
    ...unimplementedMethods,
    type: options.type ?? "",
    lastModified: options.lastModified ?? (/* @__PURE__ */ new Date()).getTime(),
    webkitRelativePath: options.webkitRelativePath ?? "",
    size: content.byteLength,
    name,
    arrayBuffer: async () => toArrayBuffer(content).buffer,
    stream: () => new Blob([toArrayBuffer(content)]).stream(),
    [rawContent]: () => content
  };
}
function createFileFromStream(stream, name, options = {}) {
  return {
    ...unimplementedMethods,
    type: options.type ?? "",
    lastModified: options.lastModified ?? (/* @__PURE__ */ new Date()).getTime(),
    webkitRelativePath: options.webkitRelativePath ?? "",
    size: options.size ?? -1,
    name,
    stream: () => {
      const s = stream();
      if (isNodeReadableStream(s)) {
        throw new Error(
          "Not supported: a Node stream was provided as input to createFileFromStream."
        );
      }
      return s;
    },
    [rawContent]: stream
  };
}
function hasArrayBuffer(source) {
  return "resize" in source.buffer;
}
function toArrayBuffer(source) {
  if (hasArrayBuffer(source)) {
    if (source.byteOffset !== 0 || source.byteLength !== source.buffer.byteLength) {
      return new Uint8Array(source);
    }
    return source;
  }
  return source.map((x) => x);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=file.js.map


/***/ }),

/***/ 9202:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var tokenCycler_exports = {};
__export(tokenCycler_exports, {
  DEFAULT_CYCLER_OPTIONS: () => DEFAULT_CYCLER_OPTIONS,
  createTokenCycler: () => createTokenCycler
});
module.exports = __toCommonJS(tokenCycler_exports);
var import_core_util = __nccwpck_require__(7779);
const DEFAULT_CYCLER_OPTIONS = {
  forcedRefreshWindowInMs: 1e3,
  // Force waiting for a refresh 1s before the token expires
  retryIntervalInMs: 3e3,
  // Allow refresh attempts every 3s
  refreshWindowInMs: 1e3 * 60 * 2
  // Start refreshing 2m before expiry
};
async function beginRefresh(getAccessToken, retryIntervalInMs, refreshTimeout) {
  async function tryGetAccessToken() {
    if (Date.now() < refreshTimeout) {
      try {
        return await getAccessToken();
      } catch {
        return null;
      }
    } else {
      const finalToken = await getAccessToken();
      if (finalToken === null) {
        throw new Error("Failed to refresh access token.");
      }
      return finalToken;
    }
  }
  let token = await tryGetAccessToken();
  while (token === null) {
    await (0, import_core_util.delay)(retryIntervalInMs);
    token = await tryGetAccessToken();
  }
  return token;
}
function createTokenCycler(credential, tokenCyclerOptions) {
  let refreshWorker = null;
  let token = null;
  let tenantId;
  const options = {
    ...DEFAULT_CYCLER_OPTIONS,
    ...tokenCyclerOptions
  };
  const cycler = {
    /**
     * Produces true if a refresh job is currently in progress.
     */
    get isRefreshing() {
      return refreshWorker !== null;
    },
    /**
     * Produces true if the cycler SHOULD refresh (we are within the refresh
     * window and not already refreshing)
     */
    get shouldRefresh() {
      if (token === null) {
        return true;
      }
      if (cycler.isRefreshing) {
        return false;
      }
      if (token.refreshAfterTimestamp && token.refreshAfterTimestamp < Date.now()) {
        return true;
      }
      return token.expiresOnTimestamp - options.refreshWindowInMs < Date.now();
    },
    /**
     * Produces true if the cycler MUST refresh (null or nearly-expired
     * token).
     */
    get mustRefresh() {
      return token === null || token.expiresOnTimestamp - options.forcedRefreshWindowInMs < Date.now();
    }
  };
  function refresh(scopes, getTokenOptions) {
    if (!cycler.isRefreshing) {
      const tryGetAccessToken = () => credential.getToken(scopes, getTokenOptions);
      refreshWorker = beginRefresh(
        tryGetAccessToken,
        options.retryIntervalInMs,
        // If we don't have a token, then we should timeout immediately
        token?.expiresOnTimestamp ?? Date.now()
      ).then((_token) => {
        refreshWorker = null;
        token = _token;
        tenantId = getTokenOptions.tenantId;
        return token;
      }).catch((reason) => {
        refreshWorker = null;
        token = null;
        tenantId = void 0;
        throw reason;
      });
    }
    return refreshWorker;
  }
  return async (scopes, tokenOptions) => {
    const hasClaimChallenge = Boolean(tokenOptions.claims);
    const tenantIdChanged = tenantId !== tokenOptions.tenantId;
    if (hasClaimChallenge) {
      token = null;
    }
    const mustRefresh = tenantIdChanged || hasClaimChallenge || cycler.mustRefresh;
    if (mustRefresh) {
      return refresh(scopes, tokenOptions);
    }
    if (cycler.shouldRefresh) {
      refresh(scopes, tokenOptions);
    }
    return token;
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=tokenCycler.js.map


/***/ }),

/***/ 8431:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var userAgent_exports = {};
__export(userAgent_exports, {
  getUserAgentHeaderName: () => getUserAgentHeaderName,
  getUserAgentValue: () => getUserAgentValue
});
module.exports = __toCommonJS(userAgent_exports);
var import_userAgent = __nccwpck_require__(1848);
var import_constants = __nccwpck_require__(6427);
function getUserAgentString(telemetryInfo) {
  const parts = [];
  for (const [key, value] of telemetryInfo) {
    const token = value ? `${key}/${value}` : key;
    parts.push(token);
  }
  return parts.join(" ");
}
function getUserAgentHeaderName() {
  return (0, import_userAgent.getHeaderName)();
}
async function getUserAgentValue(prefix) {
  const runtimeInfo = /* @__PURE__ */ new Map();
  runtimeInfo.set("core-rest-pipeline", import_constants.SDK_VERSION);
  await (0, import_userAgent.setPlatformSpecificData)(runtimeInfo);
  const defaultAgent = getUserAgentString(runtimeInfo);
  const userAgentValue = prefix ? `${prefix} ${defaultAgent}` : defaultAgent;
  return userAgentValue;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=userAgent.js.map


/***/ }),

/***/ 1848:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var userAgentPlatform_exports = {};
__export(userAgentPlatform_exports, {
  getHeaderName: () => getHeaderName,
  setPlatformSpecificData: () => setPlatformSpecificData
});
module.exports = __toCommonJS(userAgentPlatform_exports);
var import_node_os = __toESM(__nccwpck_require__(8161));
var import_node_process = __toESM(__nccwpck_require__(1708));
function getHeaderName() {
  return "User-Agent";
}
async function setPlatformSpecificData(map) {
  if (import_node_process.default && import_node_process.default.versions) {
    const osInfo = `${import_node_os.default.type()} ${import_node_os.default.release()}; ${import_node_os.default.arch()}`;
    if (import_node_process.default.versions.bun) {
      map.set("Bun", `${import_node_process.default.versions.bun} (${osInfo})`);
    } else if (import_node_process.default.versions.deno) {
      map.set("Deno", `${import_node_process.default.versions.deno} (${osInfo})`);
    } else if (import_node_process.default.versions.node) {
      map.set("Node", `${import_node_process.default.versions.node} (${osInfo})`);
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=userAgentPlatform.js.map


/***/ }),

/***/ 1297:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var wrapAbortSignal_exports = {};
__export(wrapAbortSignal_exports, {
  wrapAbortSignalLike: () => wrapAbortSignalLike
});
module.exports = __toCommonJS(wrapAbortSignal_exports);
function wrapAbortSignalLike(abortSignalLike) {
  if (abortSignalLike instanceof AbortSignal) {
    return { abortSignal: abortSignalLike };
  }
  if (abortSignalLike.aborted) {
    return {
      abortSignal: AbortSignal.abort(
        "reason" in abortSignalLike ? abortSignalLike.reason : void 0
      )
    };
  }
  const controller = new AbortController();
  let needsCleanup = true;
  function cleanup() {
    if (needsCleanup) {
      abortSignalLike.removeEventListener("abort", listener);
      needsCleanup = false;
    }
  }
  function listener() {
    controller.abort("reason" in abortSignalLike ? abortSignalLike.reason : void 0);
    cleanup();
  }
  abortSignalLike.addEventListener("abort", listener);
  return { abortSignal: controller.signal, cleanup };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=wrapAbortSignal.js.map


/***/ }),

/***/ 623:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createTracingClient = exports.useInstrumenter = void 0;
var instrumenter_js_1 = __nccwpck_require__(8729);
Object.defineProperty(exports, "useInstrumenter", ({ enumerable: true, get: function () { return instrumenter_js_1.useInstrumenter; } }));
var tracingClient_js_1 = __nccwpck_require__(3438);
Object.defineProperty(exports, "createTracingClient", ({ enumerable: true, get: function () { return tracingClient_js_1.createTracingClient; } }));
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 8729:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createDefaultTracingSpan = createDefaultTracingSpan;
exports.createDefaultInstrumenter = createDefaultInstrumenter;
exports.useInstrumenter = useInstrumenter;
exports.getInstrumenter = getInstrumenter;
const tracingContext_js_1 = __nccwpck_require__(9186);
const state_js_1 = __nccwpck_require__(8914);
function createDefaultTracingSpan() {
    return {
        end: () => {
            // noop
        },
        isRecording: () => false,
        recordException: () => {
            // noop
        },
        setAttribute: () => {
            // noop
        },
        setStatus: () => {
            // noop
        },
        addEvent: () => {
            // noop
        },
    };
}
function createDefaultInstrumenter() {
    return {
        createRequestHeaders: () => {
            return {};
        },
        parseTraceparentHeader: () => {
            return undefined;
        },
        startSpan: (_name, spanOptions) => {
            return {
                span: createDefaultTracingSpan(),
                tracingContext: (0, tracingContext_js_1.createTracingContext)({ parentContext: spanOptions.tracingContext }),
            };
        },
        withContext(_context, callback, ...callbackArgs) {
            return callback(...callbackArgs);
        },
    };
}
/**
 * Extends the Azure SDK with support for a given instrumenter implementation.
 *
 * @param instrumenter - The instrumenter implementation to use.
 */
function useInstrumenter(instrumenter) {
    state_js_1.state.instrumenterImplementation = instrumenter;
}
/**
 * Gets the currently set instrumenter, a No-Op instrumenter by default.
 *
 * @returns The currently set instrumenter
 */
function getInstrumenter() {
    if (!state_js_1.state.instrumenterImplementation) {
        state_js_1.state.instrumenterImplementation = createDefaultInstrumenter();
    }
    return state_js_1.state.instrumenterImplementation;
}
//# sourceMappingURL=instrumenter.js.map

/***/ }),

/***/ 8914:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.state = void 0;
/**
 * @internal
 *
 * Holds the singleton instrumenter, to be shared across CJS and ESM imports.
 */
exports.state = {
    instrumenterImplementation: undefined,
};
//# sourceMappingURL=state-cjs.cjs.map

/***/ }),

/***/ 3438:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createTracingClient = createTracingClient;
const instrumenter_js_1 = __nccwpck_require__(8729);
const tracingContext_js_1 = __nccwpck_require__(9186);
/**
 * Creates a new tracing client.
 *
 * @param options - Options used to configure the tracing client.
 * @returns - An instance of {@link TracingClient}.
 */
function createTracingClient(options) {
    const { namespace, packageName, packageVersion } = options;
    function startSpan(name, operationOptions, spanOptions) {
        const startSpanResult = (0, instrumenter_js_1.getInstrumenter)().startSpan(name, {
            ...spanOptions,
            packageName: packageName,
            packageVersion: packageVersion,
            tracingContext: operationOptions?.tracingOptions?.tracingContext,
        });
        let tracingContext = startSpanResult.tracingContext;
        const span = startSpanResult.span;
        if (!tracingContext.getValue(tracingContext_js_1.knownContextKeys.namespace)) {
            tracingContext = tracingContext.setValue(tracingContext_js_1.knownContextKeys.namespace, namespace);
        }
        span.setAttribute("az.namespace", tracingContext.getValue(tracingContext_js_1.knownContextKeys.namespace));
        const updatedOptions = Object.assign({}, operationOptions, {
            tracingOptions: { ...operationOptions?.tracingOptions, tracingContext },
        });
        return {
            span,
            updatedOptions,
        };
    }
    async function withSpan(name, operationOptions, callback, spanOptions) {
        const { span, updatedOptions } = startSpan(name, operationOptions, spanOptions);
        try {
            const result = await withContext(updatedOptions.tracingOptions.tracingContext, () => Promise.resolve(callback(updatedOptions, span)));
            span.setStatus({ status: "success" });
            return result;
        }
        catch (err) {
            span.setStatus({ status: "error", error: err });
            throw err;
        }
        finally {
            span.end();
        }
    }
    function withContext(context, callback, ...callbackArgs) {
        return (0, instrumenter_js_1.getInstrumenter)().withContext(context, callback, ...callbackArgs);
    }
    /**
     * Parses a traceparent header value into a span identifier.
     *
     * @param traceparentHeader - The traceparent header to parse.
     * @returns An implementation-specific identifier for the span.
     */
    function parseTraceparentHeader(traceparentHeader) {
        return (0, instrumenter_js_1.getInstrumenter)().parseTraceparentHeader(traceparentHeader);
    }
    /**
     * Creates a set of request headers to propagate tracing information to a backend.
     *
     * @param tracingContext - The context containing the span to serialize.
     * @returns The set of headers to add to a request.
     */
    function createRequestHeaders(tracingContext) {
        return (0, instrumenter_js_1.getInstrumenter)().createRequestHeaders(tracingContext);
    }
    return {
        startSpan,
        withSpan,
        withContext,
        parseTraceparentHeader,
        createRequestHeaders,
    };
}
//# sourceMappingURL=tracingClient.js.map

/***/ }),

/***/ 9186:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TracingContextImpl = exports.knownContextKeys = void 0;
exports.createTracingContext = createTracingContext;
/** @internal */
exports.knownContextKeys = {
    span: Symbol.for("@azure/core-tracing span"),
    namespace: Symbol.for("@azure/core-tracing namespace"),
};
/**
 * Creates a new {@link TracingContext} with the given options.
 * @param options - A set of known keys that may be set on the context.
 * @returns A new {@link TracingContext} with the given options.
 *
 * @internal
 */
function createTracingContext(options = {}) {
    let context = new TracingContextImpl(options.parentContext);
    if (options.span) {
        context = context.setValue(exports.knownContextKeys.span, options.span);
    }
    if (options.namespace) {
        context = context.setValue(exports.knownContextKeys.namespace, options.namespace);
    }
    return context;
}
/** @internal */
class TracingContextImpl {
    _contextMap;
    constructor(initialContext) {
        this._contextMap =
            initialContext instanceof TracingContextImpl
                ? new Map(initialContext._contextMap)
                : new Map();
    }
    setValue(key, value) {
        const newContext = new TracingContextImpl(this);
        newContext._contextMap.set(key, value);
        return newContext;
    }
    getValue(key) {
        return this._contextMap.get(key);
    }
    deleteValue(key) {
        const newContext = new TracingContextImpl(this);
        newContext._contextMap.delete(key);
        return newContext;
    }
}
exports.TracingContextImpl = TracingContextImpl;
//# sourceMappingURL=tracingContext.js.map

/***/ }),

/***/ 5209:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.cancelablePromiseRace = cancelablePromiseRace;
/**
 * promise.race() wrapper that aborts rest of promises as soon as the first promise settles.
 */
async function cancelablePromiseRace(abortablePromiseBuilders, options) {
    const aborter = new AbortController();
    function abortHandler() {
        aborter.abort();
    }
    options?.abortSignal?.addEventListener("abort", abortHandler);
    try {
        return await Promise.race(abortablePromiseBuilders.map((p) => p({ abortSignal: aborter.signal })));
    }
    finally {
        aborter.abort();
        options?.abortSignal?.removeEventListener("abort", abortHandler);
    }
}
//# sourceMappingURL=aborterUtils.js.map

/***/ }),

/***/ 3128:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createAbortablePromise = createAbortablePromise;
const abort_controller_1 = __nccwpck_require__(3134);
/**
 * Creates an abortable promise.
 * @param buildPromise - A function that takes the resolve and reject functions as parameters.
 * @param options - The options for the abortable promise.
 * @returns A promise that can be aborted.
 */
function createAbortablePromise(buildPromise, options) {
    const { cleanupBeforeAbort, abortSignal, abortErrorMsg } = options ?? {};
    return new Promise((resolve, reject) => {
        function rejectOnAbort() {
            reject(new abort_controller_1.AbortError(abortErrorMsg ?? "The operation was aborted."));
        }
        function removeListeners() {
            abortSignal?.removeEventListener("abort", onAbort);
        }
        function onAbort() {
            cleanupBeforeAbort?.();
            removeListeners();
            rejectOnAbort();
        }
        if (abortSignal?.aborted) {
            return rejectOnAbort();
        }
        try {
            buildPromise((x) => {
                removeListeners();
                resolve(x);
            }, (x) => {
                removeListeners();
                reject(x);
            });
        }
        catch (err) {
            reject(err);
        }
        abortSignal?.addEventListener("abort", onAbort);
    });
}
//# sourceMappingURL=createAbortablePromise.js.map

/***/ }),

/***/ 636:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.delay = delay;
exports.calculateRetryDelay = calculateRetryDelay;
const createAbortablePromise_js_1 = __nccwpck_require__(3128);
const util_1 = __nccwpck_require__(5750);
const StandardAbortMessage = "The delay was aborted.";
/**
 * A wrapper for setTimeout that resolves a promise after timeInMs milliseconds.
 * @param timeInMs - The number of milliseconds to be delayed.
 * @param options - The options for delay - currently abort options
 * @returns Promise that is resolved after timeInMs
 */
function delay(timeInMs, options) {
    let token;
    const { abortSignal, abortErrorMsg } = options ?? {};
    return (0, createAbortablePromise_js_1.createAbortablePromise)((resolve) => {
        token = setTimeout(resolve, timeInMs);
    }, {
        cleanupBeforeAbort: () => clearTimeout(token),
        abortSignal,
        abortErrorMsg: abortErrorMsg ?? StandardAbortMessage,
    });
}
/**
 * Calculates the delay interval for retry attempts using exponential delay with jitter.
 * @param retryAttempt - The current retry attempt number.
 * @param config - The exponential retry configuration.
 * @returns An object containing the calculated retry delay.
 */
function calculateRetryDelay(retryAttempt, config) {
    // Exponentially increase the delay each time
    const exponentialDelay = config.retryDelayInMs * Math.pow(2, retryAttempt);
    // Don't let the delay exceed the maximum
    const clampedDelay = Math.min(config.maxRetryDelayInMs, exponentialDelay);
    // Allow the final value to have some "jitter" (within 50% of the delay size) so
    // that retries across multiple clients don't occur simultaneously.
    const retryAfterInMs = clampedDelay / 2 + (0, util_1.getRandomIntegerInclusive)(0, clampedDelay / 2);
    return { retryAfterInMs };
}
//# sourceMappingURL=delay.js.map

/***/ }),

/***/ 9945:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getErrorMessage = getErrorMessage;
const util_1 = __nccwpck_require__(5750);
/**
 * Given what is thought to be an error object, return the message if possible.
 * If the message is missing, returns a stringified version of the input.
 * @param e - Something thrown from a try block
 * @returns The error message or a string of the input
 */
function getErrorMessage(e) {
    if ((0, util_1.isError)(e)) {
        return e.message;
    }
    else {
        let stringified;
        try {
            if (typeof e === "object" && e) {
                stringified = JSON.stringify(e);
            }
            else {
                stringified = String(e);
            }
        }
        catch (err) {
            stringified = "[unable to stringify input]";
        }
        return `Unknown error ${stringified}`;
    }
}
//# sourceMappingURL=error.js.map

/***/ }),

/***/ 7779:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isWebWorker = exports.isReactNative = exports.isNodeRuntime = exports.isNodeLike = exports.isNode = exports.isDeno = exports.isBun = exports.isBrowser = exports.objectHasProperty = exports.isObjectWithProperties = exports.isDefined = exports.getErrorMessage = exports.delay = exports.createAbortablePromise = exports.cancelablePromiseRace = void 0;
exports.calculateRetryDelay = calculateRetryDelay;
exports.computeSha256Hash = computeSha256Hash;
exports.computeSha256Hmac = computeSha256Hmac;
exports.getRandomIntegerInclusive = getRandomIntegerInclusive;
exports.isError = isError;
exports.isObject = isObject;
exports.randomUUID = randomUUID;
exports.uint8ArrayToString = uint8ArrayToString;
exports.stringToUint8Array = stringToUint8Array;
const tslib_1 = __nccwpck_require__(1860);
const tspRuntime = tslib_1.__importStar(__nccwpck_require__(5750));
var aborterUtils_js_1 = __nccwpck_require__(5209);
Object.defineProperty(exports, "cancelablePromiseRace", ({ enumerable: true, get: function () { return aborterUtils_js_1.cancelablePromiseRace; } }));
var createAbortablePromise_js_1 = __nccwpck_require__(3128);
Object.defineProperty(exports, "createAbortablePromise", ({ enumerable: true, get: function () { return createAbortablePromise_js_1.createAbortablePromise; } }));
var delay_js_1 = __nccwpck_require__(636);
Object.defineProperty(exports, "delay", ({ enumerable: true, get: function () { return delay_js_1.delay; } }));
var error_js_1 = __nccwpck_require__(9945);
Object.defineProperty(exports, "getErrorMessage", ({ enumerable: true, get: function () { return error_js_1.getErrorMessage; } }));
var typeGuards_js_1 = __nccwpck_require__(6277);
Object.defineProperty(exports, "isDefined", ({ enumerable: true, get: function () { return typeGuards_js_1.isDefined; } }));
Object.defineProperty(exports, "isObjectWithProperties", ({ enumerable: true, get: function () { return typeGuards_js_1.isObjectWithProperties; } }));
Object.defineProperty(exports, "objectHasProperty", ({ enumerable: true, get: function () { return typeGuards_js_1.objectHasProperty; } }));
/**
 * Calculates the delay interval for retry attempts using exponential delay with jitter.
 *
 * @param retryAttempt - The current retry attempt number.
 *
 * @param config - The exponential retry configuration.
 *
 * @returns An object containing the calculated retry delay.
 */
function calculateRetryDelay(retryAttempt, config) {
    return tspRuntime.calculateRetryDelay(retryAttempt, config);
}
/**
 * Generates a SHA-256 hash.
 *
 * @param content - The data to be included in the hash.
 *
 * @param encoding - The textual encoding to use for the returned hash.
 */
function computeSha256Hash(content, encoding) {
    return tspRuntime.computeSha256Hash(content, encoding);
}
/**
 * Generates a SHA-256 HMAC signature.
 *
 * @param key - The HMAC key represented as a base64 string, used to generate the cryptographic HMAC hash.
 *
 * @param stringToSign - The data to be signed.
 *
 * @param encoding - The textual encoding to use for the returned HMAC digest.
 */
function computeSha256Hmac(key, stringToSign, encoding) {
    return tspRuntime.computeSha256Hmac(key, stringToSign, encoding);
}
/**
 * Returns a random integer value between a lower and upper bound, inclusive of both bounds. Note that this uses Math.random and isn't secure. If you need to use this for any kind of security purpose, find a better source of random.
 *
 * @param min - The smallest integer value allowed.
 *
 * @param max - The largest integer value allowed.
 */
function getRandomIntegerInclusive(min, max) {
    return tspRuntime.getRandomIntegerInclusive(min, max);
}
/**
 * Typeguard for an error object shape (has name and message)
 *
 * @param e - Something caught by a catch clause.
 */
function isError(e) {
    return tspRuntime.isError(e);
}
/**
 * Helper to determine when an input is a generic JS object.
 *
 * @returns true when input is an object type that is not null, Array, RegExp, or Date.
 */
function isObject(input) {
    return tspRuntime.isObject(input);
}
/**
 * Generated Universally Unique Identifier
 *
 * @returns RFC4122 v4 UUID.
 */
function randomUUID() {
    return tspRuntime.randomUUID();
}
/**
 * A constant that indicates whether the environment the code is running is a Web Browser.
 */
exports.isBrowser = tspRuntime.isBrowser;
/**
 * A constant that indicates whether the environment the code is running is Bun.sh.
 */
exports.isBun = tspRuntime.isBun;
/**
 * A constant that indicates whether the environment the code is running is Deno.
 */
exports.isDeno = tspRuntime.isDeno;
/**
 * A constant that indicates whether the environment the code is running is a Node.js compatible environment.
 *
 * @deprecated
 *
 * Use `isNodeLike` instead.
 */
exports.isNode = tspRuntime.isNodeLike;
/**
 * A constant that indicates whether the environment the code is running is a Node.js compatible environment.
 */
exports.isNodeLike = tspRuntime.isNodeLike;
/**
 * A constant that indicates whether the environment the code is running is Node.JS.
 */
exports.isNodeRuntime = tspRuntime.isNodeRuntime;
/**
 * A constant that indicates whether the environment the code is running is in React-Native.
 */
exports.isReactNative = tspRuntime.isReactNative;
/**
 * A constant that indicates whether the environment the code is running is a Web Worker.
 */
exports.isWebWorker = tspRuntime.isWebWorker;
/**
 * The helper that transforms bytes with specific character encoding into string
 * @param bytes - the uint8array bytes
 * @param format - the format we use to encode the byte
 * @returns a string of the encoded string
 */
function uint8ArrayToString(bytes, format) {
    return tspRuntime.uint8ArrayToString(bytes, format);
}
/**
 * The helper that transforms string to specific character encoded bytes array.
 * @param value - the string to be converted
 * @param format - the format we use to decode the value
 * @returns a uint8array
 */
function stringToUint8Array(value, format) {
    return tspRuntime.stringToUint8Array(value, format);
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 6277:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isDefined = isDefined;
exports.isObjectWithProperties = isObjectWithProperties;
exports.objectHasProperty = objectHasProperty;
/**
 * Helper TypeGuard that checks if something is defined or not.
 * @param thing - Anything
 */
function isDefined(thing) {
    return typeof thing !== "undefined" && thing !== null;
}
/**
 * Helper TypeGuard that checks if the input is an object with the specified properties.
 * @param thing - Anything.
 * @param properties - The name of the properties that should appear in the object.
 */
function isObjectWithProperties(thing, properties) {
    if (!isDefined(thing) || typeof thing !== "object") {
        return false;
    }
    for (const property of properties) {
        if (!objectHasProperty(thing, property)) {
            return false;
        }
    }
    return true;
}
/**
 * Helper TypeGuard that checks if the input is an object with the specified property.
 * @param thing - Any object.
 * @param property - The name of the property that should appear in the object.
 */
function objectHasProperty(thing, property) {
    return (isDefined(thing) && typeof thing === "object" && property in thing);
}
//# sourceMappingURL=typeGuards.js.map

/***/ }),

/***/ 6515:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AzureLogger = void 0;
exports.setLogLevel = setLogLevel;
exports.getLogLevel = getLogLevel;
exports.createClientLogger = createClientLogger;
const logger_1 = __nccwpck_require__(2490);
const context = (0, logger_1.createLoggerContext)({
    logLevelEnvVarName: "AZURE_LOG_LEVEL",
    namespace: "azure",
});
/**
 * The AzureLogger provides a mechanism for overriding where logs are output to.
 * By default, logs are sent to stderr.
 * Override the `log` method to redirect logs to another location.
 */
exports.AzureLogger = context.logger;
/**
 * Immediately enables logging at the specified log level. If no level is specified, logging is disabled.
 * @param level - The log level to enable for logging.
 * Options from most verbose to least verbose are:
 * - verbose
 * - info
 * - warning
 * - error
 */
function setLogLevel(level) {
    context.setLogLevel(level);
}
/**
 * Retrieves the currently specified log level.
 */
function getLogLevel() {
    return context.getLogLevel();
}
/**
 * Creates a logger for use by the Azure SDKs that inherits from `AzureLogger`.
 * @param namespace - The name of the SDK package.
 * @hidden
 */
function createClientLogger(namespace) {
    return context.createClientLogger(namespace);
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 9992:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var AbortError_exports = {};
__export(AbortError_exports, {
  AbortError: () => AbortError
});
module.exports = __toCommonJS(AbortError_exports);
class AbortError extends Error {
  constructor(message) {
    super(message);
    this.name = "AbortError";
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=AbortError.js.map


/***/ }),

/***/ 6227:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var credentials_exports = {};
__export(credentials_exports, {
  isApiKeyCredential: () => isApiKeyCredential,
  isBasicCredential: () => isBasicCredential,
  isBearerTokenCredential: () => isBearerTokenCredential,
  isOAuth2TokenCredential: () => isOAuth2TokenCredential
});
module.exports = __toCommonJS(credentials_exports);
function isOAuth2TokenCredential(credential) {
  return "getOAuth2Token" in credential;
}
function isBearerTokenCredential(credential) {
  return "getBearerToken" in credential;
}
function isBasicCredential(credential) {
  return "username" in credential && "password" in credential;
}
function isApiKeyCredential(credential) {
  return "key" in credential;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=credentials.js.map


/***/ }),

/***/ 1408:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var apiVersionPolicy_exports = {};
__export(apiVersionPolicy_exports, {
  apiVersionPolicy: () => apiVersionPolicy,
  apiVersionPolicyName: () => apiVersionPolicyName
});
module.exports = __toCommonJS(apiVersionPolicy_exports);
const apiVersionPolicyName = "ApiVersionPolicy";
function apiVersionPolicy(options) {
  return {
    name: apiVersionPolicyName,
    sendRequest: (req, next) => {
      const url = new URL(req.url);
      if (!url.searchParams.get("api-version") && options.apiVersion) {
        req.url = `${req.url}${Array.from(url.searchParams.keys()).length > 0 ? "&" : "?"}api-version=${options.apiVersion}`;
      }
      return next(req);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=apiVersionPolicy.js.map


/***/ }),

/***/ 8728:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var clientHelpers_exports = {};
__export(clientHelpers_exports, {
  createDefaultPipeline: () => createDefaultPipeline,
  getCachedDefaultHttpsClient: () => getCachedDefaultHttpsClient
});
module.exports = __toCommonJS(clientHelpers_exports);
var import_httpClient = __nccwpck_require__(9468);
var import_createPipelineFromOptions = __nccwpck_require__(1810);
var import_apiVersionPolicy = __nccwpck_require__(1408);
var import_credentials = __nccwpck_require__(6227);
var import_apiKeyAuthenticationPolicy = __nccwpck_require__(2095);
var import_basicAuthenticationPolicy = __nccwpck_require__(5756);
var import_bearerAuthenticationPolicy = __nccwpck_require__(9709);
var import_oauth2AuthenticationPolicy = __nccwpck_require__(219);
let cachedHttpClient;
function createDefaultPipeline(options = {}) {
  const pipeline = (0, import_createPipelineFromOptions.createPipelineFromOptions)(options);
  pipeline.addPolicy((0, import_apiVersionPolicy.apiVersionPolicy)(options));
  const { credential, authSchemes, allowInsecureConnection } = options;
  if (credential) {
    if ((0, import_credentials.isApiKeyCredential)(credential)) {
      pipeline.addPolicy(
        (0, import_apiKeyAuthenticationPolicy.apiKeyAuthenticationPolicy)({ authSchemes, credential, allowInsecureConnection })
      );
    } else if ((0, import_credentials.isBasicCredential)(credential)) {
      pipeline.addPolicy(
        (0, import_basicAuthenticationPolicy.basicAuthenticationPolicy)({ authSchemes, credential, allowInsecureConnection })
      );
    } else if ((0, import_credentials.isBearerTokenCredential)(credential)) {
      pipeline.addPolicy(
        (0, import_bearerAuthenticationPolicy.bearerAuthenticationPolicy)({ authSchemes, credential, allowInsecureConnection })
      );
    } else if ((0, import_credentials.isOAuth2TokenCredential)(credential)) {
      pipeline.addPolicy(
        (0, import_oauth2AuthenticationPolicy.oauth2AuthenticationPolicy)({ authSchemes, credential, allowInsecureConnection })
      );
    }
  }
  return pipeline;
}
function getCachedDefaultHttpsClient() {
  if (!cachedHttpClient) {
    cachedHttpClient = (0, import_httpClient.createDefaultHttpClient)();
  }
  return cachedHttpClient;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=clientHelpers.js.map


/***/ }),

/***/ 6191:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var getClient_exports = {};
__export(getClient_exports, {
  getClient: () => getClient
});
module.exports = __toCommonJS(getClient_exports);
var import_clientHelpers = __nccwpck_require__(8728);
var import_sendRequest = __nccwpck_require__(6311);
var import_urlHelpers = __nccwpck_require__(7088);
var import_env = __nccwpck_require__(1573);
function getClient(endpoint, clientOptions = {}) {
  const pipeline = clientOptions.pipeline ?? (0, import_clientHelpers.createDefaultPipeline)(clientOptions);
  if (clientOptions.additionalPolicies?.length) {
    for (const { policy, position } of clientOptions.additionalPolicies) {
      const afterPhase = position === "perRetry" ? "Sign" : void 0;
      pipeline.addPolicy(policy, {
        afterPhase
      });
    }
  }
  const { allowInsecureConnection, httpClient } = clientOptions;
  const endpointUrl = clientOptions.endpoint ?? endpoint;
  const client = (path, ...args) => {
    const getUrl = (requestOptions) => (0, import_urlHelpers.buildRequestUrl)(endpointUrl, path, args, { allowInsecureConnection, ...requestOptions });
    return {
      get: (requestOptions = {}) => {
        return buildOperation(
          "GET",
          getUrl(requestOptions),
          pipeline,
          requestOptions,
          allowInsecureConnection,
          httpClient
        );
      },
      post: (requestOptions = {}) => {
        return buildOperation(
          "POST",
          getUrl(requestOptions),
          pipeline,
          requestOptions,
          allowInsecureConnection,
          httpClient
        );
      },
      put: (requestOptions = {}) => {
        return buildOperation(
          "PUT",
          getUrl(requestOptions),
          pipeline,
          requestOptions,
          allowInsecureConnection,
          httpClient
        );
      },
      patch: (requestOptions = {}) => {
        return buildOperation(
          "PATCH",
          getUrl(requestOptions),
          pipeline,
          requestOptions,
          allowInsecureConnection,
          httpClient
        );
      },
      delete: (requestOptions = {}) => {
        return buildOperation(
          "DELETE",
          getUrl(requestOptions),
          pipeline,
          requestOptions,
          allowInsecureConnection,
          httpClient
        );
      },
      head: (requestOptions = {}) => {
        return buildOperation(
          "HEAD",
          getUrl(requestOptions),
          pipeline,
          requestOptions,
          allowInsecureConnection,
          httpClient
        );
      },
      options: (requestOptions = {}) => {
        return buildOperation(
          "OPTIONS",
          getUrl(requestOptions),
          pipeline,
          requestOptions,
          allowInsecureConnection,
          httpClient
        );
      },
      trace: (requestOptions = {}) => {
        return buildOperation(
          "TRACE",
          getUrl(requestOptions),
          pipeline,
          requestOptions,
          allowInsecureConnection,
          httpClient
        );
      }
    };
  };
  return {
    path: client,
    pathUnchecked: client,
    pipeline
  };
}
function buildOperation(method, url, pipeline, options, allowInsecureConnection, httpClient) {
  allowInsecureConnection = options.allowInsecureConnection ?? allowInsecureConnection;
  return {
    then: function(onFulfilled, onrejected) {
      return (0, import_sendRequest.sendRequest)(
        method,
        url,
        pipeline,
        { ...options, allowInsecureConnection },
        httpClient
      ).then(onFulfilled, onrejected);
    },
    async asBrowserStream() {
      if (import_env.isNodeLike) {
        throw new Error(
          "`asBrowserStream` is supported only in the browser environment. Use `asNodeStream` instead to obtain the response body stream. If you require a Web stream of the response in Node, consider using `Readable.toWeb` on the result of `asNodeStream`."
        );
      } else {
        return (0, import_sendRequest.sendRequest)(
          method,
          url,
          pipeline,
          { ...options, allowInsecureConnection, responseAsStream: true },
          httpClient
        );
      }
    },
    async asNodeStream() {
      if (import_env.isNodeLike) {
        return (0, import_sendRequest.sendRequest)(
          method,
          url,
          pipeline,
          { ...options, allowInsecureConnection, responseAsStream: true },
          httpClient
        );
      } else {
        throw new Error(
          "`isNodeStream` is not supported in the browser environment. Use `asBrowserStream` to obtain the response body stream."
        );
      }
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=getClient.js.map


/***/ }),

/***/ 8240:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var multipart_exports = {};
__export(multipart_exports, {
  buildBodyPart: () => buildBodyPart,
  buildMultipartBody: () => buildMultipartBody
});
module.exports = __toCommonJS(multipart_exports);
var import_restError = __nccwpck_require__(9758);
var import_httpHeaders = __nccwpck_require__(4220);
var import_bytesEncoding = __nccwpck_require__(2921);
var import_typeGuards = __nccwpck_require__(8505);
function getHeaderValue(descriptor, headerName) {
  if (descriptor.headers) {
    const actualHeaderName = Object.keys(descriptor.headers).find(
      (x) => x.toLowerCase() === headerName.toLowerCase()
    );
    if (actualHeaderName) {
      return descriptor.headers[actualHeaderName];
    }
  }
  return void 0;
}
function getPartContentType(descriptor) {
  const contentTypeHeader = getHeaderValue(descriptor, "content-type");
  if (contentTypeHeader) {
    return contentTypeHeader;
  }
  if (descriptor.contentType === null) {
    return void 0;
  }
  if (descriptor.contentType) {
    return descriptor.contentType;
  }
  const { body } = descriptor;
  if (body === null || body === void 0) {
    return void 0;
  }
  if (typeof body === "string" || typeof body === "number" || typeof body === "boolean") {
    return "text/plain; charset=UTF-8";
  }
  if (body instanceof Blob) {
    return body.type || "application/octet-stream";
  }
  if ((0, import_typeGuards.isBinaryBody)(body)) {
    return "application/octet-stream";
  }
  return "application/json";
}
function escapeDispositionField(value) {
  return JSON.stringify(value);
}
function getContentDisposition(descriptor) {
  const contentDispositionHeader = getHeaderValue(descriptor, "content-disposition");
  if (contentDispositionHeader) {
    return contentDispositionHeader;
  }
  if (descriptor.dispositionType === void 0 && descriptor.name === void 0 && descriptor.filename === void 0) {
    return void 0;
  }
  const dispositionType = descriptor.dispositionType ?? "form-data";
  let disposition = dispositionType;
  if (descriptor.name) {
    disposition += `; name=${escapeDispositionField(descriptor.name)}`;
  }
  let filename = void 0;
  if (descriptor.filename) {
    filename = descriptor.filename;
  } else if (typeof File !== "undefined" && descriptor.body instanceof File) {
    const filenameFromFile = descriptor.body.name;
    if (filenameFromFile !== "") {
      filename = filenameFromFile;
    }
  }
  if (filename) {
    disposition += `; filename=${escapeDispositionField(filename)}`;
  }
  return disposition;
}
function normalizeBody(body, contentType) {
  if (body === void 0) {
    return new Uint8Array([]);
  }
  if ((0, import_typeGuards.isBinaryBody)(body)) {
    return body;
  }
  if (typeof body === "string" || typeof body === "number" || typeof body === "boolean") {
    return (0, import_bytesEncoding.stringToUint8Array)(String(body), "utf-8");
  }
  if (contentType && /application\/(.+\+)?json(;.+)?/i.test(String(contentType))) {
    return (0, import_bytesEncoding.stringToUint8Array)(JSON.stringify(body), "utf-8");
  }
  throw new import_restError.RestError(`Unsupported body/content-type combination: ${body}, ${contentType}`);
}
function buildBodyPart(descriptor) {
  const contentType = getPartContentType(descriptor);
  const contentDisposition = getContentDisposition(descriptor);
  const headers = (0, import_httpHeaders.createHttpHeaders)(descriptor.headers ?? {});
  if (contentType) {
    headers.set("content-type", contentType);
  }
  if (contentDisposition) {
    headers.set("content-disposition", contentDisposition);
  }
  const body = normalizeBody(descriptor.body, contentType);
  return {
    headers,
    body
  };
}
function buildMultipartBody(parts) {
  return { parts: parts.map(buildBodyPart) };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=multipart.js.map


/***/ }),

/***/ 9635:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var operationOptionHelpers_exports = {};
__export(operationOptionHelpers_exports, {
  operationOptionsToRequestParameters: () => operationOptionsToRequestParameters
});
module.exports = __toCommonJS(operationOptionHelpers_exports);
function operationOptionsToRequestParameters(options) {
  return {
    allowInsecureConnection: options.requestOptions?.allowInsecureConnection,
    timeout: options.requestOptions?.timeout,
    skipUrlEncoding: options.requestOptions?.skipUrlEncoding,
    abortSignal: options.abortSignal,
    onUploadProgress: options.requestOptions?.onUploadProgress,
    onDownloadProgress: options.requestOptions?.onDownloadProgress,
    headers: { ...options.requestOptions?.headers },
    onResponse: options.onResponse
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=operationOptionHelpers.js.map


/***/ }),

/***/ 7332:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var restError_exports = {};
__export(restError_exports, {
  createRestError: () => createRestError
});
module.exports = __toCommonJS(restError_exports);
var import_restError = __nccwpck_require__(9758);
var import_httpHeaders = __nccwpck_require__(4220);
function createRestError(messageOrResponse, response) {
  const resp = typeof messageOrResponse === "string" ? response : messageOrResponse;
  const internalError = resp.body?.error ?? resp.body;
  const message = typeof messageOrResponse === "string" ? messageOrResponse : internalError?.message ?? `Unexpected status code: ${resp.status}`;
  return new import_restError.RestError(message, {
    statusCode: statusCodeToNumber(resp.status),
    code: internalError?.code,
    request: resp.request,
    response: toPipelineResponse(resp)
  });
}
function toPipelineResponse(errorResponse) {
  return {
    headers: (0, import_httpHeaders.createHttpHeaders)(errorResponse.headers),
    request: errorResponse.request,
    status: statusCodeToNumber(errorResponse.status) ?? -1,
    ...typeof errorResponse.body === "string" ? { bodyAsText: errorResponse.body } : {}
  };
}
function statusCodeToNumber(statusCode) {
  const status = Number.parseInt(statusCode);
  return Number.isNaN(status) ? void 0 : status;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=restError.js.map


/***/ }),

/***/ 6311:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var sendRequest_exports = {};
__export(sendRequest_exports, {
  getRequestBody: () => getRequestBody,
  sendRequest: () => sendRequest
});
module.exports = __toCommonJS(sendRequest_exports);
var import_restError = __nccwpck_require__(9758);
var import_httpHeaders = __nccwpck_require__(4220);
var import_pipelineRequest = __nccwpck_require__(2305);
var import_clientHelpers = __nccwpck_require__(8728);
var import_typeGuards = __nccwpck_require__(8505);
var import_multipart = __nccwpck_require__(8240);
async function sendRequest(method, url, pipeline, options = {}, customHttpClient) {
  const httpClient = customHttpClient ?? (0, import_clientHelpers.getCachedDefaultHttpsClient)();
  const request = buildPipelineRequest(method, url, options);
  try {
    const response = await pipeline.sendRequest(httpClient, request);
    const headers = response.headers.toJSON();
    const stream = response.readableStreamBody ?? response.browserStreamBody;
    const parsedBody = options.responseAsStream || stream !== void 0 ? void 0 : getResponseBody(response);
    const body = stream ?? parsedBody;
    if (options?.onResponse) {
      options.onResponse({ ...response, request, rawHeaders: headers, parsedBody });
    }
    return {
      request,
      headers,
      status: `${response.status}`,
      body
    };
  } catch (e) {
    if ((0, import_restError.isRestError)(e) && e.response && options.onResponse) {
      const { response } = e;
      const rawHeaders = response.headers.toJSON();
      options?.onResponse({ ...response, request, rawHeaders }, e);
    }
    throw e;
  }
}
function getRequestContentType(options = {}) {
  if (options.contentType) {
    return options.contentType;
  }
  const headerContentType = options.headers?.["content-type"];
  if (typeof headerContentType === "string") {
    return headerContentType;
  }
  return getContentType(options.body);
}
function getContentType(body) {
  if (body === void 0) {
    return void 0;
  }
  if (ArrayBuffer.isView(body)) {
    return "application/octet-stream";
  }
  if ((0, import_typeGuards.isBlob)(body) && body.type) {
    return body.type;
  }
  if (typeof body === "string") {
    try {
      JSON.parse(body);
      return "application/json";
    } catch (error) {
      return void 0;
    }
  }
  return "application/json";
}
function buildPipelineRequest(method, url, options = {}) {
  const requestContentType = getRequestContentType(options);
  const { body, multipartBody } = getRequestBody(options.body, requestContentType);
  const headers = (0, import_httpHeaders.createHttpHeaders)({
    ...options.headers ? options.headers : {},
    accept: options.accept ?? options.headers?.accept ?? "application/json",
    ...requestContentType && {
      "content-type": requestContentType
    }
  });
  const {
    allowInsecureConnection,
    abortSignal,
    onUploadProgress,
    onDownloadProgress,
    timeout,
    responseAsStream,
    url: _url,
    method: _method,
    body: _body,
    multipartBody: _multiBody,
    headers: _headers,
    ...rest
  } = options;
  const request = (0, import_pipelineRequest.createPipelineRequest)({
    url,
    method,
    body,
    multipartBody,
    headers,
    allowInsecureConnection,
    abortSignal,
    onUploadProgress,
    onDownloadProgress,
    timeout,
    enableBrowserStreams: true,
    streamResponseStatusCodes: responseAsStream ? /* @__PURE__ */ new Set([Number.POSITIVE_INFINITY]) : void 0
  });
  Object.assign(request, rest);
  return request;
}
function getRequestBody(body, contentType = "") {
  if (body === void 0) {
    return { body: void 0 };
  }
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return { body };
  }
  if ((0, import_typeGuards.isBlob)(body)) {
    return { body };
  }
  if ((0, import_typeGuards.isReadableStream)(body)) {
    return { body };
  }
  if (typeof body === "function") {
    return { body };
  }
  if (ArrayBuffer.isView(body)) {
    return {
      body: body instanceof Uint8Array ? body : JSON.stringify(body)
    };
  }
  const firstType = contentType.split(";")[0];
  switch (firstType) {
    case "application/json":
      return { body: JSON.stringify(body) };
    case "multipart/form-data":
      if (Array.isArray(body)) {
        return { multipartBody: (0, import_multipart.buildMultipartBody)(body) };
      }
      return { body: JSON.stringify(body) };
    case "text/plain":
      return { body: String(body) };
    default:
      if (typeof body === "string") {
        return { body };
      }
      return { body: JSON.stringify(body) };
  }
}
function getResponseBody(response) {
  const contentType = response.headers.get("content-type") ?? "";
  const firstType = contentType.split(";")[0];
  const bodyToParse = response.bodyAsText ?? "";
  if (firstType === "text/plain") {
    return String(bodyToParse);
  }
  try {
    return bodyToParse ? JSON.parse(bodyToParse) : void 0;
  } catch (error) {
    if (firstType === "application/json") {
      throw createParseError(response, error);
    }
    return String(bodyToParse);
  }
}
function createParseError(response, err) {
  const msg = `Error "${err}" occurred while parsing the response body - ${response.bodyAsText}.`;
  const errCode = err.code ?? import_restError.RestError.PARSE_ERROR;
  return new import_restError.RestError(msg, {
    code: errCode,
    statusCode: response.status,
    request: response.request,
    response
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=sendRequest.js.map


/***/ }),

/***/ 7088:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var urlHelpers_exports = {};
__export(urlHelpers_exports, {
  appendQueryParams: () => appendQueryParams,
  buildBaseUrl: () => buildBaseUrl,
  buildRequestUrl: () => buildRequestUrl,
  replaceAll: () => replaceAll
});
module.exports = __toCommonJS(urlHelpers_exports);
function isQueryParameterWithOptions(x) {
  if (typeof x !== "object" || x === null || !Object.hasOwn(x, "value")) {
    return false;
  }
  const value = x.value;
  return typeof value?.toString === "function";
}
function buildRequestUrl(endpoint, routePath, pathParameters, options = {}) {
  if (routePath.startsWith("https://") || routePath.startsWith("http://")) {
    return routePath;
  }
  endpoint = buildBaseUrl(endpoint, options);
  const updatedRoutePath = buildRoutePath(routePath, pathParameters, options);
  const requestUrl = appendQueryParams(appendPath(endpoint, updatedRoutePath), options);
  const url = new URL(requestUrl);
  return url.toString();
}
function appendPath(endpoint, pathToAppend) {
  const endpointSearchStart = endpoint.indexOf("?");
  const pathSearchStart = pathToAppend.indexOf("?");
  const endpointParts = endpointSearchStart !== -1 ? [endpoint.substring(0, endpointSearchStart), endpoint.substring(endpointSearchStart + 1)] : [endpoint, ""];
  const pathParts = pathSearchStart !== -1 ? [pathToAppend.substring(0, pathSearchStart), pathToAppend.substring(pathSearchStart + 1)] : [pathToAppend, ""];
  const combinedSearch = [endpointParts[1], pathParts[1].replaceAll("?", "&")].filter(Boolean).join("&");
  const baseEndpoint = endpointParts[0].replace(/(^[^:]+:\/\/[^/]+)\/\/+/, "$1/");
  const basePathToAppend = pathParts[0];
  let combinedUrl = baseEndpoint;
  if (!baseEndpoint.endsWith("/") && !basePathToAppend.startsWith("/") && basePathToAppend !== "") {
    combinedUrl += `/${basePathToAppend}`;
  } else if (baseEndpoint.endsWith("/") && basePathToAppend.startsWith("/")) {
    combinedUrl += basePathToAppend.substring(1);
  } else {
    combinedUrl += basePathToAppend;
  }
  if (combinedSearch) {
    combinedUrl += `?${combinedSearch}`;
  }
  return combinedUrl;
}
function getQueryParamValue(key, allowReserved, style, param) {
  let separator;
  if (style === "pipeDelimited") {
    separator = "|";
  } else if (style === "spaceDelimited") {
    separator = "%20";
  } else {
    separator = ",";
  }
  let paramValues;
  if (Array.isArray(param)) {
    paramValues = param;
  } else if (typeof param === "object" && param.toString === Object.prototype.toString) {
    paramValues = Object.entries(param).flat();
  } else {
    paramValues = [param];
  }
  const value = paramValues.map((p) => {
    if (p === null || p === void 0) {
      return "";
    }
    if (!p.toString || typeof p.toString !== "function") {
      throw new Error(`Query parameters must be able to be represented as string, ${key} can't`);
    }
    const rawValue = p.toISOString !== void 0 ? p.toISOString() : p.toString();
    return allowReserved ? rawValue : encodeURIComponent(rawValue);
  }).join(separator);
  return `${allowReserved ? key : encodeURIComponent(key)}=${value}`;
}
function simpleParseQueryParams(queryString) {
  const result = /* @__PURE__ */ new Map();
  if (!queryString || queryString[0] !== "?") {
    return result;
  }
  queryString = queryString.slice(1);
  const pairs = queryString.split("&");
  for (const pair of pairs) {
    const eqIndex = pair.indexOf("=");
    const name = eqIndex === -1 ? pair : pair.substring(0, eqIndex);
    const value = eqIndex === -1 ? "" : pair.substring(eqIndex + 1);
    const existingValue = result.get(name);
    if (existingValue !== void 0) {
      if (Array.isArray(existingValue)) {
        existingValue.push(value);
      } else {
        result.set(name, [existingValue, value]);
      }
    } else {
      result.set(name, value);
    }
  }
  return result;
}
function appendQueryParams(url, options = {}) {
  if (!options.queryParameters) {
    return url;
  }
  const parsedUrl = new URL(url);
  const queryParams = options.queryParameters;
  const existingParams = simpleParseQueryParams(parsedUrl.search);
  const newParamStrings = [];
  for (const key of Object.keys(queryParams)) {
    const param = queryParams[key];
    if (param === void 0 || param === null) {
      continue;
    }
    const hasMetadata = isQueryParameterWithOptions(param);
    const rawValue = hasMetadata ? param.value : param;
    const explode = hasMetadata ? param.explode ?? false : false;
    const style = hasMetadata && param.style ? param.style : "form";
    if (explode) {
      if (Array.isArray(rawValue)) {
        for (const item of rawValue) {
          newParamStrings.push(
            getQueryParamValue(key, options.skipUrlEncoding ?? false, style, item)
          );
        }
      } else if (rawValue !== null && typeof rawValue === "object") {
        for (const [actualKey, value] of Object.entries(rawValue)) {
          newParamStrings.push(
            getQueryParamValue(actualKey, options.skipUrlEncoding ?? false, style, value)
          );
        }
      } else {
        throw new Error("explode can only be set to true for objects and arrays");
      }
    } else {
      newParamStrings.push(
        getQueryParamValue(key, options.skipUrlEncoding ?? false, style, rawValue)
      );
    }
  }
  for (const paramString of newParamStrings) {
    const eqIndex = paramString.indexOf("=");
    const name = paramString.substring(0, eqIndex);
    const value = paramString.substring(eqIndex + 1);
    const existingValue = existingParams.get(name);
    if (existingValue !== void 0) {
      if (Array.isArray(existingValue)) {
        if (!existingValue.includes(value)) {
          existingValue.push(value);
        }
      } else if (existingValue !== value) {
        existingParams.set(name, [existingValue, value]);
      }
    } else {
      existingParams.set(name, value);
    }
  }
  const searchPieces = [];
  for (const [name, value] of existingParams) {
    if (Array.isArray(value)) {
      for (const subValue of value) {
        searchPieces.push(`${name}=${subValue}`);
      }
    } else {
      searchPieces.push(`${name}=${value}`);
    }
  }
  parsedUrl.search = searchPieces.length ? `?${searchPieces.join("&")}` : "";
  return parsedUrl.toString();
}
function buildBaseUrl(endpoint, options) {
  if (!options.pathParameters) {
    return endpoint;
  }
  const pathParams = options.pathParameters;
  for (const [key, param] of Object.entries(pathParams)) {
    if (param === void 0 || param === null) {
      throw new Error(`Path parameters ${key} must not be undefined or null`);
    }
    if (!param.toString || typeof param.toString !== "function") {
      throw new Error(`Path parameters must be able to be represented as string, ${key} can't`);
    }
    let value = param.toISOString !== void 0 ? param.toISOString() : String(param);
    if (!options.skipUrlEncoding) {
      value = encodeURIComponent(param);
    }
    endpoint = replaceAll(endpoint, `{${key}}`, value) ?? "";
  }
  return endpoint;
}
function buildRoutePath(routePath, pathParameters, options = {}) {
  for (const pathParam of pathParameters) {
    const allowReserved = typeof pathParam === "object" && (pathParam.allowReserved ?? false);
    let value = typeof pathParam === "object" ? pathParam.value : pathParam;
    if (!options.skipUrlEncoding && !allowReserved) {
      value = encodeURIComponent(value);
    }
    routePath = routePath.replace(/\{[\w-]+\}/, String(value));
  }
  return routePath;
}
function replaceAll(value, searchValue, replaceValue) {
  return !value || !searchValue ? value : value.split(searchValue).join(replaceValue || "");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=urlHelpers.js.map


/***/ }),

/***/ 1255:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var constants_exports = {};
__export(constants_exports, {
  DEFAULT_RETRY_POLICY_COUNT: () => DEFAULT_RETRY_POLICY_COUNT,
  SDK_VERSION: () => SDK_VERSION
});
module.exports = __toCommonJS(constants_exports);
const SDK_VERSION = "0.3.6";
const DEFAULT_RETRY_POLICY_COUNT = 3;
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=constants.js.map


/***/ }),

/***/ 1810:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var createPipelineFromOptions_exports = {};
__export(createPipelineFromOptions_exports, {
  createPipelineFromOptions: () => createPipelineFromOptions
});
module.exports = __toCommonJS(createPipelineFromOptions_exports);
var import_logPolicy = __nccwpck_require__(7129);
var import_pipeline = __nccwpck_require__(2338);
var import_userAgentPolicy = __nccwpck_require__(1691);
var import_defaultRetryPolicy = __nccwpck_require__(2462);
var import_formDataPolicy = __nccwpck_require__(4197);
var import_policies = __nccwpck_require__(6316);
var import_multipartPolicy = __nccwpck_require__(7427);
function createPipelineFromOptions(options) {
  const pipeline = (0, import_pipeline.createEmptyPipeline)();
  (0, import_policies.addPlatformPolicies)(pipeline, options);
  pipeline.addPolicy((0, import_formDataPolicy.formDataPolicy)(), { beforePolicies: [import_multipartPolicy.multipartPolicyName] });
  pipeline.addPolicy((0, import_userAgentPolicy.userAgentPolicy)(options.userAgentOptions));
  pipeline.addPolicy((0, import_multipartPolicy.multipartPolicy)(), { afterPhase: "Deserialize" });
  pipeline.addPolicy((0, import_defaultRetryPolicy.defaultRetryPolicy)(options.retryOptions), { phase: "Retry" });
  pipeline.addPolicy((0, import_logPolicy.logPolicy)(options.loggingOptions), { afterPhase: "Sign" });
  return pipeline;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=createPipelineFromOptions.js.map


/***/ }),

/***/ 9468:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var defaultHttpClient_exports = {};
__export(defaultHttpClient_exports, {
  createDefaultHttpClient: () => createDefaultHttpClient
});
module.exports = __toCommonJS(defaultHttpClient_exports);
var import_nodeHttpClient = __nccwpck_require__(1167);
function createDefaultHttpClient() {
  return (0, import_nodeHttpClient.createNodeHttpClient)();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=defaultHttpClient.js.map


/***/ }),

/***/ 1573:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var env_exports = {};
__export(env_exports, {
  emitNodeWarning: () => emitNodeWarning,
  getEnvironmentVariable: () => getEnvironmentVariable,
  isBrowser: () => isBrowser,
  isBun: () => isBun,
  isDeno: () => isDeno,
  isNodeLike: () => isNodeLike,
  isNodeRuntime: () => isNodeRuntime,
  isReactNative: () => isReactNative,
  isWebWorker: () => isWebWorker
});
module.exports = __toCommonJS(env_exports);
var import_node_process = __toESM(__nccwpck_require__(1708));
function getEnvironmentVariable(name) {
  return import_node_process.default.env[name];
}
function emitNodeWarning(warning) {
  import_node_process.default.emitWarning(warning);
}
const isBrowser = false;
const isWebWorker = false;
const isDeno = typeof import_node_process.default.versions.deno === "string" && import_node_process.default.versions.deno.length > 0;
const isBun = typeof import_node_process.default.versions.bun === "string" && import_node_process.default.versions.bun.length > 0;
const isNodeLike = true;
const isNodeRuntime = !isBun && !isDeno;
const isReactNative = false;
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=env.js.map


/***/ }),

/***/ 9182:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var formData_exports = {};
__export(formData_exports, {
  convertBodyToFormDataMap: () => convertBodyToFormDataMap
});
module.exports = __toCommonJS(formData_exports);
function convertBodyToFormDataMap(body) {
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    const formDataMap = {};
    for (const [key, value] of body.entries()) {
      const existing = formDataMap[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        formDataMap[key] = existing !== void 0 ? [existing, value] : [value];
      }
    }
    return formDataMap;
  }
  return void 0;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=formData.js.map


/***/ }),

/***/ 4220:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var httpHeaders_exports = {};
__export(httpHeaders_exports, {
  createHttpHeaders: () => createHttpHeaders
});
module.exports = __toCommonJS(httpHeaders_exports);
function normalizeName(name) {
  return name.toLowerCase();
}
function normalizeValue(value) {
  return String(value).trim().replace(/[\r\n]/g, "");
}
function* headerIterator(map) {
  for (const entry of map.values()) {
    yield [entry.name, entry.value];
  }
}
class HttpHeadersImpl {
  _headersMap;
  constructor(rawHeaders) {
    this._headersMap = /* @__PURE__ */ new Map();
    if (rawHeaders) {
      for (const headerName of Object.keys(rawHeaders)) {
        this.set(headerName, rawHeaders[headerName]);
      }
    }
  }
  /**
   * Set a header in this collection with the provided name and value. The name is
   * case-insensitive.
   * @param name - The name of the header to set. This value is case-insensitive.
   * @param value - The value of the header to set.
   */
  set(name, value) {
    this._headersMap.set(normalizeName(name), { name, value: normalizeValue(value) });
  }
  /**
   * Get the header value for the provided header name, or undefined if no header exists in this
   * collection with the provided name.
   * @param name - The name of the header. This value is case-insensitive.
   */
  get(name) {
    return this._headersMap.get(normalizeName(name))?.value;
  }
  /**
   * Get whether or not this header collection contains a header entry for the provided header name.
   * @param name - The name of the header to set. This value is case-insensitive.
   */
  has(name) {
    return this._headersMap.has(normalizeName(name));
  }
  /**
   * Remove the header with the provided headerName.
   * @param name - The name of the header to remove.
   */
  delete(name) {
    this._headersMap.delete(normalizeName(name));
  }
  /**
   * Get the JSON object representation of this HTTP header collection.
   */
  toJSON(options = {}) {
    const result = {};
    if (options.preserveCase) {
      for (const entry of this._headersMap.values()) {
        result[entry.name] = entry.value;
      }
    } else {
      for (const [normalizedName, entry] of this._headersMap) {
        result[normalizedName] = entry.value;
      }
    }
    return result;
  }
  /**
   * Get the string representation of this HTTP header collection.
   */
  toString() {
    return JSON.stringify(this.toJSON({ preserveCase: true }));
  }
  /**
   * Iterate over tuples of header [name, value] pairs.
   */
  [Symbol.iterator]() {
    return headerIterator(this._headersMap);
  }
}
function createHttpHeaders(rawHeaders) {
  return new HttpHeadersImpl(rawHeaders);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=httpHeaders.js.map


/***/ }),

/***/ 1958:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var src_exports = {};
__export(src_exports, {
  AbortError: () => import_AbortError.AbortError,
  RestError: () => import_restError.RestError,
  TypeSpecRuntimeLogger: () => import_logger.TypeSpecRuntimeLogger,
  createClientLogger: () => import_logger.createClientLogger,
  createDefaultHttpClient: () => import_httpClient.createDefaultHttpClient,
  createEmptyPipeline: () => import_pipeline.createEmptyPipeline,
  createHttpHeaders: () => import_httpHeaders.createHttpHeaders,
  createPipelineRequest: () => import_pipelineRequest.createPipelineRequest,
  createRestError: () => import_restError2.createRestError,
  getClient: () => import_getClient.getClient,
  getLogLevel: () => import_logger.getLogLevel,
  isRestError: () => import_restError.isRestError,
  operationOptionsToRequestParameters: () => import_operationOptionHelpers.operationOptionsToRequestParameters,
  setLogLevel: () => import_logger.setLogLevel,
  stringToUint8Array: () => import_bytesEncoding.stringToUint8Array,
  uint8ArrayToString: () => import_bytesEncoding.uint8ArrayToString
});
module.exports = __toCommonJS(src_exports);
var import_AbortError = __nccwpck_require__(9992);
var import_logger = __nccwpck_require__(8459);
var import_httpHeaders = __nccwpck_require__(4220);
var import_pipelineRequest = __nccwpck_require__(2305);
var import_pipeline = __nccwpck_require__(2338);
var import_restError = __nccwpck_require__(9758);
var import_bytesEncoding = __nccwpck_require__(2921);
var import_httpClient = __nccwpck_require__(9468);
var import_getClient = __nccwpck_require__(6191);
var import_operationOptionHelpers = __nccwpck_require__(9635);
var import_restError2 = __nccwpck_require__(7332);
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 3644:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var log_exports = {};
__export(log_exports, {
  logger: () => logger
});
module.exports = __toCommonJS(log_exports);
var import_logger = __nccwpck_require__(8459);
const logger = (0, import_logger.createClientLogger)("ts-http-runtime");
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=log.js.map


/***/ }),

/***/ 6836:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var debug_exports = {};
__export(debug_exports, {
  default: () => debug_default
});
module.exports = __toCommonJS(debug_exports);
var import_log = __nccwpck_require__(8029);
var import_env = __nccwpck_require__(1573);
const debugEnvVariable = (0, import_env.getEnvironmentVariable)("DEBUG");
let enabledString;
let enabledNamespaces = [];
let skippedNamespaces = [];
const debuggers = [];
if (debugEnvVariable) {
  enable(debugEnvVariable);
}
const debugObj = Object.assign(
  (namespace) => {
    return createDebugger(namespace);
  },
  {
    enable,
    enabled,
    disable,
    log: import_log.log
  }
);
function enable(namespaces) {
  enabledString = namespaces;
  enabledNamespaces = [];
  skippedNamespaces = [];
  const namespaceList = namespaces.split(",").map((ns) => ns.trim());
  for (const ns of namespaceList) {
    if (ns.startsWith("-")) {
      skippedNamespaces.push(ns.substring(1));
    } else {
      enabledNamespaces.push(ns);
    }
  }
  for (const instance of debuggers) {
    instance.enabled = enabled(instance.namespace);
  }
}
function enabled(namespace) {
  if (namespace.endsWith("*")) {
    return true;
  }
  for (const skipped of skippedNamespaces) {
    if (namespaceMatches(namespace, skipped)) {
      return false;
    }
  }
  for (const enabledNamespace of enabledNamespaces) {
    if (namespaceMatches(namespace, enabledNamespace)) {
      return true;
    }
  }
  return false;
}
function namespaceMatches(namespace, patternToMatch) {
  if (patternToMatch.indexOf("*") === -1) {
    return namespace === patternToMatch;
  }
  let pattern = patternToMatch;
  if (patternToMatch.indexOf("**") !== -1) {
    const patternParts = [];
    let lastCharacter = "";
    for (const character of patternToMatch) {
      if (character === "*" && lastCharacter === "*") {
        continue;
      } else {
        lastCharacter = character;
        patternParts.push(character);
      }
    }
    pattern = patternParts.join("");
  }
  let namespaceIndex = 0;
  let patternIndex = 0;
  const patternLength = pattern.length;
  const namespaceLength = namespace.length;
  let lastWildcard = -1;
  let lastWildcardNamespace = -1;
  while (namespaceIndex < namespaceLength && patternIndex < patternLength) {
    if (pattern[patternIndex] === "*") {
      lastWildcard = patternIndex;
      patternIndex++;
      if (patternIndex === patternLength) {
        return true;
      }
      while (namespace[namespaceIndex] !== pattern[patternIndex]) {
        namespaceIndex++;
        if (namespaceIndex === namespaceLength) {
          return false;
        }
      }
      lastWildcardNamespace = namespaceIndex;
      namespaceIndex++;
      patternIndex++;
      continue;
    } else if (pattern[patternIndex] === namespace[namespaceIndex]) {
      patternIndex++;
      namespaceIndex++;
    } else if (lastWildcard >= 0) {
      patternIndex = lastWildcard + 1;
      namespaceIndex = lastWildcardNamespace + 1;
      if (namespaceIndex === namespaceLength) {
        return false;
      }
      while (namespace[namespaceIndex] !== pattern[patternIndex]) {
        namespaceIndex++;
        if (namespaceIndex === namespaceLength) {
          return false;
        }
      }
      lastWildcardNamespace = namespaceIndex;
      namespaceIndex++;
      patternIndex++;
      continue;
    } else {
      return false;
    }
  }
  const namespaceDone = namespaceIndex === namespace.length;
  const patternDone = patternIndex === pattern.length;
  const trailingWildCard = patternIndex === pattern.length - 1 && pattern[patternIndex] === "*";
  return namespaceDone && (patternDone || trailingWildCard);
}
function disable() {
  const result = enabledString || "";
  enable("");
  return result;
}
function createDebugger(namespace) {
  const newDebugger = Object.assign(debug, {
    enabled: enabled(namespace),
    destroy,
    log: debugObj.log,
    namespace,
    extend
  });
  function debug(...args) {
    if (!newDebugger.enabled) {
      return;
    }
    if (args.length > 0) {
      args[0] = `${namespace} ${args[0]}`;
    }
    newDebugger.log(...args);
  }
  debuggers.push(newDebugger);
  return newDebugger;
}
function destroy() {
  const index = debuggers.indexOf(this);
  if (index >= 0) {
    debuggers.splice(index, 1);
    return true;
  }
  return false;
}
function extend(namespace) {
  const newDebugger = createDebugger(`${this.namespace}:${namespace}`);
  newDebugger.log = this.log;
  return newDebugger;
}
var debug_default = debugObj;
//# sourceMappingURL=debug.js.map


/***/ }),

/***/ 2490:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var internal_exports = {};
__export(internal_exports, {
  createLoggerContext: () => import_logger.createLoggerContext
});
module.exports = __toCommonJS(internal_exports);
var import_logger = __nccwpck_require__(8459);
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=internal.js.map


/***/ }),

/***/ 8029:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var log_exports = {};
__export(log_exports, {
  log: () => log
});
module.exports = __toCommonJS(log_exports);
var import_node_os = __nccwpck_require__(8161);
var import_node_util = __toESM(__nccwpck_require__(7975));
var import_node_process = __toESM(__nccwpck_require__(1708));
function log(message, ...args) {
  import_node_process.default.stderr.write(`${import_node_util.default.format(message, ...args)}${import_node_os.EOL}`);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=log.js.map


/***/ }),

/***/ 8459:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var logger_exports = {};
__export(logger_exports, {
  TypeSpecRuntimeLogger: () => TypeSpecRuntimeLogger,
  createClientLogger: () => createClientLogger,
  createLoggerContext: () => createLoggerContext,
  getLogLevel: () => getLogLevel,
  setLogLevel: () => setLogLevel
});
module.exports = __toCommonJS(logger_exports);
var import_debug = __toESM(__nccwpck_require__(6836));
var import_env = __nccwpck_require__(1573);
const TYPESPEC_RUNTIME_LOG_LEVELS = ["verbose", "info", "warning", "error"];
const levelMap = {
  verbose: 400,
  info: 300,
  warning: 200,
  error: 100
};
function patchLogMethod(parent, child) {
  child.log = (...args) => {
    parent.log(...args);
  };
}
function isTypeSpecRuntimeLogLevel(level) {
  return TYPESPEC_RUNTIME_LOG_LEVELS.includes(level);
}
function createLoggerContext(options) {
  const registeredLoggers = /* @__PURE__ */ new Set();
  const logLevelFromEnv = (0, import_env.getEnvironmentVariable)(options.logLevelEnvVarName);
  let logLevel;
  const clientLogger = (0, import_debug.default)(options.namespace);
  clientLogger.log = (...args) => {
    import_debug.default.log(...args);
  };
  function contextSetLogLevel(level) {
    if (level && !isTypeSpecRuntimeLogLevel(level)) {
      throw new Error(
        `Unknown log level '${level}'. Acceptable values: ${TYPESPEC_RUNTIME_LOG_LEVELS.join(",")}`
      );
    }
    logLevel = level;
    const enabledNamespaces = [];
    for (const logger of registeredLoggers) {
      if (shouldEnable(logger)) {
        enabledNamespaces.push(logger.namespace);
      }
    }
    import_debug.default.enable(enabledNamespaces.join(","));
  }
  if (logLevelFromEnv) {
    if (isTypeSpecRuntimeLogLevel(logLevelFromEnv)) {
      contextSetLogLevel(logLevelFromEnv);
    } else {
      console.error(
        `${options.logLevelEnvVarName} set to unknown log level '${logLevelFromEnv}'; logging is not enabled. Acceptable values: ${TYPESPEC_RUNTIME_LOG_LEVELS.join(
          ", "
        )}.`
      );
    }
  }
  function shouldEnable(logger) {
    return Boolean(logLevel && levelMap[logger.level] <= levelMap[logLevel]);
  }
  function createLogger(parent, level) {
    const logger = Object.assign(parent.extend(level), {
      level
    });
    patchLogMethod(parent, logger);
    if (shouldEnable(logger)) {
      const enabledNamespaces = import_debug.default.disable();
      import_debug.default.enable(enabledNamespaces + "," + logger.namespace);
    }
    registeredLoggers.add(logger);
    return logger;
  }
  function contextGetLogLevel() {
    return logLevel;
  }
  function contextCreateClientLogger(namespace) {
    const clientRootLogger = clientLogger.extend(namespace);
    patchLogMethod(clientLogger, clientRootLogger);
    return {
      error: createLogger(clientRootLogger, "error"),
      warning: createLogger(clientRootLogger, "warning"),
      info: createLogger(clientRootLogger, "info"),
      verbose: createLogger(clientRootLogger, "verbose")
    };
  }
  return {
    setLogLevel: contextSetLogLevel,
    getLogLevel: contextGetLogLevel,
    createClientLogger: contextCreateClientLogger,
    logger: clientLogger
  };
}
const context = createLoggerContext({
  logLevelEnvVarName: "TYPESPEC_RUNTIME_LOG_LEVEL",
  namespace: "typeSpecRuntime"
});
const TypeSpecRuntimeLogger = context.logger;
function setLogLevel(logLevel) {
  context.setLogLevel(logLevel);
}
function getLogLevel() {
  return context.getLogLevel();
}
function createClientLogger(namespace) {
  return context.createClientLogger(namespace);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=logger.js.map


/***/ }),

/***/ 1167:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var nodeHttpClient_exports = {};
__export(nodeHttpClient_exports, {
  createNodeHttpClient: () => createNodeHttpClient,
  getBodyLength: () => getBodyLength
});
module.exports = __toCommonJS(nodeHttpClient_exports);
var import_node_http = __toESM(__nccwpck_require__(7067));
var import_node_https = __toESM(__nccwpck_require__(4708));
var import_node_zlib = __toESM(__nccwpck_require__(8522));
var import_node_stream = __nccwpck_require__(7075);
var import_AbortError = __nccwpck_require__(9992);
var import_httpHeaders = __nccwpck_require__(4220);
var import_restError = __nccwpck_require__(9758);
var import_log = __nccwpck_require__(3644);
var import_sanitizer = __nccwpck_require__(7784);
const DEFAULT_TLS_SETTINGS = {};
function isReadableStream(body) {
  return body && typeof body.pipe === "function";
}
function isStreamComplete(stream) {
  if (stream.readable === false) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const handler = () => {
      resolve();
      stream.removeListener("close", handler);
      stream.removeListener("end", handler);
      stream.removeListener("error", handler);
    };
    stream.on("close", handler);
    stream.on("end", handler);
    stream.on("error", handler);
  });
}
function isArrayBuffer(body) {
  return body && typeof body.byteLength === "number";
}
class ReportTransform extends import_node_stream.Transform {
  loadedBytes = 0;
  progressCallback;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  _transform(chunk, _encoding, callback) {
    this.push(chunk);
    this.loadedBytes += chunk.length;
    try {
      this.progressCallback({ loadedBytes: this.loadedBytes });
      callback();
    } catch (e) {
      callback(e);
    }
  }
  constructor(progressCallback) {
    super();
    this.progressCallback = progressCallback;
  }
}
class NodeHttpClient {
  cachedHttpAgent;
  cachedHttpsAgents = /* @__PURE__ */ new WeakMap();
  /**
   * Makes a request over an underlying transport layer and returns the response.
   * @param request - The request to be made.
   */
  async sendRequest(request) {
    const abortController = new AbortController();
    let abortListener;
    if (request.abortSignal) {
      if (request.abortSignal.aborted) {
        throw new import_AbortError.AbortError("The operation was aborted. Request has already been canceled.");
      }
      abortListener = (event) => {
        if (event.type === "abort") {
          abortController.abort();
        }
      };
      request.abortSignal.addEventListener("abort", abortListener);
    }
    let timeoutId;
    if (request.timeout > 0) {
      timeoutId = setTimeout(() => {
        const sanitizer = new import_sanitizer.Sanitizer();
        import_log.logger.info(`request to '${sanitizer.sanitizeUrl(request.url)}' timed out. canceling...`);
        abortController.abort();
      }, request.timeout);
    }
    const acceptEncoding = request.headers.get("Accept-Encoding");
    const shouldDecompress = acceptEncoding?.includes("gzip") || acceptEncoding?.includes("deflate");
    let body = typeof request.body === "function" ? request.body() : request.body;
    if (body && !request.headers.has("Content-Length")) {
      const bodyLength = getBodyLength(body);
      if (bodyLength !== null) {
        request.headers.set("Content-Length", bodyLength);
      }
    }
    let responseStream;
    try {
      if (body && request.onUploadProgress) {
        const onUploadProgress = request.onUploadProgress;
        const uploadReportStream = new ReportTransform(onUploadProgress);
        uploadReportStream.on("error", (e) => {
          import_log.logger.error("Error in upload progress", e);
        });
        if (isReadableStream(body)) {
          body.pipe(uploadReportStream);
        } else {
          uploadReportStream.end(body);
        }
        body = uploadReportStream;
      }
      const res = await this.makeRequest(request, abortController, body);
      if (timeoutId !== void 0) {
        clearTimeout(timeoutId);
      }
      const headers = getResponseHeaders(res);
      const status = res.statusCode ?? 0;
      const response = {
        status,
        headers,
        request
      };
      if (request.method === "HEAD") {
        res.resume();
        return response;
      }
      responseStream = shouldDecompress ? getDecodedResponseStream(res, headers) : res;
      const onDownloadProgress = request.onDownloadProgress;
      if (onDownloadProgress) {
        const downloadReportStream = new ReportTransform(onDownloadProgress);
        downloadReportStream.on("error", (e) => {
          import_log.logger.error("Error in download progress", e);
        });
        responseStream.pipe(downloadReportStream);
        responseStream = downloadReportStream;
      }
      if (
        // Value of POSITIVE_INFINITY in streamResponseStatusCodes is considered as any status code
        request.streamResponseStatusCodes?.has(Number.POSITIVE_INFINITY) || request.streamResponseStatusCodes?.has(response.status)
      ) {
        response.readableStreamBody = responseStream;
      } else {
        response.bodyAsText = await streamToText(responseStream);
      }
      return response;
    } finally {
      if (request.abortSignal && abortListener) {
        let uploadStreamDone = Promise.resolve();
        if (isReadableStream(body)) {
          uploadStreamDone = isStreamComplete(body);
        }
        let downloadStreamDone = Promise.resolve();
        if (isReadableStream(responseStream)) {
          downloadStreamDone = isStreamComplete(responseStream);
        }
        Promise.all([uploadStreamDone, downloadStreamDone]).then(() => {
          if (abortListener) {
            request.abortSignal?.removeEventListener("abort", abortListener);
          }
        }).catch((e) => {
          import_log.logger.warning("Error when cleaning up abortListener on httpRequest", e);
        });
      }
    }
  }
  makeRequest(request, abortController, body) {
    const url = new URL(request.url);
    const isInsecure = url.protocol !== "https:";
    if (isInsecure && !request.allowInsecureConnection) {
      throw new Error(`Cannot connect to ${request.url} while allowInsecureConnection is false.`);
    }
    const agent = request.agent ?? this.getOrCreateAgent(request, isInsecure);
    const options = {
      agent,
      hostname: url.hostname,
      path: `${url.pathname}${url.search}`,
      port: url.port,
      method: request.method,
      headers: request.headers.toJSON({ preserveCase: true }),
      ...request.requestOverrides
    };
    return new Promise((resolve, reject) => {
      const req = isInsecure ? import_node_http.default.request(options, resolve) : import_node_https.default.request(options, resolve);
      req.once("error", (err) => {
        reject(
          new import_restError.RestError(err.message, { code: err.code ?? import_restError.RestError.REQUEST_SEND_ERROR, request })
        );
      });
      abortController.signal.addEventListener("abort", () => {
        const abortError = new import_AbortError.AbortError(
          "The operation was aborted. Rejecting from abort signal callback while making request."
        );
        req.destroy(abortError);
        reject(abortError);
      });
      if (body && isReadableStream(body)) {
        body.pipe(req);
      } else if (body) {
        if (typeof body === "string" || Buffer.isBuffer(body)) {
          req.end(body);
        } else if (isArrayBuffer(body)) {
          req.end(
            ArrayBuffer.isView(body) ? Buffer.from(body.buffer, body.byteOffset, body.byteLength) : Buffer.from(body)
          );
        } else {
          import_log.logger.error("Unrecognized body type", body);
          reject(new import_restError.RestError("Unrecognized body type"));
        }
      } else {
        req.end();
      }
    });
  }
  getOrCreateAgent(request, isInsecure) {
    const disableKeepAlive = request.disableKeepAlive;
    if (isInsecure) {
      if (disableKeepAlive) {
        return import_node_http.default.globalAgent;
      }
      if (!this.cachedHttpAgent) {
        this.cachedHttpAgent = new import_node_http.default.Agent({ keepAlive: true });
      }
      return this.cachedHttpAgent;
    } else {
      if (disableKeepAlive && !request.tlsSettings) {
        return import_node_https.default.globalAgent;
      }
      const tlsSettings = request.tlsSettings ?? DEFAULT_TLS_SETTINGS;
      let agent = this.cachedHttpsAgents.get(tlsSettings);
      if (agent && agent.options.keepAlive === !disableKeepAlive) {
        return agent;
      }
      import_log.logger.info("No cached TLS Agent exist, creating a new Agent");
      agent = new import_node_https.default.Agent({
        // keepAlive is true if disableKeepAlive is false.
        keepAlive: !disableKeepAlive,
        // Since we are spreading, if no tslSettings were provided, nothing is added to the agent options.
        ...tlsSettings
      });
      this.cachedHttpsAgents.set(tlsSettings, agent);
      return agent;
    }
  }
}
function getResponseHeaders(res) {
  const headers = (0, import_httpHeaders.createHttpHeaders)();
  for (const header of Object.keys(res.headers)) {
    const value = res.headers[header];
    if (Array.isArray(value)) {
      if (value.length > 0) {
        headers.set(header, value[0]);
      }
    } else if (value) {
      headers.set(header, value);
    }
  }
  return headers;
}
function getDecodedResponseStream(stream, headers) {
  const contentEncoding = headers.get("Content-Encoding");
  if (contentEncoding === "gzip") {
    const unzip = import_node_zlib.default.createGunzip();
    stream.pipe(unzip);
    return unzip;
  } else if (contentEncoding === "deflate") {
    const inflate = import_node_zlib.default.createInflate();
    stream.pipe(inflate);
    return inflate;
  }
  return stream;
}
function streamToText(stream) {
  return new Promise((resolve, reject) => {
    const buffer = [];
    stream.on("data", (chunk) => {
      if (Buffer.isBuffer(chunk)) {
        buffer.push(chunk);
      } else {
        buffer.push(Buffer.from(chunk));
      }
    });
    stream.on("end", () => {
      resolve(Buffer.concat(buffer).toString("utf8"));
    });
    stream.on("error", (e) => {
      if (e && e?.name === "AbortError") {
        reject(e);
      } else {
        reject(
          new import_restError.RestError(`Error reading response as text: ${e.message}`, {
            code: import_restError.RestError.PARSE_ERROR
          })
        );
      }
    });
  });
}
function getBodyLength(body) {
  if (!body) {
    return 0;
  } else if (Buffer.isBuffer(body)) {
    return body.length;
  } else if (isReadableStream(body)) {
    return null;
  } else if (isArrayBuffer(body)) {
    return body.byteLength;
  } else if (typeof body === "string") {
    return Buffer.from(body).length;
  } else {
    return null;
  }
}
function createNodeHttpClient() {
  return new NodeHttpClient();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=nodeHttpClient.js.map


/***/ }),

/***/ 2338:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var pipeline_exports = {};
__export(pipeline_exports, {
  createEmptyPipeline: () => createEmptyPipeline
});
module.exports = __toCommonJS(pipeline_exports);
const ValidPhaseNames = /* @__PURE__ */ new Set(["Deserialize", "Serialize", "Retry", "Sign"]);
class HttpPipeline {
  _policies = [];
  _orderedPolicies;
  constructor(policies) {
    this._policies = policies?.slice(0) ?? [];
    this._orderedPolicies = void 0;
  }
  addPolicy(policy, options = {}) {
    if (options.phase && options.afterPhase) {
      throw new Error("Policies inside a phase cannot specify afterPhase.");
    }
    if (options.phase && !ValidPhaseNames.has(options.phase)) {
      throw new Error(`Invalid phase name: ${options.phase}`);
    }
    if (options.afterPhase && !ValidPhaseNames.has(options.afterPhase)) {
      throw new Error(`Invalid afterPhase name: ${options.afterPhase}`);
    }
    this._policies.push({
      policy,
      options
    });
    this._orderedPolicies = void 0;
  }
  removePolicy(options) {
    const removedPolicies = [];
    this._policies = this._policies.filter((policyDescriptor) => {
      if (options.name && policyDescriptor.policy.name === options.name || options.phase && policyDescriptor.options.phase === options.phase) {
        removedPolicies.push(policyDescriptor.policy);
        return false;
      } else {
        return true;
      }
    });
    this._orderedPolicies = void 0;
    return removedPolicies;
  }
  sendRequest(httpClient, request) {
    const policies = this.getOrderedPolicies();
    const pipeline = policies.reduceRight(
      (next, policy) => {
        return (req) => {
          return policy.sendRequest(req, next);
        };
      },
      (req) => httpClient.sendRequest(req)
    );
    return pipeline(request);
  }
  getOrderedPolicies() {
    if (!this._orderedPolicies) {
      this._orderedPolicies = this.orderPolicies();
    }
    return this._orderedPolicies;
  }
  clone() {
    return new HttpPipeline(this._policies);
  }
  static create() {
    return new HttpPipeline();
  }
  orderPolicies() {
    const result = [];
    const policyMap = /* @__PURE__ */ new Map();
    function createPhase(name) {
      return {
        name,
        policies: /* @__PURE__ */ new Set(),
        hasRun: false,
        hasAfterPolicies: false
      };
    }
    const serializePhase = createPhase("Serialize");
    const noPhase = createPhase("None");
    const deserializePhase = createPhase("Deserialize");
    const retryPhase = createPhase("Retry");
    const signPhase = createPhase("Sign");
    const orderedPhases = [serializePhase, noPhase, deserializePhase, retryPhase, signPhase];
    function getPhase(phase) {
      if (phase === "Retry") {
        return retryPhase;
      } else if (phase === "Serialize") {
        return serializePhase;
      } else if (phase === "Deserialize") {
        return deserializePhase;
      } else if (phase === "Sign") {
        return signPhase;
      } else {
        return noPhase;
      }
    }
    for (const descriptor of this._policies) {
      const policy = descriptor.policy;
      const options = descriptor.options;
      const policyName = policy.name;
      if (policyMap.has(policyName)) {
        throw new Error("Duplicate policy names not allowed in pipeline");
      }
      const node = {
        policy,
        dependsOn: /* @__PURE__ */ new Set(),
        dependants: /* @__PURE__ */ new Set()
      };
      if (options.afterPhase) {
        node.afterPhase = getPhase(options.afterPhase);
        node.afterPhase.hasAfterPolicies = true;
      }
      policyMap.set(policyName, node);
      const phase = getPhase(options.phase);
      phase.policies.add(node);
    }
    for (const descriptor of this._policies) {
      const { policy, options } = descriptor;
      const policyName = policy.name;
      const node = policyMap.get(policyName);
      if (!node) {
        throw new Error(`Missing node for policy ${policyName}`);
      }
      if (options.afterPolicies) {
        for (const afterPolicyName of options.afterPolicies) {
          const afterNode = policyMap.get(afterPolicyName);
          if (afterNode) {
            node.dependsOn.add(afterNode);
            afterNode.dependants.add(node);
          }
        }
      }
      if (options.beforePolicies) {
        for (const beforePolicyName of options.beforePolicies) {
          const beforeNode = policyMap.get(beforePolicyName);
          if (beforeNode) {
            beforeNode.dependsOn.add(node);
            node.dependants.add(beforeNode);
          }
        }
      }
    }
    function walkPhase(phase) {
      phase.hasRun = true;
      for (const node of phase.policies) {
        if (node.afterPhase && (!node.afterPhase.hasRun || node.afterPhase.policies.size)) {
          continue;
        }
        if (node.dependsOn.size === 0) {
          result.push(node.policy);
          for (const dependant of node.dependants) {
            dependant.dependsOn.delete(node);
          }
          policyMap.delete(node.policy.name);
          phase.policies.delete(node);
        }
      }
    }
    function walkPhases() {
      for (const phase of orderedPhases) {
        walkPhase(phase);
        if (phase.policies.size > 0 && phase !== noPhase) {
          if (!noPhase.hasRun) {
            walkPhase(noPhase);
          }
          return;
        }
        if (phase.hasAfterPolicies) {
          walkPhase(noPhase);
        }
      }
    }
    let iteration = 0;
    while (policyMap.size > 0) {
      iteration++;
      const initialResultLength = result.length;
      walkPhases();
      if (result.length <= initialResultLength && iteration > 1) {
        throw new Error("Cannot satisfy policy dependencies due to requirements cycle.");
      }
    }
    return result;
  }
}
function createEmptyPipeline() {
  return HttpPipeline.create();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=pipeline.js.map


/***/ }),

/***/ 2305:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var pipelineRequest_exports = {};
__export(pipelineRequest_exports, {
  createPipelineRequest: () => createPipelineRequest
});
module.exports = __toCommonJS(pipelineRequest_exports);
var import_httpHeaders = __nccwpck_require__(4220);
var import_uuid = __nccwpck_require__(5023);
class PipelineRequestImpl {
  url;
  method;
  headers;
  timeout;
  withCredentials;
  body;
  multipartBody;
  formData;
  streamResponseStatusCodes;
  enableBrowserStreams;
  proxySettings;
  disableKeepAlive;
  abortSignal;
  requestId;
  allowInsecureConnection;
  onUploadProgress;
  onDownloadProgress;
  requestOverrides;
  authSchemes;
  constructor(options) {
    this.url = options.url;
    this.body = options.body;
    this.headers = options.headers ?? (0, import_httpHeaders.createHttpHeaders)();
    this.method = options.method ?? "GET";
    this.timeout = options.timeout ?? 0;
    this.multipartBody = options.multipartBody;
    this.formData = options.formData;
    this.disableKeepAlive = options.disableKeepAlive ?? false;
    this.proxySettings = options.proxySettings;
    this.streamResponseStatusCodes = options.streamResponseStatusCodes;
    this.withCredentials = options.withCredentials ?? false;
    this.abortSignal = options.abortSignal;
    this.onUploadProgress = options.onUploadProgress;
    this.onDownloadProgress = options.onDownloadProgress;
    this.requestId = options.requestId || (0, import_uuid.randomUUID)();
    this.allowInsecureConnection = options.allowInsecureConnection ?? false;
    this.enableBrowserStreams = options.enableBrowserStreams ?? false;
    this.requestOverrides = options.requestOverrides;
    this.authSchemes = options.authSchemes;
  }
}
function createPipelineRequest(options) {
  return new PipelineRequestImpl(options);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=pipelineRequest.js.map


/***/ }),

/***/ 5366:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var agentPolicy_exports = {};
__export(agentPolicy_exports, {
  agentPolicy: () => agentPolicy,
  agentPolicyName: () => agentPolicyName
});
module.exports = __toCommonJS(agentPolicy_exports);
const agentPolicyName = "agentPolicy";
function agentPolicy(agent) {
  return {
    name: agentPolicyName,
    sendRequest: async (req, next) => {
      if (!req.agent) {
        req.agent = agent;
      }
      return next(req);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=agentPolicy.js.map


/***/ }),

/***/ 2095:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var apiKeyAuthenticationPolicy_exports = {};
__export(apiKeyAuthenticationPolicy_exports, {
  apiKeyAuthenticationPolicy: () => apiKeyAuthenticationPolicy,
  apiKeyAuthenticationPolicyName: () => apiKeyAuthenticationPolicyName
});
module.exports = __toCommonJS(apiKeyAuthenticationPolicy_exports);
var import_checkInsecureConnection = __nccwpck_require__(2302);
const apiKeyAuthenticationPolicyName = "apiKeyAuthenticationPolicy";
function apiKeyAuthenticationPolicy(options) {
  return {
    name: apiKeyAuthenticationPolicyName,
    async sendRequest(request, next) {
      (0, import_checkInsecureConnection.ensureSecureConnection)(request, options);
      const scheme = (request.authSchemes ?? options.authSchemes)?.find((x) => x.kind === "apiKey");
      if (!scheme) {
        return next(request);
      }
      if (scheme.apiKeyLocation !== "header") {
        throw new Error(`Unsupported API key location: ${scheme.apiKeyLocation}`);
      }
      request.headers.set(scheme.name, options.credential.key);
      return next(request);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=apiKeyAuthenticationPolicy.js.map


/***/ }),

/***/ 5756:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var basicAuthenticationPolicy_exports = {};
__export(basicAuthenticationPolicy_exports, {
  basicAuthenticationPolicy: () => basicAuthenticationPolicy,
  basicAuthenticationPolicyName: () => basicAuthenticationPolicyName
});
module.exports = __toCommonJS(basicAuthenticationPolicy_exports);
var import_bytesEncoding = __nccwpck_require__(2921);
var import_checkInsecureConnection = __nccwpck_require__(2302);
const basicAuthenticationPolicyName = "bearerAuthenticationPolicy";
function basicAuthenticationPolicy(options) {
  return {
    name: basicAuthenticationPolicyName,
    async sendRequest(request, next) {
      (0, import_checkInsecureConnection.ensureSecureConnection)(request, options);
      const scheme = (request.authSchemes ?? options.authSchemes)?.find(
        (x) => x.kind === "http" && x.scheme === "basic"
      );
      if (!scheme) {
        return next(request);
      }
      const { username, password } = options.credential;
      const headerValue = (0, import_bytesEncoding.uint8ArrayToString)(
        (0, import_bytesEncoding.stringToUint8Array)(`${username}:${password}`, "utf-8"),
        "base64"
      );
      request.headers.set("Authorization", `Basic ${headerValue}`);
      return next(request);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=basicAuthenticationPolicy.js.map


/***/ }),

/***/ 9709:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var bearerAuthenticationPolicy_exports = {};
__export(bearerAuthenticationPolicy_exports, {
  bearerAuthenticationPolicy: () => bearerAuthenticationPolicy,
  bearerAuthenticationPolicyName: () => bearerAuthenticationPolicyName
});
module.exports = __toCommonJS(bearerAuthenticationPolicy_exports);
var import_checkInsecureConnection = __nccwpck_require__(2302);
const bearerAuthenticationPolicyName = "bearerAuthenticationPolicy";
function bearerAuthenticationPolicy(options) {
  return {
    name: bearerAuthenticationPolicyName,
    async sendRequest(request, next) {
      (0, import_checkInsecureConnection.ensureSecureConnection)(request, options);
      const scheme = (request.authSchemes ?? options.authSchemes)?.find(
        (x) => x.kind === "http" && x.scheme === "bearer"
      );
      if (!scheme) {
        return next(request);
      }
      const token = await options.credential.getBearerToken({
        abortSignal: request.abortSignal
      });
      request.headers.set("Authorization", `Bearer ${token}`);
      return next(request);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=bearerAuthenticationPolicy.js.map


/***/ }),

/***/ 2302:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var checkInsecureConnection_exports = {};
__export(checkInsecureConnection_exports, {
  ensureSecureConnection: () => ensureSecureConnection
});
module.exports = __toCommonJS(checkInsecureConnection_exports);
var import_log = __nccwpck_require__(3644);
var import_env = __nccwpck_require__(1573);
let insecureConnectionWarningEmmitted = false;
function allowInsecureConnection(request, options) {
  if (options.allowInsecureConnection && request.allowInsecureConnection) {
    const url = new URL(request.url);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return true;
    }
  }
  return false;
}
function emitInsecureConnectionWarning() {
  const warning = "Sending token over insecure transport. Assume any token issued is compromised.";
  import_log.logger.warning(warning);
  if (!insecureConnectionWarningEmmitted) {
    insecureConnectionWarningEmmitted = true;
    (0, import_env.emitNodeWarning)(warning);
  }
}
function ensureSecureConnection(request, options) {
  if (!request.url.toLowerCase().startsWith("https://")) {
    if (allowInsecureConnection(request, options)) {
      emitInsecureConnectionWarning();
    } else {
      throw new Error(
        "Authentication is not permitted for non-TLS protected (non-https) URLs when allowInsecureConnection is false."
      );
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=checkInsecureConnection.js.map


/***/ }),

/***/ 219:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var oauth2AuthenticationPolicy_exports = {};
__export(oauth2AuthenticationPolicy_exports, {
  oauth2AuthenticationPolicy: () => oauth2AuthenticationPolicy,
  oauth2AuthenticationPolicyName: () => oauth2AuthenticationPolicyName
});
module.exports = __toCommonJS(oauth2AuthenticationPolicy_exports);
var import_checkInsecureConnection = __nccwpck_require__(2302);
const oauth2AuthenticationPolicyName = "oauth2AuthenticationPolicy";
function oauth2AuthenticationPolicy(options) {
  return {
    name: oauth2AuthenticationPolicyName,
    async sendRequest(request, next) {
      (0, import_checkInsecureConnection.ensureSecureConnection)(request, options);
      const scheme = (request.authSchemes ?? options.authSchemes)?.find((x) => x.kind === "oauth2");
      if (!scheme) {
        return next(request);
      }
      const token = await options.credential.getOAuth2Token(scheme.flows, {
        abortSignal: request.abortSignal
      });
      request.headers.set("Authorization", `Bearer ${token}`);
      return next(request);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=oauth2AuthenticationPolicy.js.map


/***/ }),

/***/ 5035:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var decompressResponsePolicy_exports = {};
__export(decompressResponsePolicy_exports, {
  decompressResponsePolicy: () => decompressResponsePolicy,
  decompressResponsePolicyName: () => decompressResponsePolicyName
});
module.exports = __toCommonJS(decompressResponsePolicy_exports);
const decompressResponsePolicyName = "decompressResponsePolicy";
function decompressResponsePolicy() {
  return {
    name: decompressResponsePolicyName,
    async sendRequest(request, next) {
      if (request.method !== "HEAD") {
        request.headers.set("Accept-Encoding", "gzip,deflate");
      }
      return next(request);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=decompressResponsePolicy.js.map


/***/ }),

/***/ 2462:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var defaultRetryPolicy_exports = {};
__export(defaultRetryPolicy_exports, {
  defaultRetryPolicy: () => defaultRetryPolicy,
  defaultRetryPolicyName: () => defaultRetryPolicyName
});
module.exports = __toCommonJS(defaultRetryPolicy_exports);
var import_exponentialRetryStrategy = __nccwpck_require__(8102);
var import_throttlingRetryStrategy = __nccwpck_require__(1112);
var import_retryPolicy = __nccwpck_require__(3345);
var import_constants = __nccwpck_require__(1255);
const defaultRetryPolicyName = "defaultRetryPolicy";
function defaultRetryPolicy(options = {}) {
  return {
    name: defaultRetryPolicyName,
    sendRequest: (0, import_retryPolicy.retryPolicy)([(0, import_throttlingRetryStrategy.throttlingRetryStrategy)(), (0, import_exponentialRetryStrategy.exponentialRetryStrategy)(options)], {
      maxRetries: options.maxRetries ?? import_constants.DEFAULT_RETRY_POLICY_COUNT
    }).sendRequest
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=defaultRetryPolicy.js.map


/***/ }),

/***/ 4656:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var exponentialRetryPolicy_exports = {};
__export(exponentialRetryPolicy_exports, {
  exponentialRetryPolicy: () => exponentialRetryPolicy,
  exponentialRetryPolicyName: () => exponentialRetryPolicyName
});
module.exports = __toCommonJS(exponentialRetryPolicy_exports);
var import_exponentialRetryStrategy = __nccwpck_require__(8102);
var import_retryPolicy = __nccwpck_require__(3345);
var import_constants = __nccwpck_require__(1255);
const exponentialRetryPolicyName = "exponentialRetryPolicy";
function exponentialRetryPolicy(options = {}) {
  return (0, import_retryPolicy.retryPolicy)(
    [
      (0, import_exponentialRetryStrategy.exponentialRetryStrategy)({
        ...options,
        ignoreSystemErrors: true
      })
    ],
    {
      maxRetries: options.maxRetries ?? import_constants.DEFAULT_RETRY_POLICY_COUNT
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=exponentialRetryPolicy.js.map


/***/ }),

/***/ 4197:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var formDataPolicy_exports = {};
__export(formDataPolicy_exports, {
  formDataPolicy: () => formDataPolicy,
  formDataPolicyName: () => formDataPolicyName
});
module.exports = __toCommonJS(formDataPolicy_exports);
var import_bytesEncoding = __nccwpck_require__(2921);
var import_formData = __nccwpck_require__(9182);
var import_httpHeaders = __nccwpck_require__(4220);
const formDataPolicyName = "formDataPolicy";
function formDataPolicy() {
  return {
    name: formDataPolicyName,
    async sendRequest(request, next) {
      const converted = (0, import_formData.convertBodyToFormDataMap)(request.body);
      if (converted) {
        request.formData = converted;
        request.body = void 0;
      }
      if (request.formData) {
        const contentType = request.headers.get("Content-Type");
        if (contentType && contentType.indexOf("application/x-www-form-urlencoded") !== -1) {
          request.body = wwwFormUrlEncode(request.formData);
        } else {
          await prepareFormData(request.formData, request);
        }
        request.formData = void 0;
      }
      return next(request);
    }
  };
}
function wwwFormUrlEncode(formData) {
  const urlSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(formData)) {
    if (Array.isArray(value)) {
      for (const subValue of value) {
        urlSearchParams.append(key, subValue.toString());
      }
    } else {
      urlSearchParams.append(key, value.toString());
    }
  }
  return urlSearchParams.toString();
}
async function prepareFormData(formData, request) {
  const contentType = request.headers.get("Content-Type");
  if (contentType && !contentType.startsWith("multipart/form-data")) {
    return;
  }
  request.headers.set("Content-Type", contentType ?? "multipart/form-data");
  const parts = [];
  for (const [fieldName, values] of Object.entries(formData)) {
    for (const value of Array.isArray(values) ? values : [values]) {
      if (typeof value === "string") {
        parts.push({
          headers: (0, import_httpHeaders.createHttpHeaders)({
            "Content-Disposition": `form-data; name="${fieldName}"`
          }),
          body: (0, import_bytesEncoding.stringToUint8Array)(value, "utf-8")
        });
      } else if (value === void 0 || value === null || typeof value !== "object") {
        throw new Error(
          `Unexpected value for key ${fieldName}: ${value}. Value should be serialized to string first.`
        );
      } else {
        const fileName = value.name || "blob";
        const headers = (0, import_httpHeaders.createHttpHeaders)();
        headers.set(
          "Content-Disposition",
          `form-data; name="${fieldName}"; filename="${fileName}"`
        );
        headers.set("Content-Type", value.type || "application/octet-stream");
        parts.push({
          headers,
          body: value
        });
      }
    }
  }
  request.multipartBody = { parts };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=formDataPolicy.js.map


/***/ }),

/***/ 4960:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var internal_exports = {};
__export(internal_exports, {
  agentPolicy: () => import_agentPolicy.agentPolicy,
  agentPolicyName: () => import_agentPolicy.agentPolicyName,
  decompressResponsePolicy: () => import_decompress.decompressResponsePolicy,
  decompressResponsePolicyName: () => import_decompress.decompressResponsePolicyName,
  defaultRetryPolicy: () => import_defaultRetryPolicy.defaultRetryPolicy,
  defaultRetryPolicyName: () => import_defaultRetryPolicy.defaultRetryPolicyName,
  exponentialRetryPolicy: () => import_exponentialRetryPolicy.exponentialRetryPolicy,
  exponentialRetryPolicyName: () => import_exponentialRetryPolicy.exponentialRetryPolicyName,
  formDataPolicy: () => import_formDataPolicy.formDataPolicy,
  formDataPolicyName: () => import_formDataPolicy.formDataPolicyName,
  getDefaultProxySettings: () => import_proxy.getDefaultProxySettings,
  logPolicy: () => import_logPolicy.logPolicy,
  logPolicyName: () => import_logPolicy.logPolicyName,
  multipartPolicy: () => import_multipartPolicy.multipartPolicy,
  multipartPolicyName: () => import_multipartPolicy.multipartPolicyName,
  proxyPolicy: () => import_proxy.proxyPolicy,
  proxyPolicyName: () => import_proxy.proxyPolicyName,
  redirectPolicy: () => import_redirectPolicy.redirectPolicy,
  redirectPolicyName: () => import_redirectPolicy.redirectPolicyName,
  retryPolicy: () => import_retryPolicy.retryPolicy,
  systemErrorRetryPolicy: () => import_systemErrorRetryPolicy.systemErrorRetryPolicy,
  systemErrorRetryPolicyName: () => import_systemErrorRetryPolicy.systemErrorRetryPolicyName,
  throttlingRetryPolicy: () => import_throttlingRetryPolicy.throttlingRetryPolicy,
  throttlingRetryPolicyName: () => import_throttlingRetryPolicy.throttlingRetryPolicyName,
  tlsPolicy: () => import_tlsPolicy.tlsPolicy,
  tlsPolicyName: () => import_tlsPolicy.tlsPolicyName,
  userAgentPolicy: () => import_userAgentPolicy.userAgentPolicy,
  userAgentPolicyName: () => import_userAgentPolicy.userAgentPolicyName
});
module.exports = __toCommonJS(internal_exports);
var import_agentPolicy = __nccwpck_require__(5366);
var import_decompress = __nccwpck_require__(5035);
var import_defaultRetryPolicy = __nccwpck_require__(2462);
var import_exponentialRetryPolicy = __nccwpck_require__(4656);
var import_retryPolicy = __nccwpck_require__(3345);
var import_systemErrorRetryPolicy = __nccwpck_require__(2418);
var import_throttlingRetryPolicy = __nccwpck_require__(4728);
var import_formDataPolicy = __nccwpck_require__(4197);
var import_logPolicy = __nccwpck_require__(7129);
var import_multipartPolicy = __nccwpck_require__(7427);
var import_proxy = __nccwpck_require__(67);
var import_redirectPolicy = __nccwpck_require__(2187);
var import_tlsPolicy = __nccwpck_require__(6690);
var import_userAgentPolicy = __nccwpck_require__(1691);
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=internal.js.map


/***/ }),

/***/ 7129:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var logPolicy_exports = {};
__export(logPolicy_exports, {
  logPolicy: () => logPolicy,
  logPolicyName: () => logPolicyName
});
module.exports = __toCommonJS(logPolicy_exports);
var import_log = __nccwpck_require__(3644);
var import_sanitizer = __nccwpck_require__(7784);
const logPolicyName = "logPolicy";
function logPolicy(options = {}) {
  const logger = options.logger ?? import_log.logger.info;
  const sanitizer = new import_sanitizer.Sanitizer({
    additionalAllowedHeaderNames: options.additionalAllowedHeaderNames,
    additionalAllowedQueryParameters: options.additionalAllowedQueryParameters
  });
  return {
    name: logPolicyName,
    async sendRequest(request, next) {
      if (!logger.enabled) {
        return next(request);
      }
      logger(`Request: ${sanitizer.sanitize(request)}`);
      const response = await next(request);
      logger(`Response status code: ${response.status}`);
      logger(`Headers: ${sanitizer.sanitize(response.headers)}`);
      return response;
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=logPolicy.js.map


/***/ }),

/***/ 7427:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var multipartPolicy_exports = {};
__export(multipartPolicy_exports, {
  multipartPolicy: () => multipartPolicy,
  multipartPolicyName: () => multipartPolicyName
});
module.exports = __toCommonJS(multipartPolicy_exports);
var import_bytesEncoding = __nccwpck_require__(2921);
var import_typeGuards = __nccwpck_require__(8505);
var import_uuid = __nccwpck_require__(5023);
var import_concat = __nccwpck_require__(547);
function generateBoundary() {
  return `----AzSDKFormBoundary${(0, import_uuid.randomUUID)()}`;
}
function encodeHeaders(headers) {
  let result = "";
  for (const [key, value] of headers) {
    result += `${key}: ${value}\r
`;
  }
  return result;
}
function getLength(source) {
  if (source instanceof Uint8Array) {
    return source.byteLength;
  } else if ((0, import_typeGuards.isBlob)(source)) {
    return source.size === -1 ? void 0 : source.size;
  } else {
    return void 0;
  }
}
function getTotalLength(sources) {
  let total = 0;
  for (const source of sources) {
    const partLength = getLength(source);
    if (partLength === void 0) {
      return void 0;
    } else {
      total += partLength;
    }
  }
  return total;
}
async function buildRequestBody(request, parts, boundary) {
  const sources = [
    (0, import_bytesEncoding.stringToUint8Array)(`--${boundary}`, "utf-8"),
    ...parts.flatMap((part) => [
      (0, import_bytesEncoding.stringToUint8Array)("\r\n", "utf-8"),
      (0, import_bytesEncoding.stringToUint8Array)(encodeHeaders(part.headers), "utf-8"),
      (0, import_bytesEncoding.stringToUint8Array)("\r\n", "utf-8"),
      part.body,
      (0, import_bytesEncoding.stringToUint8Array)(`\r
--${boundary}`, "utf-8")
    ]),
    (0, import_bytesEncoding.stringToUint8Array)("--\r\n\r\n", "utf-8")
  ];
  const contentLength = getTotalLength(sources);
  if (contentLength) {
    request.headers.set("Content-Length", contentLength);
  }
  request.body = await (0, import_concat.concat)(sources);
}
const multipartPolicyName = "multipartPolicy";
const maxBoundaryLength = 70;
const validBoundaryCharacters = new Set(
  `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'()+,-./:=?`
);
function assertValidBoundary(boundary) {
  if (boundary.length > maxBoundaryLength) {
    throw new Error(`Multipart boundary "${boundary}" exceeds maximum length of 70 characters`);
  }
  if (Array.from(boundary).some((x) => !validBoundaryCharacters.has(x))) {
    throw new Error(`Multipart boundary "${boundary}" contains invalid characters`);
  }
}
function multipartPolicy() {
  return {
    name: multipartPolicyName,
    async sendRequest(request, next) {
      if (!request.multipartBody) {
        return next(request);
      }
      if (request.body) {
        throw new Error("multipartBody and regular body cannot be set at the same time");
      }
      let boundary = request.multipartBody.boundary;
      const contentTypeHeader = request.headers.get("Content-Type") ?? "multipart/mixed";
      const parsedHeader = contentTypeHeader.match(/^(multipart\/[^ ;]+)(?:; *boundary=(.+))?$/);
      if (!parsedHeader) {
        throw new Error(
          `Got multipart request body, but content-type header was not multipart: ${contentTypeHeader}`
        );
      }
      const [, contentType, parsedBoundary] = parsedHeader;
      if (parsedBoundary && boundary && parsedBoundary !== boundary) {
        throw new Error(
          `Multipart boundary was specified as ${parsedBoundary} in the header, but got ${boundary} in the request body`
        );
      }
      boundary ??= parsedBoundary;
      if (boundary) {
        assertValidBoundary(boundary);
      } else {
        boundary = generateBoundary();
      }
      request.headers.set("Content-Type", `${contentType}; boundary=${boundary}`);
      await buildRequestBody(request, request.multipartBody.parts, boundary);
      request.multipartBody = void 0;
      return next(request);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=multipartPolicy.js.map


/***/ }),

/***/ 6316:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var platformPolicies_exports = {};
__export(platformPolicies_exports, {
  addPlatformPolicies: () => addPlatformPolicies
});
module.exports = __toCommonJS(platformPolicies_exports);
var import_agentPolicy = __nccwpck_require__(5366);
var import_tlsPolicy = __nccwpck_require__(6690);
var import_proxy = __nccwpck_require__(67);
var import_decompress = __nccwpck_require__(5035);
var import_redirectPolicy = __nccwpck_require__(2187);
function addPlatformPolicies(pipeline, options) {
  if (options.agent) {
    pipeline.addPolicy((0, import_agentPolicy.agentPolicy)(options.agent));
  }
  if (options.tlsOptions) {
    pipeline.addPolicy((0, import_tlsPolicy.tlsPolicy)(options.tlsOptions));
  }
  pipeline.addPolicy((0, import_proxy.proxyPolicy)(options.proxyOptions));
  pipeline.addPolicy((0, import_decompress.decompressResponsePolicy)());
  pipeline.addPolicy((0, import_redirectPolicy.redirectPolicy)(options.redirectOptions), { afterPhase: "Retry" });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=platformPolicies.js.map


/***/ }),

/***/ 67:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var proxyPolicy_exports = {};
__export(proxyPolicy_exports, {
  getDefaultProxySettings: () => getDefaultProxySettings,
  globalNoProxyList: () => globalNoProxyList,
  loadNoProxy: () => loadNoProxy,
  proxyPolicy: () => proxyPolicy,
  proxyPolicyName: () => proxyPolicyName
});
module.exports = __toCommonJS(proxyPolicy_exports);
var import_https_proxy_agent = __nccwpck_require__(3669);
var import_http_proxy_agent = __nccwpck_require__(1970);
var import_log = __nccwpck_require__(3644);
const HTTPS_PROXY = "HTTPS_PROXY";
const HTTP_PROXY = "HTTP_PROXY";
const ALL_PROXY = "ALL_PROXY";
const NO_PROXY = "NO_PROXY";
const proxyPolicyName = "proxyPolicy";
const globalNoProxyList = [];
let noProxyListLoaded = false;
const globalBypassedMap = /* @__PURE__ */ new Map();
function getEnvironmentValue(name) {
  if (process.env[name]) {
    return process.env[name];
  } else if (process.env[name.toLowerCase()]) {
    return process.env[name.toLowerCase()];
  }
  return void 0;
}
function loadEnvironmentProxyValue() {
  if (!process) {
    return void 0;
  }
  const httpsProxy = getEnvironmentValue(HTTPS_PROXY);
  const allProxy = getEnvironmentValue(ALL_PROXY);
  const httpProxy = getEnvironmentValue(HTTP_PROXY);
  return httpsProxy || allProxy || httpProxy;
}
function isBypassed(uri, noProxyList, bypassedMap) {
  if (noProxyList.length === 0) {
    return false;
  }
  const host = new URL(uri).hostname;
  if (bypassedMap?.has(host)) {
    return bypassedMap.get(host);
  }
  let isBypassedFlag = false;
  for (const pattern of noProxyList) {
    if (pattern[0] === ".") {
      if (host.endsWith(pattern)) {
        isBypassedFlag = true;
      } else {
        if (host.length === pattern.length - 1 && host === pattern.slice(1)) {
          isBypassedFlag = true;
        }
      }
    } else {
      if (host === pattern) {
        isBypassedFlag = true;
      }
    }
  }
  bypassedMap?.set(host, isBypassedFlag);
  return isBypassedFlag;
}
function loadNoProxy() {
  const noProxy = getEnvironmentValue(NO_PROXY);
  noProxyListLoaded = true;
  if (noProxy) {
    return noProxy.split(",").map((item) => item.trim()).filter((item) => item.length);
  }
  return [];
}
function getDefaultProxySettings(proxyUrl) {
  if (!proxyUrl) {
    proxyUrl = loadEnvironmentProxyValue();
    if (!proxyUrl) {
      return void 0;
    }
  }
  const parsedUrl = new URL(proxyUrl);
  const schema = parsedUrl.protocol ? parsedUrl.protocol + "//" : "";
  return {
    host: schema + parsedUrl.hostname,
    port: Number.parseInt(parsedUrl.port || "80"),
    username: parsedUrl.username,
    password: parsedUrl.password
  };
}
function getDefaultProxySettingsInternal() {
  const envProxy = loadEnvironmentProxyValue();
  return envProxy ? new URL(envProxy) : void 0;
}
function getUrlFromProxySettings(settings) {
  let parsedProxyUrl;
  try {
    parsedProxyUrl = new URL(settings.host);
  } catch {
    throw new Error(
      `Expecting a valid host string in proxy settings, but found "${settings.host}".`
    );
  }
  parsedProxyUrl.port = String(settings.port);
  if (settings.username) {
    parsedProxyUrl.username = settings.username;
  }
  if (settings.password) {
    parsedProxyUrl.password = settings.password;
  }
  return parsedProxyUrl;
}
function setProxyAgentOnRequest(request, cachedAgents, proxyUrl) {
  if (request.agent) {
    return;
  }
  const url = new URL(request.url);
  const isInsecure = url.protocol !== "https:";
  if (request.tlsSettings) {
    import_log.logger.warning(
      "TLS settings are not supported in combination with custom Proxy, certificates provided to the client will be ignored."
    );
  }
  if (isInsecure) {
    if (!cachedAgents.httpProxyAgent) {
      cachedAgents.httpProxyAgent = new import_http_proxy_agent.HttpProxyAgent(proxyUrl);
    }
    request.agent = cachedAgents.httpProxyAgent;
  } else {
    if (!cachedAgents.httpsProxyAgent) {
      cachedAgents.httpsProxyAgent = new import_https_proxy_agent.HttpsProxyAgent(proxyUrl);
    }
    request.agent = cachedAgents.httpsProxyAgent;
  }
}
function proxyPolicy(proxySettings, options) {
  if (!noProxyListLoaded) {
    globalNoProxyList.push(...loadNoProxy());
  }
  const defaultProxy = proxySettings ? getUrlFromProxySettings(proxySettings) : getDefaultProxySettingsInternal();
  const cachedAgents = {};
  return {
    name: proxyPolicyName,
    async sendRequest(request, next) {
      if (!request.proxySettings && defaultProxy && !isBypassed(
        request.url,
        options?.customNoProxyList ?? globalNoProxyList,
        options?.customNoProxyList ? void 0 : globalBypassedMap
      )) {
        setProxyAgentOnRequest(request, cachedAgents, defaultProxy);
      } else if (request.proxySettings) {
        setProxyAgentOnRequest(
          request,
          cachedAgents,
          getUrlFromProxySettings(request.proxySettings)
        );
      }
      return next(request);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=proxyPolicy.js.map


/***/ }),

/***/ 2187:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var redirectPolicy_exports = {};
__export(redirectPolicy_exports, {
  redirectPolicy: () => redirectPolicy,
  redirectPolicyName: () => redirectPolicyName
});
module.exports = __toCommonJS(redirectPolicy_exports);
var import_log = __nccwpck_require__(3644);
const redirectPolicyName = "redirectPolicy";
const allowedRedirect = ["GET", "HEAD"];
function redirectPolicy(options = {}) {
  const { maxRetries = 20, allowCrossOriginRedirects = false } = options;
  return {
    name: redirectPolicyName,
    async sendRequest(request, next) {
      const response = await next(request);
      return handleRedirect(next, response, maxRetries, allowCrossOriginRedirects);
    }
  };
}
async function handleRedirect(next, response, maxRetries, allowCrossOriginRedirects, currentRetries = 0) {
  const { request, status, headers } = response;
  const locationHeader = headers.get("location");
  if (locationHeader && (status === 300 || status === 301 && allowedRedirect.includes(request.method) || status === 302 && allowedRedirect.includes(request.method) || status === 303 && request.method === "POST" || status === 307) && currentRetries < maxRetries) {
    const url = new URL(locationHeader, request.url);
    if (!allowCrossOriginRedirects) {
      const originalUrl = new URL(request.url);
      if (url.origin !== originalUrl.origin) {
        import_log.logger.verbose(
          `Skipping cross-origin redirect from ${originalUrl.origin} to ${url.origin}.`
        );
        return response;
      }
    }
    request.url = url.toString();
    if (status === 303) {
      request.method = "GET";
      request.headers.delete("Content-Length");
      delete request.body;
    }
    request.headers.delete("Authorization");
    const res = await next(request);
    return handleRedirect(next, res, maxRetries, allowCrossOriginRedirects, currentRetries + 1);
  }
  return response;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=redirectPolicy.js.map


/***/ }),

/***/ 3345:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var retryPolicy_exports = {};
__export(retryPolicy_exports, {
  retryPolicy: () => retryPolicy
});
module.exports = __toCommonJS(retryPolicy_exports);
var import_helpers = __nccwpck_require__(7566);
var import_restError = __nccwpck_require__(9758);
var import_AbortError = __nccwpck_require__(9992);
var import_logger = __nccwpck_require__(8459);
var import_constants = __nccwpck_require__(1255);
const retryPolicyLogger = (0, import_logger.createClientLogger)("ts-http-runtime retryPolicy");
const retryPolicyName = "retryPolicy";
function retryPolicy(strategies, options = { maxRetries: import_constants.DEFAULT_RETRY_POLICY_COUNT }) {
  const logger = options.logger || retryPolicyLogger;
  return {
    name: retryPolicyName,
    async sendRequest(request, next) {
      let response;
      let responseError;
      let retryCount = -1;
      retryRequest: while (true) {
        retryCount += 1;
        response = void 0;
        responseError = void 0;
        try {
          logger.info(`Retry ${retryCount}: Attempting to send request`, request.requestId);
          response = await next(request);
          logger.info(`Retry ${retryCount}: Received a response from request`, request.requestId);
        } catch (e) {
          logger.error(`Retry ${retryCount}: Received an error from request`, request.requestId);
          if (!(0, import_restError.isRestError)(e)) {
            throw e;
          }
          responseError = e;
          response = e.response;
        }
        if (request.abortSignal?.aborted) {
          logger.error(`Retry ${retryCount}: Request aborted.`);
          const abortError = new import_AbortError.AbortError();
          throw abortError;
        }
        if (retryCount >= (options.maxRetries ?? import_constants.DEFAULT_RETRY_POLICY_COUNT)) {
          logger.info(
            `Retry ${retryCount}: Maximum retries reached. Returning the last received response, or throwing the last received error.`
          );
          if (responseError) {
            throw responseError;
          } else if (response) {
            return response;
          } else {
            throw new Error("Maximum retries reached with no response or error to throw");
          }
        }
        logger.info(`Retry ${retryCount}: Processing ${strategies.length} retry strategies.`);
        strategiesLoop: for (const strategy of strategies) {
          const strategyLogger = strategy.logger || logger;
          strategyLogger.info(`Retry ${retryCount}: Processing retry strategy ${strategy.name}.`);
          const modifiers = strategy.retry({
            retryCount,
            response,
            responseError
          });
          if (modifiers.skipStrategy) {
            strategyLogger.info(`Retry ${retryCount}: Skipped.`);
            continue strategiesLoop;
          }
          const { errorToThrow, retryAfterInMs, redirectTo } = modifiers;
          if (errorToThrow) {
            strategyLogger.error(
              `Retry ${retryCount}: Retry strategy ${strategy.name} throws error:`,
              errorToThrow
            );
            throw errorToThrow;
          }
          if (retryAfterInMs || retryAfterInMs === 0) {
            strategyLogger.info(
              `Retry ${retryCount}: Retry strategy ${strategy.name} retries after ${retryAfterInMs}`
            );
            await (0, import_helpers.delay)(retryAfterInMs, void 0, { abortSignal: request.abortSignal });
            continue retryRequest;
          }
          if (redirectTo) {
            strategyLogger.info(
              `Retry ${retryCount}: Retry strategy ${strategy.name} redirects to ${redirectTo}`
            );
            request.url = redirectTo;
            continue retryRequest;
          }
        }
        if (responseError) {
          logger.info(
            `None of the retry strategies could work with the received error. Throwing it.`
          );
          throw responseError;
        }
        if (response) {
          logger.info(
            `None of the retry strategies could work with the received response. Returning it.`
          );
          return response;
        }
      }
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=retryPolicy.js.map


/***/ }),

/***/ 2418:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var systemErrorRetryPolicy_exports = {};
__export(systemErrorRetryPolicy_exports, {
  systemErrorRetryPolicy: () => systemErrorRetryPolicy,
  systemErrorRetryPolicyName: () => systemErrorRetryPolicyName
});
module.exports = __toCommonJS(systemErrorRetryPolicy_exports);
var import_exponentialRetryStrategy = __nccwpck_require__(8102);
var import_retryPolicy = __nccwpck_require__(3345);
var import_constants = __nccwpck_require__(1255);
const systemErrorRetryPolicyName = "systemErrorRetryPolicy";
function systemErrorRetryPolicy(options = {}) {
  return {
    name: systemErrorRetryPolicyName,
    sendRequest: (0, import_retryPolicy.retryPolicy)(
      [
        (0, import_exponentialRetryStrategy.exponentialRetryStrategy)({
          ...options,
          ignoreHttpStatusCodes: true
        })
      ],
      {
        maxRetries: options.maxRetries ?? import_constants.DEFAULT_RETRY_POLICY_COUNT
      }
    ).sendRequest
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=systemErrorRetryPolicy.js.map


/***/ }),

/***/ 4728:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var throttlingRetryPolicy_exports = {};
__export(throttlingRetryPolicy_exports, {
  throttlingRetryPolicy: () => throttlingRetryPolicy,
  throttlingRetryPolicyName: () => throttlingRetryPolicyName
});
module.exports = __toCommonJS(throttlingRetryPolicy_exports);
var import_throttlingRetryStrategy = __nccwpck_require__(1112);
var import_retryPolicy = __nccwpck_require__(3345);
var import_constants = __nccwpck_require__(1255);
const throttlingRetryPolicyName = "throttlingRetryPolicy";
function throttlingRetryPolicy(options = {}) {
  return {
    name: throttlingRetryPolicyName,
    sendRequest: (0, import_retryPolicy.retryPolicy)([(0, import_throttlingRetryStrategy.throttlingRetryStrategy)()], {
      maxRetries: options.maxRetries ?? import_constants.DEFAULT_RETRY_POLICY_COUNT
    }).sendRequest
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=throttlingRetryPolicy.js.map


/***/ }),

/***/ 6690:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var tlsPolicy_exports = {};
__export(tlsPolicy_exports, {
  tlsPolicy: () => tlsPolicy,
  tlsPolicyName: () => tlsPolicyName
});
module.exports = __toCommonJS(tlsPolicy_exports);
const tlsPolicyName = "tlsPolicy";
function tlsPolicy(tlsSettings) {
  return {
    name: tlsPolicyName,
    sendRequest: async (req, next) => {
      if (!req.tlsSettings) {
        req.tlsSettings = tlsSettings;
      }
      return next(req);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=tlsPolicy.js.map


/***/ }),

/***/ 1691:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var userAgentPolicy_exports = {};
__export(userAgentPolicy_exports, {
  userAgentPolicy: () => userAgentPolicy,
  userAgentPolicyName: () => userAgentPolicyName
});
module.exports = __toCommonJS(userAgentPolicy_exports);
var import_userAgent = __nccwpck_require__(2731);
const UserAgentHeaderName = (0, import_userAgent.getUserAgentHeaderName)();
const userAgentPolicyName = "userAgentPolicy";
function userAgentPolicy(options = {}) {
  const userAgentValue = (0, import_userAgent.getUserAgentValue)(options.userAgentPrefix);
  return {
    name: userAgentPolicyName,
    async sendRequest(request, next) {
      if (!request.headers.has(UserAgentHeaderName)) {
        request.headers.set(UserAgentHeaderName, await userAgentValue);
      }
      return next(request);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=userAgentPolicy.js.map


/***/ }),

/***/ 9758:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var restError_exports = {};
__export(restError_exports, {
  RestError: () => RestError,
  isRestError: () => isRestError
});
module.exports = __toCommonJS(restError_exports);
var import_error = __nccwpck_require__(2573);
var import_inspect = __nccwpck_require__(7639);
var import_sanitizer = __nccwpck_require__(7784);
const errorSanitizer = new import_sanitizer.Sanitizer();
class RestError extends Error {
  /**
   * Something went wrong when making the request.
   * This means the actual request failed for some reason,
   * such as a DNS issue or the connection being lost.
   */
  static REQUEST_SEND_ERROR = "REQUEST_SEND_ERROR";
  /**
   * This means that parsing the response from the server failed.
   * It may have been malformed.
   */
  static PARSE_ERROR = "PARSE_ERROR";
  /**
   * The code of the error itself (use statics on RestError if possible.)
   */
  code;
  /**
   * The HTTP status code of the request (if applicable.)
   */
  statusCode;
  /**
   * The request that was made.
   * This property is non-enumerable.
   */
  request;
  /**
   * The response received (if any.)
   * This property is non-enumerable.
   */
  response;
  /**
   * Bonus property set by the throw site.
   */
  details;
  constructor(message, options = {}) {
    super(message);
    this.name = "RestError";
    this.code = options.code;
    this.statusCode = options.statusCode;
    Object.defineProperty(this, "request", { value: options.request, enumerable: false });
    Object.defineProperty(this, "response", { value: options.response, enumerable: false });
    const agent = this.request?.agent ? {
      maxFreeSockets: this.request.agent.maxFreeSockets,
      maxSockets: this.request.agent.maxSockets
    } : void 0;
    Object.defineProperty(this, import_inspect.custom, {
      value: () => {
        return `RestError: ${this.message} 
 ${errorSanitizer.sanitize({
          ...this,
          request: { ...this.request, agent },
          response: this.response
        })}`;
      },
      enumerable: false
    });
    Object.setPrototypeOf(this, RestError.prototype);
  }
}
function isRestError(e) {
  if (e instanceof RestError) {
    return true;
  }
  return (0, import_error.isError)(e) && e.name === "RestError";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=restError.js.map


/***/ }),

/***/ 8102:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var exponentialRetryStrategy_exports = {};
__export(exponentialRetryStrategy_exports, {
  exponentialRetryStrategy: () => exponentialRetryStrategy,
  isExponentialRetryResponse: () => isExponentialRetryResponse,
  isSystemError: () => isSystemError
});
module.exports = __toCommonJS(exponentialRetryStrategy_exports);
var import_delay = __nccwpck_require__(6776);
var import_throttlingRetryStrategy = __nccwpck_require__(1112);
const DEFAULT_CLIENT_RETRY_INTERVAL = 1e3;
const DEFAULT_CLIENT_MAX_RETRY_INTERVAL = 1e3 * 64;
function exponentialRetryStrategy(options = {}) {
  const retryInterval = options.retryDelayInMs ?? DEFAULT_CLIENT_RETRY_INTERVAL;
  const maxRetryInterval = options.maxRetryDelayInMs ?? DEFAULT_CLIENT_MAX_RETRY_INTERVAL;
  return {
    name: "exponentialRetryStrategy",
    retry({ retryCount, response, responseError }) {
      const matchedSystemError = isSystemError(responseError);
      const ignoreSystemErrors = matchedSystemError && options.ignoreSystemErrors;
      const isExponential = isExponentialRetryResponse(response);
      const ignoreExponentialResponse = isExponential && options.ignoreHttpStatusCodes;
      const unknownResponse = response && ((0, import_throttlingRetryStrategy.isThrottlingRetryResponse)(response) || !isExponential);
      if (unknownResponse || ignoreExponentialResponse || ignoreSystemErrors) {
        return { skipStrategy: true };
      }
      if (responseError && !matchedSystemError && !isExponential) {
        return { errorToThrow: responseError };
      }
      return (0, import_delay.calculateRetryDelay)(retryCount, {
        retryDelayInMs: retryInterval,
        maxRetryDelayInMs: maxRetryInterval
      });
    }
  };
}
function isExponentialRetryResponse(response) {
  return Boolean(
    response && response.status !== void 0 && (response.status >= 500 || response.status === 408) && response.status !== 501 && response.status !== 505
  );
}
function isSystemError(err) {
  if (!err) {
    return false;
  }
  return err.code === "ETIMEDOUT" || err.code === "ESOCKETTIMEDOUT" || err.code === "ECONNREFUSED" || err.code === "ECONNRESET" || err.code === "ENOENT" || err.code === "ENOTFOUND";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=exponentialRetryStrategy.js.map


/***/ }),

/***/ 1112:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var throttlingRetryStrategy_exports = {};
__export(throttlingRetryStrategy_exports, {
  isThrottlingRetryResponse: () => isThrottlingRetryResponse,
  throttlingRetryStrategy: () => throttlingRetryStrategy
});
module.exports = __toCommonJS(throttlingRetryStrategy_exports);
var import_helpers = __nccwpck_require__(7566);
const RetryAfterHeader = "Retry-After";
const AllRetryAfterHeaders = ["retry-after-ms", "x-ms-retry-after-ms", RetryAfterHeader];
function getRetryAfterInMs(response) {
  if (!(response && [429, 503].includes(response.status))) return void 0;
  try {
    for (const header of AllRetryAfterHeaders) {
      const retryAfterValue = (0, import_helpers.parseHeaderValueAsNumber)(response, header);
      if (retryAfterValue === 0 || retryAfterValue) {
        const multiplyingFactor = header === RetryAfterHeader ? 1e3 : 1;
        return retryAfterValue * multiplyingFactor;
      }
    }
    const retryAfterHeader = response.headers.get(RetryAfterHeader);
    if (!retryAfterHeader) return;
    const date = Date.parse(retryAfterHeader);
    const diff = date - Date.now();
    return Number.isFinite(diff) ? Math.max(0, diff) : void 0;
  } catch {
    return void 0;
  }
}
function isThrottlingRetryResponse(response) {
  return Number.isFinite(getRetryAfterInMs(response));
}
function throttlingRetryStrategy() {
  return {
    name: "throttlingRetryStrategy",
    retry({ response }) {
      const retryAfterInMs = getRetryAfterInMs(response);
      if (!Number.isFinite(retryAfterInMs)) {
        return { skipStrategy: true };
      }
      return {
        retryAfterInMs
      };
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=throttlingRetryStrategy.js.map


/***/ }),

/***/ 2921:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var bytesEncoding_exports = {};
__export(bytesEncoding_exports, {
  stringToUint8Array: () => stringToUint8Array,
  uint8ArrayToString: () => uint8ArrayToString
});
module.exports = __toCommonJS(bytesEncoding_exports);
function uint8ArrayToString(bytes, format) {
  return Buffer.from(bytes).toString(format);
}
function stringToUint8Array(value, format) {
  return Buffer.from(value, format);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=bytesEncoding.js.map


/***/ }),

/***/ 547:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var concat_exports = {};
__export(concat_exports, {
  concat: () => concat
});
module.exports = __toCommonJS(concat_exports);
var import_stream = __nccwpck_require__(2203);
var import_typeGuards = __nccwpck_require__(8505);
async function* streamAsyncIterator() {
  const reader = this.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
function makeAsyncIterable(webStream) {
  if (!webStream[Symbol.asyncIterator]) {
    webStream[Symbol.asyncIterator] = streamAsyncIterator.bind(webStream);
  }
  if (!webStream.values) {
    webStream.values = streamAsyncIterator.bind(webStream);
  }
}
function ensureNodeStream(stream) {
  if (stream instanceof ReadableStream) {
    makeAsyncIterable(stream);
    return import_stream.Readable.fromWeb(stream);
  } else {
    return stream;
  }
}
function toStream(source) {
  if (source instanceof Uint8Array) {
    return import_stream.Readable.from(Buffer.from(source));
  } else if ((0, import_typeGuards.isBlob)(source)) {
    return ensureNodeStream(source.stream());
  } else {
    return ensureNodeStream(source);
  }
}
async function concat(sources) {
  return function() {
    const streams = sources.map((x) => typeof x === "function" ? x() : x).map(toStream);
    return import_stream.Readable.from(
      (async function* () {
        for (const stream of streams) {
          for await (const chunk of stream) {
            yield chunk;
          }
        }
      })()
    );
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=concat.js.map


/***/ }),

/***/ 6776:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var delay_exports = {};
__export(delay_exports, {
  calculateRetryDelay: () => calculateRetryDelay
});
module.exports = __toCommonJS(delay_exports);
var import_random = __nccwpck_require__(8640);
function calculateRetryDelay(retryAttempt, config) {
  const exponentialDelay = config.retryDelayInMs * Math.pow(2, retryAttempt);
  const clampedDelay = Math.min(config.maxRetryDelayInMs, exponentialDelay);
  const retryAfterInMs = clampedDelay / 2 + (0, import_random.getRandomIntegerInclusive)(0, clampedDelay / 2);
  return { retryAfterInMs };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=delay.js.map


/***/ }),

/***/ 2573:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var error_exports = {};
__export(error_exports, {
  isError: () => isError
});
module.exports = __toCommonJS(error_exports);
var import_object = __nccwpck_require__(3632);
function isError(e) {
  if ((0, import_object.isObject)(e)) {
    const hasName = typeof e.name === "string";
    const hasMessage = typeof e.message === "string";
    return hasName && hasMessage;
  }
  return false;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=error.js.map


/***/ }),

/***/ 7566:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var helpers_exports = {};
__export(helpers_exports, {
  delay: () => delay,
  parseHeaderValueAsNumber: () => parseHeaderValueAsNumber
});
module.exports = __toCommonJS(helpers_exports);
var import_AbortError = __nccwpck_require__(9992);
const StandardAbortMessage = "The operation was aborted.";
function delay(delayInMs, value, options) {
  return new Promise((resolve, reject) => {
    let timer = void 0;
    let onAborted = void 0;
    const rejectOnAbort = () => {
      return reject(
        new import_AbortError.AbortError(options?.abortErrorMsg ? options?.abortErrorMsg : StandardAbortMessage)
      );
    };
    const removeListeners = () => {
      if (options?.abortSignal && onAborted) {
        options.abortSignal.removeEventListener("abort", onAborted);
      }
    };
    onAborted = () => {
      if (timer) {
        clearTimeout(timer);
      }
      removeListeners();
      return rejectOnAbort();
    };
    if (options?.abortSignal && options.abortSignal.aborted) {
      return rejectOnAbort();
    }
    timer = setTimeout(() => {
      removeListeners();
      resolve(value);
    }, delayInMs);
    if (options?.abortSignal) {
      options.abortSignal.addEventListener("abort", onAborted);
    }
  });
}
function parseHeaderValueAsNumber(response, headerName) {
  const value = response.headers.get(headerName);
  if (!value) return;
  const valueAsNum = Number(value);
  if (Number.isNaN(valueAsNum)) return;
  return valueAsNum;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=helpers.js.map


/***/ }),

/***/ 7639:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var inspect_exports = {};
__export(inspect_exports, {
  custom: () => custom
});
module.exports = __toCommonJS(inspect_exports);
var import_node_util = __nccwpck_require__(7975);
const custom = import_node_util.inspect.custom;
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=inspect.js.map


/***/ }),

/***/ 5750:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var internal_exports = {};
__export(internal_exports, {
  Sanitizer: () => import_sanitizer.Sanitizer,
  calculateRetryDelay: () => import_delay.calculateRetryDelay,
  computeSha256Hash: () => import_sha256.computeSha256Hash,
  computeSha256Hmac: () => import_sha256.computeSha256Hmac,
  getRandomIntegerInclusive: () => import_random.getRandomIntegerInclusive,
  isBrowser: () => import_env.isBrowser,
  isBun: () => import_env.isBun,
  isDeno: () => import_env.isDeno,
  isError: () => import_error.isError,
  isNodeLike: () => import_env.isNodeLike,
  isNodeRuntime: () => import_env.isNodeRuntime,
  isObject: () => import_object.isObject,
  isReactNative: () => import_env.isReactNative,
  isWebWorker: () => import_env.isWebWorker,
  randomUUID: () => import_uuid.randomUUID,
  stringToUint8Array: () => import_bytesEncoding.stringToUint8Array,
  uint8ArrayToString: () => import_bytesEncoding.uint8ArrayToString
});
module.exports = __toCommonJS(internal_exports);
var import_delay = __nccwpck_require__(6776);
var import_random = __nccwpck_require__(8640);
var import_object = __nccwpck_require__(3632);
var import_error = __nccwpck_require__(2573);
var import_sha256 = __nccwpck_require__(2016);
var import_uuid = __nccwpck_require__(5023);
var import_env = __nccwpck_require__(1573);
var import_bytesEncoding = __nccwpck_require__(2921);
var import_sanitizer = __nccwpck_require__(7784);
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=internal.js.map


/***/ }),

/***/ 3632:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var object_exports = {};
__export(object_exports, {
  isObject: () => isObject
});
module.exports = __toCommonJS(object_exports);
function isObject(input) {
  return typeof input === "object" && input !== null && !Array.isArray(input) && !(input instanceof RegExp) && !(input instanceof Date);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=object.js.map


/***/ }),

/***/ 8640:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var random_exports = {};
__export(random_exports, {
  getRandomIntegerInclusive: () => getRandomIntegerInclusive
});
module.exports = __toCommonJS(random_exports);
function getRandomIntegerInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  const offset = Math.floor(Math.random() * (max - min + 1));
  return offset + min;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=random.js.map


/***/ }),

/***/ 7784:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var sanitizer_exports = {};
__export(sanitizer_exports, {
  Sanitizer: () => Sanitizer
});
module.exports = __toCommonJS(sanitizer_exports);
var import_object = __nccwpck_require__(3632);
const RedactedString = "REDACTED";
const defaultAllowedHeaderNames = [
  "x-ms-client-request-id",
  "x-ms-return-client-request-id",
  "x-ms-useragent",
  "x-ms-correlation-request-id",
  "x-ms-request-id",
  "client-request-id",
  "ms-cv",
  "return-client-request-id",
  "traceparent",
  "Access-Control-Allow-Credentials",
  "Access-Control-Allow-Headers",
  "Access-Control-Allow-Methods",
  "Access-Control-Allow-Origin",
  "Access-Control-Expose-Headers",
  "Access-Control-Max-Age",
  "Access-Control-Request-Headers",
  "Access-Control-Request-Method",
  "Origin",
  "Accept",
  "Accept-Encoding",
  "Cache-Control",
  "Connection",
  "Content-Length",
  "Content-Type",
  "Date",
  "ETag",
  "Expires",
  "If-Match",
  "If-Modified-Since",
  "If-None-Match",
  "If-Unmodified-Since",
  "Last-Modified",
  "Pragma",
  "Request-Id",
  "Retry-After",
  "Server",
  "Transfer-Encoding",
  "User-Agent",
  "WWW-Authenticate"
];
const defaultAllowedQueryParameters = ["api-version"];
class Sanitizer {
  allowedHeaderNames;
  allowedQueryParameters;
  constructor({
    additionalAllowedHeaderNames: allowedHeaderNames = [],
    additionalAllowedQueryParameters: allowedQueryParameters = []
  } = {}) {
    allowedHeaderNames = defaultAllowedHeaderNames.concat(allowedHeaderNames);
    allowedQueryParameters = defaultAllowedQueryParameters.concat(allowedQueryParameters);
    this.allowedHeaderNames = new Set(allowedHeaderNames.map((n) => n.toLowerCase()));
    this.allowedQueryParameters = new Set(allowedQueryParameters.map((p) => p.toLowerCase()));
  }
  /**
   * Sanitizes an object for logging.
   * @param obj - The object to sanitize
   * @returns - The sanitized object as a string
   */
  sanitize(obj) {
    const seen = /* @__PURE__ */ new Set();
    return JSON.stringify(
      obj,
      (key, value) => {
        if (value instanceof Error) {
          return {
            ...value,
            name: value.name,
            message: value.message
          };
        }
        if (key === "headers" && (0, import_object.isObject)(value)) {
          return this.sanitizeHeaders(value);
        } else if (key === "url" && typeof value === "string") {
          return this.sanitizeUrl(value);
        } else if (key === "query" && (0, import_object.isObject)(value)) {
          return this.sanitizeQuery(value);
        } else if (key === "body") {
          return void 0;
        } else if (key === "response") {
          return void 0;
        } else if (key === "operationSpec") {
          return void 0;
        } else if (Array.isArray(value) || (0, import_object.isObject)(value)) {
          if (seen.has(value)) {
            return "[Circular]";
          }
          seen.add(value);
        }
        return value;
      },
      2
    );
  }
  /**
   * Sanitizes a URL for logging.
   * @param value - The URL to sanitize
   * @returns - The sanitized URL as a string
   */
  sanitizeUrl(value) {
    if (typeof value !== "string" || value === null || value === "") {
      return value;
    }
    const url = new URL(value);
    if (!url.search) {
      return value;
    }
    for (const [key] of url.searchParams) {
      if (!this.allowedQueryParameters.has(key.toLowerCase())) {
        url.searchParams.set(key, RedactedString);
      }
    }
    return url.toString();
  }
  sanitizeHeaders(obj) {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      if (this.allowedHeaderNames.has(key.toLowerCase())) {
        sanitized[key] = obj[key];
      } else {
        sanitized[key] = RedactedString;
      }
    }
    return sanitized;
  }
  sanitizeQuery(value) {
    if (typeof value !== "object" || value === null) {
      return value;
    }
    const sanitized = {};
    for (const k of Object.keys(value)) {
      if (this.allowedQueryParameters.has(k.toLowerCase())) {
        sanitized[k] = value[k];
      } else {
        sanitized[k] = RedactedString;
      }
    }
    return sanitized;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=sanitizer.js.map


/***/ }),

/***/ 2016:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var sha256_exports = {};
__export(sha256_exports, {
  computeSha256Hash: () => computeSha256Hash,
  computeSha256Hmac: () => computeSha256Hmac
});
module.exports = __toCommonJS(sha256_exports);
var import_node_crypto = __nccwpck_require__(7598);
async function computeSha256Hmac(key, stringToSign, encoding) {
  const decodedKey = Buffer.from(key, "base64");
  return (0, import_node_crypto.createHmac)("sha256", decodedKey).update(stringToSign).digest(encoding);
}
async function computeSha256Hash(content, encoding) {
  return (0, import_node_crypto.createHash)("sha256").update(content).digest(encoding);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=sha256.js.map


/***/ }),

/***/ 2250:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var typeGuards_node_exports = {};
__export(typeGuards_node_exports, {
  isNodeReadableStream: () => isNodeReadableStream,
  isWebReadableStream: () => isWebReadableStream
});
module.exports = __toCommonJS(typeGuards_node_exports);
var import_stream = __nccwpck_require__(2203);
function isNodeReadableStream(x) {
  return x instanceof import_stream.Readable;
}
function isWebReadableStream(x) {
  return x instanceof ReadableStream;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=typeGuards-node.js.map


/***/ }),

/***/ 8505:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var typeGuards_exports = {};
__export(typeGuards_exports, {
  isBinaryBody: () => isBinaryBody,
  isBlob: () => isBlob,
  isNodeReadableStream: () => import_typeGuards.isNodeReadableStream,
  isReadableStream: () => isReadableStream,
  isWebReadableStream: () => import_typeGuards.isWebReadableStream
});
module.exports = __toCommonJS(typeGuards_exports);
var import_typeGuards = __nccwpck_require__(2250);
function isBinaryBody(body) {
  return body !== void 0 && (body instanceof Uint8Array || isReadableStream(body) || typeof body === "function" || body instanceof Blob);
}
function isReadableStream(x) {
  return (0, import_typeGuards.isNodeReadableStream)(x) || (0, import_typeGuards.isWebReadableStream)(x);
}
function isBlob(x) {
  return x instanceof Blob;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=typeGuards.js.map


/***/ }),

/***/ 2731:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var userAgent_exports = {};
__export(userAgent_exports, {
  getUserAgentHeaderName: () => getUserAgentHeaderName,
  getUserAgentValue: () => getUserAgentValue,
  setPlatformSpecificData: () => import_userAgent.setPlatformSpecificData
});
module.exports = __toCommonJS(userAgent_exports);
var import_userAgent = __nccwpck_require__(3196);
var import_constants = __nccwpck_require__(1255);
function getUserAgentString(telemetryInfo) {
  const parts = [];
  for (const [key, value] of telemetryInfo) {
    const token = value ? `${key}/${value}` : key;
    parts.push(token);
  }
  return parts.join(" ");
}
function getUserAgentHeaderName() {
  return (0, import_userAgent.getHeaderName)();
}
async function getUserAgentValue(prefix) {
  const runtimeInfo = /* @__PURE__ */ new Map();
  runtimeInfo.set("ts-http-runtime", import_constants.SDK_VERSION);
  await (0, import_userAgent.setPlatformSpecificData)(runtimeInfo);
  const defaultAgent = getUserAgentString(runtimeInfo);
  const userAgentValue = prefix ? `${prefix} ${defaultAgent}` : defaultAgent;
  return userAgentValue;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=userAgent.js.map


/***/ }),

/***/ 3196:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var userAgentPlatform_exports = {};
__export(userAgentPlatform_exports, {
  getHeaderName: () => getHeaderName,
  setPlatformSpecificData: () => setPlatformSpecificData
});
module.exports = __toCommonJS(userAgentPlatform_exports);
var import_node_os = __toESM(__nccwpck_require__(8161));
var import_node_process = __toESM(__nccwpck_require__(1708));
function getHeaderName() {
  return "User-Agent";
}
async function setPlatformSpecificData(map) {
  if (import_node_process.default && import_node_process.default.versions) {
    const osInfo = `${import_node_os.default.type()} ${import_node_os.default.release()}; ${import_node_os.default.arch()}`;
    if (import_node_process.default.versions.bun) {
      map.set("Bun", `${import_node_process.default.versions.bun} (${osInfo})`);
    } else if (import_node_process.default.versions.deno) {
      map.set("Deno", `${import_node_process.default.versions.deno} (${osInfo})`);
    } else if (import_node_process.default.versions.node) {
      map.set("Node", `${import_node_process.default.versions.node} (${osInfo})`);
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=userAgentPlatform.js.map


/***/ }),

/***/ 5023:
/***/ ((module) => {

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var uuidUtils_exports = {};
__export(uuidUtils_exports, {
  randomUUID: () => randomUUID
});
module.exports = __toCommonJS(uuidUtils_exports);
function randomUUID() {
  return crypto.randomUUID();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);
//# sourceMappingURL=uuidUtils.js.map


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(9407);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;