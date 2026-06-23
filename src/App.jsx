import { useEffect, useMemo, useRef, useState } from "react";
import {
  ADDONS,
  COMPLEXITIES,
  GOLD,
  SERVICES,
  SUPPORT_OPTIONS,
  TIMELINES,
  calculateQuote,
  defaultForm,
  downloadFile,
  formatMoney,
  quoteToText,
} from "./quoteEngine";

const FORM_KEY = "elite-smart-quote-form-v1";
const LIBRARY_KEY = "elite-smart-quote-library-v1";

const clone = (value) => JSON.parse(JSON.stringify(value));
const safeLoad = (key, fallback) => {
  try { const data = JSON.parse(window.localStorage.getItem(key)); return data ?? fallback; }
  catch { return fallback; }
};

function Field({ label, children, full = false }) {
  return <label className={`field ${full ? "full" : ""}`}><span>{label}</span>{children}</label>;
}

function TextInput({ label, value, onChange, placeholder, type = "text", full = false }) {
  return <Field label={label} full={full}><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></Field>;
}

function SelectInput({ label, value, onChange, options, full = false }) {
  return <Field label={label} full={full}><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>;
}

function Slider({ label, value, onChange, min, max, suffix = "", hint }) {
  return <div className="slider-field"><div><span>{label}</span><strong>{value}{suffix}</strong></div><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /><small>{hint}</small></div>;
}

function Toggle({ checked, onChange, title, text }) {
  return <button className={checked ? "toggle-card checked" : "toggle-card"} onClick={() => onChange(!checked)}><span className="toggle-dot">{checked ? "✓" : ""}</span><div><strong>{title}</strong><small>{text}</small></div></button>;
}

function Card({ children, title, eyebrow, description, className = "" }) {
  return <section className={`card ${className}`}>{(title || eyebrow) && <div className="card-head"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div></div>}{children}</section>;
}

function Metric({ label, value, note, tone = "gold" }) {
  return <div className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}

function Decision({ quote }) {
  const kind = quote.decision.kind.toLowerCase();
  const icon = kind === "accept" ? "✓" : kind === "negotiate" ? "↔" : kind === "decline" ? "!" : "i";
  return <div className={`decision ${kind}`}><div className="decision-icon">{icon}</div><div><span>{quote.decision.kind}</span><strong>{quote.decision.title}</strong><p>{quote.decision.detail}</p></div></div>;
}

