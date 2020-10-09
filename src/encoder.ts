import * as path from "path"
import * as util from "util"
import { Lame } from "node-lame"
import { exec } from "child_process"

const BITRATE = 192

const execPromise = util.promisify(exec)

const encodeWavToMp3 = async (fileName: string): Promise<string> => {
	const fileInfo = path.parse(fileName)
	if (!(fileInfo?.ext?.toString() === '.wav')) {
		throw new Error('Wrong file format!')
	}
	const outputFileName = `${fileInfo.dir}/${fileInfo.name}.mp3`
	const encoder = new Lame({
		output: outputFileName,
		bitrate: BITRATE,
	}).setFile(`${fileName}`)
	if (!encoder.encode()) {
		throw new Error('Error during file converting.')
	}
	return outputFileName
}

const extractWaveformDataFromMp3 = async (fileName: string): Promise<string> => {
	const fileInfo = path.parse(fileName)
	if (!(fileInfo?.ext?.toString() === '.mp3')) {
		throw new Error('Wrong file format!')
	}
	const outputFileName = `${fileInfo.dir}/${fileInfo.name}.json`
	await execPromise(`audiowaveform -i "${fileName}" -o "${outputFileName}"`)
	return outputFileName
}

export { encodeWavToMp3, extractWaveformDataFromMp3 }
