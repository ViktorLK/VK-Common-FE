// [BASE-01] [FS-01] [AP.01] Enterprise Form Hook with Standard Schema v1 Support
import { useForm, type UseFormProps, type UseFormReturn, type FieldValues } from 'react-hook-form';
import type { StandardSchemaV1, VKLegacySafeParseSchema } from '@vk-blocks/core';
import { vkStandardSchemaResolver } from './resolver/vk-standard-schema-resolver.js';
import type { z } from 'zod';

/**
 * Universal schema contract supported by useVKForm.
 * Accepts modern StandardSchemaV1, Zod schemas, or any schema with a .safeParse() method.
 */
export type VKFormSchema<TOutput = unknown> =
  | StandardSchemaV1<unknown, TOutput>
  | VKLegacySafeParseSchema<TOutput>
  | z.ZodType<TOutput, any, any>;

/**
 * Inferred output data type from a StandardSchemaV1, Zod schema, or legacy safeParse schema.
 */
export type InferSchemaOutput<TSchema> =
  TSchema extends z.ZodType<infer TOutput, any, any>
    ? TOutput
    : TSchema extends StandardSchemaV1<unknown, infer TOutput>
      ? TOutput
      : TSchema extends VKLegacySafeParseSchema<infer TOutput>
        ? TOutput
        : FieldValues;

export interface UseVKFormProps<TSchema extends VKFormSchema<any>>
  extends Omit<UseFormProps<InferSchemaOutput<TSchema>>, 'resolver'> {
  /**
   * The validation schema (StandardSchemaV1, Zod, or safeParse-compatible schema).
   */
  readonly schema: TSchema;
}

/**
 * Dedicated interface preserving 100% backward compatibility for Zod schemas.
 */
export interface UseVKFormPropsZod<T extends z.ZodTypeAny>
  extends Omit<UseFormProps<z.infer<T>>, 'resolver'> {
  readonly schema: T;
}

/**
 * Dedicated interface for StandardSchemaV1 schemas.
 */
export interface UseVKFormPropsStandard<TOutput extends FieldValues = FieldValues>
  extends Omit<UseFormProps<TOutput>, 'resolver'> {
  readonly schema: StandardSchemaV1<unknown, TOutput>;
}

/**
 * Enterprise Form Hook adhering to Standard Schema v1 specification (FS-01, CS.01).
 * Decouples form validation from vendor-specific resolvers (Zod, Valibot, ArkType)
 * while maintaining 100% backward compatibility with existing Zod schemas.
 */
export function useVKForm<T extends z.ZodTypeAny>(
  props: UseVKFormPropsZod<T>,
): UseFormReturn<z.infer<T>>;
export function useVKForm<TOutput extends FieldValues>(
  props: UseVKFormPropsStandard<TOutput>,
): UseFormReturn<TOutput>;
export function useVKForm<TSchema extends VKFormSchema<any>>(
  props: UseVKFormProps<TSchema>,
): UseFormReturn<InferSchemaOutput<TSchema>>;
export function useVKForm(
  props: UseVKFormProps<any>,
): UseFormReturn<any> {
  const { schema, ...formProps } = props;
  return useForm<FieldValues>({
    ...(formProps as UseFormProps<FieldValues>),
    resolver: vkStandardSchemaResolver(schema),
  });
}

export type { UseFormReturn } from 'react-hook-form';
