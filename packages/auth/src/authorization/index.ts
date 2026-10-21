// [MB.02] Explicit barrel export - Authorization Engine & Ability Model
export {
  VKAuthorizationEngine,
  type AuthRequirement,
} from './vk-authorization-engine.js';

export {
  VKAbility,
  createAbility,
  defineAbility,
  type IVKAbility,
  type AbilityRule,
  type AbilityBuilder,
  type RulePredicate,
} from './ability.js';
