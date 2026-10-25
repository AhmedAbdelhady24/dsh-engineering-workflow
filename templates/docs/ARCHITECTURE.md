# System Architecture: {{PROJECT_NAME}}

This document details the architectural topology, component boundaries, data lifecycle, and integration contracts for {{PROJECT_NAME}}.

---

## 1. System Topology & Context

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Client / UI   │ ────► │  API / Backend  │ ────► │ Database / State│
│   (Web/Mobile)  │ ◄──── │  (REST/GraphQL) │ ◄──── │  (Postgres/KV)  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │ External APIs / │
                          │ Third Parties   │
                          └─────────────────┘
```

- **Archetype**: {{PROJECT_ARCHETYPE}} (e.g. Next.js Fullstack, Distributed Microservices, Standalone CLI)
- **Primary Runtime**: {{RUNTIME_ENVIRONMENT}} (e.g. Node.js 20 LTS, Python 3.11, Bun)
- **Hosting / Deployment Target**: {{DEPLOYMENT_TARGET}} (e.g. Docker, Vercel, AWS, Kubernetes)

---

## 2. Module Boundaries & Directory Layout

```text
src/
├── app/               # Application routing, controllers, or HTTP handlers
├── core/              # Pure domain logic and business entities (independent of transport)
├── db/                # Persistence schemas, migrations, and database clients
├── lib/               # Shared utilities, validation schemas, and helpers
└── types/             # Canonical data contracts and interface definitions
```

### Boundary Invariants:
1. `core` domain logic must never import framework-specific transport layers (e.g. Next.js `req/res` or Express objects).
2. Data persistence is decoupled behind repository or query interfaces to facilitate test mocking.

---

## 3. Data Lifecycle & State Flow

1. **Input Validation**: All incoming requests are validated against strict schemas (e.g. Zod) before reaching domain logic.
2. **Business Transaction**: Domain services execute state mutations inside transactional boundaries when multiple entities are touched.
3. **Response Serialization**: Output payloads conform to typed DTOs (Data Transfer Objects), stripping internal identifiers or sensitive properties.

---

## 4. Key Architectural Decisions (ADRs)

| ADR ID | Decision Title | Status | Rationale |
| :--- | :--- | :--- | :--- |
| **ADR-001** | {{ADR_001_TITLE}} | Accepted | {{ADR_001_RATIONALE}} |
| **ADR-002** | {{ADR_002_TITLE}} | Accepted | {{ADR_002_RATIONALE}} |
| **ADR-003** | {{ADR_003_TITLE}} | Accepted | {{ADR_003_RATIONALE}} |
