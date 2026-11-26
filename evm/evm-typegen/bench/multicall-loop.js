const { performance } = require("node:perf_hooks");

function splitSlice(maxSize, beg, end = Number.MAX_SAFE_INTEGER) {
  maxSize = Math.max(1, maxSize);
  const slices = [];
  while (beg < end) {
    const left = end - beg;
    const splits = Math.ceil(left / maxSize);
    const step = Math.round(left / splits);
    slices.push([beg, beg + step]);
    beg += step;
  }
  return slices;
}

function splitArray(maxSize, arr) {
  if (arr.length <= maxSize) {
    return [arr];
  }

  const pages = [];
  for (const [beg, end] of splitSlice(maxSize, 0, arr.length)) {
    pages.push(arr.slice(beg, end));
  }
  return pages;
}

async function oldPattern(calls, pageSize) {
  const pages = splitArray(pageSize, calls);
  const results = await Promise.all(
    pages.map(async (page) => page.map((x) => x + 1)),
  );
  return results.flat();
}

async function newPattern(calls, pageSize) {
  const promises = [];
  for (const page of splitArray(pageSize, calls)) {
    promises.push(Promise.resolve(page.map((x) => x + 1)));
  }

  const result = [];
  for (const group of await Promise.all(promises)) {
    result.push(...group);
  }
  return result;
}

async function bench(name, fn, calls, pageSize, rounds) {
  for (let i = 0; i < 20; i++) {
    await fn(calls, pageSize);
  }

  const start = performance.now();
  let checksum = 0;
  for (let i = 0; i < rounds; i++) {
    const result = await fn(calls, pageSize);
    checksum += result.length + result[0] + result[result.length - 1];
  }
  const ms = performance.now() - start;

  return { name, ms, checksum };
}

async function run(size, pageSize, rounds) {
  const calls = Array.from({ length: size }, (_, i) => i);
  const oldResult = await bench("old", oldPattern, calls, pageSize, rounds);
  const newResult = await bench("new", newPattern, calls, pageSize, rounds);

  return {
    size,
    pageSize,
    rounds,
    oldMs: oldResult.ms,
    newMs: newResult.ms,
    speedup: oldResult.ms / newResult.ms,
    same: oldResult.checksum === newResult.checksum,
  };
}

async function main() {
  const cases = [
    { size: 1000, pageSize: 50, rounds: 5000 },
    { size: 10000, pageSize: 100, rounds: 1000 },
  ];

  for (const testCase of cases) {
    console.log(
      JSON.stringify(
        await run(testCase.size, testCase.pageSize, testCase.rounds),
        null,
        2,
      ),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
