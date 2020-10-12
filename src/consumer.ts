import { connect } from "amqplib"
import { encodeWavToMp3, extractWaveformDataFromMp3 } from "./encoder"
import { IUploadMessage, IExtractMessage } from "./models/extract-messages"

const q = "encode"
const uploadQueue = "upload"

const delay = (ms: number): Promise<number> => {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

connect("amqp://rabbitmq")
	.then((conn) => conn.createChannel())
	.then((ch) =>
		ch.assertQueue(q).then(() =>
			ch.consume(q, async (msg) => {
				if (msg !== null) {
					ch.ack(msg)
					const message: IExtractMessage = JSON.parse(
						msg.content.toString()
					)
					if (message?.fileName) {
						try {
							const { fileName: wavFilename, packId } = message
							const mp3Filename = await encodeWavToMp3(wavFilename)
							const waveformFilename = await extractWaveformDataFromMp3(
								mp3Filename
							)
							const result: IUploadMessage = {
								files: {
									mp3: mp3Filename,
									waveformJson: waveformFilename,
									wav: wavFilename,
								},
								packId: packId,
							}
							return ch.assertQueue(uploadQueue).then(() => {
								return ch.sendToQueue(
									uploadQueue,
									Buffer.from(JSON.stringify(result))
								)
							})
						} catch (error) {
							console.warn(error)
						}
					}
					return delay(500)
				}
			})
		)
	)
	.catch(console.warn)
