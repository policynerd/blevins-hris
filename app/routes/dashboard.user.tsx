import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { getInitials } from "~/utils/getInitials";
import { getSession } from "~/session.server";
import { createClient } from "~/utils/supabase.server";

export const meta: MetaFunction = () => {
  return [{ title: "User Profile | Blevins HRIS" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("__session");

  if (!token) {
    return redirect("/login");
  }

  const { supabase } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) {
    return redirect("/login");
  }

  const email = user.email ?? "";
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    email.split("@")[0];

  return Response.json({ user: { name, email } });
}

export default function User() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 lg:text-3xl">
        User Details
      </h1>
      <div className="flex flex-col overflow-hidden bg-white shadow-md rounded-xl md:flex-row">
        <div className="flex flex-col w-full px-8 py-10 bg-slate-50 md:basis-1/3 md:items-center lg:py-12">
          <div className="flex items-center justify-center w-20 h-20 text-2xl font-medium tracking-wide text-white rounded-full ring-2 ring-cyan-300 bg-cyan-500 lg:w-28 lg:h-28">
            {getInitials(user.name)}
          </div>
        </div>
        <div className="px-8 py-10 md:basis-2/3 lg:px-10 lg:py-12">
          <div className="mb-6 space-y-1">
            <p className="text-sm">Name</p>
            <p className="font-medium">{user.name}</p>
          </div>
          <div className="mb-6 space-y-1 overflow-hidden">
            <p className="text-sm">Email</p>
            <p className="font-medium truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </>
  );
}
