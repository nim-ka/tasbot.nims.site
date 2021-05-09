const fs = require("fs");

const consts = require(process.env.DOCUMENT_ROOT + "/private/consts.js");
const utils = require(process.env.DOCUMENT_ROOT + "/private/utils.js");

class M64 {
	constructor (filename, data) {
		this.filename = filename;

		this.valid = true;

		if (data.length < 0x400) {
			return this.valid = false;
		}

		if (data.readInt32BE(0x000) != 0x4D36341A) {
			return this.valid = false;
		}

		this.version = data.readInt32LE(0x004);

		if (this.version < 3) {
			return this.valid = false;
		}

		this.vis = data.readInt32LE(0x00C);
		this.rerecords = data.readInt32LE(0x010);

		this.numControllers = data[0x015];

		if (this.numControllers != 1) {
			return this.valid = false;
		}

		this.frames = data.readInt32LE(0x018);
		this.approxLength = this.frames / 30;

		if (data.length < 0x400 + this.frames * 4) {
			return this.valid = false;
		}

		this.startType = data.readInt16LE(0x1C);

		if (this.startType != 2) {
			return this.valid = false;
		}

		this.author = data.toString("utf8", 0x222, 0x300).replace(/\0/g, "");
		this.description = data.toString("utf8", 0x300, 0x400).replace(/\0/g, "");

		this.inputs = [];

		for (let i = 0; i < this.frames; i++) {
			this.inputs.push(data.readInt32BE(0x400 + i * 4));
		}

		return this.valid;
	}
}

const queue = require(process.env.DOCUMENT_ROOT + "/private/m64/queue.js");

let counter = 0;

module.exports = function processM64 (filename, data) {
	if (!data) {
		return { res: "nofile" };
	}

	let m64 = new M64(filename, data);

	if (!m64.valid) {
		return { res: "invalid" };
	}

	if (m64.approxLength > consts.maxTASLength) {
		return { res: "toolarge" };
	}

	let json = JSON.stringify(m64);

	let id = utils.getUserFriendlyUniqueId();

	let tempName = queue.resolveID(id);

	utils.createSafeFileOp(fs.writeFileSync)(process.env.DOCUMENT_ROOT + tempName, json);

	let queuePos = queue.queueM64(tempName);

	return { res: "success", pos: queuePos, id: id };
};
