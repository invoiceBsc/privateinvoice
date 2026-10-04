import { route } from "@/server/router";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
async function handle(req: Request, context: Context) {
  return route(req, (await context.params).path);
}
export { handle as GET, handle as POST, handle as PATCH };
