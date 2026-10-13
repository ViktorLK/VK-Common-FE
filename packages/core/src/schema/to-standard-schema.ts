// [BASE-04] Adapter to convert legacy safeParse schemas to StandardSchemaV1
import type { StandardSchemaV1, VKLegacySafeParseSchema } from './schema.types.js';

/**
 * Adapts a legacy Zod-like schema (having .safeParse()) into the official StandardSchemaV1 contract.
 * Facilitates backward-compatibility without vendor lock-in.
 */
export function toStandardSchema<TOutput>(
  legacySchema: VKLegacySafeParseSchema<TOutput>,
  vendorName = 'legacy-adapter',
): StandardSchemaV1<unknown, TOutput> {
  return {
    '~standard': {
      version: 1,
      vendor: vendorName,
      validate(value: unknown): StandardSchemaV1.Result<TOutput> {
        const result = legacySchema.safeParse(value);
        if (result.success) {
          return { value: result.data };
        }

        const issues: StandardSchemaV1.Issue[] = [];
        if (result.error.flatten) {
          const flattened = result.error.flatten();
          for (const [field, messages] of Object.entries(flattened.fieldErrors)) {
            const msgs = Array.isArray(messages) ? messages : [String(messages)];
            for (const msg of msgs) {
              issues.push({
                message: String(msg),
                path: [field],
              });
            }
          }
        }

        if (issues.length === 0) {
          issues.push({
            message: result.error.message ?? 'Validation failed',
          });
        }

        return { issues };
      },
    },
  };
}

/**
 * Adapter function conforming to VK prefix convention per AP.03.
 */
export const vkToStandardSchema = toStandardSchema;
