# WhatsApp Capture

> **Secure, enterprise-grade WhatsApp client built for scalable messaging infrastructure.**

A containerized WhatsApp client powered by whatsapp-web.js, designed for enterprise backends with secure message streaming, webhook integration, and per-user deployment capabilities.

# Comma Compliance WhatsApp Capture Repository – Use & Contribution Policy

## Scope & License

This policy applies to the WhatsApp Capture code in this repository only. The project is open source under the Apache 2.0 license.

## Intended Purpose

This tool enables secure, transparent, and privacy‑conscious capture of WhatsApp messages for organizations or individuals who explicitly choose to retain their own communication history (e.g., for SEC/FINRA or other regulatory, legal, or organizational requirements). It currently supports WhatsApp only.

WhatsApp provides rich messaging for personal and business communication, but it does not natively offer compliant archiving. This project exists for cases where regulated retention is required and all involved parties have consented to capture and storage.

## User Consent & Control

This tool is designed with user consent and data ownership as core principles:

* Only the device owner or an authorized user can initiate or configure archiving.
* Data access occurs through clearly defined, user-enabled methods.
* While the tool supports automatic uploads for regulatory compliance, data is only sent to storage destinations that have been approved by the user or established by their organization.
* No data is transmitted to external services outside of those intended and authorized storage endpoints.

Users and organizations are fully responsible for how they use this tool, including where archived data is stored, how it's protected, and whether it is shared.

## Prohibited Uses

* Unsolicited messaging, spam, or harassment.
* Intercepting or archiving communications without appropriate consent or legal authority.

## Compliance & Legal Notice

* This release—and Comma Compliance's WhatsApp capture—are neither affiliated with nor endorsed by Meta Platforms, Inc.
* By using this code, you acknowledge that compliance determinations and data governance decisions are your responsibility.

## Respect for WhatsApp's Privacy Model

This capture tool:

* **Does not interfere** with WhatsApp's core infrastructure, encryption, or protocols.
* **Does not weaken or bypass** end-to-end encryption.
* Only works if the device owner gives permission.
* Operates **entirely outside of the WhatsApp app** and ecosystem.
* Strong encryption is required for both in-transit and at-rest data protection of captured content and related metadata.

This tool does not modify WhatsApp clients, servers, protocols, or end‑to‑end encryption. It operates solely on data that the authorized device owner can already access.

## Transparency, Auditability & Contributions

This project is fully open-source and licensed under the Apache 2.0 license, which means anyone can read the code, review its functionality, and suggest improvements.

* Contributions are welcome, especially those that enhance **security**, **auditability**, and user **access control**.
* We encourage independent audits and feedback to ensure the tool aligns with the privacy and security expectations of both users and the broader community.
* Secrets (API keys, tokens) must never be committed to the repo; use secure secret management, such as HashiCorp Vault.
* Submit pull requests with clear descriptions, relevant tests, and no embedded secrets.

## Disclaimers

* The tool is intended for transparent, authorized use, not for surveillance or covert monitoring.
* It is designed for **regulated or informed use** in professional settings where communication retention is necessary and explicitly understood by all parties.
* Using this tool may violate the terms of use of WhatsApp if used **without consent or improperly.** Users assume full responsibility.
* Maintainers may update this policy; material changes will be documented in the repo history.

## Our Commitment

We believe users and organizations should be able to manage their own data without sacrificing privacy. Our goal is to provide transparent, ethical tools that help meet legitimate compliance requirements while respecting user trust.

---

## Key Features

- User-specific Docker containers with complete isolation.
- Real-time encrypted message streaming.
- Comprehensive monitoring with Sentry.
- Headless Chromium with Puppeteer pre-configured.
- Supports scalable batch processing.

---

## Quick Start

### Installation

```bash
# Build the image
docker build -t whatsapp-client .

# Run with environment file
docker run --env-file .env whatsapp-client
```

---

### Configurations
Please set up docker environment variables.

