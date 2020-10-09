/* eslint-disable promise/no-nesting */
import { connect, Connection } from "amqplib"

const q = "encode"



connect("amqp://rabbitmq")
	.then(function(conn) {
		return conn.createChannel();
	}).then(function(ch) {
		return ch.assertQueue(q).then(function(ok) {
			return ch.consume(q, async function(msg) {
				if (msg !== null) {
					console.log(msg.content.toString());
					ch.ack(msg);
					await delay(500)
          
				}
			});
		});
	}).catch(console.warn);

function delay(ms: number) {
	return new Promise( resolve => setTimeout(resolve, ms) );
}