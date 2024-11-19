// __tests__/whatsappClient.test.js
import { jest } from '@jest/globals'
import { initializeWhatsAppClient } from '../src/whatsappClient'
import { channel } from '../src/anycable'
import { Client } from 'whatsapp-web.js'

// Correctly mock the `whatsapp-web.js` module and its `Client` class
jest.mock('whatsapp-web.js', () => {
  const mockClient = {
    on: jest.fn(),
    initialize: jest.fn(),
    destroy: jest.fn(),
    getContacts: jest.fn().mockResolvedValue([])
  }
  return {
    Client: jest.fn(() => mockClient)
  }
})

// Mock the AnyCable channel
jest.mock('../src/anycable', () => ({
  channel: {
    speak: jest.fn()
  }
}))

describe('WhatsApp Client Initialization', () => {
  let client

  beforeEach(() => {
    client = initializeWhatsAppClient()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize WhatsApp client and set up event listeners', () => {
    expect(Client).toHaveBeenCalledTimes(1) // Check that the Client constructor was called
    expect(client.on).toHaveBeenCalledWith('qr', expect.any(Function))
    expect(client.on).toHaveBeenCalledWith('authenticated', expect.any(Function))
    expect(client.on).toHaveBeenCalledWith('message', expect.any(Function))
    expect(client.on).toHaveBeenCalledWith('ready', expect.any(Function))
  })

  it('should broadcast QR code when received', () => {
    const qrHandler = client.on.mock.calls.find(call => call[0] === 'qr')[1]
    qrHandler('test_qr_code')

    expect(channel.speak).toHaveBeenCalledWith({ qr_code: 'test_qr_code' })
  })

  it('should broadcast when authenticated', () => {
    const authHandler = client.on.mock.calls.find(call => call[0] === 'authenticated')[1]
    authHandler()

    expect(channel.speak).toHaveBeenCalledWith({ whatsapp_authed: true })
  })

  it('should handle ready event and broadcast message', async () => {
    const readyHandler = client.on.mock.calls.find(call => call[0] === 'ready')[1]
    await readyHandler()

    expect(channel.speak).toHaveBeenCalledWith({ message: 'Client is ready!' })
  })
})
