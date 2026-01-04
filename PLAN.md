# Implementation Plan

## Phase 1: Project Setup & Testing Foundation

### 1.1 Set Up Test Infrastructure
- [ ] Create `test/` directory structure
- [ ] Create `test/core/serialization.test.ts` for serialize/deserialize tests
- [ ] Create `test/core/compression.test.ts` for compression tests
- [ ] Create `test/api.test.ts` for public API tests
- [ ] Add empty file map test
- [ ] Add large file test (10MB+)
- [ ] Add unicode filename test
- [ ] Add special characters in path test
- [ ] Add roundtrip test (zip then unzip matches original)
- [ ] Run tests to verify they pass

### 1.2 Generate Type Definitions
- [ ] Run `bun build ./index.ts --outdir . --format esm --target browser` to update index.js
- [ ] Check if index.d.ts was generated, if not configure TypeScript to emit it
- [ ] Verify all public API functions have type exports
- [ ] Verify type exports are correctly listed in package.json exports

### 1.3 Add Error Handling
- [ ] Create `src/errors.ts` with `SqurpError` class and error codes enum
- [ ] Add error codes: INVALID_HEADER, CORRUPTED_DATA, UNSUPPORTED_VERSION, PATH_TOO_LONG, CONTENT_TOO_LARGE
- [ ] Refactor index.ts to use SqurpError with proper error codes
- [ ] Add error message factory functions for each error type
- [ ] Run tests to verify errors work correctly

### 1.4 Set Up Linting
- [ ] Create `.eslintrc.json` or configure biome.json
- [ ] Add pre-commit hook using husky or lefthook
- [ ] Run linter and fix any issues
- [ ] Ensure CI includes linting step

## Phase 2: Code Organization

### 2.1 Refactor into Modular Structure
- [ ] Create `src/` directory
- [ ] Move core logic from index.ts to `src/core/compression.ts`
- [ ] Move serialization logic to `src/core/serialization.ts`
- [ ] Move normalization to `src/core/normalize.ts`
- [ ] Move error codes to `src/errors.ts`
- [ ] Create `src/index.ts` as barrel file exporting all public APIs
- [ ] Update package.json to point to new src/index.ts
- [ ] Update build script to use new entry point
- [ ] Run tests to verify refactoring didn't break anything
- [ ] Run typecheck to ensure types are correct

### 2.2 Add JSDoc Comments
- [ ] Add JSDoc to all public API functions in src/index.ts
- [ ] Document parameters, return types, and examples
- [ ] Add @throws documentation for error cases
- [ ] Verify IDE tooltips work correctly

## Phase 3: Compression Format Support

### 3.1 Add Brotli Support
- [ ] Update compression functions to accept format parameter
- [ ] Add "br" as valid compression format
- [ ] Update tests to verify brotli compression/decompression
- [ ] Add brotli roundtrip tests
- [ ] Update API documentation

### 3.2 Add Deflate Support
- [ ] Add "deflate" as valid compression format
- [ ] Update compression functions
- [ ] Add deflate roundtrip tests
- [ ] Update API documentation

### 3.3 Auto-detect Compression Format
- [ ] Add function to detect compression format from magic bytes
- [ ] Update unzip to auto-detect format if not specified
- [ ] Add tests for auto-detection
- [ ] Document format detection behavior

## Phase 4: Streaming API

### 4.1 Add Streaming Zip
- [ ] Create `zipStream(writable, input, options)` function
- [ ] Implement WritableStream support
- [ ] Handle backpressure correctly
- [ ] Add progress callback option
- [ ] Add streaming zip tests

### 4.2 Add Streaming Unzip
- [ ] Create `unzipStream(readable, options)` function
- [ ] Implement ReadableStream support
- [ ] Add callback for each file as it's extracted
- [ ] Add streaming unzip tests

### 4.3 Add Progress Callbacks
- [ ] Add `onProgress` callback option to non-streaming APIs
- [ ] Report bytes processed and current file
- [ ] Add progress callback tests

## Phase 5: Node.js Support

### 5.1 Create Node.js Entry Point
- [ ] Create `node/index.js` with Node-compatible implementations
- [ ] Use `node:zlib` for compression/decompression
- [ ] Handle Buffer instead of Uint8Array where needed
- [ ] Create `node/index.d.ts` with Node-specific types

