import { vi } from 'vitest';

// 只 mock fetch，保留原生 Headers/Request/Response
if (!global.fetch) {
  global.fetch = vi.fn();
}
