export type HParam = {
  k: {
    // N, 刻み数
    count: number;
    // 刻み幅, readonly
    stride: number;
    lowerBound: number;
    upperBound: number;
  };
};

export const Gauss = (x: number, mu: number, sigma: number) =>
  (1 / Math.sqrt(2 * Math.PI * sigma * sigma)) *
  Math.exp((-1 * (x - mu) * (x - mu)) / 2 / sigma / sigma);

export const INITIAL_HYPER_PARAMS: HParam = {
  k: {
    count: 100,
    stride: (1e-4 - 1e-5) / 100,
    lowerBound: 1e-5,
    upperBound: 1e-4,
  },
};