```env
NOMAD_JOB_ID=unique-session-identifier
WEBSOCKET_URL=ws://your-app:3000/cable?token=your-token
# Cryptographic Keys
APP_PUBLIC_KEY=your-app-public-key
WHATSAPP_PRIVATE_KEY=your-whatsapp-private-key
WHATSAPP_PUBLIC_KEY=your-whatsapp-public-key

# Webhook Delivery
WEBHOOK_URL=http://your-app/whatsapp_webhooks/

# Batch Processing
CONTACTS_BATCH_SIZE=50
CONTACTS_DELAY=3000

# AWS S3 Storage (optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_S3_REGION=us-west-2

# Error Monitoring
SENTRY_DSN=your-sentry-dsn

# Server Configuration
PORT=3000

WA_SYSTEM_IDENTIFIERS=worker1,worker2,worker3
```

## Architecture Diagram

```
                                    ┌─────────────────────────────────────────────┐
                                    │               CI/CD Pipeline                │
                                    │               GitHub Actions                │
                                    └──────────────────┬──────────────────────────┘
                                                       │ Auto Deploy
                                                       ▼
┌─────────────────┐     QR Auth     ┌─────────────────────────────────────────────┐
│    WhatsApp     │◄───────────────►│               Docker Container              │
│   Web Client    │                 │  ┌─────────────────────────────────────┐    │
└─────────────────┘                 │  │              Puppeteer              │    │
         ▲                          │  │           (Headless Chrome)         │    │        
         │ Messages                 │  └─────────────────────────────────────┘    │
         │                          │  ┌─────────────────────────────────────┐    │
         │                          │  │             whatsapp-web.js         │    │
         ▼                          │  │           (WhatsApp Web API)        │    │
                                    │  └─────────────────────────────────────┘    │
                                    │  ┌─────────────────────────────────────┐    │
                                    │  │            Crypto Layer             │    │
                                    │  │   XChaCha20 + Ed25519 + Curve25519  │    │
                                    │  └─────────────────────────────────────┘    │
                                    └─────────────────┬───────────────────────────┘
                                                      │
                               ┌──────────────────────┼─────────────────────┐
                               │                      │                     │
                               ▼                      ▼                     ▼
                    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
                    │     WebSocket    │  │     Webhook      │  │      AWS S3      │
                    │     Real-time    │  │    HTTP  POST    │  │  Media Storage   │
                    │     Streaming    │  │     Delivery     │  │    & Sessions    │
                    └─────────┬────────┘  └─────────┬────────┘  └──────────────────┘
                              │                     │
                              └─────────┬───────────┘
                                        │
                                        ▼
                              ┌─────────────────────┐
                              │       Your App      │
                              │       Backend       │
                              │                     │
                              │ • Message Processing│
                              │ • Business Logic    │
                              │ • User Management   │
                              └─────────────────────┘
                                        │
                                        │ Error Logs
                                        ▼
                              ┌─────────────────────┐
                              │     Sentry          │
                              │   Error Monitoring  │
                              │   & Performance     │
                              └─────────────────────┘

```

This capture tool operates as a secure bridge between WhatsApp Web and your enterprise infrastructure, ensuring message delivery through multiple channels with full encryption support.

---

## Security & Bug Bounty

For vulnerability disclosure, secure development practices, see our [Security Policy](./SECURITY.md).  

**Bug Bounty Program**: Coming soon, report vulnerabilities responsibly and earn rewards. The minimum bounty is $25 for valid submissions.


---

## Roadmap
**FIPS Compliance**: A --fips flag is coming soon for FIPS supported encryption protocols but our current crypto stack is already safer. Unlike FIPS, we use modern, misuse-resistant algorithms, such as XChaCha20 and Ed25519 that offer better real-world security.  
**Kafka Streaming:** Kafka can be enabled using --kafka flag to replace action cable.

---

## Deployment

### CI/CD Pipeline
Automated builds are triggered by changes in the `whatsapp-client/` directory:
- **Workflow**: `.github/workflows/ci-whatsapp-client.yml`
- **Registry**: GitHub Container Registry (GHCR)


## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

---

## Support

- **Enterprise Support**: contact@commacompliance.com

---
