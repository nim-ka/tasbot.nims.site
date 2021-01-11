const consts = require(process.env.DOCUMENT_ROOT + "/private/consts.js");
const utils = require(process.env.DOCUMENT_ROOT + "/private/utils.js");

module.exports = (() => {
	const keyset = [
		["REDIRECT_STATUS", Number, "http", "redirectStatus"],
		["HTTP_HOST", String, "http", "host"],
		["HTTP_CONNECTION", String, "http", "connection"],
		["CONTENT_LENGTH", Number, "content", "length"],
		["HTTP_CACHE_CONTROL", String, "http", "cacheCtrl"],
		["HTTP_UPGRADE_INSECURE_REQUESTS", Number, "http", "upgradeInsecureReqs"],
		["HTTP_ORIGIN", String, "http", "origin"],
		["CONTENT_TYPE", String, "content", "type"],
		["HTTP_USER_AGENT", String, "http", "userAgent"],
		["HTTP_USER_AGENT", String, "httpSub", "userAgent"],
		["HTTP_ACCEPT", String, "http", "accept"],
		["HTTP_REFERER", String, "http", "referer"],
		["HTTP_REFERER", String, "httpSub", "referer"],
		["HTTP_ACCEPT_ENCODING", String, "http", "acceptEncoding"],
		["HTTP_ACCEPT_LANGUAGE", String, "http", "acceptLang"],
		["SERVER_SIGNATURE", String, "server", "signature"],
		["SERVER_SOFTWARE", String, "server", "software"],
		["SERVER_NAME", String, "server", "name"],
		["SERVER_ADDR", String, "server", "addr"],
		["SERVER_PORT", Number, "server", "port"],
		["REMOTE_ADDR", String, "remote", "addr"],
		["DOCUMENT_ROOT", String, "apache", "documentRoot"],
		["REQUEST_SCHEME", String, "apache", "requestScheme"],
		["CONTEXT_PREFIX", String, "apache", "ctxPrefix"],
		["CONTEXT_DOCUMENT_ROOT", String, "apache", "ctxDocumentRoot"],
		["SERVER_ADMIN", String, "server", "admin"],
		["SCRIPT_FILENAME", String, "apache", "scriptFilename"],
		["REMOTE_PORT", Number, "remote", "port"],
		["REDIRECT_URL", String, "http", "redirectUrl"],
		["GATEWAY_INTERFACE", String, "apache", "gatewayInterface"],
		["SERVER_PROTOCOL", String, "server", "protocol"],
		["REQUEST_METHOD", String, "request", "method"],
		["QUERY_STRING", String, "request", "queryString"],
		["REQUEST_URI", String, "request", "uri"],
		["SCRIPT_NAME", String, "apache", "scriptName"]
	];

	let contextCreated = false;

	let initFromEnv = (obj, env) => {
		for (let key of keyset) {
			let data = key[1](env[key[0]]);

			obj[key[0]] = data;

			let path = key.slice(2);
			let cur = obj;

			for (let i = 0; i < path.length - 1; i++) {
				if (!cur[path[i]]) cur[path[i]] = {};
				cur = cur[path[i]];
			}

			cur[path[path.length - 1]] = data;
		}
	}

	return class CGIContext {
		constructor (env) {
			if (contextCreated || !env) return;

			initFromEnv(this, env);

			contextCreated = true;
		}

		initStdin (callback) {
			let totalLength = 0;
			let chunks = [];

			let onceCallback = utils.once(callback);

			process.stdin.on("data", (chunk) => {
				totalLength += chunk.length;
				if (totalLength > consts.maxFileUploadSize) {
					process.stdin.destroy();
					onceCallback(false);
				}

				chunks.push(chunk);
			});

			process.stdin.on("end", () => {
				this.stdin = Buffer.concat(chunks);
				onceCallback(true);
			});
		}

		toString (categories) {
			return categories ? JSON.stringify(Object.fromEntries(categories.split(",").map((cat) => [cat, this[cat]]))) : JSON.stringify(this);
		}
	};
})();
