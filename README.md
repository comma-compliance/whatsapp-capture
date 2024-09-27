# Whatsapp client

packaged to a docker and run via nomad - one for each user connection to whatsapp.

uses whatsapp-web.js


## CI

see .github/workflows/cii-whatsapp-client.yml

runs on any changes in the whatsapp-client folder. packages to docker and deploys to our internal GHCR location. gets picked up and deployed via nomad for job deploys