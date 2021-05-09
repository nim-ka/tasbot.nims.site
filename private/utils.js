const crypto = require("crypto");
const fs = require("fs");
const lockfile = require("lockfile");

const utils = {};

module.exports = Object.assign(utils, {
	once: (func) => (() => {
		let ran = false;
		return (...args) => ran ? undefined : (ran = true, func(...args));
	})(),
	hash: (str) => crypto.createHash("sha256").update(str).digest("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, ""),
	getUniqueId: (() => {
		let counter = 0;
		return (str) => utils.hash(new Date().toString() + (counter++).toString() + (str || ""));
	})(),
	createSafeFileOp: (operation) => (path, ...args) => {
		let lockPath = process.env.DOCUMENT_ROOT + "/private/locks/" + utils.hash(path) + ".lock";
		let res;

		try {
			lockfile.lockSync(lockPath, { retries: 20 });
			res = operation(path, ...args);
			lockfile.unlockSync(lockPath);
		} catch (err) {
			console.error(`Failed safe file operation ${operation.name} with error:`);
			throw err;
		}

		return res;
	},
	readJSONUnsafe: (path) => JSON.parse(fs.readFileSync(path).toString()),
	readJSONSafe: (path) => utils.createSafeFileOp(utils.readJSONUnsafe)(path),
	writeJSONUnsafe: (path, data) => fs.writeFileSync(path, JSON.stringify(data)),
	writeJSONSafe: (path, data) => utils.createSafeFileOp(utils.writeJSONUnsafe)(path, data),
});
