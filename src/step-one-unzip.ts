import { connect } from "amqplib"
import { dir } from "console"
import * as extract from "extract-zip"
import * as fs from "fs"
import * as glob from "glob"
import { resolve } from "path"
import { IExtractMessage } from "./models/extract-message"

const stepOne = "step_one"
const stepTwo = "step_two"

// {
//   "fileName": "Dirty EDM Basslines Vol 1 - ACID WAV.zip",
//   "packId": 12
// }


connect("amqp://rabbitmq")
  .then(function (conn) {
    return conn.createChannel()
  })
  .then(function (ch) {
    return ch.assertQueue(stepOne).then(function (ok) {
      return ch.consume(stepOne, async function (msg) {
        if (msg !== null) {
          const fileMessage = JSON.parse(msg.content.toString()) as IExtractMessage
          console.log(`STEP_ONE:  ${fileMessage}`)
          const extractDir = `/app/extract/${fileMessage.packId}`
          ch.ack(msg)
          await extract(`/app/zip/${fileMessage.fileName}`, {
            dir: extractDir,
          })
            .then(async () => {
              glob(`${extractDir}/**/*.wav`, (_err: any, matches: any[]) => {
                matches.forEach((filename: any) => {
                  return ch.assertQueue(stepTwo).then(function (oka) {
                    return ch.sendToQueue(
                      stepTwo,
                      Buffer.from(`{
                        "fileName": "${filename}",
                        "packId": ${fileMessage.packId}
                    }`)
                    )
                  })
                })
              })
              await glob(`${extractDir}/**/*.mp3`, (_err: any, matches: any[]) => {
                matches.forEach((filename: any) => console.log(filename))
              })
              console.log(`STEP_ONE: MIDI FILES:`)
              await glob(`${extractDir}/**/*.mid`, (_err: any, matches: any[]) => {
                matches.forEach((filename: any) => console.log(filename))
              })
            })
            .catch((error: any) => console.log(`DEBUG: ${error}`))
        }
      })
    })
  })
  .catch((error) => console.warn(error))
