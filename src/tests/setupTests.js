import { beforeAll, afterEach, vi } from 'vitest';

beforeAll(() => {
  vi.mock('d3-random', () => ({
    randomInt: vi.fn().mockImplementation((min, max) => () => min),
    randomBernoulli: vi.fn().mockImplementation(p => () => p > 0.5)
  }));

  Object.defineProperty(global, 'navigator', {
    value: {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    },
    writable: true,
  });

  global.setInterval = vi.fn().mockReturnValue(1);
  global.clearInterval = vi.fn();
})

afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});
