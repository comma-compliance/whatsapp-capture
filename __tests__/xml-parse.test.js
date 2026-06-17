// __tests__/xml-parse.test.js
//
// Contract coverage for fast-xml-parser, which @aws-sdk/client-s3 uses to parse
// S3 XML responses. The capture client persists WhatsApp sessions to S3 via the
// RemoteAuth strategy (src/authStrategy.js), so S3 error/listing XML is on the
// hot path. These tests pin the parsed structure of representative S3 responses
// (the observable contract) so a parser change that altered parse output would be
// caught. They use parser options equivalent to the AWS SDK's XML parsing config.

import { XMLParser } from 'fast-xml-parser'

// Mirrors the relevant options the AWS SDK uses for S3 response parsing.
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: false,
  parseTagValue: false
})

it('parses an S3 <Error> response into a structured object', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Error><Code>NoSuchKey</Code><Message>The specified key does not exist.</Message><Key>session/RemoteAuth.zip</Key><RequestId>4442587FB7D0A2F9</RequestId></Error>`
  const parsed = parser.parse(xml)
  expect(parsed.Error.Code).toBe('NoSuchKey')
  expect(parsed.Error.Message).toBe('The specified key does not exist.')
  expect(parsed.Error.Key).toBe('session/RemoteAuth.zip')
  expect(parsed.Error.RequestId).toBe('4442587FB7D0A2F9')
})

it('parses a ListBucketResult with multiple Contents entries into an array', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Name>whatsapp-sessions</Name>
  <KeyCount>2</KeyCount>
  <Contents><Key>a/RemoteAuth.zip</Key><Size>1024</Size></Contents>
  <Contents><Key>b/RemoteAuth.zip</Key><Size>2048</Size></Contents>
</ListBucketResult>`
  const parsed = parser.parse(xml)
  expect(parsed.ListBucketResult.Name).toBe('whatsapp-sessions')
  expect(Array.isArray(parsed.ListBucketResult.Contents)).toBe(true)
  expect(parsed.ListBucketResult.Contents).toHaveLength(2)
  expect(parsed.ListBucketResult.Contents[0].Key).toBe('a/RemoteAuth.zip')
  // Compare loosely so this stays a structural contract, not a value-typing assertion.
  expect(String(parsed.ListBucketResult.Contents[1].Size)).toBe('2048')
})

it('exposes element attributes (e.g. HeadObject-style metadata)', () => {
  const xml = '<Tag key="ContentType" value="application/zip"/>'
  const parsed = parser.parse(xml)
  expect(parsed.Tag.key).toBe('ContentType')
  expect(parsed.Tag.value).toBe('application/zip')
})

it('decodes standard XML entities in text content', () => {
  const xml = '<Message>key a&amp;b &lt;not here&gt;</Message>'
  const parsed = parser.parse(xml)
  expect(parsed.Message).toBe('key a&b <not here>')
})
