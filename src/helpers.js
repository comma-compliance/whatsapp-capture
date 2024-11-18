import { v4 as uuidv4 } from 'uuid'
import fetch from 'node-fetch'
import { WEBHOOK_URL, JOB_ID } from './config.js'

export { uuidv4 }

export const sendWebhook = async (data) => {
  const job_id = JOB_ID
  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id, data })
  })
    .then((res) => res.text())
    .then((text) => console.log('Message sent to webhook:', text))
    .catch((err) => console.error('Error sending message to webhook:', err))
}
