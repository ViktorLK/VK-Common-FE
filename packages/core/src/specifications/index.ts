// [MB.02] Explicit barrel export for specifications slice
export type { VKSpecificationPredicate } from './specifications.types.js';
export type { VKSpecification as IVKSpecification } from './specifications.types.js';
export { VKSpecificationConstants } from './specifications.constants.js';
export {
  VKSpecification,
  createVKSpecification,
  vkAllSpecification,
  vkNoneSpecification,
} from './create-vk-specification.js';
export { VKAndSpecification } from './vk-and-specification.js';
export { VKOrSpecification } from './vk-or-specification.js';
export { VKNotSpecification } from './vk-not-specification.js';
