// [CS.01] Assertion Error Codes
import { VKCoreErrorCodes } from '../errors/errors.constants.js';

export const VKAssertErrorCodes = {
  AssertionFailed: VKCoreErrorCodes.AssertionFailed,
  NullOrUndefined: 'Core.Assert.NullOrUndefined',
  EmptyString: 'Core.Assert.EmptyString',
  EmptyArray: 'Core.Assert.EmptyArray',
  InvalidEnum: 'Core.Assert.InvalidEnum',
  ExhaustiveMatchFailed: 'Core.Assert.ExhaustiveMatchFailed',
} as const;
