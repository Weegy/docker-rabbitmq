import { connect, Connection } from "amqplib"

var q = "tasks"
var qe = "encode"



connect("amqp://rabbitmq")
.then(function(conn) {
    return conn.createChannel();
  }).then(function(ch) {
    return ch.assertQueue(q).then(function(ok) {
      return ch.consume(q, function(msg) {
        if (msg !== null) {
          console.error(`DEBUG: ${msg.content.toString()}`);
          ch.ack(msg);
          return ch.assertQueue(qe).then(function(oka) {
            return ch.sendToQueue(qe, Buffer.from('start encoding'));
          });
        }
      });
    });
  }).catch(console.warn);
