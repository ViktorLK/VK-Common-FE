import { describe, it, expectTypeOf } from 'vitest';
import type { VKError } from './vk-error.js';
import type { VKProblemDetails, VKErrorOptions, VKErrorType } from './errors.types.js';

describe('errors.test-d', () => {
  it('verifies VKProblemDetails structural contracts', () => {
    expectTypeOf<VKError>().toMatchTypeOf<VKProblemDetails>();
    expectTypeOf<VKErrorOptions['status']>().toEqualTypeOf<number | undefined>();
  });

  it('verifies VKErrorType values', () => {
    expectTypeOf<VKErrorType>().toEqualTypeOf<
      | 'None'
      | 'Validation'
      | 'Unauthorized'
      | 'Forbidden'
      | 'NotFound'
      | 'Conflict'
      | 'PreconditionFailed'
      | 'TooManyRequests'
      | 'Failure'
      | 'ExternalError'
      | 'ServiceUnavailable'
      | 'Timeout'
    >();
  });
});
