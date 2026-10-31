"use client";
import { useQueryClient } from "@tanstack/react-query";
export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  const client = useQueryClient();
  return <div role="alert" className="p-6 space-y-4"><h2 className="text-xl font-semibold">Unable to load this page</h2>
    <p>{error.message || "Please check the connection and try again."}</p>
    <button className="rounded-lg bg-indigo-600 px-4 py-2 text-white" onClick={async () => { await client.resetQueries(); reset(); }}>Try again</button></div>;
}
