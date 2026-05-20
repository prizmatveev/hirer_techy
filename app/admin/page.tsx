import Link from "next/link";

export default function AdminIndex() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="card p-8 w-full max-w-lg space-y-4">
        <h1 className="text-2xl font-semibold">Admin Portal</h1>
        <p className="text-zinc-600">Use the links below to register or login as an admin/recruiter.</p>
        <div className="flex gap-3">
          <Link href="/admin/register" className="btn-primary">Register</Link>
          <Link href="/admin/login" className="border rounded-xl px-6 py-3">Login</Link>
        </div>
      </div>
    </main>
  );
}
