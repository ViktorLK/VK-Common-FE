// [BASE-01] [AP.01] Isomorphic CASL-aligned Ability Engine & Rule Builder
export type RulePredicate<TSubject = unknown> = (subject: TSubject) => boolean;

export interface AbilityRule<TAction extends string = string, TSubject = unknown> {
  readonly action: TAction | readonly TAction[];
  readonly subject: string;
  readonly inverted?: boolean;
  readonly condition?: RulePredicate<TSubject>;
}

export interface IVKAbility<TAction extends string = string, TSubject = unknown> {
  can(action: TAction, subject: TSubject | string): boolean;
  cannot(action: TAction, subject: TSubject | string): boolean;
  readonly rules: readonly AbilityRule<TAction, TSubject>[];
}

export interface AbilityBuilder<TAction extends string = string, TSubject = unknown> {
  can(
    action: TAction | readonly TAction[],
    subject: string,
    condition?: RulePredicate<TSubject>,
  ): void;
  cannot(
    action: TAction | readonly TAction[],
    subject: string,
    condition?: RulePredicate<TSubject>,
  ): void;
}

/**
 * Resolves standard entity type name from subject string or instance.
 */
function resolveSubjectType(subject: unknown): string {
  if (typeof subject === 'string') {
    return subject;
  }
  if (typeof subject === 'object' && subject !== null) {
    if ('__type' in subject && typeof (subject as { __type?: unknown }).__type === 'string') {
      return (subject as { __type: string }).__type;
    }
    const constructorName = subject.constructor?.name;
    if (constructorName && constructorName !== 'Object') {
      return constructorName;
    }
  }
  return 'all';
}

/**
 * Matches action against rule's action or action array, supporting 'manage' wildcard.
 */
function actionMatches<TAction extends string>(
  ruleAction: TAction | readonly TAction[],
  action: TAction,
): boolean {
  if (ruleAction === 'manage' || action === 'manage') {
    return true;
  }
  if (Array.isArray(ruleAction)) {
    return ruleAction.includes(action) || ruleAction.includes('manage' as TAction);
  }
  return ruleAction === action;
}

/**
 * Enterprise Isomorphic Ability Engine.
 * Evaluates fine-grained permissions and ABAC dynamic attributes across Client, Server, and Edge.
 */
export class VKAbility<TAction extends string = string, TSubject = unknown>
  implements IVKAbility<TAction, TSubject>
{
  readonly rules: readonly AbilityRule<TAction, TSubject>[];

  constructor(rules: readonly AbilityRule<TAction, TSubject>[] = []) {
    this.rules = rules;
  }

  can(action: TAction, subject: TSubject | string): boolean {
    const subjectName = resolveSubjectType(subject);

    // 1. Inverted (cannot) rules take precedence
    for (const rule of this.rules) {
      if (!rule.inverted) continue;

      if (
        (rule.subject === 'all' || rule.subject === subjectName) &&
        actionMatches(rule.action, action)
      ) {
        if (!rule.condition) {
          return false;
        }
        if (typeof subject === 'object' && subject !== null && rule.condition(subject as TSubject)) {
          return false;
        }
      }
    }

    // 2. Direct (can) rules evaluation
    for (const rule of this.rules) {
      if (rule.inverted) continue;

      if (
        (rule.subject === 'all' || rule.subject === subjectName) &&
        actionMatches(rule.action, action)
      ) {
        if (!rule.condition) {
          return true;
        }
        if (typeof subject === 'object' && subject !== null && rule.condition(subject as TSubject)) {
          return true;
        }
      }
    }

    return false;
  }

  cannot(action: TAction, subject: TSubject | string): boolean {
    return !this.can(action, subject);
  }
}

/**
 * Factory creating an IVKAbility from an array of pre-built rules.
 */
export function createAbility<TAction extends string = string, TSubject = unknown>(
  rules: readonly AbilityRule<TAction, TSubject>[] = [],
): IVKAbility<TAction, TSubject> {
  return new VKAbility(rules);
}

/**
 * Centralized rule builder function for defining typed ABAC/RBAC abilities.
 *
 * Example:
 * ```ts
 * const ability = defineAbility((can, cannot) => {
 *   can('read', 'Invoice');
 *   can('edit', 'Invoice', (doc) => doc.ownerId === user.id);
 *   cannot('delete', 'Invoice', (doc) => doc.isArchived);
 * });
 * ```
 */
export function defineAbility<TAction extends string = string, TSubject = unknown>(
  define: (builder: AbilityBuilder<TAction, TSubject>) => void,
): IVKAbility<TAction, TSubject> {
  const rules: AbilityRule<TAction, TSubject>[] = [];

  const builder: AbilityBuilder<TAction, TSubject> = {
    can: (action, subject, condition) => {
      rules.push({
        action,
        subject,
        inverted: false,
        condition,
      });
    },
    cannot: (action, subject, condition) => {
      rules.push({
        action,
        subject,
        inverted: true,
        condition,
      });
    },
  };

  define(builder);
  return new VKAbility(rules);
}
