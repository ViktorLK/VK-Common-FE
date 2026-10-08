// [FS-05] Datetime contracts and options

export interface VKDateFormatOptions {
  readonly timezone?: string;
  readonly format?: string;
}

export interface VKTimeZoneFormatOptions extends Intl.DateTimeFormatOptions {
  readonly locale?: string;
}

