import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MatchCard } from "../components/MatchCard";
import { API_BASE_URL } from "../constants";
import { createMatch, fetchMatches, updateMatchScore } from "../services/api";
import type { CreateMatchInput, Match } from "../types";

type AdminHubView = "hub" | "create" | "commentary" | "scores";

interface AdminFormState {
  sport: string;
  homeTeam: string;
  awayTeam: string;
  status: string;
  startTime: string;
  endTimeLocal: string;
  homeScore: number;
  awayScore: number;
}

const toDatetimeLocalValue = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
};

const fromDatetimeLocalToIso = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
};

const emptyToUndefined = (s: string) => (s.trim() === "" ? undefined : s);

const defaultForm = (): AdminFormState => ({
  sport: "Football",
  homeTeam: "",
  awayTeam: "",
  status: "scheduled",
  startTime: toDatetimeLocalValue(new Date()),
  endTimeLocal: "",
  homeScore: 0,
  awayScore: 0,
});

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [hubView, setHubView] = useState<AdminHubView>("hub");
  const [commentaryMatches, setCommentaryMatches] = useState<Match[]>([]);
  const [commentaryLoading, setCommentaryLoading] = useState(false);
  const [commentaryError, setCommentaryError] = useState<string | null>(null);
  const [form, setForm] = useState(() => defaultForm());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [scoreMatches, setScoreMatches] = useState<Match[]>([]);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreListError, setScoreListError] = useState<string | null>(null);
  const [selectedMatchForScore, setSelectedMatchForScore] =
    useState<Match | null>(null);
  const [scoreForm, setScoreForm] = useState({ homeScore: 0, awayScore: 0 });
  const [updateScoreSubmitting, setUpdateScoreSubmitting] = useState(false);
  const [updateScoreError, setUpdateScoreError] = useState<string | null>(null);
  const [updateScoreSuccess, setUpdateScoreSuccess] = useState<string | null>(
    null,
  );

  const previewMatch: Match = useMemo(
    () => ({
      id: "preview",
      sport: form.sport.trim() || "Sport",
      homeTeam: form.homeTeam.trim() || "Home team",
      awayTeam: form.awayTeam.trim() || "Away team",
      status: form.status,
      startTime: fromDatetimeLocalToIso(form.startTime),
      endTime: emptyToUndefined(form.endTimeLocal)
        ? fromDatetimeLocalToIso(form.endTimeLocal)
        : undefined,
      homeScore: Number.isFinite(form.homeScore) ? form.homeScore : 0,
      awayScore: Number.isFinite(form.awayScore) ? form.awayScore : 0,
    }),
    [form],
  );

  useEffect(() => {
    if (hubView !== "commentary") return;
    let cancelled = false;
    setCommentaryLoading(true);
    setCommentaryError(null);
    fetchMatches()
      .then((res) => {
        if (!cancelled) {
          setCommentaryMatches(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : "Failed to load matches";
          setCommentaryError(msg);
          setCommentaryMatches([]);
        }
      })
      .finally(() => {
        if (!cancelled) setCommentaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hubView]);

  useEffect(() => {
    if (hubView !== "scores") return;
    let cancelled = false;
    setScoreLoading(true);
    setScoreListError(null);
    fetchMatches(100)
      .then((res) => {
        if (!cancelled) {
          setScoreMatches(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : "Failed to load matches";
          setScoreListError(msg);
          setScoreMatches([]);
        }
      })
      .finally(() => {
        if (!cancelled) setScoreLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hubView]);

  const fieldLabel =
    "block text-xs font-bold uppercase tracking-wide text-gray-600 mb-1.5";
  const inputClass =
    "w-full rounded-xl border-2 border-black bg-white px-3 py-2.5 text-sm font-medium shadow-hard-sm focus:outline-none focus:ring-2 focus:ring-brand-dark/20";

  const hubCardClass =
    "text-left rounded-2xl border-2 border-black bg-white p-6 shadow-hard transition-all hover:shadow-hard-sm hover:brightness-[1.02] active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-brand-dark/25";

  const openScoreForm = (m: Match) => {
    setSelectedMatchForScore(m);
    setScoreForm({
      homeScore: Number(m.homeScore) || 0,
      awayScore: Number(m.awayScore) || 0,
    });
    setUpdateScoreError(null);
    setUpdateScoreSuccess(null);
  };

  const closeScoreForm = () => {
    setSelectedMatchForScore(null);
    setUpdateScoreError(null);
    setUpdateScoreSuccess(null);
  };

  const handleUpdateScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchForScore) return;
    setUpdateScoreError(null);
    setUpdateScoreSuccess(null);
    setUpdateScoreSubmitting(true);
    try {
      const payload = {
        homeScore: Number(scoreForm.homeScore) || 0,
        awayScore: Number(scoreForm.awayScore) || 0,
      };
      await updateMatchScore(selectedMatchForScore.id, payload);
      setUpdateScoreSuccess("Scores updated successfully.");
      setScoreMatches((prev) =>
        prev.map((m) =>
          // eslint-disable-next-line eqeqeq
          m.id == selectedMatchForScore.id
            ? {
                ...m,
                homeScore: payload.homeScore,
                awayScore: payload.awayScore,
              }
            : m,
        ),
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to update match score";
      setUpdateScoreError(msg);
    } finally {
      setUpdateScoreSubmitting(false);
    }
  };

  const update = <K extends keyof AdminFormState>(
    key: K,
    value: AdminFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.homeTeam.trim() || !form.awayTeam.trim()) {
      setError("Home team and away team are required.");
      return;
    }

    const payload: CreateMatchInput = {
      sport: form.sport.trim(),
      homeTeam: form.homeTeam.trim(),
      awayTeam: form.awayTeam.trim(),
      status: form.status,
      startTime: fromDatetimeLocalToIso(form.startTime),
      endTime: emptyToUndefined(form.endTimeLocal)
        ? fromDatetimeLocalToIso(form.endTimeLocal)
        : undefined,
      homeScore: Number(form.homeScore) || 0,
      awayScore: Number(form.awayScore) || 0,
    };

    setSubmitting(true);
    try {
      const res = await createMatch(payload);
      const id = res.data?.id;
      setSuccess(
        id != null
          ? `Match created successfully (id: ${String(id)}).`
          : "Match created successfully.",
      );
      setForm((prev) => ({
        ...defaultForm(),
        sport: prev.sport,
        status: prev.status,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create match";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (hubView === "hub") {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-brand-dark">Admin</h2>
          <p className="text-sm text-gray-600">
            Create a match, post commentary, or update live scores.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            type="button"
            className={hubCardClass}
            onClick={() => setHubView("create")}
          >
            <span className="block text-lg font-bold text-black mb-1">
              Create Match
            </span>
            <span className="text-sm text-gray-600">
              Publish a new fixture with teams, time, and scores.
            </span>
          </button>
          <button
            type="button"
            className={hubCardClass}
            onClick={() => setHubView("commentary")}
          >
            <span className="block text-lg font-bold text-black mb-1">
              Add Commentary
            </span>
            <span className="text-sm text-gray-600">
              Pick a match from the list to open the commentary editor.
            </span>
          </button>
          <button
            type="button"
            className={hubCardClass}
            onClick={() => setHubView("scores")}
          >
            <span className="block text-lg font-bold text-black mb-1">
              Update match scores
            </span>
            <span className="text-sm text-gray-600">
              Choose a match and set home and away scores.
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (hubView === "commentary") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setHubView("hub")}
            className="px-4 py-2 rounded-xl font-bold text-sm border-2 border-black bg-white hover:bg-gray-50 transition-all shadow-hard-sm"
          >
            ← Back
          </button>
          <h2 className="text-xl font-bold border-l-4 border-brand-blue pl-3">
            Add commentary
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          Select a match to post commentary on the next screen.
        </p>

        {commentaryLoading && (
          <p className="text-sm font-medium text-gray-600">Loading matches…</p>
        )}
        {commentaryError && (
          <div
            role="alert"
            className="rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-900 font-medium"
          >
            {commentaryError}
          </div>
        )}

        {!commentaryLoading &&
          !commentaryError &&
          commentaryMatches.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
              No matches yet.{" "}
              <button
                type="button"
                className="font-bold text-black underline underline-offset-2"
                onClick={() => setHubView("create")}
              >
                Create a match
              </button>{" "}
              first.
            </div>
          )}

        <ul className="space-y-3" aria-label="Matches">
          {commentaryMatches.map((m) => (
            <li key={String(m.id)}>
              <button
                type="button"
                onClick={() =>
                  navigate(`/admin/${encodeURIComponent(String(m.id))}`)
                }
                className="w-full text-left rounded-2xl border-2 border-black bg-white p-4 shadow-hard-sm hover:shadow-hard hover:brightness-[1.01] transition-all active:translate-y-0.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-black">
                    {m.homeTeam} <span className="text-gray-500">vs</span>{" "}
                    {m.awayTeam}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wide bg-brand-blue border border-black rounded-full px-2.5 py-0.5">
                    {m.sport}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  <span className="font-mono">ID: {String(m.id)}</span>
                  <span className="capitalize">{m.status}</span>
                  <span>
                    {m.homeScore} – {m.awayScore}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (hubView === "scores") {
    if (selectedMatchForScore) {
      return (
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={closeScoreForm}
              className="px-4 py-2 rounded-xl font-bold text-sm border-2 border-black bg-white hover:bg-gray-50 transition-all shadow-hard-sm"
            >
              ← Match list
            </button>
            <h2 className="text-xl font-bold border-l-4 border-brand-blue pl-3">
              Update scores
            </h2>
          </div>
          <div className="rounded-2xl border-2 border-black bg-white p-4 shadow-hard-sm text-sm text-gray-700">
            <p className="font-bold text-black">
              {selectedMatchForScore.homeTeam}{" "}
              <span className="text-gray-500">vs</span>{" "}
              {selectedMatchForScore.awayTeam}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              ID: {String(selectedMatchForScore.id)} ·{" "}
              {selectedMatchForScore.sport}
            </p>
          </div>
          <form
            onSubmit={handleUpdateScoreSubmit}
            className="bg-white border-2 border-black rounded-2xl p-6 shadow-hard space-y-5"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="update-homeScore" className={fieldLabel}>
                  Home score
                </label>
                <input
                  id="update-homeScore"
                  type="number"
                  min={0}
                  className={inputClass}
                  value={scoreForm.homeScore}
                  onChange={(e) => {
                    setUpdateScoreError(null);
                    setUpdateScoreSuccess(null);
                    setScoreForm((p) => ({
                      ...p,
                      homeScore: Number(e.target.value) || 0,
                    }));
                  }}
                />
              </div>
              <div>
                <label htmlFor="update-awayScore" className={fieldLabel}>
                  Away score
                </label>
                <input
                  id="update-awayScore"
                  type="number"
                  min={0}
                  className={inputClass}
                  value={scoreForm.awayScore}
                  onChange={(e) => {
                    setUpdateScoreError(null);
                    setUpdateScoreSuccess(null);
                    setScoreForm((p) => ({
                      ...p,
                      awayScore: Number(e.target.value) || 0,
                    }));
                  }}
                />
              </div>
            </div>
            {updateScoreError && (
              <div
                role="alert"
                className="rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-900 font-medium"
              >
                {updateScoreError}
              </div>
            )}
            {updateScoreSuccess && (
              <div
                role="status"
                className="rounded-xl border-2 border-black bg-brand-blue px-4 py-3 text-sm font-bold text-brand-dark"
              >
                {updateScoreSuccess}
              </div>
            )}
            <p className="text-xs font-mono text-gray-500">
              PATCH {API_BASE_URL}/matches/{String(selectedMatchForScore.id)}
              /score
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="submit"
                disabled={updateScoreSubmitting}
                className={`
                  px-6 py-2.5 rounded-xl font-bold text-sm border-2 border-black transition-all shadow-hard-sm
                  ${
                    updateScoreSubmitting
                      ? "bg-gray-200 text-gray-500 cursor-wait"
                      : "bg-brand-yellow hover:brightness-95 active:translate-y-0.5"
                  }
                `}
              >
                {updateScoreSubmitting ? "Saving…" : "Save scores"}
              </button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setHubView("hub")}
            className="px-4 py-2 rounded-xl font-bold text-sm border-2 border-black bg-white hover:bg-gray-50 transition-all shadow-hard-sm"
          >
            ← Back
          </button>
          <h2 className="text-xl font-bold border-l-4 border-brand-blue pl-3">
            Update match scores
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          Select a match, then set home and away scores only.
        </p>
        {scoreLoading && (
          <p className="text-sm font-medium text-gray-600">Loading matches…</p>
        )}
        {scoreListError && (
          <div
            role="alert"
            className="rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-900 font-medium"
          >
            {scoreListError}
          </div>
        )}
        {!scoreLoading && !scoreListError && scoreMatches.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
            No matches yet.{" "}
            <button
              type="button"
              className="font-bold text-black underline underline-offset-2"
              onClick={() => setHubView("create")}
            >
              Create a match
            </button>{" "}
            first.
          </div>
        )}
        <ul className="space-y-3" aria-label="Matches to update">
          {scoreMatches.map((m) => (
            <li key={String(m.id)}>
              <button
                type="button"
                onClick={() => openScoreForm(m)}
                className="w-full text-left rounded-2xl border-2 border-black bg-white p-4 shadow-hard-sm hover:shadow-hard hover:brightness-[1.01] transition-all active:translate-y-0.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-black">
                    {m.homeTeam} <span className="text-gray-500">vs</span>{" "}
                    {m.awayTeam}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wide bg-brand-blue border border-black rounded-full px-2.5 py-0.5">
                    {m.sport}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  <span className="font-mono">ID: {String(m.id)}</span>
                  <span className="capitalize">{m.status}</span>
                  <span>
                    {m.homeScore} – {m.awayScore}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setHubView("hub")}
          className="px-4 py-2 rounded-xl font-bold text-sm border-2 border-black bg-white hover:bg-gray-50 transition-all shadow-hard-sm"
        >
          ← Back
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold border-l-4 border-brand-blue pl-3">
              Create match
            </h2>
            <span className="text-xs font-mono bg-black text-white px-2 py-1 rounded">
              POST /matches
            </span>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white border-2 border-black rounded-2xl p-6 md:p-8 shadow-hard space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label htmlFor="sport" className={fieldLabel}>
                  Sport
                </label>
                <input
                  id="sport"
                  className={inputClass}
                  value={form.sport}
                  onChange={(e) => update("sport", e.target.value)}
                  placeholder="e.g. Football, Basketball"
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="homeTeam" className={fieldLabel}>
                  Home team
                </label>
                <input
                  id="homeTeam"
                  className={inputClass}
                  value={form.homeTeam}
                  onChange={(e) => update("homeTeam", e.target.value)}
                  placeholder="Home club or player"
                  autoComplete="off"
                  required
                />
              </div>
              <div>
                <label htmlFor="awayTeam" className={fieldLabel}>
                  Away team
                </label>
                <input
                  id="awayTeam"
                  className={inputClass}
                  value={form.awayTeam}
                  onChange={(e) => update("awayTeam", e.target.value)}
                  placeholder="Away club or player"
                  autoComplete="off"
                  required
                />
              </div>
              <div>
                <label htmlFor="status" className={fieldLabel}>
                  Status
                </label>
                <select
                  id="status"
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="finished">Finished</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="homeScore" className={fieldLabel}>
                    Home score
                  </label>
                  <input
                    id="homeScore"
                    type="number"
                    min={0}
                    className={inputClass}
                    value={form.homeScore}
                    onChange={(e) =>
                      update("homeScore", Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <label htmlFor="awayScore" className={fieldLabel}>
                    Away score
                  </label>
                  <input
                    id="awayScore"
                    type="number"
                    min={0}
                    className={inputClass}
                    value={form.awayScore}
                    onChange={(e) =>
                      update("awayScore", Number(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
              <div>
                <label htmlFor="startTime" className={fieldLabel}>
                  Start time
                </label>
                <input
                  id="startTime"
                  type="datetime-local"
                  className={inputClass}
                  value={form.startTime}
                  onChange={(e) => update("startTime", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="endTime" className={fieldLabel}>
                  End time{" "}
                  <span className="font-normal normal-case">(optional)</span>
                </label>
                <input
                  id="endTime"
                  type="datetime-local"
                  className={inputClass}
                  value={form.endTimeLocal}
                  onChange={(e) => update("endTimeLocal", e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-900 font-medium"
              >
                {error}
              </div>
            )}
            {success && (
              <div
                role="status"
                className="rounded-xl border-2 border-black bg-brand-blue px-4 py-3 text-sm font-bold text-brand-dark"
              >
                {success}{" "}
                <Link
                  to="/"
                  className="underline underline-offset-2 hover:opacity-80"
                >
                  View matches
                </Link>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className={`
                  px-6 py-2.5 rounded-xl font-bold text-sm border-2 border-black transition-all shadow-hard-sm
                  ${submitting ? "bg-gray-200 text-gray-500 cursor-wait" : "bg-brand-yellow hover:brightness-95 active:translate-y-0.5"}
                `}
              >
                {submitting ? "Publishing…" : "Publish match"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(defaultForm());
                  setError(null);
                  setSuccess(null);
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-sm border-2 border-black bg-white hover:bg-gray-50 transition-all"
              >
                Reset form
              </button>
            </div>
          </form>
        </main>

        <aside className="lg:col-span-1 space-y-4 lg:sticky lg:top-8 self-start">
          <div className="rounded-2xl border-2 border-black bg-brand-blue p-4 shadow-hard-sm">
            <h3 className="font-bold text-lg mb-1">Live preview</h3>
            <p className="text-xs font-medium text-gray-700 mb-4">
              How this match will look on the board (read-only).
            </p>
            <div className="pointer-events-none opacity-95">
              <MatchCard
                match={previewMatch}
                isActive={false}
                onWatch={() => {}}
                onUnwatch={() => {}}
              />
            </div>
          </div>
          <div className="rounded-2xl border-2 border-dashed border-gray-400 bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-bold text-black mb-2">Tips</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>
                Use <span className="font-mono text-xs">live</span> to show the
                &quot;Watch Live&quot; action on the home page.
              </li>
              <li>
                Use <span className="font-bold">Add Commentary</span> on the
                admin home to pick a match and post updates.
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <section className="mt-12 border-t-2 border-gray-200 pt-8">
        <div className="bg-white border-2 border-black rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">
              i
            </span>
            Admin &amp; API
          </h3>
          <div className="grid md:grid-cols-2 gap-8 text-sm text-gray-600">
            <div>
              <h4 className="font-bold text-black mb-2">Payload</h4>
              <p className="mb-2">
                The form submits JSON with{" "}
                <code className="bg-gray-100 px-1 rounded text-xs">sport</code>,{" "}
                <code className="bg-gray-100 px-1 rounded text-xs">
                  homeTeam
                </code>
                ,{" "}
                <code className="bg-gray-100 px-1 rounded text-xs">
                  awayTeam
                </code>
                ,{" "}
                <code className="bg-gray-100 px-1 rounded text-xs">status</code>
                ,{" "}
                <code className="bg-gray-100 px-1 rounded text-xs">
                  startTime
                </code>{" "}
                (ISO), optional{" "}
                <code className="bg-gray-100 px-1 rounded text-xs">
                  endTime
                </code>
                , and scores.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-black mb-2">After create</h4>
              <p className="mb-2">
                Open{" "}
                <Link
                  to="/"
                  className="font-bold text-black underline underline-offset-2"
                >
                  Matches
                </Link>{" "}
                to confirm the new row appears once your API lists it.
              </p>
              <p>
                Base URL is set in{" "}
                <code className="bg-gray-100 px-1 rounded">constants.ts</code>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
