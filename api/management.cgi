#!/var/www/html/nim/private/node-wrapper.sh

const multipart = require("parse-multipart");
const querystring = require("querystring");
const Bottleneck = require("bottleneck");

const consts = require(process.env.DOCUMENT_ROOT + "/private/consts.js");
const utils = require(process.env.DOCUMENT_ROOT + "/private/utils.js");
const queue = require(process.env.DOCUMENT_ROOT + "/private/m64/queue.js");

const limiter = new Bottleneck(consts.bottleneckParams);

const ctx = require(process.env.DOCUMENT_ROOT + "/assets/js/site.cgi");

let sendCGI = (code, msg) => {
	console.log("Status: " + code);
	console.log("Content-Type: application/json\n");
	console.log(JSON.stringify(msg));
}

const type = ctx.content.type;

if (!type || !type.includes("boundary")) {
	sendCGI(400, { errorMessage: "No form data submitted" });
} else if (ctx.content.length > ctx.maxReadLength) {
	sendCGI(413, { errorMessage: "Request too large" });
} else {
	ctx.initStdin((res) => {
		if (!res) {
			sendCGI(413, { errorMessage: "Request too large" });
		} else {
			const parts = multipart.Parse(ctx.stdin, multipart.getBoundary(type));
			let params = {};

			for (let part of parts) {
				params[part.filename] = part.data.toString();
			}

			limiter.wrap(apiCall)(params);
		}
	});
}

function apiCall (params) {
	if (params.action == "shift") {
		if (params.auth && utils.hash(params.auth) == consts.tasbotKey) {
			if (queue.getSize() == 0) {
				sendCGI(400, { errorMessage: "Queue is empty" });
			} else {
				sendCGI(200, { queueEmpty: queue.shift() });
			}
		} else {
			sendCGI(401, { errorMessage: "Unauthorized to perform action" });
		}

		return;
	}

	if (!params.id) {
		sendCGI(403, { errorMessage: "No ID" });
		return;
	}

	const res = queue.resolveID(params.id);

	if (!queue.verifyResolvedID(res)) {
		sendCGI(403, { errorMessage: "Invalid ID" });
		return;
	}

	const tas = queue.readTAS(res);

	let filename = tas.filename;
	let queuepos = queue.getPos(res);

	switch (params.action) {
		case "info":
			sendCGI(200, {
				filename: filename,
				queuePos: queuepos
			});

			break;
		case "delete":
			if (queuepos == 1) {
				sendCGI(406, { errorMessage: "Cannot delete TAS that is first in queue" });
			} else {
				queue.deleteTAS(res);

				sendCGI(200, {
					deleted: true,
					deletedFilename: filename.length > 16 ? filename.slice(0, 16) + "..." : filename
				});
			}

			break;
		default:
			sendCGI(400, { errorMessage: "Invalid action" });
	}
}
