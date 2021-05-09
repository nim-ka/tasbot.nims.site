const fs = require("fs");

const utils = require(process.env.DOCUMENT_ROOT + "/private/utils.js");

const queue = require(process.env.DOCUMENT_ROOT + "/private/m64/queue.js");

const promotions = {};

module.exports = Object.assign(promotions, {
	promotionsFile: process.env.DOCUMENT_ROOT + "/api/promotions.json",
	resolvePromotionKey: (key, res) => utils.hash(key + res),
	getPromotionKey: (res) => {
		let key = utils.getUserFriendlyUniqueId();

		utils.createSafeFileOp(() => {
			let promotionsData = utils.readJSONUnsafe(promotions.promotionsFile);
			promotionsData.push(promotions.resolvePromotionKey(key, res));
			utils.writeJSONUnsafe(promotions.promotionsFile, promotionsData);
		})(promotions.promotionsFile);

		return key;
	},
	promote: (key, res) => {
		let result = false;

		utils.createSafeFileOp(() => {
			let promotionsData = utils.readJSONUnsafe(promotions.promotionsFile);
			let idx = promotionsData.indexOf(promotions.resolvePromotionKey(key, res));

			if (idx != -1) {
				promotionsData.splice(idx, 1);
				queue.promote(res);
				result = true;
				utils.writeJSONUnsafe(promotions.promotionsFile, promotionsData);
			}
		})(promotions.promotionsFile);

		return result;
	},
});
