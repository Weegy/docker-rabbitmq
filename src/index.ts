import { connect, Connection } from "amqplib"
import { dir } from "console"
import * as extract from "extract-zip"
import * as fs from "fs"
import * as glob from "glob"
import { resolve } from "path"
import { IExtractMessage } from "./models/extract-message"

const tasksQueue = "tasks"
const encodeQueue = "encode"

connect("amqp://rabbitmq")
  .then(function (conn) {
    return conn.createChannel()
  })
  .then(function (ch) {
    return ch.assertQueue(tasksQueue).then(function (ok) {
      return ch.consume(tasksQueue, async function (msg) {
        if (msg !== null) {
          const fileMessage = JSON.parse(msg.content.toString()) as IExtractMessage
          console.log(fileMessage)
          const extractDir = `/app/extract/${fileMessage.packId}`
          ch.ack(msg)
          await extract(`/app/zip/${fileMessage.fileName}`, {
            dir: extractDir,
          })
            .then(async () => {
              await glob(`${extractDir}/**/*.wav`, (err, matches) => {
                matches.forEach((filename) => console.log(filename))
              })
              await glob(`${extractDir}/**/*.mp3`, (err, matches) => {
                matches.forEach((filename) => console.log(filename))
              })
              console.log("MIDI FILES")
              await glob(`${extractDir}/**/*.mid`, (err, matches) => {
                matches.forEach((filename) => console.log(filename))
              })
            })
            .catch((error) => console.log(`DEBUG: ${error}`))
        }
      })
    })
  })
  .catch((error) => console.warn(error))
