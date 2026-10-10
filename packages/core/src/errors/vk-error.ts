// [CS.01] Centralized Error Model
// [FS-02] RFC 7807 ProblemDetails compliance
import { VKErrorCategory, VKErrorType, VKCoreErrorCodes } from './errors.constants.js';
import type {
  VKErrorOptions,
  VKProblemDetails,
  VKFieldError,
  VKErrorSeverity,
  VKErrorCategory as VKErrorCategoryEnum,
} from './errors.types.js';

/**
 * Standard enterprise error for VK.Blocks, implementing RFC 7807 ProblemDetails.
 */
export class VKError extends Error implements VKProblemDetails {
  public readonly code: string;
  public readonly description: string;
  public readonly category: VKErrorCategoryEnum;
  public readonly errorType: VKErrorCategoryEnum;
  public readonly severity: VKErrorSeverity;
  public readonly status: number;
  public readonly type: string;
  public readonly title: string;
  public readonly detail: string;
  public readonly instance?: string;
  public readonly extensions?: Readonly<Record<string, unknown>>;
  public override readonly cause?: unknown;
  public readonly traceId?: string;
  public readonly fieldErrors?: readonly VKFieldError[];

  constructor(
    code: string,
    description: string,
    category: VKErrorCategoryEnum = VKErrorCategory.Failure,
    options?: VKErrorOptions,
  ) {
    super(description);
    this.name = 'VKError';
    this.code = code;
    this.description = description;
    this.category = options?.category ?? category;
    this.errorType = this.category;
    this.severity = options?.severity ?? VKError.defaultSeverityForCategory(this.category);
    // [FS-02] [ARCH-02] Authoritative category-to-status mapping lives in @vk-blocks/api.
    // Core provides fallback-tier default status to preserve RFC 7807 compliance per BASE-04.
    this.status = options?.status ?? VKError.defaultStatusForType(this.category);
    this.type = options?.type ?? this.category;
    this.title = options?.title ?? code;
    this.detail = options?.detail ?? description;
    this.instance = options?.instance;
    this.extensions = options?.extensions;
    this.cause = options?.cause;
    this.traceId = options?.traceId;
    this.fieldErrors = options?.fieldErrors;

    // Restore prototype chain in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Neutral fallback status per BASE-04. Authoritative transport mapping belongs in @vk-blocks/api.
   */
  private static defaultStatusForType(type: VKErrorCategoryEnum): number {
    switch (type) {
      case VKErrorCategory.Validation:
        return 400;
      case VKErrorCategory.Unauthorized:
        return 401;
      case VKErrorCategory.Forbidden:
        return 403;
      case VKErrorCategory.NotFound:
        return 404;
      case VKErrorCategory.Conflict:
        return 409;
      case VKErrorCategory.PreconditionFailed:
        return 412;
      case VKErrorCategory.TooManyRequests:
        return 429;
      case VKErrorCategory.Timeout:
        return 408;
      case VKErrorCategory.ServiceUnavailable:
        return 503;
      case VKErrorCategory.ExternalError:
      case VKErrorCategory.Failure:
        return 500;
      case VKErrorCategory.None:
        return 200;
      default: {
        const _exhaustive: never = type;
        return 500;
      }
    }
  }

  /**
   * Neutral fallback severity per BASE-04. System errors are marked 'error', validation 'warn'.
   */
  private static defaultSeverityForCategory(category: VKErrorCategoryEnum): VKErrorSeverity {
    switch (category) {
      case VKErrorCategory.ExternalError:
      case VKErrorCategory.Failure:
      case VKErrorCategory.ServiceUnavailable:
      case VKErrorCategory.Timeout:
        return 'error';
      case VKErrorCategory.Validation:
      case VKErrorCategory.NotFound:
      case VKErrorCategory.Conflict:
      case VKErrorCategory.Unauthorized:
      case VKErrorCategory.Forbidden:
      case VKErrorCategory.PreconditionFailed:
      case VKErrorCategory.TooManyRequests:
        return 'warn';
      case VKErrorCategory.None:
        return 'info';
      default: {
        const _exhaustive: never = category;
        return 'error';
      }
    }
  }

  // Predefined sentinel errors
  public static readonly nullValue = new VKError(
    VKCoreErrorCodes.NullValue,
    'The specified result value is null.',
    VKErrorCategory.Failure,
    { status: 500 },
  );

  public static readonly conditionNotMet = new VKError(
    VKCoreErrorCodes.ConditionNotMet,
    'The specified condition was not met.',
    VKErrorCategory.Failure,
    { status: 500 },
  );

  /**
   * Formats a safe RFC 7807 ProblemDetails object excluding internal cause/stack.
   */
  public toProblemDetails(): VKProblemDetails {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.detail,
      ...(this.instance !== undefined ? { instance: this.instance } : {}),
      ...(this.extensions !== undefined ? { extensions: this.extensions } : {}),
    };
  }

  /**
   * Safe JSON representation for transmission.
   */
  public toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      description: this.description,
      category: this.category,
      errorType: this.errorType,
      severity: this.severity,
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.detail,
      ...(this.instance !== undefined ? { instance: this.instance } : {}),
      ...(this.traceId !== undefined ? { traceId: this.traceId } : {}),
      ...(this.fieldErrors !== undefined ? { fieldErrors: this.fieldErrors } : {}),
      ...(this.extensions !== undefined ? { extensions: this.extensions } : {}),
    };
  }

  // Static Factory Methods
  public static validation(code: string, description: string, options?: VKErrorOptions): VKError {
    return new VKError(code, description, VKErrorCategory.Validation, options);
  }

  public static unauthorized(code: string, description: string, options?: VKErrorOptions): VKError {
    return new VKError(code, description, VKErrorCategory.Unauthorized, options);
  }

  public static forbidden(code: string, description: string, options?: VKErrorOptions): VKError {
    return new VKError(code, description, VKErrorCategory.Forbidden, options);
  }

  public static notFound(code: string, description: string, options?: VKErrorOptions): VKError {
    return new VKError(code, description, VKErrorCategory.NotFound, options);
  }

  public static conflict(code: string, description: string, options?: VKErrorOptions): VKError {
    return new VKError(code, description, VKErrorCategory.Conflict, options);
  }

  public static preconditionFailed(code: string, description: string, options?: VKErrorOptions): VKError {
    return new VKError(code, description, VKErrorCategory.PreconditionFailed, options);
  }

  public static tooManyRequests(code: string, description: string, options?: VKErrorOptions): VKError {
    return new VKError(code, description, VKErrorCategory.TooManyRequests, options);
  }

  public static failure(code: string, description: string, options?: VKErrorOptions): VKError {
    return new VKError(code, description, VKErrorCategory.Failure, options);
  }

  public static externalError(code: string, description: string, options?: VKErrorOptions): VKError {
    return new VKError(code, description, VKErrorCategory.ExternalError, options);
  }

  public static serviceUnavailable(code: string, description: string, options?: VKErrorOptions): VKError {
    return new VKError(code, description, VKErrorCategory.ServiceUnavailable, options);
  }

  public static timeout(code: string, description: string, options?: VKErrorOptions): VKError {
    return new VKError(code, description, VKErrorCategory.Timeout, options);
  }
}

