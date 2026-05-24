import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import invariant from "tiny-invariant";

import { createClient } from "~/utils/supabase.server";

export async function action({ request, params }: ActionFunctionArgs) {
  invariant(params.memberId, "Missing memberId param");
  const { supabase } = createClient(request);
  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", params.memberId);
  if (error) throw new Response(error.message, { status: 500 });
  return redirect("/dashboard");
}
