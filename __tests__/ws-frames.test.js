// __tests__/ws-frames.test.js
//
// Contract coverage for the `ws` WebSocket transport that @anycable/core uses in
// src/anycable.js. The capture client exchanges AnyCable protocol frames over a
// `ws` socket, so these tests pin the observable frame behaviour - text frames,
// binary frames, JSON command/ack frames and clean close codes - rather than any
// `ws` internals. A safe ws bump keeps these green.

import { jest } from '@jest/globals'
import WebSocket, { WebSocketServer } from 'ws'

jest.setTimeout(10000)

let server
let port
const openClients = new Set()

beforeAll(async () => {
  await new Promise((resolve) => {
    // Echo server: mirrors whatever frame it receives, preserving binary-ness.
    server = new WebSocketServer({ port: 0 }, () => {
      port = server.address().port
      resolve()
    })
    server.on('connection', (socket) => {
      socket.on('message', (data, isBinary) => socket.send(data, { binary: isBinary }))
    })
  })
})

afterEach(() => {
  // Force-close any sockets a test left open so handles never leak into the
  // next test or race with afterAll(server.close).
  for (const client of openClients) client.terminate()
  openClients.clear()
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
})

function connect () {
  const client = new WebSocket(`ws://127.0.0.1:${port}`)
  openClients.add(client)
  client.on('close', () => openClients.delete(client))
  return new Promise((resolve, reject) => {
    client.on('open', () => resolve(client))
    client.on('error', reject)
  })
}

function nextMessage (client) {
  return new Promise((resolve) => {
    client.once('message', (data, isBinary) => resolve({ data, isBinary }))
  })
}

it('round-trips a text frame unchanged', async () => {
  const client = await connect()
  const reply = nextMessage(client)
  client.send('hello-anycable')
  const { data, isBinary } = await reply
  expect(isBinary).toBe(false)
  expect(data.toString()).toBe('hello-anycable')
  client.close()
})

it('round-trips a JSON command frame (AnyCable-style envelope)', async () => {
  const client = await connect()
  const frame = { command: 'message', identifier: '{"channel":"WhatsappChannel"}', data: '{"action":"speak"}' }
  const reply = nextMessage(client)
  client.send(JSON.stringify(frame))
  const { data } = await reply
  expect(JSON.parse(data.toString())).toEqual(frame)
  client.close()
})

it('preserves binary frame bytes exactly', async () => {
  const client = await connect()
  const payload = Buffer.from([0x00, 0x01, 0xfe, 0xff, 0x10, 0x7f])
  const reply = nextMessage(client)
  client.send(payload, { binary: true })
  const { data, isBinary } = await reply
  expect(isBinary).toBe(true)
  expect(Buffer.compare(Buffer.from(data), payload)).toBe(0)
  client.close()
})

it('reports a normal (1000) close code on clean shutdown', async () => {
  const client = await connect()
  const closed = new Promise((resolve) => client.once('close', (code) => resolve(code)))
  client.close(1000)
  expect(await closed).toBe(1000)
})
