/* eslint-disable consistent-return */
/* eslint-disable import/first */

import { IExtractMessage } from "./models/extract-messages"
const fs = require("fs")

const amqp = require("amqplib/callback_api") // ggf stern from

const stepFour = "step_four"

const bail = (err): void => {
	console.error(err)
	throw err
}

let isWorking = false

const consumer = (conn): void => {
	const ok = conn.createChannel((err, ch) => {
		if (err != null) bail(err)
		ch.assertQueue(stepFour)
		ch.prefetch(1)
		ch.consume(stepFour, async (msg) => {
			if (msg !== null && !isWorking) {
				isWorking = true
				const fileMessage = JSON.parse(
					msg.content.toString()
				) as IExtractMessage
				console.log(`${fileMessage.fileName}`)
				try {
					fs.unlinkSync(fileMessage.fileName)
					isWorking = false
					ch.ack(msg)
				} catch (error) {
					bail(error)
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
		console.log("started step 3")
		consumer(connection)
	})
}

init()

process.on("uncaughtException", (err) => console.log(err))
