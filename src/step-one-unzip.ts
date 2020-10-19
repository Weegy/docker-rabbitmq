/* eslint-disable consistent-return */
/* eslint-disable no-console */
import * as extract from "extract-zip"
import * as glob from "glob"
import { IExtractMessage } from "./models/extract-messages"

// eslint-disable-next-line @typescript-eslint/no-var-requires
const amqp = require("amqplib/callback_api")

const stepOne = "step_one"
const stepTwo = "step_two"
const uploadQueue = "step_three"

// {
//   "fileName": "Massive EDM Drops Vol 3 - ACID WAV.zip",
//   "packId": 12
// }

const bail = (err): void => {
	console.error(`STEP ONE: ${err}`)
	throw err
}

const producer = (conn): void => {
	conn.createChannel((err, ch) => {
		if (err != null) bail(err)
		ch.assertQueue(stepOne)
		ch.prefetch(1)
		ch.consume(stepOne, async (msg) => {
			if (msg !== null) {
				const fileMessage = JSON.parse(
					msg.content.toString()
				) as IExtractMessage
				console.log(`STEP_ONE:  ${fileMessage}`)
				const extractDir = `/app/extract/${fileMessage.packId}`
				try {
					await extract(`/app/zip/${fileMessage.fileName}`, {
						dir: extractDir,
					})
					glob(`${extractDir}/**/*.wav`, (_err, matches) => {
						matches.forEach(async (filename) => {
							await ch.assertQueue(stepTwo)
							await ch.sendToQueue(
								stepTwo,
								Buffer.from(
									`{"fileName": "${filename}","packId": ${fileMessage.packId}}`
								)
							)
						})
					})
					glob(`${extractDir}/**/*.mid`, (_err, matches) => {
						matches.forEach(async (filename) => {
							await ch.assertQueue(uploadQueue)
							await ch.sendToQueue(
								uploadQueue,
								Buffer.from(
									`{"fileName": "${filename}","packId": ${fileMessage.packId}}`
								)
							)
						})
					})
				} catch (error) {
					bail(error)
				}
				console.log("ended step 1")
				ch.ack(msg)
			}
		})
	})
}
const init = (): void => {
	console.log("connectToRabbit")
	amqp.connect("amqp://rabbitmq", (errorConnect, connection) => {
		if (errorConnect) {			
			bail("error connect")
			return setTimeout(init, 1000)
		}
		console.log("started step 1")
		producer(connection)
	})
}

init()
