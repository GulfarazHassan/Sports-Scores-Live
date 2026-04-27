import React, { useEffect, useMemo, useState } from "react";
import { MatchCard } from "../components/MatchCard";
import { LiveFeed } from "../components/LiveFeed";
import { API_BASE_URL, WS_BASE_URL } from "../constants";
import type { UseMatchData } from "../hooks/useMatchData";
import type { Commentary, Match } from "../types";

const DUMMY_MATCHES: Match[] = [
  {
    id: "demo-1",
    sport: "Football",
    homeTeam: "North End FC",
    awayTeam: "Riverside United",
    status: "live",
    startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    homeScore: 2,
    awayScore: 1,
  },
  {
    id: "demo-2",
    sport: "Basketball",
    homeTeam: "City Hawks",
    awayTeam: "Harbor Lights",
    status: "live",
    startTime: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    homeScore: 54,
    awayScore: 51,
  },
  {
    id: "demo-3",
    sport: "Tennis",
    homeTeam: "A. Costa",
    awayTeam: "M. Singh",
    status: "scheduled",
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    homeScore: 0,
    awayScore: 0,
  },
];

const DUMMY_COMMENTARY_BY_MATCH: Record<string, Commentary[]> = {
  "demo-1": [
    {
      id: "c1",
      matchId: "demo-1",
      minute: 12,
      eventType: "goal",
      team: "North End FC",
      message: "Goal! Header from the corner — North End lead 1-0.",
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: "c2",
      matchId: "demo-1",
      minute: 34,
      eventType: "yellow_card",
      team: "Riverside United",
      message: "Yellow card for a late challenge on the wing.",
      createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: "c3",
      matchId: "demo-1",
      minute: 41,
      eventType: "goal",
      team: "Riverside United",
      message: "Equalizer! Low drive from the edge of the box. 1-1.",
      createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    },
    {
      id: "c4",
      matchId: "demo-1",
      minute: 67,
      eventType: "goal",
      team: "North End FC",
      message:
        "North End back in front — tidy finish after a quick counter. 2-1.",
      createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    },
  ],
  "demo-2": [
    {
      id: "b1",
      matchId: "demo-2",
      period: "Q2",
      minute: 6,
      message: "City Hawks on a 8-0 run; timeout Harbor Lights.",
      createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    },
    {
      id: "b2",
      matchId: "demo-2",
      period: "Q2",
      minute: 4,
      message: "And-one finish at the rim — crowd on its feet.",
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
  ],
  "demo-3": [
    {
      id: "t1",
      matchId: "demo-3",
      message:
        "Players are on court for warm-ups; first serve in about 25 minutes.",
      createdAt: new Date().toISOString(),
    },
  ],
};

interface HomePageProps {
  matchData: UseMatchData;
}

export const HomePage: React.FC<HomePageProps> = ({ matchData }) => {
  const pageSize = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const {
    matches,
    isLoading,
    error,
    commentary,
    isCommentaryLoading,
    activeMatchId,
    newMatchesCount,
    dismissNewMatches,
    watchMatch,
    unwatchMatch,
    reloadMatches,
  } = matchData;

  const mergedMatches = useMemo(() => {
    if (isLoading && !error) {
      return matches;
    }
    const seen = new Set(matches.map((m) => String(m.id)));
    return [...matches];
  }, [matches, isLoading, error]);

  const displayCommentary = useMemo(() => {
    if (activeMatchId == null) {
      return commentary;
    }
    const key = String(activeMatchId);
    const demoFeed = DUMMY_COMMENTARY_BY_MATCH[key];
    if (!demoFeed?.length) {
      return commentary;
    }
    const byId = new Map<string, Commentary>();
    for (const c of demoFeed) {
      byId.set(String(c.id), c);
    }
    for (const c of commentary) {
      byId.set(String(c.id), c);
    }
    const merged = Array.from(byId.values());
    merged.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
    return merged;
  }, [activeMatchId, commentary]);

  const totalPages = Math.max(1, Math.ceil(mergedMatches.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedMatches = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return mergedMatches.slice(startIndex, startIndex + pageSize);
  }, [mergedMatches, currentPage, pageSize]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold border-l-4 border-brand-blue pl-3">
              Current Matches
            </h2>
            <span className="text-xs font-mono bg-black text-white px-2 py-1 rounded">
              API: {isLoading ? "..." : matches.length}
            </span>
          </div>
          {newMatchesCount > 0 && (
            <div className="flex items-center justify-between gap-3 bg-brand-yellow border-2 border-black rounded-xl px-4 py-3 shadow-hard-sm">
              <span className="text-sm font-bold">
                {newMatchesCount} new match{newMatchesCount > 1 ? "es" : ""}{" "}
                added
              </span>
              <button
                type="button"
                onClick={dismissNewMatches}
                className="px-3 py-1 rounded-full text-xs font-bold border-2 border-black bg-white hover:bg-gray-50 transition-all"
              >
                Dismiss
              </button>
            </div>
          )}

          {isLoading && (
            <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-2xl">
              <div className="animate-spin w-8 h-8 border-4 border-brand-yellow border-t-black rounded-full mx-auto mb-4" />
              <p className="font-medium text-gray-500">Loading matches...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-500 text-red-900 p-6 rounded-xl text-center shadow-sm">
              <div className="flex justify-center mb-3 text-red-500">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-1">Connection Error</h3>
              <p className="font-mono text-sm bg-red-100 py-1 px-2 rounded inline-block mb-4 border border-red-200">
                {error}
              </p>
              <p className="text-sm opacity-80 mb-6 max-w-md mx-auto">
                The application could not reach the API. Please ensure the API
                server is online and accessible from your network.
              </p>
              <button
                type="button"
                onClick={reloadMatches}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-all shadow-md active:translate-y-0.5"
              >
                Retry Connection
              </button>
            </div>
          )}

          {!isLoading && !error && mergedMatches.length === 0 && (
            <div className="p-12 text-center border-2 border-black rounded-2xl bg-gray-50">
              <p className="font-bold text-lg">No matches found</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pagedMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                // eslint-disable-next-line eqeqeq
                isActive={activeMatchId == match.id}
                onWatch={watchMatch}
                onUnwatch={unwatchMatch}
              />
            ))}
          </div>
          {!isLoading && !error && mergedMatches.length > pageSize && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-xs font-medium text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className={`
                      px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-black transition-all
                      ${currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50"}
                    `}
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`
                      px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-black transition-all
                      ${currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50"}
                    `}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </main>

        <aside className="lg:col-span-1 h-[500px] lg:h-[calc(100vh-140px)] lg:sticky lg:top-8">
          <LiveFeed
            messages={displayCommentary}
            isActive={!!activeMatchId}
            isLoading={
              isCommentaryLoading &&
              activeMatchId != null &&
              DUMMY_COMMENTARY_BY_MATCH[String(activeMatchId)] === undefined
            }
          />
        </aside>
      </div>

      <section className="mt-12 border-t-2 border-gray-200 pt-8">
        <div className="bg-white border-2 border-black rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">
              ?
            </span>
            How to login as Admin to Create Match and Create commentary on existing matches
          </h3>
          <div className="grid md:grid-cols-2 gap-8 text-sm text-gray-600">
            <div>
              <h4 className="font-bold text-black mb-2">Login Creds</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <code className="bg-gray-100 px-1 rounded">
                  Username: admin
                  </code>
                </li>
                <li>
                  <code className="bg-gray-100 px-1 rounded">
                  Password: admin
                  </code>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-black mb-2">How to Verify</h4>
              <p className="mb-2">
                1. Click the action button on any card (it shows &quot;Watch
                Live&quot; for live games).
              </p>
              <p className="mb-2">
                2. The status indicator top-right will turn green.
              </p>
              <p>
                3. Wait for{" "}
                <code className="text-xs bg-gray-100 p-0.5 border border-gray-300 rounded">
                  score_update
                </code>{" "}
                or{" "}
                <code className="text-xs bg-gray-100 p-0.5 border border-gray-300 rounded">
                  commentary
                </code>{" "}
                events from the server. The card score updates instantly, and
                the right panel fills with text.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
