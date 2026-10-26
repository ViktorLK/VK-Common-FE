// [MB.02] Explicit barrel export - Forms Layer

// Form Container & Deconstructed Binding Primitives
export { VKForm } from './components/VKForm.js';
export type { VKFormProps } from './components/VKForm.js';

export { VKFormField } from './components/VKFormField.js';
export type {
  VKFormFieldProps,
  VKFormFieldRenderProps,
} from './components/VKFormField.js';

// Accessible Root Form Error Alert
export { VKFormRootAlert } from './components/VKFormRootAlert.js';
export type { VKFormRootAlertProps } from './components/VKFormRootAlert.js';

// Server Actions & Progressive Enhancement Controls
export { VKSubmitButton } from './components/VKSubmitButton.js';
export type { VKSubmitButtonProps } from './components/VKSubmitButton.js';

export {
  useVKActionForm,
  useVKActionFormContext,
  valuesToFormData,
  VKActionFormContext,
} from './hooks/useVKActionForm.js';
export type {
  VKServerAction,
  UseVKActionFormOptions,
  UseVKActionFormReturn,
  VKActionFormContextValue,
} from './hooks/useVKActionForm.js';


// Standard Schema & Form Hooks
export { useVKForm } from './useVKForm.js';
export type {
  UseVKFormProps,
  UseFormReturn,
  VKFormSchema,
  InferSchemaOutput,
} from './useVKForm.js';

export { vkStandardSchemaResolver } from './resolver/vk-standard-schema-resolver.js';
export type { VKStandardSchemaResolverOptions } from './resolver/vk-standard-schema-resolver.js';

// Multi-step State Machine & Dirty Protection
export { useMultiStepForm } from './hooks/useMultiStepForm.js';
export type {
  UseMultiStepFormOptions,
  UseMultiStepFormReturn,
  VKMultiStepPersistenceConfig,
} from './hooks/useMultiStepForm.js';

export { useDirtyGuard } from './hooks/useDirtyGuard.js';
export type {
  UseDirtyGuardOptions,
  UseDirtyGuardReturn,
} from './hooks/useDirtyGuard.js';

// Autosave & Crash Recovery
export {
  useFormAutosave,
  DEFAULT_SENSITIVE_FIELDS,
} from './hooks/useFormAutosave.js';
export type {
  UseFormAutosaveOptions,
  UseFormAutosaveReturn,
  VKFormStorageAdapter,
  VKFormDraftPayload,
} from './hooks/useFormAutosave.js';

export { useFormRecovery } from './hooks/useFormRecovery.js';
export type {
  UseFormRecoveryOptions,
  UseFormRecoveryReturn,
} from './hooks/useFormRecovery.js';

// Zod Extensions
export { vkZod } from './vk-zod-extensions.js';

// Server Error Mappers (VKResult & RFC 7807 ProblemDetails)
export {
  mapVKResultErrorsToFormErrors,
  mapVKProblemDetailsToFormErrors,
  parseServerFieldPath,
} from './vk-form-mapper.js';
export type {
  MapErrorsOptions,
  VKProblemDetailsPayload,
} from './vk-form-mapper.js';
