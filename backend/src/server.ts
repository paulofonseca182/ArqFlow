import { env } from "./shared/env.js";
import { createApp } from "./app.js";
import { enableSqliteForeignKeys } from "./database/prisma.js";

const app = createApp();

await enableSqliteForeignKeys();

app.listen(env.port, () => {
  console.log(`ArqFlow API running on http://localhost:${env.port}`);
});
