import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

export default function AccountRecovery() {
  const mode = window.location.pathname.split("/").pop();
  const token = new URLSearchParams(window.location.search).get("token");
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><section className="bg-white border rounded-2xl p-8 w-full max-w-md space-y-5"><Link href="/" className="font-bold">DreamBuilder</Link><h1 className="text-2xl font-semibold">{mode === "verify" ? "Verify your email" : mode === "reset" ? "Choose a new password" : "Reset your password"}</h1>
    {!done && <form className="space-y-4" onSubmit={async e => { e.preventDefault(); setBusy(true); try { await apiRequest("POST", mode === "verify" ? "/api/auth/verify" : mode === "reset" ? "/api/auth/reset-password" : "/api/auth/forgot-password", mode === "verify" ? {token} : mode === "reset" ? {token,password:value} : {email:value}); setDone(true); window.history.replaceState(null,"",window.location.pathname); setMessage(mode === "verify" ? "Email verified. Return to setup to publish." : mode === "reset" ? "Password updated. Sign in with your new password." : "If that account exists, a reset link will be sent. Check your inbox."); } catch (error:any) { setMessage(error.message); } finally { setBusy(false); } }}>
      {mode !== "verify" && <label className="block text-sm">{mode === "reset" ? "New password (10–72 characters)" : "Email"}<Input className="mt-2" type={mode === "reset" ? "password" : "email"} autoComplete={mode === "reset" ? "new-password" : "email"} minLength={mode === "reset" ? 10 : undefined} maxLength={mode === "reset" ? 72 : 254} required value={value} onChange={e => setValue(e.target.value)}/></label>}
      <Button disabled={busy}>{busy ? "Working…" : mode === "verify" ? "Confirm my email" : mode === "reset" ? "Save password" : "Send reset link"}</Button></form>}
    {message && <p role="status" className="text-sm break-words">{message}</p>}<div className="flex gap-5 text-blue-700 text-sm"><Link href="/auth">Sign in</Link><Link href="/setup">Back to setup</Link></div>
  </section></main>;
}
