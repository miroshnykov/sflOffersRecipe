const config = require('plain-config')()

let AWS = require('aws-sdk')
console.log('config.aws:',config.aws)
let sqs = new AWS.SQS({
    accessKeyId: config.aws.access_key,
    secretAccessKey: config.aws.secret_key,
    region: config.aws.region
})

// let queueUrl = 'https://sqs.us-east-1.amazonaws.com/511376436002/sfl-offers-events-staging.fifo'
let queueUrl = config.aws.queue_url

const sqsProcess = async (param = '') => {

    try {
        let dataQueue = await receiveMessage()
        if (!dataQueue.Messages) {
            //console.log(`no records from queue sfl-offers-events`)
            return
        }
        let messages = []
        for (const message of dataQueue.Messages) {
            messages.push(JSON.parse(message.Body))
            if (param !== 'debug') {

                await deleteMessage(message.ReceiptHandle)
            }
        }
        return messages
    } catch (e) {
        console.log('receiveMessageError:', e)
    }

}

const receiveMessage = async () => {
    return sqs.receiveMessage({
        QueueUrl: queueUrl,
        AttributeNames: ['All'],
        MaxNumberOfMessages: 10,
        VisibilityTimeout: 10,
        WaitTimeSeconds: 20
    }).promise()
        .then(data => {
            return data
        })
        .catch(err => {
            console.log("Error while fetching messages from the sqs queue", err)
        })
}

const deleteMessage = async (messageId) => {

    let params = {
        QueueUrl: queueUrl,
        ReceiptHandle: messageId
    }
    return sqs.deleteMessage(params)
        .promise()
        .then(data => {
            console.log(' \n Successfully deleted message with ReceiptHandle', data)
            return data
        })
        .catch(err => {
            console.log("\n Error while fetching messages from the sqs queue", err)
        })

}


module.exports = {
    sqsProcess
}