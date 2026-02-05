# Repository navigation guidelines for hexagonal architecture

Use these guidelines to organize and discover code in hexagonal TypeScript projects.

## Standard directory structure

### Source layout pattern
```
src/
├── domain/                  # Core business logic
│   ├── entities/           # Domain entities
│   ├── value-objects/      # Immutable value objects
│   ├── services/           # Domain services
│   └── exceptions.ts       # Domain-specific errors
├── application/            # Use cases and orchestration
│   ├── use-cases/          # Application use cases
│   ├── ports/              # Input/output ports (interfaces)
│   └── dtos/               # Data transfer objects
├── adapters/               # External system interfaces
│   ├── input/              # Driving adapters (CLI, HTTP, VS Code commands)
│   └── output/             # Driven adapters (VS Code LM API, config, external APIs)
└── extension.ts            # Entry point (wiring/DI)
```

### Test layout pattern
```
tests/
├── unit/                   # Fast, isolated unit tests
│   ├── domain/            # Domain logic tests
│   ├── application/       # Use case tests
│   └── adapters/          # Adapter unit tests
├── integration/           # Integration tests with I/O
│   └── adapters/          # Adapter integration tests
└── e2e/                   # End-to-end tests
```

**Note:** Test directories should mirror the source structure for easy navigation.

## Documentation and configuration
- `README.md`: Project onboarding, setup, and usage
- `docs/`: Architecture decision records (ADRs), design docs
- `package.json`: Package configuration and dependencies
- `tsconfig.json`: TypeScript compiler configuration

## Common search patterns

### Finding definitions
```bash
# Find all class/interface definitions in a specific area
grep -r "class\|interface" src/<area>/

# Find all ports (interfaces)
grep -r "interface.*Port" src/application/ports/

# Find all adapters
find src/adapters/ -name "adapter.ts" -o -name "*Adapter.ts"
```

### Finding usage
```bash
# Find where a specific class is imported
grep -r "import.*ClassName" src/ tests/

# Find instantiation of adapters
grep -r "new.*Adapter" src/
```

### Exploring structure
```bash
# View directory tree
tree src/ -L 3

# List all TypeScript files in a layer
find src/domain/ -name "*.ts"

# Find entry points
find src/ -name "extension.ts" -o -name "main.ts"
```

## Project-specific navigation

To generate a project-specific navigation map for your repository:
1. See `.clinerules/workflows/update-repo-navigation.md` for instructions
2. Run the workflow when the project structure changes significantly
3. The generated map will provide concrete paths and file locations

## Navigation principles
- **Layer isolation**: Code in `domain/` should never import from `adapters/` or `application/`
- **Port discovery**: Look in `application/ports/` to understand system boundaries
- **Entry points**: Find wiring and configuration in entry point files (`extension.ts`, `main.ts`)
- **Test mirrors source**: Navigate tests using the same path as the source module being tested

## TypeScript-specific navigation
- **Barrel exports**: Follow `index.ts` files to find public API
- **Type definitions**: Look for `.d.ts` files or `types.ts` modules
- **Configuration**: Check `tsconfig.json` for path mappings and module resolution
