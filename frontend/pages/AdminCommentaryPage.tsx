import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LiveFeed } from "../components/LiveFeed";
import { MatchCard } from "../components/MatchCard";
import { API_BASE_URL } from "../constants";
import { useWebSocket } from "../hooks/useWebSocket";
import {
  createMatchCommentary,
  fetchMatchCommentary,
  fetchMatches,
} from "../services/api";
import type {
  CreateCommentaryInput,
  Commentary,
  Match,
  WSMessage,
} from "../types";

interface CommentaryFormState {
  message: string;
  minute: string;
  sequence: string;
  period: string;
  eventType: string;
  actor: string;
  team: string;
  tags: string;
}

const defaultCommentaryForm = (): CommentaryFormState => ({
  message: "",
  minute: "",
  sequence: "",
  period: "",
  eventType: "",
  actor: "",
  team: "",
  tags: "",
});

const buildPayload = (form: CommentaryFormState): CreateCommentaryInput => {
  const minute = form.minute.trim() === "" ? undefined : Number(form.minute);
  const sequence =
    form.sequence.trim() === "" ? undefined : Number(form.sequence);
  const tags =
    form.tags.trim() === ""
      ? undefined
      : form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

  const payload: CreateCommentaryInput = {
    message: form.message.trim(),
    ...(minute !== undefined && !Number.isNaN(minute) ? { minute } : {}),
    ...(sequence !== undefined && !Number.isNaN(sequence) ? { sequence } : {}),
    ...(form.period.trim() ? { period: form.period.trim() } : {}),
    ...(form.eventType.trim() ? { eventType: form.eventType.trim() } : {}),
    ...(form.actor.trim() ? { actor: form.actor.trim() } : {}),
    ...(form.team.trim() ? { team: form.team.trim() } : {}),
    ...(tags && tags.length > 0 ? { tags } : {}),
  };
  return payload;
};

