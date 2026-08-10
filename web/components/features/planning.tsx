"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarClock, MapPin, Route } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { featureCopy } from "@/lib/features-i18n";
import { FeatureHeader, PlacePicker, VisibilitySelect } from "@/components/features/shared";

type Plan = { id: string; plannedFor: string; plannedUntil: string; siteName: string; details?: string | null; visibility: "PUBLIC" | "PRIVATE"; latitude?: number | null; longitude?: number | null };

const minimumPlanDate = new Date().toISOString().slice(0, 10);

export function PlanningFeature() {
  const { locale } = useLanguage();
  const c = featureCopy(locale);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [siteName, setSiteName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function load() {
    const response = await fetch("/api/plans");
    if (response.ok) setPlans((await response.json()).plans);
  }

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, []);

  function changeStart(value: string) {
    setStartDate(value);
    if (!endDate || endDate < value) setEndDate(value);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setPending(true); setError(false);
    const form = new FormData(formElement);
    const response = await fetch("/api/plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plannedFor: startDate, plannedUntil: endDate || startDate, siteName, details: form.get("details"), visibility, latitude: latitude ? Number(latitude) : null, longitude: longitude ? Number(longitude) : null }) });
    if (response.ok) {
      formElement.reset(); setSiteName(""); setLatitude(""); setLongitude(""); setStartDate(""); setEndDate(""); await load();
    } else setError(true);
    setPending(false);
  }

  async function togglePlan(plan: Plan) {
    const next = plan.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    const response = await fetch(`/api/plans/${plan.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visibility: next }) });
    if (response.ok) await load();
  }

  function dateRange(plan: Plan) {
    const start = new Date(plan.plannedFor).toLocaleDateString(locale);
    const end = new Date(plan.plannedUntil).toLocaleDateString(locale);
    return start === end ? start : `${start} – ${end}`;
  }

  return <div className="feature-page">
    <FeatureHeader eyebrow="NEXT DESCENT" title={c.planningTitle} subtitle={c.planningSub} />
    <div className="two-column-feature">
      <form className="feature-form" onSubmit={submit}>
        <div className="form-title"><span><Route size={19} /></span><div><h2>{c.addPlan}</h2><p>{c.visibilityHelp}</p></div></div>
        <PlacePicker {...{ siteName, setSiteName, latitude, longitude, setLatitude, setLongitude }} />
        <div className="form-grid"><label>{c.startDate}<input name="plannedFor" type="date" required min={minimumPlanDate} value={startDate} onChange={(event) => changeStart(event.target.value)} /></label><label>{c.endDate}<input name="plannedUntil" type="date" required min={startDate || minimumPlanDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label></div>
        <label>{c.details}<textarea name="details" rows={5} maxLength={4000} /></label>
        <div><span className="section-label">{c.divePrivacy}</span><VisibilitySelect value={visibility} onChange={setVisibility} /></div>
        {error && <p className="form-error">{c.invalidDateRange}</p>}
        <button className="primary-action" disabled={pending || !siteName || !startDate || !endDate}>{pending ? c.saving : c.savePlan}</button>
      </form>
      <section className="timeline-panel">
        <div className="section-heading"><h2>{c.upcoming}</h2><span>{plans.length}</span></div>
        {plans.length === 0 ? <div className="empty-feature"><CalendarClock size={30} /><p>{c.noPlans}</p></div> : <div className="plan-timeline">{plans.map((plan) => <article key={plan.id}>
          <div className="timeline-date"><strong>{new Date(plan.plannedFor).toLocaleDateString(locale, { day: "2-digit" })}</strong><span>{new Date(plan.plannedFor).toLocaleDateString(locale, { month: "short" })}</span></div>
          <div><span className="future-label">{c.future}</span><h3><MapPin size={15} />{plan.siteName}</h3><p>{plan.details || "—"}</p><button className={`privacy-dot ${plan.visibility.toLowerCase()}`} type="button" onClick={() => togglePlan(plan)}>{dateRange(plan)} · {plan.visibility === "PUBLIC" ? c.public : c.private}</button></div>
        </article>)}</div>}
      </section>
    </div>
  </div>;
}
