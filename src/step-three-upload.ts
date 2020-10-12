/* eslint-disable import/first */
import { connect, Connection } from "amqplib"
import { BlobServiceClient } from "@azure/storage-blob"
import { resolve } from "path"
import { AbortController } from "@azure/abort-controller"
import path = require("path")
import { IExtractMessage } from "./models/extract-message"

let isWorking = false
const ONE_MEGABYTE = 1024 * 1024
const FOUR_MEGABYTES = 4 * ONE_MEGABYTE
const ONE_MINUTE = 60 * 1000

const stepTwo = "step_two"
const AZURE_STORAGE_CONNECTION_STRING =
  "DefaultEndpointsProtocol=https;AccountName=producercloudpim;AccountKey=2YtRFa5blhZuV/n0UlnCO/649LezHKUt/H3JQvWJ6c/9Je0ggTeEMwAtjS5fkPVfcNGdVcQgyAD7THZhu7eQ8g==;EndpointSuffix=core.windows.net"
const AZURE_CONTAINER_NAME = "test2"
async function upload(data: IExtractMessage) {
  try {
    const aborter = AbortController.timeout(30 * ONE_MINUTE)

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    )

    const containerClient = blobServiceClient.getContainerClient(
      `${AZURE_CONTAINER_NAME}/${data.packId.toString()}`
    )

    await uploadLocalFile(aborter, containerClient, data.fileName)

    resolve()
    return true
  } catch (error) {
    console.log(`upload shit happend: ${error}`)
    return false
  }
}

async function uploadLocalFile(aborter, containerClient, filePath) {
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

connect("amqp://rabbitmq")
  .then((conn) => conn.createChannel())
  .then((ch) => {
    ch.prefetch(1)
    ch.assertQueue(stepTwo).then(() =>
      ch.consume(stepTwo, async (msg) => {
        if (msg !== null && !isWorking) {
          ch.ack(msg)
          console.log(`started ${msg.content.toString()}`)
          isWorking = true

          const fileMessage = JSON.parse(msg.content.toString()) as IExtractMessage

          if (await upload(fileMessage)) {
            isWorking = false
          }

          console.log("ended")
        }
      })
    )
  })
  .catch(console.warn)
