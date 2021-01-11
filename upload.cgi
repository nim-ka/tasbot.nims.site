#!/var/www/html/nim/private/node-wrapper.sh

const multipart = require("parse-multipart");
const querystring = require("querystring");

const utils = require(process.env.DOCUMENT_ROOT + "/private/utils.js");
const processM64 = require(process.env.DOCUMENT_ROOT + "/private/m64/process.js");

const ctx = require(process.env.DOCUMENT_ROOT + "/assets/js/site.cgi");

let redirect = utils.once((uri) => {
	console.log("Status: 301");
	console.log("Location: " + uri);
	console.log("Content-Type: text/html\n");
	console.log("This page has <a href='" + uri + "'>moved.</a>");
	process.stdin.destroy();
});

console.error("Attempting to upload: " + ctx.toString("content"));

const type = ctx.content.type;

if (!type || !type.includes("boundary")) {
	console.error("No form submitted");
	redirect("/");
} else if (ctx.content.length > ctx.maxReadLength) {
	redirect("/complete?res=toolarge");
} else {
	// If too large files get through here intelligent stdin design acts as failsafe

	ctx.initStdin((res) => {
		if (!res) {
			redirect("/complete?res=toolarge");
		} else {
			const parts = multipart.Parse(ctx.stdin, multipart.getBoundary(type));

			redirect("/complete?" + querystring.stringify(processM64(parts[0].filename, parts[0].data)));
		}
	});
}
