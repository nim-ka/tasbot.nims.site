const fs = require("fs");

const utils = require(process.env.DOCUMENT_ROOT + "/private/utils.js");

module.exports = queue = (() => {
	const queueFile = process.env.DOCUMENT_ROOT + "/api/queue.json";

	return {
		queueM64: (res) => {
			let queuePos = 0;

			utils.createSafeFileOp(() => {
				let queue = utils.readJSONUnsafe(queueFile);
				queuePos = queue.push(res);
				utils.writeJSONUnsafe(queueFile, queue);
			})(queueFile);

			return queuePos;
		},
		resolveID: (id) => "/tases/" + utils.hash(id) + ".m64.json",
		realPath: (res) => process.env.DOCUMENT_ROOT + res,
		verifyResolvedID: (res) => fs.existsSync(queue.realPath(res)),
		getPos: (res) => utils.readJSONSafe(queueFile).indexOf(res) + 1 || -1,
		readTAS: (res) => utils.readJSONSafe(queue.realPath(res)),
		deleteTAS: (res) => {
			utils.createSafeFileOp(() => {
				let queue = utils.readJSONUnsafe(queueFile);
				let idx = queue.indexOf(res);

				if (idx >= 0 && idx < queue.length) {
					queue.splice(queue.indexOf(res), 1);
					utils.writeJSONUnsafe(queueFile, queue);
				}
			})(queueFile);

			utils.createSafeFileOp(fs.unlinkSync)(queue.realPath(res));
		},
		shift: () => {
			let queueEmpty;
			let res;

			utils.createSafeFileOp(() => {
				let queue = utils.readJSONUnsafe(queueFile);
				res = queue[0];

				queue.splice(0, 1);
				queueEmpty = queue.length == 0;

				utils.writeJSONUnsafe(queueFile, queue);
			})(queueFile);

			if (res) {
				utils.createSafeFileOp(fs.unlinkSync)(queue.realPath(res));
			}

			return queueEmpty;
		},
	};
})();
