// promise-limit@2.7.0 的等价 ESM 重写。
// 上游发布物是 CJS/UMD（见同目录 index.cjs），Deno 与边缘运行时无法将其作为
// ESM 导入（无 default 导出互操作），故按原语义逐行重写为 ESM：
// - `promiseLimit(count)` 返回 semaphore 函数，并发上限 count，超出排队；
// - semaphore.queue = 当前排队长度；
// - semaphore.map(items, mapper) 原样保留（首个失败后其余任务跳过）。
// 语义差异：无（对照上游 index.cjs 逐分支等价）。
function limiter(count) {
  let outstanding = 0;
  const jobs = [];

  function remove() {
    outstanding--;
    if (outstanding < count) dequeue();
  }

  function dequeue() {
    const job = jobs.shift();
    semaphore.queue = jobs.length;
    if (job) run(job.fn).then(job.resolve).catch(job.reject);
  }

  function queue(fn) {
    return new Promise((resolve, reject) => {
      jobs.push({ fn, resolve, reject });
      semaphore.queue = jobs.length;
    });
  }

  function run(fn) {
    outstanding++;
    try {
      return Promise.resolve(fn()).then(
        (result) => {
          remove();
          return result;
        },
        (error) => {
          remove();
          throw error;
        },
      );
    } catch (err) {
      remove();
      return Promise.reject(err);
    }
  }

  function semaphore(fn) {
    if (outstanding >= count) return queue(fn);
    return run(fn);
  }

  return semaphore;
}

function map(items, mapper) {
  let failed = false;
  const limit = this;

  return Promise.all(
    items.map((...args) =>
      limit(() => {
        if (!failed) {
          return mapper(...args).catch((e) => {
            failed = true;
            throw e;
          });
        }
      })
    ),
  );
}

function addExtras(fn) {
  fn.queue = 0;
  fn.map = map;
  return fn;
}

export default function promiseLimit(count) {
  if (count) return addExtras(limiter(count));
  return addExtras((fn) => fn());
}