/** Graceful shutdown helper */
export function setupGracefulShutdown(callback: () => Promise<void> | void): void {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const sig of signals) {
    process.on(sig, async () => {
      // eslint-disable-next-line no-console
      console.log(`Received ${sig}, shutting down...`);
      try {
        await callback();
      } finally {
        process.exit(0);
      }
    });
  }
}
