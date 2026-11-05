// Seed for drop-healthcheck. Deleting a line that matches /health|ready/
// (for example the healthcheck export below) should hit that rule.

export function ready(): boolean {
  return true;
}
