# Testing standards: pyramid, Jest/Mocha conventions, mocks, coverage

Use these rules for all automated tests to keep signal high and feedback fast.

**For test directory structure and organization, see `07-repo-navigation.md`.**

## Test pyramid expectations
- **Must** keep the majority of tests as unit tests (fast, isolated, no I/O).
- **Should** use integration tests sparingly for adapter boundaries that touch real I/O.
- **Must** avoid mixing adapter behavior into domain unit tests.
- **Should** use end-to-end tests minimally for critical user flows (e.g., extension activation, command execution).

## Jest/Mocha conventions
- **Must** use `describe()` blocks to group related tests by class/module.
- **Must** use `it()` or `test()` for individual test cases with clear, behavior-oriented names.
  -  `it('should reject non-localhost requests')`
  - L `it('test 1')`
- **Must** use `beforeEach()`/`afterEach()` for test setup/teardown; avoid global state.
- **Should** use `beforeAll()`/`afterAll()` sparingly for expensive shared setup.
- **Should** use test markers/tags (e.g., `.skip()`, `.only()`) temporarily, not in committed code.

## Test file naming
- **Must** name test files with `.test.ts` or `.spec.ts` suffix.
- **Should** mirror source file structure: `src/domain/ChatMessage.ts` ’ `tests/unit/domain/ChatMessage.test.ts`.

## Mocks, stubs, and fakes
- **Must** mock output ports in application tests to verify orchestration.
- **Must** avoid mocking domain entities or value objects.
- **Should** use test doubles (fakes) for external dependencies when deterministic behavior is needed.
- **Should** use Jest's `jest.fn()`, `jest.spyOn()`, or Sinon for mocking.
- **Must** verify interactions with mocks using `expect(mockFn).toHaveBeenCalledWith(...)`.

## VS Code Extension testing
- **Should** use `@vscode/test-electron` for integration tests that require VS Code APIs.
- **Must** mock VS Code APIs (`vscode.*`) in unit tests to avoid dependency on the editor.
- **Should** test command registration and activation events in integration tests.
- **Must** test extension lifecycle (activation, deactivation) in integration tests.

## Assertions
- **Must** use clear, descriptive assertions with helpful error messages.
- **Should** prefer semantic matchers: `toEqual()`, `toBe()`, `toThrow()`, `toContain()`.
- **Must** test both happy paths and error conditions.
- **Should** test edge cases (empty arrays, null values, boundary conditions).

## Coverage and regression expectations
- **Must** add or update tests when behavior changes.
- **Should** add regression tests for bugs before fixing them.
- **Should** keep coverage stable or improving; document intentional gaps in PR notes.
- **Should** aim for >80% coverage on application and domain layers.

## Running tests
- **Should** run a focused subset during development: `npm test -- ChatMessage.test.ts`.
- **Must** run the full suite (`npm test`) before handoff or PR.
- **Should** run tests in watch mode during active development: `npm test -- --watch`.

## Test organization
- `tests/unit/`: Fast, isolated unit tests (domain, application, individual adapters).
- `tests/integration/`: Tests with real I/O or VS Code APIs.
- `tests/e2e/`: End-to-end tests of full workflows.

## Example test structure
```typescript
import { ChatMessage } from '../../../src/domain/ChatMessage';

describe('ChatMessage', () => {
  describe('constructor', () => {
    it('should create a valid chat message', () => {
      const message = new ChatMessage('user', 'Hello');

      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello');
    });

    it('should throw error for invalid role', () => {
      expect(() => new ChatMessage('invalid' as any, 'Hello'))
        .toThrow('Invalid message role');
    });
  });
});
```
