# Hexagonal architecture doctrine (hard constraints)

Use this doctrine as the default architecture standard for this repo. Any deviation must be explicitly documented.

## Core principles (non-negotiable)
- **Dependency direction**: All dependencies point **inward** toward the domain and application core.
- **Business logic isolation**: Domain models are pure and independent of frameworks, I/O, and infrastructure.
- **Explicit boundaries**: Interaction between layers happens only through ports (interfaces).
- **Replaceable adapters**: I/O details are swappable without changing the core.

## Vocabulary
- **Domain**: Entities, value objects, domain services, and domain errors. No I/O concerns.
- **Application**: Use cases orchestration. Defines **ports** (input/output) and coordinates domain behavior.
- **Ports**: Contracts that isolate the core from infrastructure. Input ports (commands/queries) and output ports (persistence, messaging, external APIs).
- **Adapters**: Implementation of ports at the system edge (HTTP, CLI, VS Code commands, external APIs, databases, message queues, etc.).
- **Infrastructure**: Frameworks, SDKs, external libraries, HTTP clients, serializers, etc. Lives only in adapters.

## Dependency rules (allowed/forbidden)
✅ **Allowed**
- Domain → Domain (same layer)
- Application → Domain
- Adapters → Application ports + Domain (through ports or DTOs)

❌ **Forbidden**
- Domain → Application, Adapters, Infrastructure
- Application → Adapters, Infrastructure
- Adapter → Adapter (unless through application ports)

## Layer responsibilities
### Domain
- Pure business rules and invariants.
- No side effects, no I/O, no framework imports.
- Exposes domain errors and value objects.
- **TypeScript-specific**: Use pure classes, interfaces, and types. No external dependencies.

### Application (Use Cases)
- Orchestrates flows, validates inputs (structural validation), invokes domain logic.
- Defines ports (interfaces) and DTOs that are **inward-facing** and stable.
- Handles cross-cutting concerns like transactions or unit-of-work abstractions.
- **TypeScript-specific**: Define ports as interfaces with clear contracts.

### Ports
- **Input ports**: Methods used by driving adapters (HTTP/CLI/VS Code commands).
- **Output ports**: Interfaces for persistence, external services, or notifications.
- Ports are defined in the application layer only.
- **TypeScript-specific**: Use interfaces for ports, DTOs as types or interfaces.

### Adapters
- Implement ports for external systems.
- Translate external data structures ↔ DTOs/domain objects.
- Handle I/O, serialization, transport, retry logic.
- **TypeScript-specific**: VS Code API, HTTP servers, external API clients live here.

## Module/package structure guidance
- `src/domain/`: entities, value objects, domain services, domain errors.
- `src/application/`: use cases + ports + DTOs.
- `src/adapters/`: input (HTTP/CLI/VS Code) and output (VS Code LM API, databases, external APIs, etc.).
- `src/infrastructure/` (optional): shared infra utilities used by adapters only.
- `src/extension.ts` (or `src/main.ts`): Wiring/dependency injection, entry point.

## Naming conventions (layer-aware)
- `.../ports/` for interfaces.
- `.../adapters/input/` and `.../adapters/output/` for adapter implementations.
- DTOs named for their intent: `CreateChatCommand`, `ChatResponseDTO`, `ModelSelectionDTO`.
- Files: `camelCase.ts` or `kebab-case.ts` for consistency.

## No-go examples (explicitly banned)
- Importing an HTTP client or VS Code API in `domain/` or `application/`.
- Using external frameworks (like `vscode.*`) inside domain entities.
- Adapters calling each other directly instead of via application ports.
- "Helper" utilities in `domain/` that perform I/O.

## Adapter directory structure
Adapters at the same conceptual level **must** be organized uniformly to keep navigation predictable and scalable.

### Directory structure rules
- **Must** organize adapters in subdirectories (not as standalone files) when multiple adapters exist in the same parent directory.
- **Should** use subdirectories even for simple, single-file adapters to maintain consistency and allow future expansion without restructuring.
- **Must** name the main implementation file semantically: `adapter.ts`, `server.ts`, `client.ts`, etc. (never repeat the directory name).
- **Must** export public classes from the subdirectory's `index.ts` to keep imports clean.

### Pattern: output adapters
When you have multiple output adapters (e.g., VS Code LM API, configuration, persistence), each should follow the same structure:

✅ **Consistent structure**
```
adapters/output/
├── language-model/
│   ├── index.ts              # Exports VSCodeLanguageModelAdapter
│   ├── adapter.ts            # Implementation
│   └── types.ts              # Adapter-specific types
├── configuration/
│   ├── index.ts              # Exports VSCodeConfigAdapter
│   └── adapter.ts            # Implementation
└── http-client/
    ├── index.ts
    ├── client.ts
    └── retry.ts
```

❌ **Inconsistent structure (avoid)**
```
adapters/output/
├── languageModel.ts          # ❌ Standalone file
└── configuration/            # ✅ Subdirectory
    └── ...
```

### Naming conventions
- Directory: `kebab-case` (e.g., `language-model/`, `http-server/`, `chat-processor/`)
- Main file: semantic name matching responsibility (e.g., `adapter.ts`, `server.ts`, `client.ts`)
- Supporting files: `types.ts`, `validation.ts`, `mappers.ts`, `routes.ts`, etc.

### Exceptions
- When there's only **one** adapter in a category and no plans for more, a single file may be acceptable.
- Document the reasoning if deviating from the standard structure.

## TypeScript-specific patterns
- **Use dependency injection**: Pass dependencies through constructors or factory functions.
- **Avoid singletons**: Use explicit instances managed at the entry point.
- **Use interfaces for ports**: Clear contracts between layers.
- **Keep adapters thin**: Logic belongs in application/domain, not adapters.
