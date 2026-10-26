import { z } from 'zod';

/**
 * Predefined Zod schema validation helpers to easily mirror backend FluentValidation constraints.
 */
export const vkZod = {
  /**
   * Defines a required string that automatically trims whitespace and ensures it is non-empty.
   */
  requiredString: (fieldName: string) =>
    z
      .string({
        required_error: `${fieldName} is required.`,
        invalid_type_error: `${fieldName} must be a string.`,
      })
      .trim()
      .min(1, { message: `${fieldName} cannot be empty.` }),

  /**
   * Defines a validated email field.
   */
  email: (fieldName: string) =>
    z
      .string({
        required_error: `${fieldName} is required.`,
      })
      .trim()
      .email({ message: `Invalid email format for ${fieldName}.` }),

  /**
   * Defines a standard E.164 phone format validation.
   */
  phone: (fieldName: string) =>
    z
      .string({
        required_error: `${fieldName} is required.`,
      })
      .trim()
      .regex(/^\+?[1-9]\d{1,14}$/, {
        message: `Invalid phone format for ${fieldName}.`,
      }),

  /**
   * Defines a standard GUID/UUID format matching backend unique IDs.
   */
  guid: (fieldName: string) =>
    z
      .string({
        required_error: `${fieldName} is required.`,
      })
      .trim()
      .uuid({ message: `${fieldName} must be a valid UUID.` }),
} as const;
