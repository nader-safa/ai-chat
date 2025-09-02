# Test Suite Documentation

## Overview

This test suite provides comprehensive coverage for the Express TypeScript chat application. It uses **Bun's built-in testing framework** for fast, reliable testing with proper mocking and isolation.

## Test Structure

```
__tests__/
├── setup.ts                           # Test environment configuration
├── README.md                          # This documentation
├── controllers/
│   └── chat.controller.test.ts        # Chat controller unit tests
├── services/
│   └── chat.service.test.ts           # Chat service unit tests with OpenAI mocking
├── repositories/
│   └── conversation.repository.test.ts # Repository unit tests
├── routes/
│   ├── index.test.ts                  # Main router integration tests
│   └── v1/
│       ├── chat.router.test.ts        # Chat router unit tests
│       └── health.router.test.ts      # Health router unit tests
└── index.test.ts                      # Main application tests
```

## Test Categories

### 1. Unit Tests

**Health Router** (`health.router.test.ts`)

- ✅ Basic health check functionality
- ✅ Response format validation
- ✅ Performance testing (sub-100ms response)
- ✅ HTTP method restrictions
- ✅ Content-Type validation

**Chat Controller** (`chat.controller.test.ts`)

- ✅ Request validation with Zod schema
- ✅ Error handling for invalid requests
- ✅ Service integration
- ✅ Repository updates
- ✅ HTTP status codes
- ✅ Edge cases (empty prompts, invalid UUIDs, etc.)

**Chat Service** (`chat.service.test.ts`)

- ✅ OpenAI API integration (mocked)
- ✅ Conversation continuity
- ✅ Error handling (API failures, timeouts)
- ✅ Response format validation
- ✅ Configuration validation

**Conversation Repository** (`conversation.repository.test.ts`)

- ✅ Data storage and retrieval
- ✅ Data integrity across multiple conversations
- ✅ Edge cases (special characters, long IDs)
- ✅ Memory management

**Chat Router** (`chat.router.test.ts`)

- ✅ Route configuration
- ✅ Controller integration
- ✅ HTTP method restrictions
- ✅ Path matching
- ✅ Middleware integration

### 2. Integration Tests

**Main Router** (`index.test.ts`)

- ✅ Route mounting and structure
- ✅ Cross-route functionality
- ✅ Concurrent request handling
- ✅ Error isolation between routes
- ✅ Performance testing

**Main Application** (`index.test.ts`)

- ✅ Express app configuration
- ✅ Middleware setup and order
- ✅ Environment configuration
- ✅ Error handling and recovery
- ✅ Content-Type handling

## Key Testing Features

### Mocking Strategy

1. **OpenAI API**: Fully mocked to avoid external dependencies and API costs
2. **Services**: Mocked at module level for controller tests
3. **Environment**: Controlled test environment variables

### Validation Testing

- **Zod Schema Validation**: Comprehensive testing of all validation rules
- **UUID Format**: Proper UUID format validation
- **Prompt Length**: Min/max length validation
- **Whitespace Handling**: Trimming and empty string detection

### Error Scenarios

- **API Failures**: OpenAI service unavailability
- **Network Issues**: Timeout and connection errors
- **Validation Errors**: Invalid input formats
- **Malformed Requests**: JSON parsing errors
- **Unexpected Errors**: Generic error handling

### Performance Testing

- **Response Time**: Health checks under 100ms
- **Concurrent Requests**: Multiple simultaneous requests
- **Memory Usage**: Basic memory leak detection
- **Rapid Requests**: Stress testing with multiple quick requests

## Running Tests

### All Tests

```bash
bun test
```

### Watch Mode

```bash
bun test --watch
```

### Coverage Report

```bash
bun test --coverage
```

### Specific Test Files

```bash
bun test __tests__/controllers/chat.controller.test.ts
bun test __tests__/services/chat.service.test.ts
```

### Specific Test Patterns

```bash
bun test --grep "validation"
bun test --grep "error handling"
```

## Test Configuration

The test suite is configured with:

- **Environment Variables**: Isolated test environment
- **Timeouts**: Appropriate timeouts for async operations
- **Mocking**: Comprehensive mocking of external dependencies
- **Setup/Teardown**: Proper test isolation

## Mock Configuration

### OpenAI Service

- Mock responses with configurable content
- Error simulation for various failure scenarios
- Validation of API call parameters

### Conversation Repository

- In-memory storage for test isolation
- Configurable responses for different scenarios

### Environment Variables

- Controlled test environment
- No external API keys required

## Test Best Practices

1. **Isolation**: Each test is independent and can run in any order
2. **Mocking**: External dependencies are mocked to ensure reliability
3. **Assertions**: Clear, specific assertions with meaningful error messages
4. **Coverage**: Comprehensive coverage of happy paths and edge cases
5. **Performance**: Tests complete quickly for rapid feedback

## Example Test Patterns

### Basic Route Test

```typescript
test('should return expected response', async () => {
  const response = await request(app).get('/api/v1/health').expect(200)

  expect(response.body).toEqual({ status: 'ok' })
})
```

### Validation Test

```typescript
test('should return 400 for invalid input', async () => {
  const response = await request(app)
    .post('/api/v1/chat')
    .send({
      /* invalid data */
    })
    .expect(400)

  expect(response.body.issues[0]).toHaveProperty('message')
})
```

### Service Mock Test

```typescript
test('should handle service errors', async () => {
  mockService.mockRejectedValue(new Error('Service error'))

  await request(app).post('/api/v1/chat').send(validRequest).expect(500)
})
```

## Debugging Tests

1. **Console Logging**: Add `console.log` statements for debugging
2. **Test Isolation**: Run individual tests to isolate issues
3. **Mock Verification**: Check mock call counts and parameters
4. **Error Messages**: Review detailed error messages and stack traces

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Include both positive and negative test cases
3. Test edge cases and error conditions
4. Update this documentation if needed
5. Ensure all tests pass before committing

## Test Metrics

The test suite aims for:

- **100% route coverage**: All endpoints tested
- **95%+ code coverage**: Most code paths covered
- **Fast execution**: All tests complete in under 30 seconds
- **Reliable**: Tests pass consistently across different environments