### 5.2 Update Package.json
- [ ] Add node export in package.json exports field
- [ ] Add conditional imports for node vs browser
- [ ] Add node.js to peerDependencies if needed

### 5.3 Test Node.js Support
- [ ] Create Node.js test script
- [ ] Test all APIs work with Node.js fs streams
- [ ] Verify Buffer compatibility

## Phase 6: Directory Support

### 6.1 Add Directory Reading (Node.js)
- [ ] Create `zipDirectory(path, options)` function
- [ ] Recursively read directory contents
- [ ] Preserve directory structure in archive
- [ ] Add directory zip tests

### 6.2 Add Directory Writing (Node.js)
- [ ] Create `unzipToDirectory(data, outputPath, options)` function
- [ ] Recreate directory structure on disk
- [ ] Handle file permissions
- [ ] Add directory unzip tests

### 6.3 Add Browser Directory Support
- [ ] Add File System Access API support where available
- [ ] Create helper for directory selection
- [ ] Add browser directory tests

## Phase 7: Security Hardening

### 7.1 Add Path Traversal Protection
- [ ] Add check for ".." in file paths
- [ ] Add check for absolute paths
- [ ] Add configurable allowed base path
- [ ] Add security tests with malicious paths

### 7.2 Add Size Limits
- [ ] Add max total size option
- [ ] Add max individual file size option
- [ ] Throw error when limits exceeded
- [ ] Add size limit tests

### 7.3 Add Checksum Verification
- [ ] Add optional CRC32 checksum
- [ ] Verify checksum on unzip
- [ ] Add checksum tests

## Phase 8: Documentation & Polish

### 8.1 Add Architecture Documentation
- [ ] Create `docs/FORMAT.md` explaining binary format
- [ ] Create `docs/API.md` with complete API reference
- [ ] Add architecture diagram to docs

### 8.2 Add Contributing Guide
- [ ] Create `CONTRIBUTING.md`
- [ ] Document development setup
- [ ] Document testing requirements
- [ ] Document coding standards

### 8.3 Add Examples
- [ ] Create `examples/` directory
- [ ] Add basic usage example
- [ ] Add streaming example
- [ ] Add Node.js file processing example

## Phase 9: Performance & Optimization

### 9.1 Add Benchmarks
- [ ] Create `benchmark/` directory
- [ ] Add benchmark for compression speed
- [ ] Add benchmark for decompression speed
- [ ] Add benchmark for serialization
- [ ] Document baseline performance numbers

### 9.2 Optimize Memory Usage
- [ ] Profile memory usage with large files
- [ ] Reduce unnecessary allocations
- [ ] Consider using ArrayBuffers more efficiently
- [ ] Document memory improvements

### 9.3 Reduce Bundle Size
- [ ] Measure current bundle size
- [ ] Identify opportunities to reduce size
- [ ] Set up bundle size tracking in CI
- [ ] Target bundle size goal

## Phase 10: Release Preparation

### 10.1 Version Bump (v1.1.0)
- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Create GitHub release
- [ ] Publish to npm

### 10.2 Version Bump (v1.2.0)
- [ ] Update version for streaming features
- [ ] Update CHANGELOG.md
- [ ] Create GitHub release
- [ ] Publish to npm

### 10.3 Version Bump (v2.0.0)
- [ ] Update major version
- [ ] Add migration guide
- [ ] Update CHANGEL.md
- [ ] Create GitHub release
- [ ] Publish to npm

## Task Dependencies

Some tasks depend on others completing first:

- Phase 1 tasks can be done in any order
- Phase 2 requires Phase 1 complete
- Phase 3 requires Phase 2 complete
- Phase 4 requires Phase 3 complete
- Phase 5 requires Phase 2 complete
- Phase 6 requires Phase 5 complete
- Phase 7 can be done in parallel with Phase 6
- Phase 8 requires earlier phases mostly complete
- Phase 9 should be done after all features are implemented
- Phase 10 is the final phase

## Verification Checklist

After completing each phase, verify:
- [ ] All tests pass (`bun test`)
- [ ] TypeScript typecheck passes (`bun run typecheck`)
- [ ] Build succeeds (`bun run build`)
- [ ] No lint errors
- [ ] Documentation is updated
- [ ] Examples work correctly
