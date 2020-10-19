import * as path from "path"
import * as util from "util"
import { exec } from "child_process"
import * as fs from "fs"

const Lame = require("node-lame").Lame

const BITRATE = 192

const execPromise = util.promisify(exec)

const encodeWavToMp3 = async (fileName: string): Promise<string> => {
	const fileInfo = path.parse(fileName)
	if (!(fileInfo?.ext?.toString() === ".wav")) {
		throw new Error("Wrong file format!")
	}
	const outputFileName = `${fileInfo.dir}/${fileInfo.name}.mp3`
	const encoder = new Lame({
		output: outputFileName,
		bitrate: BITRATE,
	}).setFile(`${fileName}`)


	try {
		await encoder.encode()
		return outputFileName
	} catch (error) {
		throw new Error("shit happend")
	}
}

const extractWaveformDataFromMp3 = async (fileName: string): Promise<string> => {
	const fileInfo = path.parse(fileName)
	if (!fs.existsSync(fileName)) {
		console.log("file dose not exists")
	}
	if (!(fileInfo?.ext?.toString() === ".mp3")) {
		throw new Error("Wrong file format!")
	}
	const outputFileName = `${fileInfo.dir}/${fileInfo.name}.json`
	await execPromise(`audiowaveform -i "${fileName}" -o "${outputFileName}"`)
	return outputFileName
}

export { encodeWavToMp3, extractWaveformDataFromMp3 }
