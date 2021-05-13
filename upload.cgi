#!/var/www/html/nim/private/node-wrapper.sh

const Busboy = require("busboy");
const querystring = require("querystring");

const utils = require(process.env.DOCUMENT_ROOT + "/private/utils.js");
const processM64 = require(process.env.DOCUMENT_ROOT + "/private/m64/process.js");

const ctx = require(process.env.DOCUMENT_ROOT + "/assets/js/site.cgi");

const credentials = require(process.env.DOCUMENT_ROOT + "/private/credentials.json");

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
	redirect("/complete?res=error");
} else if (ctx.content.length > ctx.maxReadLength) {
	redirect("/complete?res=toolarge");
} else {
	// If too large files get through here intelligent stdin design acts as failsafe

	ctx.initStdin((res) => {
		if (!res) {
			redirect("/complete?res=toolarge");
			return;
		}

		const busboy = new Busboy({
			headers: {
				"content-type": ctx.content.type,
				"content-length": ctx.content.length
			}
		});

		let filename;
		let data;
		let password;

		busboy.on("file", (field, file, name) => {
			if (field == "m64") {
				filename = name;

				let chunks = [];

				file.on("data", (data) => {
					chunks.push(data);
				});

				file.on("end", () => {
					data = Buffer.concat(chunks);
				});
			}
		});

		busboy.on("field", (field, val) => {
			if (field == "password") {
				password = val;
			}
		});

		busboy.on("finish", () => {
			let auth = false;

			if (password) {
				for (let i = 0; i < credentials.length; i++) {
					if (utils.verifyHashSalted(password, credentials[i])) {
						auth = true;
					}
				}

				if (!auth) {
					redirect("/complete?res=unauth");
					return;
				}
			}

			redirect("/complete?" + querystring.stringify(processM64(filename, data)));
		});

		busboy.end(ctx.stdin);
	});
}
