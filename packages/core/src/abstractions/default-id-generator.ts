// [CS.06] Default ID Generator implementation unified with VKGuidGenerator (RFC 9562 UUIDv7 / RFC 4122 UUIDv4)
import type { VKIdGenerator } from './abstractions.types.js';
import { defaultGuidGenerator } from '../guids/default-guid-generator.js';

export const defaultIdGenerator: VKIdGenerator = defaultGuidGenerator;
