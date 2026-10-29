import { createApp } from "./app.js";
import { ensureSeededFileDb } from "./seed.js";

const PORT = Number(process.env.PORT ?? 4000);
const db = ensureSeededFileDb();
const app = createApp(db);

app.listen(PORT, () => {
  console.log(`EventHub API listening on http://localhost:${PORT}`);
});
