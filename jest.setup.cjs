// jest.setup.cjs
//
// The source is authored as ES modules ("type": "module" in package.json) but a
// few modules reach for CommonJS `require()` (e.g. src/helpers.js does
// `require('tweetnacl-util')`, src/sentry.js does `require('log-timestamp')`).
// Under Jest's experimental VM-modules loader a bare `require` reference is a free
// identifier that resolves against the global object, so we expose a CommonJS
// `require` there. This lets the real source modules load inside tests without
// altering their behaviour.
globalThis.require = require

// Deterministic NaCl keypairs (generated once) so the encrypt/decrypt envelope
// contract is reproducible. These are throwaway test keys, not secrets. Set them
// unconditionally so the suite is hermetic and never picks up real
// APP_PUBLIC_KEY / WHATSAPP_* / WEBHOOK_URL values from the ambient environment.
process.env.APP_PUBLIC_KEY = 'qESEyL7Fx3jFnuC6ygLwbxoCrvC+gJRldu7r8XWRujw='
process.env.WHATSAPP_PUBLIC_KEY = 'uFtfUtIVrg6Hvcm6fmLmhIr5MYTqmRJsPbxY/VXDwkI='
process.env.WHATSAPP_PRIVATE_KEY = '9cS+RyO2d+/nekVnpnLabJsUalTZ+oQDI6r1BRstLW4='
process.env.WEBHOOK_URL = 'https://webhook.test/inbound'
