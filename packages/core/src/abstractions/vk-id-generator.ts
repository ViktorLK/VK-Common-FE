export interface VKIdGenerator {
  readonly generate: () => string;
}

export const defaultIdGenerator: VKIdGenerator = {
  generate: () => crypto.randomUUID(),
};
