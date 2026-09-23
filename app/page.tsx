"use client";

import { useEffect, useMemo, useState } from "react";
import { initialAssessment, calculateComplexity, totalPlanDays, assessmentCoverage, planCoverage, deriveFindings, syncPlanFromAssessment } from "@/lib/assessment";
import { questions } from "@/lib/questions";
import { AssessmentState, Classification, Workstream } from "@/lib/types";

const STORAGE_KEY = "gamesroomz-prime-assessment-v1";

const sections = [
  "Overview",
  "Project Health",
  "Unity & Android",
  "Core Gameplay",
  "PvP Architecture",
  "Multi-Touch & Input",
  "Prime 16:9 UI",
  "Gamesroomz Integration",
  "Prime Hardware & QA",
  "Conversion Plan",
  "Management Summary",
];

const classificationHelp: Record<Exclude<Classification, "">, string> = {
  reuse: "Existing implementation can remain substantially unchanged.",
  modify: "Existing implementation is usable but requires changes.",
  rewrite: "Existing implementation is unsuitable and needs substantial redevelopment.",
  new: "This capability does not currently exist and must be newly developed.",
};

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={"pill pill-" + tone}>{children}</span>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="field-label">{children}</label>;
}

export default function HomePage() {
  const [state, setState] = useState<AssessmentState>(() => initialAssessment());
  const [active, setActive] = useState("Overview");
  const [loaded, setLoaded] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>("multiplayer-architecture");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState(JSON.parse(saved));
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...state, lastSavedAt: new Date().toISOString() })
      );
    }, 300);
    return () => window.clearTimeout(timer);
  }, [state, loaded]);

  const complexity = useMemo(() => calculateComplexity(state), [state]);
  const assessPct = useMemo(() => assessmentCoverage(state), [state]);
  const planPct = useMemo(() => planCoverage(state), [state]);
  const totalDays = useMemo(() => totalPlanDays(state), [state]);
  const findings = useMemo(() => deriveFindings(state), [state]);

  const sectionQuestions = questions.filter((q) => q.section === active);

  function updateGameInfo(key: keyof AssessmentState["gameInfo"], value: string) {
    setState((s) => ({ ...s, gameInfo: { ...s.gameInfo, [key]: value } }));
  }

  function updateResponse(id: string, patch: Record<string, unknown>) {
    setState((s) => ({
      ...s,
      responses: {
        ...s.responses,
        [id]: { ...s.responses[id], ...patch },
      },
    }));
  }

  function updatePlan(id: string, patch: Partial<Workstream>) {
    setState((s) => ({
      ...s,
      plan: s.plan.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }));
  }

  function applyAssessmentToPlan() {
    setState((s) => ({ ...s, plan: syncPlanFromAssessment(s), status: "planning" }));
    setActive("Conversion Plan");
  }

  function resetAll() {
    if (!confirm("Reset this assessment and remove the locally saved draft?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setState(initialAssessment());
    setActive("Overview");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">G</div>
          <div>
            <strong>Gamesroomz Prime</strong>
            <span>Conversion Portal</span>
          </div>
        </div>

        <div className="game-chip">
          <span className="eyebrow">Reference assessment</span>
          <strong>{state.gameInfo.gameName || "Untitled game"}</strong>
          <span>{state.status.replaceAll("-", " ")}</span>
        </div>

        <nav>
          {sections.map((item) => (
            <button
              key={item}
              className={active === item ? "nav-item active" : "nav-item"}
              onClick={() => setActive(item)}
            >
              {item}
              {item !== "Overview" && item !== "Conversion Plan" && item !== "Management Summary" && (
                <span className="nav-count">
                  {questions.filter((q) => q.section === item).length || ""}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span>Assessment {assessPct}%</span>
          <div className="mini-progress"><i style={{ width: assessPct + "%" }} /></div>
          <span>Plan {planPct}%</span>
          <div className="mini-progress"><i style={{ width: planPct + "%" }} /></div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">Techninier · Prime Game Conversion</span>
            <h1>{active}</h1>\n            <div className="workspace-meta"><span>{state.gameInfo.gameName || "Untitled game"}</span><i /> <span>Draft autosaved locally</span></div>
          </div>
          <div className="top-actions">
            <Pill tone={complexity.level}>{complexity.label}</Pill>
            <button className="button secondary" onClick={() => window.print()}>Print report</button>
            <button className="button ghost" onClick={resetAll}>Reset</button>
          </div>
        </header>

        {active === "Overview" && (
          <div className="page-grid">
            <section className="card span-2">
              <div className="card-heading">
                <div>
                  <span className="eyebrow">Purpose</span>
                  <h2>Define what “redo” actually means</h2>
                </div>
                <Pill tone="info">Bubble Shooter PvP</Pill>
              </div>
              <p className="lead">
                This portal separates reusable game content from real Prime conversion work.
                Developers first assess the existing game, then document the implementation plan,
                dependencies, risks and person-days for every affected workstream.
              </p>
              <div className="principles">
                <div><strong>1</strong><span>Assess</span><small>What exists today?</small></div>
                <div><strong>2</strong><span>Classify</span><small>Reuse, modify, rewrite or new?</small></div>
                <div><strong>3</strong><span>Plan</span><small>How will Prime support be implemented?</small></div>
                <div><strong>4</strong><span>Estimate</span><small>How many person-days and what risks?</small></div>
              </div>
            </section>

            <section className="dashboard-metrics span-2">
              <div className="metric-card">
                <div className="metric-icon metric-icon-purple">A</div>
                <div><span>Assessment</span><strong>{assessPct}%</strong><small>Technical coverage</small></div>
              </div>
              <div className="metric-card">
                <div className="metric-icon metric-icon-blue">P</div>
                <div><span>Conversion plan</span><strong>{planPct}%</strong><small>Planning coverage</small></div>
              </div>
              <div className="metric-card">
                <div className="metric-icon metric-icon-green">D</div>
                <div><span>Planned effort</span><strong>{totalDays}</strong><small>Person-days</small></div>
              </div>
              <div className="metric-card">
                <div className="metric-icon metric-icon-orange">R</div>
                <div><span>High-risk areas</span><strong>{state.plan.filter(w=>w.risk==="high").length}</strong><small>Need attention</small></div>
              </div>
            </section>

            <section className="card">
              <span className="eyebrow">Game information</span>
              <div className="form-stack">
                <div><FieldLabel>Game name</FieldLabel><input value={state.gameInfo.gameName} onChange={(e)=>updateGameInfo("gameName", e.target.value)} /></div>
                <div><FieldLabel>Developer / team</FieldLabel><input value={state.gameInfo.developer} onChange={(e)=>updateGameInfo("developer", e.target.value)} placeholder="Name or team" /></div>
                <div><FieldLabel>Current Unity version</FieldLabel><input value={state.gameInfo.currentUnity} onChange={(e)=>updateGameInfo("currentUnity", e.target.value)} placeholder="e.g. 2020.3 LTS" /></div>
                <div><FieldLabel>Current Android API / SDK</FieldLabel><input value={state.gameInfo.currentAndroidApi} onChange={(e)=>updateGameInfo("currentAndroidApi", e.target.value)} placeholder="If known" /></div>
              </div>
            </section>

            <section className="card">
              <span className="eyebrow">Target conversion</span>
              <dl className="facts">
                <div><dt>Prime OS</dt><dd>Android</dd></div>
                <div><dt>Prime screen</dt><dd>16:9 tabletop display</dd></div>
                <div><dt>Existing game</dt><dd>{state.gameInfo.currentMultiplayer}</dd></div>
                <div><dt>Prime target</dt><dd>{state.gameInfo.targetPlayers}</dd></div>
                <div><dt>Game layout</dt><dd>Two vertical P1/P2 playfields</dd></div>
              </dl>
            </section>

            <section className="card span-2">
              <div className="card-heading">
                <div>
                  <span className="eyebrow">Progress</span>
                  <h2>Assessment → Conversion plan</h2>
                </div>
                <button className="button primary" onClick={()=>setActive("Project Health")}>Start assessment</button>
              </div>
              <div className="progress-row">
                <div><strong>{assessPct}%</strong><span>Technical assessment</span></div>
                <div className="progress-track"><i style={{width: assessPct+"%"}} /></div>
              </div>
              <div className="progress-row">
                <div><strong>{planPct}%</strong><span>Conversion planning</span></div>
                <div className="progress-track"><i style={{width: planPct+"%"}} /></div>
              </div>
              <p className="note">
                Drafts are currently saved in this browser only. Supabase persistence and multi-developer access are planned for the next iteration.
              </p>
            </section>
          </div>
        )}

        {sectionQuestions.length > 0 && (
          <div className="question-list">
            <div className="section-intro">
              <p>
                Answer the technical question, classify the expected Prime change, then explain why.
                Add person-days when you already have a reasonable estimate.
              </p>
            </div>

            {sectionQuestions.map((q, index) => {
              const r = state.responses[q.id];
              return (
                <article className="question-card" key={q.id}>
                  <div className="question-number">{String(index + 1).padStart(2, "0")}</div>
                  <div className="question-body">
                    <h3>{q.prompt}</h3>
                    {q.helper && <p className="helper">{q.helper}</p>}

                    <div className="answer-grid">
                      <div>
                        <FieldLabel>Answer</FieldLabel>
                        <div className="segmented">
                          {["yes","no","unsure"].map((answer) => (
                            <button
                              key={answer}
                              onClick={() => updateResponse(q.id, { answer })}
                              className={r.answer === answer ? "selected" : ""}
                            >
                              {answer === "unsure" ? "Not sure" : answer[0].toUpperCase() + answer.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <FieldLabel>Prime impact</FieldLabel>
                        <select value={r.classification} onChange={(e)=>updateResponse(q.id,{classification:e.target.value})}>
                          <option value="">Select…</option>
                          <option value="reuse">Reuse</option>
                          <option value="modify">Modify</option>
                          <option value="rewrite">Rewrite</option>
                          <option value="new">New</option>
                        </select>
                        {r.classification && <small className="classification-help">{classificationHelp[r.classification as Exclude<Classification,"">]}</small>}
                      </div>
                      <div className="effort-field">
                        <FieldLabel>Estimated person-days</FieldLabel>
                        <input type="number" min="0" step="0.5" value={r.effortDays || ""} onChange={(e)=>updateResponse(q.id,{effortDays:Number(e.target.value)})} placeholder="0" />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Developer explanation / technical evidence</FieldLabel>
                      <textarea value={r.explanation} onChange={(e)=>updateResponse(q.id,{explanation:e.target.value})} placeholder="Explain how the existing implementation works, why a change is or is not required, and any important dependency or limitation." />
                    </div>
                  </div>
                </article>
              );
            })}

            <div className="sticky-footer">
              <span>Draft autosaved locally</span>
              <div>
                <button className="button secondary" onClick={() => {
                  const currentIndex = sections.indexOf(active);
                  setActive(sections[Math.max(0,currentIndex-1)]);
                }}>Previous</button>
                <button className="button primary" onClick={() => {
                  const currentIndex = sections.indexOf(active);
                  const next = sections[currentIndex+1];
                  if (next === "Conversion Plan") applyAssessmentToPlan();
                  else setActive(next);
                }}>Continue</button>
              </div>
            </div>
          </div>
        )}

        {active === "Conversion Plan" && (
          <div className="plan-page">
            <div className="section-intro split">
              <div>
                <h2>Developer Conversion Plan</h2>
                <p>
                  The assessment identifies the impact. This section documents exactly how the developer intends to implement the conversion.
                  Every workstream should state the current implementation, Prime requirement, proposed solution, reusable parts, deliverable, effort and risk.
                </p>
              </div>
              <button className="button secondary" onClick={applyAssessmentToPlan}>Sync from assessment</button>
            </div>

            <div className="plan-summary-strip">
              <div><span>Total planned effort</span><strong>{totalDays} person-days</strong></div>
              <div><span>Workstreams</span><strong>{state.plan.length}</strong></div>
              <div><span>Plan completion</span><strong>{planPct}%</strong></div>
              <div><span>Complexity</span><strong>{complexity.label}</strong></div>
            </div>

            <div className="plan-list">
              {state.plan.map((w, index) => (
                <article className="plan-card" key={w.id}>
                  <button className="plan-head" onClick={()=>setExpandedPlan(expandedPlan===w.id?null:w.id)}>
                    <span className="plan-index">{String(index+1).padStart(2,"0")}</span>
                    <span className="plan-title">
                      <strong>{w.title}</strong>
                      <small>{w.deliverable}</small>
                    </span>
                    <Pill tone={w.classification || "neutral"}>{w.classification || "Unclassified"}</Pill>
                    <span className="days">{w.personDays || 0}d</span>
                    <span className="chevron">{expandedPlan===w.id?"−":"+"}</span>
                  </button>

                  {expandedPlan===w.id && (
                    <div className="plan-body">
                      <div className="two-col">
                        <div><FieldLabel>Current implementation</FieldLabel><textarea value={w.currentImplementation} onChange={(e)=>updatePlan(w.id,{currentImplementation:e.target.value})}/></div>
                        <div><FieldLabel>Prime requirement</FieldLabel><textarea value={w.primeRequirement} onChange={(e)=>updatePlan(w.id,{primeRequirement:e.target.value})}/></div>
                      </div>

                      <div className="three-col">
                        <div>
                          <FieldLabel>Classification</FieldLabel>
                          <select value={w.classification} onChange={(e)=>updatePlan(w.id,{classification:e.target.value as Classification})}>
                            <option value="">Select…</option><option value="reuse">Reuse</option><option value="modify">Modify</option><option value="rewrite">Rewrite</option><option value="new">New</option>
                          </select>
                        </div>
                        <div>
                          <FieldLabel>Scope</FieldLabel>
                          <select value={w.scopeType} onChange={(e)=>updatePlan(w.id,{scopeType:e.target.value as Workstream["scopeType"]})}>
                            <option value="mandatory">Mandatory Prime conversion</option>
                            <option value="enhancement">Optional / new enhancement</option>
                          </select>
                        </div>
                        <div>
                          <FieldLabel>Technical risk</FieldLabel>
                          <select value={w.risk} onChange={(e)=>updatePlan(w.id,{risk:e.target.value as Workstream["risk"]})}>
                            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                          </select>
                        </div>
                      </div>

                      <div><FieldLabel>Why is this change required?</FieldLabel><textarea value={w.whyChange} onChange={(e)=>updatePlan(w.id,{whyChange:e.target.value})} placeholder="Give the technical reason. Avoid simply saying 'redo'." /></div>
                      <div><FieldLabel>Proposed implementation</FieldLabel><textarea className="large" value={w.proposedImplementation} onChange={(e)=>updatePlan(w.id,{proposedImplementation:e.target.value})} placeholder="Describe the proposed architecture / implementation steps and how the Prime requirement will be achieved." /></div>

                      <div className="two-col">
                        <div><FieldLabel>Existing components to reuse</FieldLabel><textarea value={w.reusedComponents} onChange={(e)=>updatePlan(w.id,{reusedComponents:e.target.value})}/></div>
                        <div><FieldLabel>Components changed / removed / rebuilt</FieldLabel><textarea value={w.changedComponents} onChange={(e)=>updatePlan(w.id,{changedComponents:e.target.value})}/></div>
                      </div>

                      <div className="two-col">
                        <div><FieldLabel>Deliverable / acceptance outcome</FieldLabel><textarea value={w.deliverable} onChange={(e)=>updatePlan(w.id,{deliverable:e.target.value})}/></div>
                        <div><FieldLabel>Dependencies / assumptions</FieldLabel><textarea value={w.dependencies} onChange={(e)=>updatePlan(w.id,{dependencies:e.target.value})}/></div>
                      </div>

                      <div className="person-days">
                        <FieldLabel>Estimated engineering effort</FieldLabel>
                        <div><input type="number" min="0" step="0.5" value={w.personDays || ""} onChange={(e)=>updatePlan(w.id,{personDays:Number(e.target.value)})}/><span>person-days</span></div>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>

            <div className="sticky-footer">
              <span>{totalDays} person-days currently planned</span>
              <button className="button primary" onClick={()=>setActive("Management Summary")}>Generate management summary</button>
            </div>
          </div>
        )}

        {active === "Management Summary" && (
          <div className="summary-page">
            <section className="hero-summary">
              <div>
                <span className="eyebrow">Prime conversion assessment</span>
                <h2>{state.gameInfo.gameName}</h2>
                <p>
                  Existing mobile PvP → shared-device Prime multiplayer on Android,
                  16:9 tabletop display, simultaneous multi-touch and Gamesroomz integration.
                </p>
              </div>
              <div className={"complexity-box "+complexity.level}>
                <span>Overall conversion scope</span>
                <strong>{complexity.label}</strong>
              </div>
            </section>

            <div className="metrics">
              <div><span>Planned engineering effort</span><strong>{totalDays}</strong><small>person-days</small></div>
              <div><span>Assessment completion</span><strong>{assessPct}%</strong><small>technical questions</small></div>
              <div><span>Planning completion</span><strong>{planPct}%</strong><small>workstreams</small></div>
              <div><span>High-risk workstreams</span><strong>{state.plan.filter(w=>w.risk==="high").length}</strong><small>need attention</small></div>
            </div>

            <section className="card">
              <span className="eyebrow">What “redo” means</span>
              <h2>Reuse vs modification vs redevelopment</h2>
              <div className="finding-grid">
                {(["reuse","modify","rewrite","new"] as const).map((key)=>(
                  <div className={"finding "+key} key={key}>
                    <strong>{key==="new"?"New development":key[0].toUpperCase()+key.slice(1)}</strong>
                    {findings[key].length ? <ul>{findings[key].map(x=><li key={x}>{x}</li>)}</ul> : <p>None currently classified.</p>}
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <div className="card-heading">
                <div><span className="eyebrow">Implementation plan</span><h2>Effort by workstream</h2></div>
                <Pill tone="info">{totalDays} person-days</Pill>
              </div>
              <div className="summary-table">
                <div className="table-row table-head"><span>Workstream</span><span>Action</span><span>Risk</span><span>Scope</span><span>Days</span></div>
                {state.plan.map((w)=>(
                  <div className="table-row" key={w.id}>
                    <span><strong>{w.title}</strong><small>{w.deliverable}</small></span>
                    <span>{w.classification || "—"}</span>
                    <span>{w.risk}</span>
                    <span>{w.scopeType==="mandatory"?"Mandatory":"Enhancement"}</span>
                    <span>{w.personDays || 0}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <span className="eyebrow">Developer confirmation</span>
              <h2>Before scope approval</h2>
              <div className="confirmation-grid">
                <label><input type="checkbox"/> The assessment accurately describes the existing game architecture.</label>
                <label><input type="checkbox"/> All items classified as Rewrite/New include a technical reason and implementation approach.</label>
                <label><input type="checkbox"/> Optional enhancements are separated from mandatory Prime conversion work.</label>
                <label><input type="checkbox"/> Person-day estimates include implementation and developer testing assumptions.</label>
              </div>
              <div className="status-row">
                <FieldLabel>Assessment status</FieldLabel>
                <select value={state.status} onChange={(e)=>setState(s=>({...s,status:e.target.value as AssessmentState["status"]}))}>
                  <option value="draft">Draft</option>
                  <option value="assessment-complete">Assessment completed</option>
                  <option value="planning">Planning</option>
                  <option value="submitted">Submitted for review</option>
                  <option value="changes-requested">Changes requested</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
