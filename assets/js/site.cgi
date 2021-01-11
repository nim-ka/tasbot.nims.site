#!/var/www/html/nim/private/node-wrapper.sh

const consts = require(process.env.DOCUMENT_ROOT + "/private/consts.js");
const utils = require(process.env.DOCUMENT_ROOT + "/private/utils.js");

let isCGI = !module.parent;

let cgiPrint = (() => {
	return isCGI ? console.log : () => {};
})();

cgiPrint("Status: 200");
cgiPrint("Content-Type: application/javascript\n");

const fs = require("fs");

const CGIContext = require(process.env.DOCUMENT_ROOT + "/private/cgictx/cgictx.js");
const ctx = new CGIContext(process.env);

if (consts.debug) {
	utils.createSafeFileOp(fs.appendFileSync)(process.env.DOCUMENT_ROOT + "/private/log.txt", new Date().toISOString() + " " + ctx.toString("httpSub,remote,request,content") + "\n");
}

cgiPrint(fs.readFileSync(process.env.DOCUMENT_ROOT + "/assets/js/site.js", "utf8"));
cgiPrint("const consts = " + JSON.stringify(consts));

module.exports = ctx;
