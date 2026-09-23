import { useMemo, useState } from "react";
import Layout from "./Layout";
import LandingStep from "./LandingStep";
import AddDataStep from "./AddDataStep";
import ConclusionStep from "./ConclusionStep";
const STEP_ORDER = ["landing", "addData", "conclusion"];
function isObject(value) {
 return value !== null && typeof value === "object" && !Array.isArray(value);
}
function normaliseAnalysis(data) {
 // n8n is allowed to omit a field temporarily while the workflow is being finalised.
 // Missing numeric values become null and the conclusion UI displays "—" instead of crashing.
 if (!isObject(data)) {
 throw new Error("The n8n response was not a JSON object.");
 }
 const hasRecognisableField = [
 "summary",
 "goalAmount",
 "alreadySaved",
 "requiredMonthly",
 "safeCapacity",
 "monthlyGap",
 "confidence",
 "whyThisResult",
 ].some((key) => Object.prototype.hasOwnProperty.call(data, key));
 if (!hasRecognisableField) {
 throw new Error("The n8n response does not match the expected analysis shape.");
 }
 const confidence = ["low", "medium", "high"].includes(data.confidence)
 ? data.confidence
 : null;
 return {
 summary: typeof data.summary === "string" ? data.summary : null,
 goalAmount: typeof data.goalAmount === "number" ? data.goalAmount : null,
 alreadySaved:
 typeof data.alreadySaved === "number" ? data.alreadySaved : null,
 requiredMonthly:
 typeof data.requiredMonthly === "number" ? data.requiredMonthly : null,
 safeCapacity:
 typeof data.safeCapacity === "number" ? data.safeCapacity : null,
 monthlyGap:
 typeof data.monthlyGap === "number" ? data.monthlyGap : null,
 confidence,
 whyThisResult:
 typeof data.whyThisResult === "string" ? data.whyThisResult : null,
 };
}
function buildN8nRequest(inputs) {
 const primary = inputs[0];
 if (inputs.length === 1) {
    // SINGLE INPUT: this is exactly the JSON contract requested for the first version.
 return {
 type: primary.type,
 payload: primary.payload,
 };
 }
 // MULTIPLE INPUTS:
 // We keep "type" as one of the documented values, while placing every collected
 // input inside payload.inputs so no manual/upload/voice data is lost.
 // If the final n8n workflow chooses another multi-input schema, change ONLY this function.
 return {
 type: primary.type,
 payload: {
 inputs: inputs.map(({ type, payload }) => ({ type, payload })),
 },
 };
}
export default function Dashboard() {
 const [step, setStep] = useState("landing");
 const [activeNav, setActiveNav] = useState("dashboard");
 const [language, setLanguage] = useState("EN");
 const [inputs, setInputs] = useState([]);
 const [analysis, setAnalysis] = useState(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [actionNotice, setActionNotice] = useState("");
 const hasData = inputs.length > 0;
 const stepIndex = useMemo(() => STEP_ORDER.indexOf(step), [step]);
 const addInput = (input) => {
 setInputs((current) => [
 ...current,
 {
 ...input,
 id: `${input.type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
 },
 ]);
 setError("");
 setActionNotice("");
 };
 const removeInput = (id) => {
 setInputs((current) => current.filter((input) => input.id !== id));
 };
 const analyse = async () => {
 if (!hasData || loading) return;
 const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
 if (!webhookUrl) {
 setError(
 "VITE_N8N_WEBHOOK_URL is missing. Add it to your .env file and restart Vite."
 );
 return;
 }
 setLoading(true);
 setError("");
 setActionNotice("");
 try {
    const res = await fetch(webhookUrl, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 // API keys are never sent from the React app. n8n owns its LLM credentials.
 body: JSON.stringify(buildN8nRequest(inputs)),
 });
 if (!res.ok) {
 throw new Error(`n8n returned HTTP ${res.status}.`);
 }
 let data;
 try {
 data = await res.json();
 } catch {
 throw new Error("n8n returned a response that was not valid JSON.");
 }
 const cleaned = normaliseAnalysis(data);
 setAnalysis(cleaned);
 setStep("conclusion");
 } catch (err) {
 setError(
 err instanceof Error
 ? err.message
 : "Something went wrong while analysing your data."
 );
 // Important: stay on Add Data. Never advance to Conclusion after an error.
 } finally {
 setLoading(false);
 }
 };
 const startFlow = () => {
 setError("");
 setActionNotice("");
 setStep("addData");
 };
 const adjustGoal = () => {
 setError("");
 setActionNotice("");
 setStep("addData");
 };
 const savePlan = () => {
 if (!analysis) return;
 localStorage.setItem(
 "goalpath-last-plan",
 JSON.stringify({
 savedAt: new Date().toISOString(),
 analysis,
 })
 );
 setActionNotice("This plan has been saved on this device.");
 };
 const renderNavigationView = () => {
 if (activeNav === "goals") {
 return (
 <section className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
 <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#4F1FA2]">
 Screen 2
 </p>
 <h1 className="mt-2 text-2xl font-extrabold text-[#0B1739]">
 My Goals
 </h1>
 <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
 Goal creation, analysis and the risk-profile dialogue belong to the
 next screen flow. This navigation item is already wired so it can
 be expanded without changing the shared layout.
 </p>
 </section>
 );
 }
 if (activeNav === "afford") {
 return (
 <section className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
 <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#4F1FA2]">
 Afford Check
 </p>
 <h1 className="mt-2 text-2xl font-extrabold text-[#0B1739]">
 Can I afford this?
 </h1>
 <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
 The dedicated affordability check is part of the later frontend
 flow. The shared navigation is functional now and ready for that
 component.
 </p>
 </section>
 );
 }
 if (step === "landing") {
 return <LandingStep onGetStarted={startFlow} language={language} />;
 }
 if (step === "addData") {
 return (
 <AddDataStep
 inputs={inputs}
 hasData={hasData}
 loading={loading}
 error={error}
 onAddInput={addInput}
 onRemoveInput={removeInput}
 onAnalyse={analyse}
 language={language}
 />
 );
 }
 return (
 <ConclusionStep
 analysis={analysis}
 actionNotice={actionNotice}
 onAdjustGoal={adjustGoal}
 onSavePlan={savePlan}
 language={language}
 />
 );
 };
 return (
 <Layout
 activeNav={activeNav}
 onNavChange={(nav) => {
 setActiveNav(nav);
 setError("");
 setActionNotice("");
 }}
 language={language}
 onLanguageChange={setLanguage}
 >
 {/* Main content stays inside the shared Layout; only this view changes. */}
 <div
 className="mx-auto w-full max-w-6xl"
 aria-label={`GoalPath step ${stepIndex + 1}`}
 >
 {renderNavigationView()}
 </div>
 </Layout>
 );
}