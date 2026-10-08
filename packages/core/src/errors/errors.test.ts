import { describe, it, expect } from 'vitest';
import { VKError, VKErrorType, VKCoreErrors, VKCoreErrorCodes, toVKError } from './index.js';

describe('errors', () => {
  it('creates VKError with RFC 7807 properties and fixes detail mapping', () => {
    const err = VKError.notFound('Resource.NotFound', 'Item 123 was not found', {
      instance: '/api/v1/items/123',
      detail: 'Detailed message',
      extensions: { itemId: '123' },
    });

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(VKError);
    expect(err.code).toBe('Resource.NotFound');
    expect(err.status).toBe(404);
    expect(err.errorType).toBe(VKErrorType.NotFound);
    expect(err.detail).toBe('Detailed message');
    expect(err.instance).toBe('/api/v1/items/123');
    expect(err.extensions).toEqual({ itemId: '123' });
    expect(err.type).toBe(VKErrorType.NotFound);

    const customErr = VKError.notFound('Custom.Error', 'Msg', {
      type: 'https://example.com/probs/not-found',
    });
    expect(customErr.type).toBe('https://example.com/probs/not-found');

    const problemDetails = err.toProblemDetails();
    expect(problemDetails.detail).toBe('Detailed message');
    expect(problemDetails.status).toBe(404);

    const json = err.toJSON();
    expect(json['code']).toBe('Resource.NotFound');
    expect(json['detail']).toBe('Detailed message');
  });

  it('toVKError safely converts standard error to VKError', () => {
    const nativeErr = new Error('Standard failure');
    const vkErr = toVKError(nativeErr);

    expect(vkErr).toBeInstanceOf(VKError);
    expect(vkErr.message).toBe('Standard failure');
    expect(vkErr.cause).toBe(nativeErr);
    expect(vkErr.code).toBe(VKCoreErrorCodes.ExecutionError);
  });

  it('toVKError returns existing VKError as-is', () => {
    const existing = VKCoreErrors.Unauthorized;
    expect(toVKError(existing)).toBe(existing);
  });

  it('VKCoreErrors contains all centralized errors', () => {
    expect(VKCoreErrors.NullValue.code).toBe(VKCoreErrorCodes.NullValue);
    expect(VKCoreErrors.Unauthorized.status).toBe(401);
  });

  it('supports VKErrorCategory, traceId, and structured fieldErrors', () => {
    const err = VKError.validation('Order.Invalid', 'Order validation failed', {
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      fieldErrors: [
        { path: 'items[0].quantity', code: 'Order.Quantity.Positive', message: 'Quantity must be > 0' },
      ],
    });

    expect(err.category).toBe('Validation');
    expect(err.errorType).toBe('Validation');
    expect(err.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
    expect(err.fieldErrors).toHaveLength(1);
    expect(err.fieldErrors?.[0].path).toBe('items[0].quantity');

    const json = err.toJSON();
    expect(json['category']).toBe('Validation');
    expect(json['traceId']).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
    expect(json['fieldErrors']).toHaveLength(1);
  });
});
