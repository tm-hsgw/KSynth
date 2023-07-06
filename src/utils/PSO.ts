type Candidate = {
  value: number[];
  error: number;
};

type Particle = {
  z: Candidate;
  v: number[];
  pBest: Candidate;
};

type Swarm = {
  swarm: Particle[];
  gBest: Candidate;
  // todo: Boundをarrayに
  lowerBound: number;
  upperBound: number;
  inertia: number;
  cp: number;
  cg: number;
  fit: (
    f: (candidate: number[]) => number,
    tmax: number,
    criterion?: number
  ) => OptimizeResult;
};

export type OptimizeResult = {
  value: number[];
  error: number;
  iteraions: number;
};

const randint = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // [min. max)
};

const randarr = (n: number, min: number = 0, max: number = 1) =>
  [...Array(n)].map((_) => Math.random() * (max - min) + min);

const Particle = (d: number, min: number, max: number): Particle => {
  const self: Particle = {
    z: {
      value: randarr(d, min, max),
      error: Infinity,
    },
    v: [...Array(d)].map((_) => 0),
    pBest: {
      value: [],
      error: Infinity,
    },
  };
  return self;
};

export const Swarm = (
  d: number,
  population: number = 30,
  min: number = 0,
  max: number = 0.0001,
  inertia: number = 0.7,
  cp: number = 1.49445,
  cg: number = 1.49445
): Swarm => {
  const self: Swarm = {
    swarm: [...Array(population)].map((_) => Particle(d, min, max)),
    gBest: {
      value: [],
      error: Infinity,
    },
    lowerBound: min,
    upperBound: max,
    inertia,
    cp,
    cg,
    fit: (
      f: (candidate: number[]) => number,
      tmax: number = 200,
      criterion: number | null = null
    ) => {
      if (self) {
        // init
        self.swarm.forEach((p) => {
          p.pBest.value = p.z.value.slice();
        });

        // main loop
        for (let i = 0; i < tmax; i++) {
          // update error
          self.swarm.forEach((p) => {
            p.z.error = f(p.z.value);

            if (p.z.error < p.pBest.error) {
              p.pBest = Object.assign({}, p.z);
            }

            if (p.z.error < self.gBest.error) {
              console.log({ iter: i, gbest: self.gBest });
              console.log(self.gBest);
              // console.log(self.gBest.error.toExponential(6));
              self.gBest = Object.assign({}, p.z);
            }
          });

          // judgement
          if (criterion && self.gBest.error < criterion) {
            return {
              value: self.gBest.value,
              error: self.gBest.error,
              iteraions: i,
            };
          }

          // update position
          self.swarm.forEach((p) => {
            p.v = p.v.map((vi, i) => {
              const nv =
                inertia * vi +
                Math.random() * cp * (p.pBest.value[i] - p.z.value[i]) +
                Math.random() * cg * (self.gBest.value[i] - p.z.value[i]);

              if (p.z.value[i] + nv < min || max < p.z.value[i] + nv) {
                p.z.value[i] = Math.random() * (max - min) + min;
                return 0;
              }

              return nv;
            });

            p.z.value = p.z.value.map((zi, i) => zi + p.v[i]);
          });

          // random selection
          // todo
          for (let j = 0; j < 1; j++) {
            const idx = randint(0, population);
            self.swarm[idx].z.value = randarr(d);
            self.swarm[idx].v = randarr(d);
          }
        }
        // ^ main loop

        return {
          value: self.gBest.value,
          error: self.gBest.error,
          iteraions: -1,
        };
      } else return { value: [], error: Infinity, iteraions: -1 };
    },
  };
  return self;
};
