const utils = {
	hideDiv: (id) => document.getElementById(id).style.display = "none",
	unhideDiv: (id) => document.getElementById(id).style.display = "block",
	setText: (id, text) => document.getElementById(id).innerText = text,
};

const ajax = {
	_get: (type, url, callback) => {
		let xhr = new XMLHttpRequest();

		xhr.open("GET", url);
		xhr.onload = (...args) => {
			callback(xhr, ...args);
		};

		xhr.responseType = type;

		xhr.send();
	},
	_post: (type, url, data, callback) => {
		let formData = new FormData();

		for (let key in data) {
			//formData.append(key, new Blob([data[key].toString()], { type: "text/plain" }), key);
			formData.append(key, data[key]);
		}

		let xhr = new XMLHttpRequest();

		xhr.open("POST", url);
		xhr.onload = (...args) => {
			callback(xhr, ...args);
		};

		xhr.responseType = type;

		xhr.send(formData);
	},
	get: (...args) => ajax._get("", ...args),
	getJSON: (...args) => ajax._get("json", ...args),
	post: (...args) => ajax._post("", ...args),
	postJSON: (...args) => ajax._post("json", ...args),
};
