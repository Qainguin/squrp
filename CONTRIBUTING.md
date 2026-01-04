# Contributing to squrp

Thank you for your interest in contributing to squrp! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0+ for package management and running scripts
- Node.js 18+ (if not using Bun)
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR-USERNAME/squrp.git
cd squrp
```

3. Add the original repository as a remote:

```bash
git remote add upstream https://github.com/original-owner/squrp.git
```

---

## Development Setup

### Install Dependencies

```bash
bun install
```

### Available Commands

| Command | Description |
|---------|-------------|
| `bun test` | Run all tests |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run build` | Build the project |
| `bun run lint` | Run linter with auto-fix |
| `bun run declarations` | Generate TypeScript declarations |

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test test/api.test.ts

# Run tests with coverage
bun test --coverage
```

---

## Project Structure

```
squrp/
├── src/                    # Source code
│   ├── core/
│   │   ├── compression.ts  # Compression logic
│   │   └── serialization.ts # Binary format handling
│   ├── errors.ts           # Error handling
│   └── index.ts            # Public API
├── test/                   # Test files
│   ├── api.test.ts         # API tests
│   └── errors.test.ts      # Error handling tests
├── docs/                   # Documentation
│   └── API.md              # API reference
├── biome.json              # Linter configuration
├── tsconfig.json           # TypeScript configuration
└── package.json
```

---

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Provide complete type annotations for public APIs
- Use JSDoc comments for all public functions and types
- Prefer interfaces over type aliases for object types

### Code Style

- Format code using Biome (configured in `biome.json`)
- Run `bun run lint` before committing
- Enable auto-format on save in your editor

### Naming Conventions

- **PascalCase** for classes and types: `SqurpError`, `ZipOptions`
- **camelCase** for variables and functions: `compressData`, `normalizeInput`
- **UPPER_SNAKE_CASE** for constants: `SqurpErrorCode.INVALID_HEADER`
- Descriptive names: avoid abbreviations except well-known ones

### Error Handling

- Use `SqurpError` with appropriate error codes
- Error codes should be specific enough to handle different failure modes
- Provide helpful error messages with context

**Example:**

```ts
if (path.length > 65535) {
  throw createError(SqurpErrorCode.PATH_TOO_LONG, `Path too long: ${path}`);
}
```

### Git Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (formatting)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or modifying tests
- `chore`: Changes to build process or auxiliary tools

**Example:**

```
feat(errors): add SqurpError class with error codes

Add comprehensive error handling with specific error codes
for different failure modes including INVALID_HEADER,
CORRUPTED_DATA, PATH_TOO_LONG, etc.

Closes #123
```

---

## Testing

### Test Structure

- Tests go in the `test/` directory
- Test files should end with `.test.ts`
- Use Bun's test runner (`bun:test`)

### Writing Tests

```ts
import { describe, it, expect } from "bun:test";
import { zip, unzip } from "../src/index";

describe("zip/unzip", () => {
  it("should roundtrip string content", async () => {
    const files = new Map<string, string | Uint8Array>();
    files.set("hello.txt", "Hello, World!");
    const zipped = await zip(files);
    const unzipped = await unzip(zipped);
    expect(unzipped.get("hello.txt")).toBe("Hello, World!");
  });
});
```

### Test Coverage

Aim for comprehensive test coverage:
- Roundtrip tests (zip then unzip should match original)
- Edge cases (empty files, unicode filenames, large files)
- Error cases (invalid data, corrupted files)
- Different compression formats
- All output formats (Uint8Array, Blob, Base64)

---

## Documentation

### JSDoc

All public APIs must have JSDoc comments:

```ts
/**
 * Compresses a file map into a compressed Uint8Array.
 *
 * @param input - A Map or object containing file paths and contents.
 * @param options - Optional settings including compression format.
 * @returns A Promise that resolves to a compressed Uint8Array.
 *
 * @throws {SqurpError} PATH_TOO_LONG if any path exceeds 65535 bytes.
 *
 * @example
 * ```ts
 * const zipped = await zip(files);
 * ```
 */
export async function zip(input: ZipInput, options?: ZipOptions): Promise<Uint8Array>
```

### Documentation Files

- Update `README.md` for user-facing changes
- Update `docs/API.md` for API changes
- Add examples for new features

---

## Pull Request Process

### Before Submitting

1. Ensure all tests pass: `bun test`
2. Run type checking: `bun run typecheck`
3. Run linter: `bun run lint`
4. Update documentation as needed
5. Add tests for new functionality

### Pull Request Checklist

- [ ] I have read and understood the contributing guidelines
- [ ] My code follows the project's coding standards
- [ ] I have added tests for new functionality
- [ ] All tests pass locally
- [ ] I have updated documentation as needed
- [ ] My commit messages follow conventional commits

### Review Process

1. Maintainers will review your PR
2. You may be asked to make changes
3. Once approved, a maintainer will merge your PR

---

## Release Process

### Version Bumping

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create GitHub release
4. Publish to npm (maintainers only)

### Changelog Format

```markdown
## [version] - date

### Added
- Feature descriptions

### Changed
- Changed behavior descriptions

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security improvements
```

---

## Questions?

If you have questions, feel free to:
- Open an issue for discussion
- Check existing documentation
- Ask in discussions

---

Thank you for contributing to squrp!
