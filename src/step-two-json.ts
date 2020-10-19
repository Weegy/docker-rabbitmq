/* eslint-disable consistent-return */
import { extractWaveformDataFromMp3 } from "./encoder"
import { IExtractMessage } from "./models/extract-messages"

const amqp = require("amqplib/callback_api")

const q = "step_two_mp3"
const uploadQueue = "step_three"

const bail = (err): void => {
	console.error(err)
	throw err
}

const consumer = (conn): void => {
	const ok = conn.createChannel(function (err, ch) {
		if (err != null) bail(err)
		ch.assertQueue(q)
		ch.prefetch(1)
		ch.consume(q, async (msg) => {
			if (msg !== null) {
				const message: IExtractMessage = JSON.parse(msg.content.toString())
				if (message?.fileName) {
					try {
						const { fileName, packId } = message
						const waveformFilename = await extractWaveformDataFromMp3(
							fileName
						)
						const resultWave: IExtractMessage = {
							fileName: waveformFilename,
							packId,
						}
						const result: IExtractMessage = {
							fileName,
							packId,
						}
						await ch.assertQueue(uploadQueue)
						await ch.sendToQueue(
							uploadQueue,
							Buffer.from(JSON.stringify(resultWave))
						)
						await ch.sendToQueue(
							uploadQueue,
							Buffer.from(JSON.stringify(result))
						)
						console.log(`${resultWave.fileName}`)
						ch.ack(msg)
					} catch (error) {
						console.warn(error)
					}
				}
			}
		})
	})
}

const init = (): void => {
	console.log("connectToRabbit")
	amqp.connect("amqp://rabbitmq", (errorConnect, connection) => {
		if (errorConnect) {
			console.log("error connect")
			return setTimeout(init, 1000)
		}
		console.log("started step 2 json")
		consumer(connection)
	})
}

init()
