"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Shield, RefreshCw, Power } from "lucide-react";
import type { AdminAnalyticsData } from "@/lib/ai-gateway/admin";
import type { AISystemConfig, AICreditPolicies } from "@/lib/ai-gateway/types";
import { SiteContentAdminPanel } from "@/components/site-content-admin-panel";

export function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [system, setSystem] = useState<AISystemConfig | null>(null);
  const [policies, setPolicies] = useState<AICreditPolicies | null>(null);
  const [models, setModels] = useState<Array<{ model_id: string; enabled: boolean; credit_weight: number }>>([]);
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; email: string; displayName: string; creditsRemaining: number; creditsUsed: number }>>([]);

  const [killSwitchPending, setKillSwitchPending] = useState(false);
  const [savePending, setSavePending] = useState(false);

  const fetchAdminData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setLoading(true);
    setError("");
    try {
      const [configRes, analyticsRes, usersRes] = await Promise.all([
        fetch("/api/admin/config"),
        fetch("/api/admin/analytics"),
        fetch("/api/admin/users"),
      ]);

      if (!configRes.ok) {
        throw new Error(configRes.status === 403 ? "Administrator privileges required." : "Failed to load admin configuration.");
      }

      const configData = await configRes.json();
      setSystem(configData.system);
      setPolicies(configData.policies);
      setModels(configData.models || []);

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error connecting to admin service.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      try {
        const [configRes, analyticsRes, usersRes] = await Promise.all([
          fetch("/api/admin/config"),
          fetch("/api/admin/analytics"),
          fetch("/api/admin/users"),
        ]);
        if (!configRes.ok) throw new Error(configRes.status === 403 ? "Administrator privileges required." : "Failed to load admin configuration.");
        const configData = await configRes.json();
        if (!ignore) {
          setSystem(configData.system);
          setPolicies(configData.policies);
          setModels(configData.models || []);
        }
        if (analyticsRes.ok && !ignore) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData);
        }
        if (usersRes.ok && !ignore) {
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Error connecting to admin service.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const toggleKillSwitch = async () => {
    if (!system || killSwitchPending) return;
    setKillSwitchPending(true);
    setError("");
    try {
      const targetState = !system.killSwitchActive;
      const res = await fetch("/api/admin/kill-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: targetState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle kill switch.");
      setSystem({ ...system, killSwitchActive: data.killSwitchActive });
      setSuccessMessage(data.killSwitchActive ? "Global AI Kill Switch ACTIVATED." : "Global AI Kill Switch deactivated.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle kill switch.");
    } finally {
      setKillSwitchPending(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!system || !policies || savePending) return;
    setSavePending(true);
    setError("");
    try {
      const modelsMap: Record<string, { enabled: boolean; creditWeight: number }> = {};
      models.forEach((m) => {
        modelsMap[m.model_id] = { enabled: m.enabled, creditWeight: Number(m.credit_weight) };
      });

      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: {
            sharedAiEnabled: system.sharedAiEnabled,
            selectedModelId: system.selectedModelId,
            globalDailyThresholdCredits: Number(system.globalDailyThresholdCredits),
            globalWarningThresholdCredits: Number(system.globalWarningThresholdCredits),
          },
          policies: {
            monthlyAuthenticatedCredits: Number(policies.monthlyAuthenticatedCredits),
            guestTrialCredits: Number(policies.guestTrialCredits),
            userRequestsPerMinute: Number(policies.userRequestsPerMinute),
            guestRequestsPerMinute: Number(policies.guestRequestsPerMinute),
            maxInputCharacters: Number(policies.maxInputCharacters),
          },
          models: modelsMap,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update configuration.");
      setSuccessMessage("Admin configuration successfully saved and audited.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration.");
    } finally {
      setSavePending(false);
    }
  };

  if (loading) {
    return (
      <article className="settings-card admin-settings-card">
        <div className="context-head">
          <div>
            <h2>AI Administration & Gateway Controls</h2>
            <p>Loading real-time gateway metrics and configuration…</p>
          </div>
        </div>
      </article>
    );
  }

  if (error && !system) {
    return (
      <article className="settings-card admin-settings-card">
        <div className="context-head">
          <div>
            <h2>AI Administration & Gateway Controls</h2>
            <p className="inline-error">{error}</p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="settings-card admin-settings-card">
      <div className="context-head">
        <div>
          <h2>AI Administration & Gateway Controls</h2>
          <p>Configure shared AI policies, rate limits, credit weights, and emergency overrides.</p>
        </div>
        <button className="secondary-button" onClick={() => void fetchAdminData()} title="Refresh metrics">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && <p className="inline-error" role="alert">{error}</p>}
      {successMessage && <p className="inline-success" role="status"><CheckCircle size={14} /> {successMessage}</p>}

      <SiteContentAdminPanel />

      {/* Emergency Kill Switch Banner */}
      <section className={`admin-emergency-banner ${system?.killSwitchActive ? "banner-active" : ""}`}>
        <div className="banner-info">
          <Shield size={20} className={system?.killSwitchActive ? "text-error" : "text-muted"} />
          <div>
            <strong>Emergency Global AI Kill Switch</strong>
            <p>{system?.killSwitchActive ? "KILL SWITCH ACTIVE: All shared AI requests are blocked." : "Inactive: Normal inference traffic is permitted."}</p>
          </div>
        </div>
        <button
          className={system?.killSwitchActive ? "primary-button" : "account-danger-button"}
          onClick={() => void toggleKillSwitch()}
          disabled={killSwitchPending}
        >
          <Power size={14} /> {system?.killSwitchActive ? "Resume AI Service" : "Activate Kill Switch"}
        </button>
      </section>

      {/* Usage Analytics Grid */}
      {analytics && (
        <section className="admin-analytics-section">
          <h3>Gateway Telemetry & Consumption</h3>
          <div className="admin-metrics-grid">
            <div className="metric-box">
              <span className="metric-label">Total Requests</span>
              <span className="metric-val">{analytics.totalRequests}</span>
              <span className="metric-sub">{analytics.successfulRequests} ok · {analytics.failedRequests} err</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Active Learners</span>
              <span className="metric-val">{analytics.activeUsers}</span>
              <span className="metric-sub">{analytics.guestCount} guest trials</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Credits Deducted</span>
              <span className="metric-val">{analytics.totalCreditsDeducted.toFixed(1)}</span>
              <span className="metric-sub">{analytics.actualCount} actual · {analytics.estimatedCount} est</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Daily Threshold</span>
              <span className="metric-val">{analytics.dailyThresholdStatus.consumedToday.toFixed(0)} / {analytics.dailyThresholdStatus.threshold}</span>
              <span className="metric-sub">{analytics.dailyThresholdStatus.isExceeded ? "Exceeded" : analytics.dailyThresholdStatus.isWarning ? "Near Warning" : "Healthy"}</span>
            </div>
          </div>
        </section>
      )}

      {/* Configuration Form */}
      {system && policies && (
        <form onSubmit={(e) => void handleSaveConfig(e)} className="admin-config-form">
          <section className="admin-form-group">
            <h3>Shared Model & System Policy</h3>
            <div className="form-row">
              <label>
                Shared Cloudflare Model
                <input
                  type="text"
                  value={system.selectedModelId}
                  onChange={(e) => setSystem({ ...system, selectedModelId: e.target.value })}
                  placeholder="@cf/meta/llama-3.3-70b-instruct"
                  required
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={system.sharedAiEnabled}
                  onChange={(e) => setSystem({ ...system, sharedAiEnabled: e.target.checked })}
                />
                Enable KATALYST Shared AI
              </label>
            </div>
          </section>

          <p className="settings-explainer">The deployment owner can choose Gemini or Cloudflare Workers AI for shared Kat in the server environment. Gemini credentials remain server-side and are restricted to Kat; they are not a Workspace fallback. See the deployment guide for the exact server settings. Cloudflare remains the default when no shared provider is selected.</p>
          <section className="admin-form-group">
            <h3>User Quota & Rate Limit Rules</h3>
            <div className="form-grid-3">
              <label>
                Monthly Authenticated Credits
                <input
                  type="number"
                  value={policies.monthlyAuthenticatedCredits}
                  onChange={(e) => setPolicies({ ...policies, monthlyAuthenticatedCredits: Number(e.target.value) })}
                  min={10}
                  required
                />
              </label>
              <label>
                Guest Trial Credits
                <input
                  type="number"
                  value={policies.guestTrialCredits}
                  onChange={(e) => setPolicies({ ...policies, guestTrialCredits: Number(e.target.value) })}
                  min={5}
                  required
                />
              </label>
              <label>
                Max Input Characters
                <input
                  type="number"
                  value={policies.maxInputCharacters}
                  onChange={(e) => setPolicies({ ...policies, maxInputCharacters: Number(e.target.value) })}
                  min={1000}
                  required
                />
              </label>
              <label>
                User Requests / Minute
                <input
                  type="number"
                  value={policies.userRequestsPerMinute}
                  onChange={(e) => setPolicies({ ...policies, userRequestsPerMinute: Number(e.target.value) })}
                  min={1}
                  max={120}
                  required
                />
              </label>
              <label>
                Guest Requests / Minute
                <input
                  type="number"
                  value={policies.guestRequestsPerMinute}
                  onChange={(e) => setPolicies({ ...policies, guestRequestsPerMinute: Number(e.target.value) })}
                  min={1}
                  max={60}
                  required
                />
              </label>
              <label>
                Daily Global Quota Threshold
                <input
                  type="number"
                  value={system.globalDailyThresholdCredits}
                  onChange={(e) => setSystem({ ...system, globalDailyThresholdCredits: Number(e.target.value) })}
                  min={100}
                  required
                />
              </label>
            </div>
          </section>

          {/* Model Weights */}
          <section className="admin-form-group">
            <h3>Available Model Credit Weights</h3>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Model ID</th>
                    <th>Enabled</th>
                    <th>Credit Weight Multiplier</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m, idx) => (
                    <tr key={m.model_id}>
                      <td><code>{m.model_id}</code></td>
                      <td>
                        <input
                          type="checkbox"
                          checked={m.enabled}
                          onChange={(e) => {
                            const updated = [...models];
                            updated[idx] = { ...updated[idx], enabled: e.target.checked };
                            setModels(updated);
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="20"
                          value={m.credit_weight}
                          onChange={(e) => {
                            const updated = [...models];
                            updated[idx] = { ...updated[idx], credit_weight: Number(e.target.value) };
                            setModels(updated);
                          }}
                          style={{ width: "90px" }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="account-actions">
            <button type="submit" className="primary-button" disabled={savePending}>
              {savePending ? "Saving changes…" : "Save Configuration & Audit"}
            </button>
          </div>
        </form>
      )}

      {/* User Quota Inspection Table */}
      {users.length > 0 && (
        <section className="admin-users-section">
          <h3>Registered Learner Balances</h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User / Email</th>
                  <th>Remaining Credits</th>
                  <th>Used Credits</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 15).map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.displayName || u.email}</strong><br /><small>{u.email}</small></td>
                    <td>{u.creditsRemaining.toFixed(1)}</td>
                  <td>{u.creditsUsed.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </article>
  );
}
