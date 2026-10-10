// [CS.06] Safe serialization utility: handles BigInt, circular references, Date, and Error
export function safeJsonStringify(
  value: unknown,
  replacer?: (key: string, value: unknown) => unknown,
  space?: string | number,
): string {
  const stack: object[] = [];

  return JSON.stringify(
    value,
    function (this: unknown, key: string, val: unknown) {
      let current = val;

      if (replacer) {
        current = replacer(key, current);
      }

      if (typeof current === 'bigint') {
        return current.toString();
      }

      if (current instanceof Error) {
        return {
          name: current.name,
          message: current.message,
          code: (current as { code?: unknown }).code,
          stack: current.stack,
        };
      }

      if (typeof current === 'object' && current !== null) {
        if (typeof this === 'object' && this !== null) {
          const thisPos = stack.indexOf(this as object);
          if (thisPos !== -1) {
            stack.length = thisPos + 1;
          } else {
            stack.push(this as object);
          }
        }

        if (stack.includes(current)) {
          return '[Circular]';
        }

        if (current instanceof Map) {
          return {
            __vk_type: 'Map',
            entries: Array.from(current.entries()),
          };
        }

        if (current instanceof Set) {
          return {
            __vk_type: 'Set',
            values: Array.from(current.values()),
          };
        }

        if (current instanceof RegExp) {
          return {
            __vk_type: 'RegExp',
            source: current.source,
            flags: current.flags,
          };
        }
      }

      return current;
    },
    space,
  );
}
