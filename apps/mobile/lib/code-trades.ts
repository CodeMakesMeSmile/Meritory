// Half the server's limit on trades per minute, so junk links can't use it all up
const MAX_CODES = 5;

/**
 * Trades the codes that arrive during one sign-in, one at a time, until one works.
 * A code that fails doesn't end the sign-in, because any app can send a link with a wrong one.
 */
export function createCodeTrades(
  trade: (code: string) => Promise<boolean>,
  limit = MAX_CODES,
) {
  const tried = new Set<string>();
  let settled = Promise.resolve(false);
  let won = () => {};
  const success = new Promise<true>((resolve) => {
    won = () => resolve(true);
  });

  return {
    /** Whether any code has arrived */
    get started() {
      return tried.size > 0;
    },
    offer(code: string) {
      // A code is single use, so a repeat can't work
      if (tried.has(code) || tried.size >= limit) return;
      tried.add(code);
      settled = settled.then(async (done) => {
        // Only the first code that works counts
        if (done) return true;
        const traded = await trade(code).catch(() => false);
        if (traded) won();
        return traded;
      });
    },
    /** True as soon as a code works, and false if none has after the wait */
    async result(waitMs: number) {
      if (await settled) return true;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<false>((resolve) => {
        timer = setTimeout(() => resolve(false), waitMs);
      });
      try {
        return await Promise.race([success, timeout]);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

/** The link that opened the app, unless it was already there when the sign-in began */
export function freshLink(before: string | null, after: string | null) {
  return after && after !== before ? after : null;
}
