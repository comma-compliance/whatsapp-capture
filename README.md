# Whatsapp client

packaged to a docker and run via nomad - one for each user connection to whatsapp.

uses whatsapp-web.js


## CI

see .github/workflows/cii-whatsapp-client.yml

runs on any changes in the whatsapp-client folder. packages to docker and deploys to our internal GHCR location. gets picked up and deployed via nomad for job deploys

## ENV variables

WEBSOCKET_URL - URL to hookup to rails actioncable URL ie `ws://app:3000/cable`

KAFKA_URL - kafka formatted URL string to talk to streams server - IE `stream:9092`