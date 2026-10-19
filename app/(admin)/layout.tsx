import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { displayName } from "@/lib/data";
import { signOutAction } from "./actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  return (
    <div className="shell">
      <nav className="side" aria-label="Admin">
        <div className="brand">Color Field · Admin</div>
        <Link href="/">Dashboard</Link>
        <Link href="/users">Users</Link>
        <Link href="/media">AI media</Link>
        <Link href="/votes">Ratings</Link>
        <div className="who">
          {displayName(profile)}
          <form action={signOutAction}><button className="btn" style={{ marginTop: 8 }}>Sign out</button></form>
        </div>
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}
