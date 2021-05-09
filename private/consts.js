module.exports = {
	debug: false,
	maxFileUploadSize: 0x400 + 12 * 60 * 60 * 30 * 4,
	maxTASLength: 4 * 60 * 60,
	tasbotKey: "66WUm0YhUEtbGmo3u9E8myKNfyTNh3-1ksPu_G7Kv6E",
	bottleneckParams: {
		maxConcurrent: 1,
		minTime: 1000
	}
};
