/* eslint-disable consistent-return */
/* eslint-disable import/first */

import { BlobServiceClient } from "@azure/storage-blob"
import { resolve } from "path"
import { AbortController } from "@azure/abort-controller"
import path = require("path")
import { IExtractMessage } from "./models/extract-messages"

const amqp = require("amqplib/callback_api") // ggf stern from

let isWorking = false
const ONE_MINUTE = 60 * 1000

const stepThree = "step_three"
const stepFour = "step_four"

const AZURE_STORAGE_CONNECTION_STRING =
	"DefaultEndpointsProtocol=https;AccountName=producercloudpim;AccountKey=2YtRFa5blhZuV/n0UlnCO/649LezHKUt/H3JQvWJ6c/9Je0ggTeEMwAtjS5fkPVfcNGdVcQgyAD7THZhu7eQ8g==;EndpointSuffix=core.windows.net"
const AZURE_CONTAINER_NAME = "test3"

async function upload(data: IExtractMessage): Promise<boolean> {
	try {
		const aborter = AbortController.timeout(30 * ONE_MINUTE)

		const blobServiceClient = BlobServiceClient.fromConnectionString(
			AZURE_STORAGE_CONNECTION_STRING
		)

		const containerClient = blobServiceClient.getContainerClient(
			`${AZURE_CONTAINER_NAME}/${data.packId?.toString()}`
		)

		await uploadLocalFile(aborter, containerClient, data.fileName)

		resolve()
		return true
	} catch (error) {
		console.log(`upload shit happend: ${error}`)
		return false
	}
}

async function uploadLocalFile(
	aborter,
	containerClient,
	filePath
): Promise<boolean> {
	try {
		const fullPath = path.resolve(filePath)
		const fileName = path.basename(fullPath)
		const blobClient = containerClient.getBlobClient(fileName)
		const blockBlobClient = blobClient.getBlockBlobClient()
		await blockBlobClient.uploadFile(filePath, aborter)
		return true
	} catch (error) {
		console.log(`uploadLocalFile shit happend: ${error}`)
		return false
	}
}

const bail = (err): void => {
	console.error(err)
	throw err
}

const consumer = (conn): void => {
	const ok = conn.createChannel((err, ch) => {
		if (err != null) bail(err)
		ch.assertQueue(stepThree)
		ch.prefetch(1)
		ch.consume(stepThree, async (msg) => {
			if (msg !== null && !isWorking) {
				isWorking = true
				const fileMessage = JSON.parse(
					msg.content.toString()
				) as IExtractMessage
				console.log(`${fileMessage.fileName}`)
				if (await upload(fileMessage)) {
					isWorking = false

						
					ch.ack(msg)
					const result: IExtractMessage = {
						fileName: fileMessage.fileName											
					}
					await ch.assertQueue(stepFour)
					await ch.sendToQueue(
						stepFour,
						Buffer.from(JSON.stringify(result))
					)
					
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
