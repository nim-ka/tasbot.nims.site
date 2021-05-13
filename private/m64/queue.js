const fs = require("fs");

const utils = require(process.env.DOCUMENT_ROOT + "/private/utils.js");

const queue = {};

module.exports = Object.assign(queue, {
	queueFile: process.env.DOCUMENT_ROOT + "/api/queue.json",
	queueM64: (res) => {
		let queuePos = 0;

		utils.createSafeFileOp(() => {
			let queueData = utils.readJSONUnsafe(queue.queueFile);
			queuePos = queueData.push(res);
			utils.writeJSONUnsafe(queue.queueFile, queueData);
		})(queue.queueFile);

		return queuePos;
	},
	resolveID: (id) => "/tases/" + utils.hash(id) + ".m64.json",
	realPath: (res) => process.env.DOCUMENT_ROOT + res,
	verifyResolvedID: (res) => fs.existsSync(queue.realPath(res)),
	getPos: (res) => utils.readJSONSafe(queue.queueFile).indexOf(res) + 1 || -1,
	readTAS: (res) => utils.readJSONSafe(queue.realPath(res)),
	deleteTAS: (res) => {
		utils.createSafeFileOp(() => {
			let queueData = utils.readJSONUnsafe(queue.queueFile);
			let idx = queueData.indexOf(res);

			if (idx != -1) {
				queueData.splice(queueData.indexOf(res), 1);
				utils.writeJSONUnsafe(queue.queueFile, queueData);
			}
		})(queue.queueFile);

		utils.createSafeFileOp(fs.unlinkSync)(queue.realPath(res));
	},
	getSize: () => {
		let result;

		utils.createSafeFileOp(() => {
			result = utils.readJSONUnsafe(queue.queueFile).length;
		})(queue.queueFile);

		return result;
	},
	shift: () => {
		let queueEmpty;
		let result;

		utils.createSafeFileOp(() => {
			let queueData = utils.readJSONUnsafe(queue.queueFile);
			result = queueData[0];

			queueData.splice(0, 1);
			queueEmpty = queueData.length == 0;

			utils.writeJSONUnsafe(queue.queueFile, queueData);
		})(queue.queueFile);

		if (result) {
			utils.createSafeFileOp(fs.unlinkSync)(queue.realPath(result));
		}

		return queueEmpty;
	},
	promote: (res) => {
		utils.createSafeFileOp(() => {
			let queueData = utils.readJSONUnsafe(queue.queueFile);
			let idx = queueData.indexOf(res);

			if (idx == 0) {
				return;
			}

			queueData.splice(idx, 1);
			queueData.splice(idx - 1, 0, res);

			utils.writeJSONUnsafe(queue.queueFile, queueData);
		})(queue.queueFile);
	}
});
