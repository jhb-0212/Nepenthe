try {
  process.loadEnvFile();
} catch {
  /* 容器里由环境变量注入 */
}

import { reindexAll } from '../src/lib/search';

reindexAll()
  .then((r) => {
    console.log(`reindex ok=${r.ok} count=${r.count} ${'reason' in r ? r.reason : ''}`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
