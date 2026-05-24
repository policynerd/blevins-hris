import type { MetaFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import Guide from "~/components/Guide";
import Logo from "~/components/Logo";

export async function loader() {
  const isSupabaseAvailable = !!(
    process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  );

  if (isSupabaseAvailable) {
    return redirect("/login");
  }

  return Response.json({});
}

export const meta: MetaFunction = () => {
  return [
    { title: "Blevins HRIS" },
    { name: "description", content: "Welcome to Blevins HRIS!" },
  ];
};

export default function Index() {
  return (
    <>
      <nav className="flex justify-center w-full px-4 pt-8">
        <Logo />
      </nav>
      <main className="grow">
        <Guide />
      </main>
      <footer className="w-full px-4 pb-8 mx-auto max-w-7xl">
        <p className="text-sm text-center">
          &copy; {new Date().getFullYear()} Blevins Holdings. All rights
          reserved.
        </p>
      </footer>
    </>
  );
}
