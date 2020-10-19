/* eslint-disable consistent-return */
import { encodeWavToMp3 } from "./encoder"
import { IExtractMessage } from "./models/extract-messages"

const amqp = require("amqplib/callback_api")

const q = "step_two"
const uploadQueue = "step_two_mp3"
const stepFour = "step_four"

const bail = (err):void => {
	console.error(err)
	throw err
}


const consumer = (conn):void => {
	const ok = conn.createChannel(function (err, ch) {
		if (err != null) bail(err)
		ch.assertQueue(q)
		ch.prefetch(1)
		ch.consume(q, async (msg) => {
			if (msg !== null) {
				const message: IExtractMessage = JSON.parse(msg.content.toString())
				if (message?.fileName) {
					try {
						const { fileName: wavFilename, packId } = message
						const mp3Filename = await encodeWavToMp3(wavFilename)
						
						const resultMp3: IExtractMessage = {
							fileName: mp3Filename,
							packId,
						}						
						await ch.assertQueue(uploadQueue)
						await ch.sendToQueue(
							uploadQueue,
							Buffer.from(JSON.stringify(resultMp3))
						)

						const result: IExtractMessage = {
							fileName: wavFilename,
							packId,
						}	
						console.log(`${resultMp3.fileName}`)						
						ch.ack(msg)
						await ch.assertQueue(stepFour)
						await ch.sendToQueue(
							stepFour,
							Buffer.from(JSON.stringify(result))
						)
					} catch (error) {
						console.warn(error)
					}
				}
			}
		})
	})
}

const init = ():void => {
	console.log("connectToRabbit")
	amqp.connect("amqp://rabbitmq", (errorConnect, connection) => {
		if (errorConnect) {
			console.log("error connect")
			return setTimeout(init, 1000)
		}
		console.log("started step 2 mp3")
		consumer(connection)
	})
}

init()
