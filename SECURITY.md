# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0   | ✅ |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability:

1. **DO NOT** create public GitHub issues for security vulnerabilities.
2. Email us at **security@commacompliance.com**.
3. Include detailed reproduction steps.
4. Allow up to **48 hours** for an initial response.

## Security Features

- **Cryptographic Verification**: All commits are **GPG-signed** and verified.
- **Dependency Scanning**: Automated vulnerability detection in CI/CD.
- **Container Security**: 
  - Runs as **non-root users**.
  - Uses **distroless images** to minimize attack surface.
- **Encryption**:
  - Symmetric: `XChaCha20`
  - Asymmetric key exchange: `Curve25519`
  - Signatures: `Ed25519`
- **Network Security**:
  - TLS 1.3 support
  - Certificate pinning
- **Access Controls**:
  - Multi-Factor Authentication (MFA) readiness
- **Audit Logging**: Complete logging for compliance and threat detection.

## Compliance Certifications

- **FIPS 140-2**: On roadmap (target Q1 2026)
- **Common Criteria**: Evaluation in progress
- **ISO 27001**: Framework alignment documented

## Security Best Practices

We strongly recommend the following:

- Rotate cryptographic keys regularly.
- Use secure secret management systems (e.g., HashiCorp Vault, AWS Secrets Manager).
- Monitor application and infrastructure logs for suspicious activity.
- Keep all dependencies and images up to date.
- Deploy in isolated and hardened network environments.
