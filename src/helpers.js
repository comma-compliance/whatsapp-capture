import { v4 as uuidv4 } from 'uuid'
import fetch from 'node-fetch'
import { JOB_ID, RAILS_PUBLIC_KEY, WHATSAPP_PRIVATE_KEY, WHATSAPP_PUBLIC_KEY, WEBHOOK_URL } from './config.js'
import nacl from 'tweetnacl';
nacl.util = require('tweetnacl-util');

export { uuidv4 }

export const sendWebhook = async (data) => {
  data = { ...data, job_id: JOB_ID };
  data = encryptMessage(data)

  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  })
    .then((res) => res.text())
    .then((text) => console.log('Message sent to webhook', text))
    .catch((err) => console.error('Error sending message to webhook:', err))
}

export const sendContactsWebhook = async (data) => {
  const payload = {
    bulk_contacts: true,
    data: data
  };

  data = encryptMessage(payload)

  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  })
    .then((res) => res.text())
    .then((text) => console.log('Contacts sent to webhook:', text))
    .catch((err) => console.error('Error sending contact to webhook:', err))
}

export const encryptMessage = (message) =>  {
  message = JSON.stringify(message)
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

export const decryptMessage = (message) =>  {
  const ciphertext = nacl.util.decodeBase64(message["ciphertext"]);
  const nonce = nacl.util.decodeBase64(message["nonce"]);
  const senderPublicKey = nacl.util.decodeBase64(message["rails_public_key"]);
  const receiverPrivateKey = nacl.util.decodeBase64(WHATSAPP_PRIVATE_KEY);

  const decrypted = nacl.box.open(ciphertext, nonce, senderPublicKey, receiverPrivateKey);

  const payload = nacl.util.encodeUTF8(decrypted);
  return JSON.parse(payload)
}