function RiskGauge({ score, band }) {
  return <div className="risk-gauge" style={{ "--score": `${score * 3.6}deg` }}><div><strong>{score}</strong><span>{band} risk</span></div></div>;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

export default function App() {
  const [form, setForm] = useState(() => ({ ...clone(defaultForm), ...safeLoad(FORM_KEY, {}) }));
  const [savedQuotes, setSavedQuotes] = useState(() => safeLoad(LIBRARY_KEY, []));
  const [tab, setTab] = useState("builder");
  const [addOnSearch, setAddOnSearch] = useState("");
  const [customAddOn, setCustomAddOn] = useState({ label: "", price: "", cost: "", hours: "" });
  const [toast, setToast] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const importRef = useRef(null);

  useEffect(() => { window.localStorage.setItem(FORM_KEY, JSON.stringify(form)); }, [form]);
  useEffect(() => { window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(savedQuotes)); }, [savedQuotes]);
  useEffect(() => { if (!toast) return undefined; const timer = window.setTimeout(() => setToast(""), 2600); return () => window.clearTimeout(timer); }, [toast]);

  const quote = useMemo(() => calculateQuote(form), [form]);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const serviceOptions = Object.entries(SERVICES).map(([value, item]) => ({ value, label: item.label }));
  const complexOptions = COMPLEXITIES.map((item) => ({ value: item.id, label: `${item.label} · ×${item.factor}` }));
  const timelineOptions = TIMELINES.map((item) => ({ value: item.id, label: item.label }));
  const supportOptions = SUPPORT_OPTIONS.map((item) => ({ value: item.id, label: `${item.label} · ${formatMoney(item.price)}` }));
  const filteredAddOns = ADDONS.filter((item) => `${item.label} ${item.category}`.toLowerCase().includes(addOnSearch.toLowerCase()));
  const libraryItems = savedQuotes.filter((item) => `${item.form.client} ${item.form.company} ${item.form.quoteName} ${item.quote.service.label}`.toLowerCase().includes(librarySearch.toLowerCase()));

  function toggleAddOn(id) {
    setForm((current) => ({ ...current, addOnIds: current.addOnIds.includes(id) ? current.addOnIds.filter((item) => item !== id) : [...current.addOnIds, id] }));
  }

  function addCustomAddOn() {
    if (!customAddOn.label.trim() || !Number(customAddOn.price)) return setToast("Add-on name and price are required");
    setForm((current) => ({ ...current, customAddOns: [...current.customAddOns, { id: `custom-${Date.now()}`, label: customAddOn.label.trim(), price: Number(customAddOn.price), cost: Number(customAddOn.cost) || 0, hours: Number(customAddOn.hours) || 0 }] }));
    setCustomAddOn({ label: "", price: "", cost: "", hours: "" }); setToast("Custom add-on added");
  }

  function saveQuote() {
    const entry = { id: `quote-${Date.now()}`, createdAt: new Date().toISOString(), form: clone(form), quote: calculateQuote(form) };
    setSavedQuotes((current) => [entry, ...current]); setToast("Quote saved to library");
  }

  function newQuote() {
    setForm(clone(defaultForm)); setTab("builder"); setToast("New quote created");
  }

  function loadQuote(entry) {
    setForm(clone(entry.form)); setTab("builder"); setToast("Saved quote loaded");
  }

  function exportJson() {
    const data = { generatedAt: new Date().toLocaleString(), agency: "Elite Era Development L.L.C", madeBy: "Hira Khyzer", form, quote };
    downloadFile("elite-smart-quote.json", JSON.stringify(data, null, 2), "application/json"); setToast("Quote JSON downloaded");
  }

  function exportText() {
    downloadFile("elite-smart-quote.txt", quoteToText(form, quote), "text/plain"); setToast("Quote text summary downloaded");
  }

  function printQuote() {
    const popup = window.open("", "_blank");
    if (!popup) return setToast("Please allow pop-ups to print the quote");
    const rows = [
      ["Service", quote.service.label], ["Complexity", quote.complexity.label], ["Features", form.features], ["Team size", form.teamSize], ["Timeline", quote.timeline.label], ["Total hours", `${Math.round(quote.totalHours)} hours`], ["Estimated delivery", `${quote.expectedWeeks} weeks`], ["Recommended price", formatMoney(quote.recommendedPrice)], ["Delivery cost", formatMoney(quote.totalCost)], ["Expected profit", formatMoney(quote.profit)], ["Profit margin", `${quote.actualMargin.toFixed(1)}%`], ["Budget fit", `${quote.budgetFit.toFixed(1)}%`],
    ].map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join("");
    popup.document.write(`<!doctype html><html><head><title>Elite Quote</title><style>body{font-family:Arial,sans-serif;max-width:780px;margin:40px auto;color:#17130d}h1{border-bottom:3px solid #f4af00;padding-bottom:12px}h2{font-size:14px;text-transform:uppercase;letter-spacing:.12em;border-left:4px solid #f4af00;padding-left:10px;margin-top:28px}table{border-collapse:collapse;width:100%;font-size:13px}td{padding:9px;border-bottom:1px solid #eee}td:first-child{color:#766d5e;width:200px}.hero{background:#fff7db;padding:20px;border-radius:12px}.footer{margin-top:35px;border-top:1px solid #eee;padding-top:12px;text-align:center;color:#888;font-size:11px}</style></head><body><h1>Elite Era Development L.L.C</h1><p>Smart Quote · Made by Hira Khyzer</p><div class="hero"><strong>${escapeHtml(form.quoteName || "Project quote")}</strong><br>Prepared for ${escapeHtml(form.client || "Client")} ${form.company ? `· ${escapeHtml(form.company)}` : ""}<h2>Recommended investment</h2><div style="font-size:32px;color:#b97900;font-weight:bold">${formatMoney(quote.recommendedPrice)}</div><p>${escapeHtml(quote.decision.title)}</p></div><h2>Quote details</h2><table>${rows}</table><h2>Add-ons</h2>${quote.selectedAddOns.length ? `<ul>${quote.selectedAddOns.map((item) => `<li>${escapeHtml(item.label)} — ${formatMoney(item.price)}</li>`).join("")}</ul>` : "<p>No add-ons selected.</p>"}<h2>Payment terms</h2><p>${escapeHtml(form.paymentTerms)}</p><h2>Notes</h2><p>${escapeHtml(form.notes || "No notes added.")}</p><div class="footer">Elite Era Development L.L.C · Made by Hira Khyzer · #f4af00</div></body></html>`);
    popup.document.close(); window.setTimeout(() => popup.print(), 350);
  }

  function importQuote(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { const imported = JSON.parse(reader.result); setForm({ ...clone(defaultForm), ...(imported.form || imported) }); setToast("Quote imported"); }
      catch { setToast("Invalid quote JSON file"); }
    };
    reader.readAsText(file); event.target.value = "";
  }

  function applyScenario(name) {
    const scenario = quote.scenarios.find((item) => item.name === name);
    if (!scenario) return;
    if (name === "Starter") setForm((current) => ({ ...current, features: Math.max(1, Math.round(current.features * 0.62)), support: "one", addOnIds: current.addOnIds.slice(0, 2), discount: 0 }));
    if (name === "Professional") setForm((current) => ({ ...current, support: "three", discount: 0, qualityAssurance: true }));
    if (name === "Enterprise") setForm((current) => ({ ...current, features: Math.max(1, Math.round(current.features * 1.35)), support: "twelve", qualityAssurance: true, discovery: true, margin: Math.max(40, current.margin) }));
    setTab("builder"); setToast(`${name} scenario applied`);
  }

  return <div className="app-shell">
    <header className="topbar"><div className="top-brand"><div className="brand-mark">E</div><div><span>Elite Era Development L.L.C</span><strong>Smart Quote Engine</strong></div></div><div className="top-actions"><button className="text-action" onClick={newQuote}>New quote</button><button className="outline-button small" onClick={() => importRef.current?.click()}>Import</button><button className="gold-button small" onClick={saveQuote}>Save quote</button><input ref={importRef} type="file" accept="application/json,.json" onChange={importQuote} hidden /></div></header>

    <nav className="tabs"><button className={tab === "builder" ? "active" : ""} onClick={() => setTab("builder")}>◫ Quote builder</button><button className={tab === "scenarios" ? "active" : ""} onClick={() => setTab("scenarios")}>◌ Scenarios</button><button className={tab === "library" ? "active" : ""} onClick={() => setTab("library")}>▤ Quote library <span>{savedQuotes.length}</span></button></nav>

    <main className="content">
      {tab === "builder" && <div className="builder-grid">
        <aside className="control-panel">
          <Card eyebrow="Quote inputs" title="Build the project estimate" description="Every change recalculates the quote automatically.">
            <div className="input-section"><h3>Client context</h3><div className="field-grid"><TextInput label="Quote name" value={form.quoteName} onChange={(value) => set("quoteName", value)} placeholder="Q3 client website" full/><TextInput label="Client name" value={form.client} onChange={(value) => set("client", value)} placeholder="Jane Smith"/><TextInput label="Company" value={form.company} onChange={(value) => set("company", value)} placeholder="Acme Inc."/></div></div>
            <div className="input-section"><h3>Delivery scope</h3><div className="field-grid"><SelectInput label="Service type" value={form.service} onChange={(value) => set("service", value)} options={serviceOptions} full/><SelectInput label="Complexity" value={form.complexity} onChange={(value) => set("complexity", value)} options={complexOptions}/><SelectInput label="Timeline" value={form.timeline} onChange={(value) => set("timeline", value)} options={timelineOptions}/></div><Slider label="Pages / features" value={form.features} onChange={(value) => set("features", value)} min="1" max="40" hint="Primary screens, workflows, or campaign assets"/><Slider label="Team size" value={form.teamSize} onChange={(value) => set("teamSize", value)} min="1" max="10" hint="People assigned to the delivery team"/><div className="toggle-grid"><Toggle checked={form.discovery} onChange={(value) => set("discovery", value)} title="Discovery phase" text="Strategy and requirements"/><Toggle checked={form.qualityAssurance} onChange={(value) => set("qualityAssurance", value)} title="Quality assurance" text="Testing and review time"/></div></div>
          </Card>

          <Card eyebrow="Commercial settings" title="Protect profitability"><div className="field-grid"><SelectInput label="Support period" value={form.support} onChange={(value) => set("support", value)} options={supportOptions} full/></div><Slider label="Target profit margin" value={form.margin} onChange={(value) => set("margin", value)} min="10" max="70" suffix="%" hint="Sets the protected pricing target"/><Slider label="Risk buffer" value={form.riskBuffer} onChange={(value) => set("riskBuffer", value)} min="0" max="20" suffix="%" hint="Covers uncertainty and change risk"/><Slider label="Quote discount" value={form.discount} onChange={(value) => set("discount", value)} min="0" max="20" suffix="%" hint="Discount is never allowed below margin floor"/><TextInput label="Client budget" value={form.clientBudget} onChange={(value) => set("clientBudget", Number(value))} type="number" placeholder="8000"/><TextInput label="Payment terms" value={form.paymentTerms} onChange={(value) => set("paymentTerms", value)} placeholder="50% upfront · 50% launch"/></Card>
        </aside>

        <section className="quote-workspace">
          <section className="price-hero"><div><p className="eyebrow">Recommended investment</p><h1>{formatMoney(quote.recommendedPrice)}</h1><p>for {quote.service.label} · {Math.round(quote.totalHours)} delivery hours</p></div><div className="hero-meta"><span>Margin protected</span><strong>{quote.actualMargin.toFixed(1)}%</strong><small>Target: {form.margin}%</small></div><div className="hero-line" /></section>
          <div className="metrics-grid"><Metric label="Expected profit" value={formatMoney(quote.profit)} note="After delivery cost"/><Metric label="Margin floor" value={formatMoney(quote.marginFloor)} note="Minimum viable quote" tone="ink"/><Metric label="Budget fit" value={form.clientBudget ? `${quote.budgetFit.toFixed(0)}%` : "—"} note={form.clientBudget ? `${formatMoney(quote.budget)} available` : "Add a client budget"} tone={quote.budgetFit >= 95 ? "success" : quote.budgetFit >= 72 ? "gold" : "danger"}/><Metric label="Duration" value={`${quote.expectedWeeks} weeks`} note={`${Math.round(quote.perMemberHours)} hrs per member`} tone="blue"/></div>
          <Decision quote={quote}/>
          <div className="analysis-grid"><Card eyebrow="Financial model" title="Quote breakdown"><div className="breakdown-list">{[["Core delivery labor", quote.laborCost], ["Team coordination", quote.coordinationCost], ["Add-on delivery cost", quote.addOnCost], ["Support cost", quote.support.cost], ["Risk buffer", quote.riskBufferAmount], ["Rush delivery fee", quote.rushFee], ["Discount applied", -quote.discountAmount]].map(([label, value]) => <div key={label}><span>{label}</span><strong className={value < 0 ? "negative" : ""}>{value === 0 ? "—" : formatMoney(value)}</strong></div>)}<div className="total-row"><span>Total delivery cost</span><strong>{formatMoney(quote.totalCost)}</strong></div></div></Card><Card eyebrow="Delivery intelligence" title="Risk and capacity"><div className="risk-layout"><RiskGauge score={quote.riskScore} band={quote.riskBand}/><div className="risk-copy"><strong>{quote.riskBand} delivery risk</strong><p>{quote.riskBand === "Low" ? "Scope and schedule look healthy." : quote.riskBand === "Moderate" ? "Monitor scope control and delivery capacity." : "Use a buffer, phased delivery, and stronger change control."}</p><div className="risk-lines"><span>Core hours <b>{Math.round(quote.coreHours)}h</b></span><span>Discovery <b>{Math.round(quote.discoveryHours)}h</b></span><span>QA / review <b>{Math.round(quote.qaHours)}h</b></span><span>Project management <b>{Math.round(quote.projectManagementHours)}h</b></span></div></div></div></Card></div>
          <Card eyebrow="Client budget view" title="Commercial position" description="Use the protected margin floor to understand when a budget should be negotiated instead of accepted."><div className="budget-scale"><div className="scale-labels"><span>Client budget {form.clientBudget ? formatMoney(quote.budget) : "not entered"}</span><span>Recommended {formatMoney(quote.recommendedPrice)}</span></div><div className="scale-track"><i className={quote.decision.kind.toLowerCase()} style={{ width: `${Math.min(100, quote.budgetFit || 0)}%` }} /></div><div className="scale-floor"><span>Margin floor</span><b>{formatMoney(quote.marginFloor)}</b></div></div></Card>
          <Card eyebrow="Scope add-ons" title="Choose included capabilities" description="These affect both client price and internal delivery cost."><div className="addon-search"><input value={addOnSearch} onChange={(event) => setAddOnSearch(event.target.value)} placeholder="Search add-ons"/><span>{form.addOnIds.length + form.customAddOns.length} selected</span></div><div className="addon-grid">{filteredAddOns.map((item) => <button key={item.id} className={form.addOnIds.includes(item.id) ? "addon selected" : "addon"} onClick={() => toggleAddOn(item.id)}><span className="addon-check">{form.addOnIds.includes(item.id) ? "✓" : "+"}</span><div><strong>{item.label}</strong><small>{item.category} · {item.hours} delivery hrs</small></div><b>{formatMoney(item.price)}</b></button>)}</div><div className="custom-addon"><h3>Custom add-on</h3><div className="custom-grid"><input value={customAddOn.label} onChange={(event) => setCustomAddOn((current) => ({ ...current, label: event.target.value }))} placeholder="Name"/><input type="number" value={customAddOn.price} onChange={(event) => setCustomAddOn((current) => ({ ...current, price: event.target.value }))} placeholder="Client price"/><input type="number" value={customAddOn.cost} onChange={(event) => setCustomAddOn((current) => ({ ...current, cost: event.target.value }))} placeholder="Internal cost"/><input type="number" value={customAddOn.hours} onChange={(event) => setCustomAddOn((current) => ({ ...current, hours: event.target.value }))} placeholder="Hours"/><button className="outline-button" onClick={addCustomAddOn}>Add</button></div>{form.customAddOns.length > 0 && <div className="custom-list">{form.customAddOns.map((item) => <span key={item.id}>{item.label} · {formatMoney(item.price)} <button onClick={() => set("customAddOns", form.customAddOns.filter((entry) => entry.id !== item.id))}>×</button></span>)}</div>}</div></Card>
          <Card eyebrow="Quote notes" title="Commercial context"><textarea value={form.notes} onChange={(event) => set("notes", event.target.value)} placeholder="Capture client constraints, negotiation decisions, assumptions, or special conditions." rows="4"/><div className="export-row"><button className="gold-button" onClick={saveQuote}>Save to library</button><button className="outline-button" onClick={printQuote}>Print / PDF</button><button className="outline-button" onClick={exportJson}>Export JSON</button><button className="outline-button" onClick={exportText}>Export TXT</button></div></Card>
        </section>
      </div>}

      {tab === "scenarios" && <section className="scenario-page"><header className="page-heading"><p className="eyebrow">Pricing strategy</p><h1>Compare package scenarios</h1><p>Use a practical three-tier ladder to protect margin while giving the client clear choices.</p></header><div className="scenario-grid">{quote.scenarios.map((scenario) => <article className={scenario.name === "Professional" ? "scenario-card recommended" : "scenario-card"} key={scenario.name}>{scenario.name === "Professional" && <span className="recommended-label">Recommended</span>}<p>{scenario.scope}</p><h2>{formatMoney(scenario.price)}</h2><span>{Math.round(scenario.hours)} estimated hours</span><div className="scenario-rule" /><strong>{scenario.includes}</strong><small>Estimated margin: {scenario.margin.toFixed(1)}%</small><button className={scenario.name === "Professional" ? "gold-button" : "outline-button"} onClick={() => applyScenario(scenario.name)}>Use this scenario</button></article>)}</div><div className="scenario-insights"><Card title="Decision guide"><div className="guide-list"><div><b>Starter</b><span>Use when budget is limited and a minimum viable outcome is acceptable.</span></div><div><b>Professional</b><span>Use for a balanced scope, quality assurance, and reliable delivery support.</span></div><div><b>Enterprise</b><span>Use when the client values scale, resilience, extended support, and a broader outcome.</span></div></div></Card><Card title="Current commercial signal"><Decision quote={quote}/><div className="signal-rows"><span>Client budget <b>{form.clientBudget ? formatMoney(quote.budget) : "Not entered"}</b></span><span>Protected margin floor <b>{formatMoney(quote.marginFloor)}</b></span><span>Recommended scenario <b>Professional</b></span></div></Card></div></section>}

      {tab === "library" && <section className="library-page"><header className="page-heading split"><div><p className="eyebrow">Saved workspace</p><h1>Quote library</h1><p>Save, reload, compare, and revisit prior commercial decisions.</p></div><button className="danger-button" onClick={() => { if (window.confirm("Delete all saved quotes?")) { setSavedQuotes([]); setToast("Quote library cleared"); } }}>Clear library</button></header><div className="library-tools"><input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="Search client, company, quote, or service"/><span>{libraryItems.length} results</span></div>{libraryItems.length ? <div className="quote-table"><div className="table-head"><span>Quote</span><span>Client</span><span>Service</span><span>Recommended</span><span>Decision</span><span /></div>{libraryItems.map((entry) => <div className="table-row" key={entry.id}><div><strong>{entry.form.quoteName || "Untitled quote"}</strong><small>{new Date(entry.createdAt).toLocaleDateString()}</small></div><div><strong>{entry.form.client || "No client"}</strong><small>{entry.form.company || "No company"}</small></div><div>{entry.quote.service.label}</div><div><strong>{formatMoney(entry.quote.recommendedPrice)}</strong><small>{entry.quote.actualMargin.toFixed(1)}% margin</small></div><div><span className={`mini-decision ${entry.quote.decision.kind.toLowerCase()}`}>{entry.quote.decision.kind}</span></div><div className="row-actions"><button onClick={() => loadQuote(entry)}>Load</button><button onClick={() => { downloadFile(`elite-quote-${entry.id}.txt`, quoteToText(entry.form, entry.quote), "text/plain"); }}>TXT</button><button className="remove" onClick={() => { setSavedQuotes((current) => current.filter((item) => item.id !== entry.id)); setToast("Saved quote deleted"); }}>×</button></div></div>)}</div> : <div className="empty-library"><div>▤</div><h2>No saved quotes yet</h2><p>Build a quote, then use Save quote to keep it in this browser.</p><button className="gold-button" onClick={() => setTab("builder")}>Build first quote</button></div>}</section>}
    </main>
    <footer className="footer"><strong>Made by Hira Khyzer</strong><span>Elite Era Development L.L.C</span><b style={{ color: GOLD }}>#f4af00</b></footer>
    {toast && <div className="toast">{toast}</div>}
  </div>;
}