export const AdminCommentaryPage: React.FC = () => {
  const { matchId: matchIdParam } = useParams<{ matchId: string }>();
  const matchId = matchIdParam ? decodeURIComponent(matchIdParam) : "";

  const [form, setForm] = useState(() => defaultCommentaryForm());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resolvedMatch, setResolvedMatch] = useState<Match | null | undefined>(
    undefined,
  );
  const [feed, setFeed] = useState<Commentary[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  const matchIdRef = useRef(matchId);
  useEffect(() => {
    matchIdRef.current = matchId;
  }, [matchId]);

  const handleWSMessage = useCallback((msg: WSMessage) => {
    if (msg.type !== "commentary") {
      return;
    }
    const routeMatchId = matchIdRef.current;
    if (!routeMatchId) {
      return;
    }
    const incomingMid = msg.data?.matchId;
    if (incomingMid != null && String(incomingMid) !== String(routeMatchId)) {
      return;
    }
    const normalized = {
      ...msg.data,
      createdAt: msg.data.createdAt ?? new Date().toISOString(),
    };
    setFeed((prev) => {
      if (
        normalized.id != null &&
        prev.some((c) => String(c.id) === String(normalized.id))
      ) {
        return prev;
      }
      return [normalized, ...prev];
    });
  }, []);

  const { connectGlobal, subscribeMatch, unsubscribeMatch } =
    useWebSocket(handleWSMessage);

  useEffect(() => {
    connectGlobal();
  }, [connectGlobal]);

  useEffect(() => {
    if (!matchId) {
      return;
    }
    subscribeMatch(matchId);
    return () => {
      unsubscribeMatch(matchId);
    };
  }, [matchId, subscribeMatch, unsubscribeMatch]);

  const loadFeed = useCallback(async () => {
    if (!matchId) return;
    setFeedLoading(true);
    setFeedError(null);
    try {
      const res = await fetchMatchCommentary(matchId, 100);
      setFeed(res.data || []);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load commentary";
      setFeedError(msg);
      setFeed([]);
    } finally {
      setFeedLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchMatches(200);
        const found = (res.data || []).find(
          (m) => String(m.id) === String(matchId),
        );
        if (!cancelled) setResolvedMatch(found ?? null);
      } catch {
        if (!cancelled) setResolvedMatch(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const update = <K extends keyof CommentaryFormState>(
    key: K,
    value: CommentaryFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!matchId) return;

    const payload = buildPayload(form);
    if (!payload.message) {
      setError("Message is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createMatchCommentary(matchId, payload);
      const id = res.data?.id;
      setSuccess(
        id != null
          ? `Commentary posted (id: ${String(id)}).`
          : "Commentary posted successfully.",
      );
      setForm(defaultCommentaryForm());
      await loadFeed();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to post commentary";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldLabel =
    "block text-xs font-bold uppercase tracking-wide text-gray-600 mb-1.5";
  const inputClass =
    "w-full rounded-xl border-2 border-black bg-white px-3 py-2.5 text-sm font-medium shadow-hard-sm focus:outline-none focus:ring-2 focus:ring-brand-dark/20";

  if (!matchId) {
    return (
      <div className="rounded-2xl border-2 border-black bg-white p-8 text-center shadow-hard-sm">
        <p className="font-bold text-lg mb-2">Missing match</p>
        <p className="text-sm text-gray-600 mb-4">
          Open this page as{" "}
          <span className="font-mono text-xs">/admin/&lt;matchId&gt;</span>.
        </p>
        <Link
          to="/admin"
          className="font-bold underline underline-offset-2 text-brand-dark"
        >
          Back to admin
        </Link>
      </div>
    );
  }

  const previewMatch: Match =
    resolvedMatch != null
      ? resolvedMatch
      : {
          id: matchId,
          sport: "—",
          homeTeam: "Home",
          awayTeam: "Away",
          status: "scheduled",
          startTime: new Date().toISOString(),
          homeScore: 0,
          awayScore: 0,
        };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-2">
        <Link
          to="/admin"
          className="font-bold text-black underline underline-offset-2 hover:opacity-80"
        >
          Admin
        </Link>
        <span aria-hidden>/</span>
        <span className="font-mono text-xs bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
          {matchId}
        </span>
        <span className="font-medium text-gray-500">Commentary</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold border-l-4 border-brand-blue pl-3">
              Post commentary
            </h2>
            <span className="text-xs font-mono bg-black text-white px-2 py-1 rounded break-all max-w-full text-right">
              POST …/matches/{matchId}/commentary
            </span>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white border-2 border-black rounded-2xl p-6 md:p-8 shadow-hard space-y-5"
          >
            <div>
              <label htmlFor="message" className={fieldLabel}>
                Message <span className="text-red-600">*</span>
              </label>
              <textarea
                id="message"
                className={`${inputClass} min-h-[120px] resize-y`}
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="What happened on the pitch?"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="minute" className={fieldLabel}>
                  Minute
                </label>
                <input
                  id="minute"
                  type="number"
                  min={0}
                  className={inputClass}
                  value={form.minute}
                  onChange={(e) => update("minute", e.target.value)}
                  placeholder="e.g. 67"
                />
              </div>
              <div>
                <label htmlFor="sequence" className={fieldLabel}>
                  Sequence
                </label>
                <input
                  id="sequence"
                  type="number"
                  min={0}
                  className={inputClass}
                  value={form.sequence}
                  onChange={(e) => update("sequence", e.target.value)}
                  placeholder="Optional order"
                />
              </div>
              <div>
                <label htmlFor="period" className={fieldLabel}>
                  Period
                </label>
                <input
                  id="period"
                  className={inputClass}
                  value={form.period}
                  onChange={(e) => update("period", e.target.value)}
                  placeholder="e.g. Q2, 1st half"
                />
              </div>
              <div>
                <label htmlFor="eventType" className={fieldLabel}>
                  Event type
                </label>
                <input
                  id="eventType"
                  className={inputClass}
                  value={form.eventType}
                  onChange={(e) => update("eventType", e.target.value)}
                  placeholder="e.g. goal, foul"
                />
              </div>
              <div>
                <label htmlFor="actor" className={fieldLabel}>
                  Actor
                </label>
                <input
                  id="actor"
                  className={inputClass}
                  value={form.actor}
                  onChange={(e) => update("actor", e.target.value)}
                  placeholder="Player or official"
                />
              </div>
              <div>
                <label htmlFor="team" className={fieldLabel}>
                  Team
                </label>
                <input
                  id="team"
                  className={inputClass}
                  value={form.team}
                  onChange={(e) => update("team", e.target.value)}
                  placeholder="Team label"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="tags" className={fieldLabel}>
                  Tags{" "}
                  <span className="font-normal normal-case">
                    (comma-separated)
                  </span>
                </label>
                <input
                  id="tags"
                  className={inputClass}
                  value={form.tags}
                  onChange={(e) => update("tags", e.target.value)}
                  placeholder="highlight, var, injury"
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

            {feedError && (
              <div
                role="alert"
                className="rounded-xl border-2 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-950 font-medium"
              >
                Could not refresh feed: {feedError}
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
                {submitting ? "Posting…" : "Post commentary"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(defaultCommentaryForm());
                  setError(null);
                  setSuccess(null);
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-sm border-2 border-black bg-white hover:bg-gray-50 transition-all"
              >
                Reset form
              </button>
              <button
                type="button"
                onClick={() => loadFeed()}
                className="px-4 py-2.5 rounded-xl font-bold text-sm border-2 border-black bg-white hover:bg-gray-50 transition-all"
              >
                Refresh feed
              </button>
            </div>
          </form>
        </main>

        <aside className="lg:col-span-1 space-y-4 lg:sticky lg:top-8 self-start">
        

          <div className="h-[420px] lg:h-[min(520px,calc(100vh-220px))]">
            <LiveFeed messages={feed} isActive isLoading={feedLoading} />
          </div>
        </aside>
      </div>

      <section className="mt-12 border-t-2 border-gray-200 pt-8">
        <div className="bg-white border-2 border-black rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">
              i
            </span>
            Commentary API
          </h3>
          <div className="grid md:grid-cols-2 gap-8 text-sm text-gray-600">
            <div>
              <h4 className="font-bold text-black mb-2">Endpoint</h4>
              <p className="mb-2 break-all font-mono text-xs bg-gray-100 p-2 rounded border border-gray-200">
                POST {API_BASE_URL}/matches/&lt;matchId&gt;/commentary
              </p>
              <p>
                Body is JSON with at least{" "}
                <code className="bg-gray-100 px-1 rounded text-xs">
                  message
                </code>
                ; other fields mirror the commentary model.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-black mb-2">Realtime</h4>
              <p>
                After posting, subscribers watching this match should receive{" "}
                <code className="text-xs bg-gray-100 p-0.5 border border-gray-300 rounded">
                  commentary
                </code>{" "}
                events if your server broadcasts them.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
