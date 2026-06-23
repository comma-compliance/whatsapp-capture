// __tests__/capture-contract.test.js
//
// Contract coverage for the capture pipeline's I/O seam in src/helpers.js:
//   - the encrypted envelope shape emitted to AnyCable / the webhook
//   - the decrypt round-trip for inbound app -> client messages
//   - the webhook POST contract (URL, headers, body, job_id injection)
//   - the uuid v4 identifier contract
// These assert observable behaviour (wire shape, decryptability), not the
// internals or versions of any dependency, so a safe dependency bump keeps them
// green while a behaviour change would fail them.

import { jest } from '@jest/globals'
import nacl from 'tweetnacl'
import naclUtil from 'tweetnacl-util'

// The "app" side keypair. Its public key matches APP_PUBLIC_KEY in jest.setup.cjs
// and its secret key lets the test play the role of the app when building inbound
// messages or opening the client's outbound envelopes.
const APP_PUBLIC = 'qESEyL7Fx3jFnuC6ygLwbxoCrvC+gJRldu7r8XWRujw='
const APP_SECRET = 'I4eNygEiiVyglSOe5BCGuaCSMm24vv5S6v0H0OXKf2w='
const WA_PUBLIC = 'uFtfUtIVrg6Hvcm6fmLmhIr5MYTqmRJsPbxY/VXDwkI='

// Mock node-fetch before importing helpers so sendWebhook hits the spy.
const fetchMock = jest.fn(() => Promise.resolve({ text: () => Promise.resolve('ok') }))
jest.unstable_mockModule('node-fetch', () => ({ __esModule: true, default: fetchMock }))

const { encryptMessage, decryptMessage, sendWebhook, sendContactsWebhook, uuidv4 } =
  await import('../src/helpers.js')

const b64 = /^[A-Za-z0-9+/]+={0,2}$/

// Open an envelope produced by encryptMessage() from the app's perspective.
function openOutbound (env) {
  const opened = nacl.box.open(
    naclUtil.decodeBase64(env.ciphertext),
    naclUtil.decodeBase64(env.nonce),
    naclUtil.decodeBase64(WA_PUBLIC),
    naclUtil.decodeBase64(APP_SECRET)
  )
  return JSON.parse(naclUtil.encodeUTF8(opened))
}

// Build an inbound message as the app would send it to the client.
function buildInbound (obj) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const ct = nacl.box(
    naclUtil.decodeUTF8(JSON.stringify(obj)),
    nonce,
    naclUtil.decodeBase64(WA_PUBLIC),
    naclUtil.decodeBase64(APP_SECRET)
  )
  return {
    ciphertext: naclUtil.encodeBase64(ct),
    nonce: naclUtil.encodeBase64(nonce),
    app_public_key: APP_PUBLIC
  }
}

describe('encryptMessage envelope contract', () => {
  it('emits a {ciphertext, nonce, whatsappPublicKey} envelope', () => {
    const env = encryptMessage({ qr_code: 'ABC123' })
    expect(Object.keys(env).sort()).toEqual(['ciphertext', 'nonce', 'whatsappPublicKey'])
    expect(env.whatsappPublicKey).toBe(WA_PUBLIC)
    expect(env.ciphertext).toMatch(b64)
    expect(env.nonce).toMatch(b64)
    // 24-byte nonce per nacl.box
    expect(naclUtil.decodeBase64(env.nonce)).toHaveLength(nacl.box.nonceLength)
    // ciphertext is not the plaintext
    expect(env.ciphertext).not.toContain('ABC123')
  })

  it('produces a fresh nonce/ciphertext on every call (non-deterministic)', () => {
    const a = encryptMessage({ message: 'same' })
    const b = encryptMessage({ message: 'same' })
    expect(a.nonce).not.toBe(b.nonce)
    expect(a.ciphertext).not.toBe(b.ciphertext)
  })

  it('emits an envelope the app can decrypt back to the original payload', () => {
    const payload = { whatsapp_authed: true, user_info: { phone: '15551234567' } }
    const env = encryptMessage(payload)
    expect(openOutbound(env)).toEqual(payload)
  })
})

describe('decryptMessage contract', () => {
  it('round-trips an inbound app message', () => {
    const inbound = buildInbound({ type: 'outbound_message', info: { phone_number: '1555', message: 'hi' } })
    expect(decryptMessage(inbound)).toEqual({
      type: 'outbound_message',
      info: { phone_number: '1555', message: 'hi' }
    })
  })
})

describe('sendWebhook contract', () => {
  beforeEach(() => fetchMock.mockClear())

  it('POSTs an encrypted, job_id-stamped envelope to WEBHOOK_URL', async () => {
    await sendWebhook({ data: { key: '1555@c.us', message: { body: 'hello' } } })
    await Promise.resolve()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('https://webhook.test/inbound')
    expect(opts.method).toBe('POST')
    expect(opts.headers).toEqual({ 'Content-Type': 'application/json' })

    const body = JSON.parse(opts.body)
    expect(Object.keys(body)).toEqual(['data'])
    expect(Object.keys(body.data).sort()).toEqual(['ciphertext', 'nonce', 'whatsappPublicKey'])

    const decoded = openOutbound(body.data)
    expect(decoded.job_id).toBeDefined()
    expect(decoded.data).toEqual({ key: '1555@c.us', message: { body: 'hello' } })
  })

  it('marks contact batches with bulk_contacts: true', async () => {
    await sendContactsWebhook([{ data: { key: 'a@c.us' } }])
    await Promise.resolve()

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    const decoded = openOutbound(body.data)
    expect(decoded.bulk_contacts).toBe(true)
    expect(decoded.data).toEqual([{ data: { key: 'a@c.us' } }])
  })
})

describe('uuid identifier contract', () => {
  it('exposes a v4 uuid generator', () => {
    const id = uuidv4()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    expect(uuidv4()).not.toBe(id)
  })
})
