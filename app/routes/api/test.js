// app/routes/test.js
import { json } from "@remix-run/node";

export const loader = () => {
  return json({ ok: true, message: "Server funcionando" });
};
