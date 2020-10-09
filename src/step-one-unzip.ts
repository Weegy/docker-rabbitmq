/* eslint-disable promise/no-nesting */
import { connect } from "amqplib"
import * as unzipper from "unzipper"
import fs = require("fs")

const q = "step_one"
const qe = "step_two"

export interface IFile {
  id: string
  name: string
  path: string
}

connect("amqp://rabbitmq")
	.then(function (conn) {
		return conn.createChannel()
	})
	.then(function (ch) {
		return ch.assertQueue(q).then(function (ok) {
			return ch.consume(q, function (msg) {
				if (msg !== null) {
					console.log(msg.content.toString())
					const data = JSON.parse(msg.content.toString())
					console.log(`${"id: "}${data.id}`)
					console.log(`${"path: "}${data.path}`)
					console.log(`${"name: "}${data.name}`)

					//   fs.createReadStream(`${data.path}/${data.name}`).pipe(
					//     unzipper.Extract({ path: `output/${data.name}` })
					//   )

					fs.createReadStream(`./zip/asdasd.zip`).pipe(
						unzipper.Extract({ path: `./extract/${data.name}` })
					)

					ch.ack(msg)
					return ch.assertQueue(qe).then(function (oka) {
						return ch.sendToQueue(
							qe,
							Buffer.from(`
						{
							"id": "${data.id}",
							"path": "${data.path}",
							"name": "${data.name}"
						}`)
						)
					})
				}
			})
		})
	})
	.catch(console.warn)
