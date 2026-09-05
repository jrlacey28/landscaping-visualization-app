import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Building2, Palette, Rocket, ShieldCheck, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { uploadImageToPublic } from "@/lib/api";
import { TERMS_VERSION } from "@shared/legal";

const trades = { roofing: "Roofing & siding", landscape: "Landscaping", pools: "Pools", painting: "Painting", kitchen: "Kitchens", bathroom: "Bathrooms", "living-room": "Living rooms" };
const designPaths: Record<string, string> = { roofing: "/roofing-siding", landscape: "/landscape", pools: "/pools", painting: "/painting", kitchen: "/kitchen-redesign", bathroom: "/bathroom-redesign", "living-room": "/living-room-design" };
const empty = { companyName: "", logoUrl: "", primaryColor: "#3b82f6", phone: "", trade: "roofing", exteriorOptions: { roof: [], siding: [], windows: [] }, roofColors: [], sidingColors: [], windowColors: [] };

export default function Setup() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [published, setPublished] = useState("");
  const [category, setCategory] = useState<"roof" | "siding" | "windows">("siding");
  const [productName, setProductName] = useState("");
  const [productNotes, setProductNotes] = useState("");
  const [productImage, setProductImage] = useState("");
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#6b858e");
  const dirty = useRef(false);
  const revision = useRef(0);
  const saveQueue = useRef(Promise.resolve());

  async function load() {
    const result = await (await apiRequest("GET", "/api/workspace/setup")).json();
    setData(result);
    if (result.onboarding?.publishedAt) {
      const trade = result.onboarding.trade || "roofing";
      const path = `/embed${trade === "landscape" ? "" : `-${trade}`}?tenant=${encodeURIComponent(result.tenant.slug)}`;
      setPublished(new URL(path, window.location.origin).href);
    }
    return result;
  }
  useEffect(() => {
    if (!user) return;
    load().then(result => {
      const t = result.tenant, c = t.embedCustomizations || {};
      setForm({ ...empty, companyName: t.companyName === "Your Company" ? "" : t.companyName, logoUrl: t.logoUrl || "", primaryColor: t.embedPrimaryColor || t.primaryColor || "#3b82f6", phone: t.phone || "", trade: result.onboarding.trade || "roofing", exteriorOptions: { roof: c.exteriorOptions?.roof || [], siding: c.exteriorOptions?.siding || [], windows: c.exteriorOptions?.windows || [] }, roofColors: c.roofColors || [], sidingColors: c.sidingColors || [], windowColors: c.windowColors || [] });
      setSaved(result.onboarding.brandSavedAt ? "Saved to your workspace" : "");
    }).catch(error => setMessage(error.message));
  }, [user?.user.id]);
  function change(patch: any) { dirty.current = true; revision.current++; setSaved("Unsaved changes"); setForm((current: any) => ({ ...current, ...patch })); }
  function save(snapshot = form) {
    const version = revision.current;
    const pending = saveQueue.current.catch(() => {}).then(async () => {
      setSaved("Saving…");
      await apiRequest("PUT", "/api/workspace/setup", snapshot);
      if (revision.current === version) { dirty.current = false; setSaved("Saved to your workspace"); }
    });
    saveQueue.current = pending;
    return pending;
  }
  useEffect(() => {
    if (!data || !dirty.current || !form.companyName.trim()) return;
    const timeout = setTimeout(() => { save(form).catch(() => setSaved("Not saved — use Save and continue to retry")); }, 900);
    return () => clearTimeout(timeout);
  }, [form]);
  async function action(fn: () => Promise<void>) {
    setBusy(true); setMessage("");
    try { await fn(); } catch (error: any) { setMessage(error.message || "Please try again."); }
    finally { setBusy(false); }
  }
  async function upload(file?: File, reference = false) {
    if (!file) return;
    await action(async () => { const image = await uploadImageToPublic(file); if (reference) setProductImage(image.imageUrl); else change({ logoUrl: image.imageUrl }); });
  }
  const field = "block text-sm font-medium text-slate-700 space-y-2";
  const colorKey = category === "roof" ? "roofColors" : category === "siding" ? "sidingColors" : "windowColors";
  if (loading) return <div className="p-10">Loading your workspace…</div>;
  if (!user) return <div className="p-10">Create your business workspace. <Link className="text-blue-600 underline" href="/auth?mode=signup">Start free</Link></div>;
  return <div className="min-h-screen bg-slate-50 text-slate-950">
    <header className="border-b bg-white"><div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center"><Link href="/" className="font-bold text-xl">DreamBuilder</Link><Link href="/dashboard" className="text-sm text-blue-700">Go to dashboard →</Link></div></header>
    <main className="max-w-6xl mx-auto px-6 py-10">
      <p className="text-blue-700 text-xs tracking-widest font-semibold uppercase">Your business, ready to show</p>
      <h1 className="text-3xl sm:text-4xl font-bold mt-3">Make DreamBuilder yours.</h1>
      <p className="mt-3 text-slate-600 max-w-2xl">Set up your business, try a design, and launch your visualizer. Your settings save as you go. No demo appointment needed.</p>
      <div className="grid md:grid-cols-[240px_1fr] gap-8 mt-8">
        <aside><nav aria-label="Setup steps" className="space-y-2">{[[Building2,"Your business"],[Palette,"Products & first design"],[Rocket,"Review & launch"]].map(([Icon,label]: any,i) => <button key={label} onClick={() => setStep(i)} className={`w-full text-left flex items-center gap-3 p-4 rounded-xl ${step === i ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}><Icon size={19}/><span>{i+1}. {label}</span></button>)}</nav><p className="text-xs text-slate-500 mt-4" role="status">{saved}</p><p className="text-sm text-slate-500 mt-6">You can use starter products now and add your own later.</p></aside>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {message && <div role="status" className="mb-5 rounded-lg bg-blue-50 text-blue-900 p-4 break-words">{message}</div>}
          {!data ? <p>{message ? "Use the dashboard if your workspace owner manages setup." : "Loading setup…"}</p> : <>
          {step === 0 && <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Start with the basics</h2>
            <label className={field}>Company name<Input value={form.companyName} maxLength={150} onChange={e => change({companyName:e.target.value})} placeholder="Your company name"/></label>
            <label className={field}>Main service<select className="block border rounded-md w-full p-3 bg-white" value={form.trade} onChange={e => change({trade:e.target.value})}>{Object.entries(trades).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <div className="grid sm:grid-cols-2 gap-5"><label className={field}>Phone (optional)<Input type="tel" value={form.phone} onChange={e => change({phone:e.target.value})}/></label><label className={field}>Brand color<input type="color" className="block w-full h-10" value={form.primaryColor} onChange={e => change({primaryColor:e.target.value})}/></label></div>
            <label className={field}>Logo (optional)<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e => upload(e.target.files?.[0])} className="block w-full text-sm"/></label>
            {form.logoUrl && <img alt="Your company logo" src={form.logoUrl} className="h-20 max-w-64 object-contain"/>}
            <Button disabled={busy || !form.companyName.trim()} onClick={() => action(async () => { await save(); setStep(1); })}>Save and continue <ArrowRight className="ml-2 h-4 w-4"/></Button>
          </div>}
          {step === 1 && <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Show what you install</h2>
            <div className="rounded-xl bg-blue-50 p-5"><h3 className="font-semibold">Try your first design</h3><p className="text-sm text-slate-600 my-2">Open the visualizer, upload a house photo and choose a style. Your free account includes five designs per month.</p><a href={designPaths[form.trade]} target="_blank" rel="noreferrer" className="inline-flex text-blue-700 font-semibold">Open visualizer →</a></div>
            {form.trade === "roofing" && <>
              <h3 className="font-semibold">Your product library (optional)</h3><p className="text-sm text-slate-600">Add a product name, its profile or installation details, and a reference photo. These become choices in your business visualizer.</p>
              <label className={field}>Product category<select value={category} onChange={e => setCategory(e.target.value as any)} className="block w-full border rounded-md p-2">{["siding","roof","windows"].map(value => <option key={value}>{value}</option>)}</select></label>
              <label className={field}>Brand and product<Input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Brand, product line, profile" maxLength={150}/></label>
              <label className={field}>Product details<Input value={productNotes} onChange={e => setProductNotes(e.target.value)} placeholder="e.g. horizontal lap, smooth finish" maxLength={1500}/></label>
              <label className={field}>Product photo (optional)<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e => upload(e.target.files?.[0], true)} className="block w-full"/></label>
              {productImage && <img src={productImage} alt="Product reference" className="h-16"/>}
              <Button variant="outline" disabled={!productName.trim() || busy} onClick={() => { change({ exteriorOptions: {...form.exteriorOptions, [category]: [...form.exteriorOptions[category], { label:productName.trim(), prompt:productNotes, ...(productImage ? {referenceImageUrls:[productImage]} : {}) }] }}); setProductName(""); setProductNotes(""); setProductImage(""); }}><Plus className="h-4 w-4 mr-2"/>Add product</Button>
              <ul className="divide-y">{form.exteriorOptions[category].map((item:any,i:number) => <li key={i} className="py-3 flex justify-between items-center"><span>{item.label}</span><Button variant="ghost" aria-label={`Remove ${item.label}`} onClick={() => change({exteriorOptions:{...form.exteriorOptions,[category]:form.exteriorOptions[category].filter((_:any,index:number) => index !== i)}})}><Trash2 className="h-4 w-4"/></Button></li>)}</ul>
              <div className="grid grid-cols-[1fr_70px] gap-3"><label className={field}>Color name<Input value={colorName} onChange={e => setColorName(e.target.value)} maxLength={150}/></label><label className={field}>Swatch<input type="color" value={colorHex} onChange={e => setColorHex(e.target.value)} className="block h-10 w-full"/></label></div>
              <Button variant="outline" disabled={!colorName.trim()} onClick={() => { change({[colorKey]:[...form[colorKey],{label:colorName.trim(),hex:colorHex}]}); setColorName(""); }}>Add color</Button>
              <div className="flex gap-2 flex-wrap">{form[colorKey].map((c:any,i:number) => <button key={i} className="border rounded-full px-3 py-1 text-sm" title="Remove color" onClick={() => change({[colorKey]:form[colorKey].filter((_:any,index:number) => index !== i)})}><span style={{background:c.hex}} className="inline-block w-3 h-3 rounded-full mr-2"/>{c.label} ×</button>)}</div>
            </>}
            <Button disabled={busy || !form.companyName.trim()} onClick={() => action(async () => { await save(); await load(); setStep(2); })}>Save and review <ArrowRight className="ml-2 h-4 w-4"/></Button>
          </div>}
          {step === 2 && <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Ready when you are</h2>
            <div className="border rounded-xl p-5 flex gap-4 items-center" style={{borderColor:form.primaryColor}}>{form.logoUrl && <img src={form.logoUrl} alt="" className="h-12 w-16 object-contain"/>}<div><h3 className="font-semibold">{form.companyName || "Your company"}</h3><p className="text-sm text-slate-500">{trades[form.trade as keyof typeof trades]} · Quotes sent to {user.user.email}</p></div></div>
            <div className="space-y-3"><p className="flex gap-2 items-center"><ShieldCheck className="w-5"/>{data.emailVerified ? "Email verified" : "Verify your email before publishing"}</p>{!data.emailVerified && <div className="flex gap-3 flex-wrap"><Button disabled={busy} variant="outline" onClick={() => action(async () => { await apiRequest("POST","/api/auth/verification"); setMessage("Verification email sent. Open the link, then refresh this checklist."); })}>Send verification email</Button><Button variant="ghost" onClick={() => action(async () => { await load(); })}>Refresh checklist</Button></div>}</div>
            {!data.termsAccepted ? <div className="space-y-3"><label className="flex gap-3 text-sm"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}/><span>I agree to the <a className="underline" href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and acknowledge the <a className="underline" href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>. I am authorized to act for this business.</span></label><Button disabled={!accepted || busy} variant="outline" onClick={() => action(async () => { await apiRequest("POST","/api/auth/terms",{accepted:true,version:TERMS_VERSION}); await load(); })}>Save agreement</Button></div> : <p className="flex gap-2"><CheckCircle2 className="w-5 text-green-600"/>Terms accepted</p>}
            <Button variant="outline" disabled={busy || !data.emailVerified} onClick={() => action(async () => { await apiRequest("POST","/api/workspace/test-email"); setMessage("Test email accepted for delivery. Check your inbox to confirm it arrived."); })}>Send a test email</Button>
            {!data.canPublish && <div className="bg-slate-50 p-5 rounded-xl"><h3 className="font-semibold">Choose a plan to launch on your website</h3><p className="text-sm text-slate-600 my-2">Keep creating free designs, or choose Contractor or Professional to publish your business visualizer.</p><Link href="/pricing" className="font-semibold text-blue-700">See plans →</Link></div>}
            <Button disabled={busy || !data.canPublish || !data.emailVerified || !data.termsAccepted || !form.companyName.trim()} onClick={() => action(async () => { await save(); const result = await (await apiRequest("POST","/api/workspace/publish")).json(); setPublished(new URL(result.path,window.location.origin).href); await load(); })}>{busy ? "Working…" : "Publish my visualizer"}</Button>
            {published && <div className="rounded-xl bg-green-50 p-5 space-y-3"><h3 className="font-semibold">Your business visualizer is ready</h3><a href={published} target="_blank" rel="noreferrer" className="block text-blue-700 underline break-all">Open your visualizer</a><Input readOnly aria-label="Your visualizer link" value={published}/><Button variant="outline" onClick={() => action(async () => { await navigator.clipboard.writeText(published); setMessage("Link copied"); })}>Copy link</Button><p className="text-sm">Share this link immediately. To add it to your website, use the embed builder in your dashboard.</p><Link href="/dashboard?tab=embed" className="text-blue-700 font-semibold">Get website embed code →</Link></div>}
          </div>}
          </>}
        </section>
      </div>
    </main>
  </div>;
}
