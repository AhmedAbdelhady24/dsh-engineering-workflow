# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

---

## Getting Started

### Prerequisites
- {{PREREQUISITES}} (e.g. Node.js 20+, Python 3.11+, Go 1.22+)
- Package manager: `{{PACKAGE_MANAGER}}`

### Installation
```bash
git clone {{REPOSITORY_URL}}
cd {{PROJECT_NAME}}
{{INSTALL_COMMAND}}
```

### Development
```bash
{{DEV_COMMAND}}
```

### Running Tests
```bash
{{TEST_COMMAND}}
```

### Production Build
```bash
{{BUILD_COMMAND}}
```

---

## Project Structure

```text
{{PROJECT_NAME}}/
├── src/                # Application source code
├── tests/              # Unit, integration, and e2e tests
├── docs/               # System documentation & engineering standards
│   ├── ARCHITECTURE.md
│   ├── ENGINEERING_STANDARDS.md
│   └── UI_STANDARDS.md
├── AGENTS.md           # Instructions for AI coding assistants
└── README.md           # Project documentation
```

---

## Contributing & Agent Guidelines

This project uses the canonical `engineering-workflow` skill for automated and pair programming development. All contributors and AI agents must follow the quality gates and testing protocols documented in [`AGENTS.md`](AGENTS.md) and [`docs/ENGINEERING_STANDARDS.md`](docs/ENGINEERING_STANDARDS.md).

---

## License

{{LICENSE_NAME}}
