import { v4 as uuidv4 } from 'uuid'
import fetch from 'node-fetch'
import { RAILS_PUBLIC_KEY, WHATSAPP_PRIVATE_KEY, WHATSAPP_PUBLIC_KEY, WEBHOOK_URL, JOB_ID } from './config.js'
import nacl from 'tweetnacl';
nacl.util = require('tweetnacl-util');

export { uuidv4 }

export const sendWebhook = async (data) => {
  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({data})
  })
    .then((res) => res.text())
    .then((text) => console.log('Message sent to webhook:', data.nonce, text))
    .catch((err) => console.error('Error sending message to webhook:', err))
}

export const sendContactsWebhook = async (data) => {
  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: JOB_ID, bulk_contacts: true, data })
  })
    .then((res) => res.text())
    .then((text) => console.log('Contacts sent to webhook:', text))
    .catch((err) => console.error('Error sending contact to webhook:', err))
}

export const encryptMessage = async (message) =>  {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint8 = nacl.util.decodeUTF8(message);
  const appPublicKey = nacl.util.decodeBase64(RAILS_PUBLIC_KEY);
  const whatsappPrivateKey = nacl.util.decodeBase64(WHATSAPP_PRIVATE_KEY);
  const encrypted = nacl.box(messageUint8, nonce, appPublicKey, whatsappPrivateKey);
  return {
    nonce: nacl.util.encodeBase64(nonce),
    ciphertext: nacl.util.encodeBase64(encrypted),
    whatsappPublicKey: WHATSAPP_PUBLIC_KEY
  };
}
