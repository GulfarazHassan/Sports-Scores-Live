export interface Match {
  id: string | number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  status: string; // Allow flexible status strings from API
  startTime: string;
  endTime?: string;
  homeScore: number;
  awayScore: number;
  createdAt?: string;
}

export interface MatchResponse {
  data: Match[];
}

/** Payload for POST /matches (server may accept additional fields). */
export interface CreateMatchInput {
  sport: string;
  homeTeam: string;
  awayTeam: string;
  status: string;
  startTime: string;
  endTime?: string;
  homeScore: number;
  awayScore: number;
}

export interface CreateMatchResponse {
  data: Match;
}

/** Payload for PATCH /matches/:matchId/score */
export interface UpdateMatchScoreInput {
  homeScore: number;
  awayScore: number;
}

export interface UpdateMatchScoreResponse {
  data?: Match;
}

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export interface Commentary {
  id: string | number;
  matchId: string | number;
  minute?: number;
  sequence?: number;
  period?: string;
  eventType?: string;
  actor?: string;
  team?: string;
  message: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  createdAt?: string;
}

export interface CommentaryResponse {
  data: Commentary[];
}

/** Payload for POST /matches/:matchId/commentary (server may set id, matchId, createdAt). */
export interface CreateCommentaryInput {
  message: string;
  minute?: number;
  sequence?: number;
  period?: string;
  eventType?: string;
  actor?: string;
  team?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface CreateCommentaryResponse {
  data: Commentary;
}

// WebSocket Message Types
export interface WSMessageCommentary {
  type: "commentary";
  data: Commentary;
}

export interface WSMessageScore {
  type: "score_update";
  data: {
    homeScore: number;
    awayScore: number;
    matchId: string | number;
  };
}

export interface WSMessageWelcome {
  type: "welcome";
  message?: string;
}

export interface WSMessagePong {
  type: "pong";
}

export interface WSMessageError {
  type: "error";
  code: string;
  message: string;
}

export interface WSMessageSubscribed {
  type: "subscribed";
  matchId: string | number;
}

export interface WSMessageUnsubscribed {
  type: "unsubscribed";
  matchId: string | number;
}

export interface WSMessageSubscriptions {
  type: "subscriptions";
  matchIds: Array<string | number>;
}

export interface WSMessageSubscribedAll {
  type: "subscribed_all";
}

export interface WSMessageUnsubscribedAll {
  type: "unsubscribed_all";
}

export type WSMessage =
  | WSMessageCommentary
  | WSMessageScore
  | WSMessageWelcome
  | WSMessagePong
  | WSMessageError
  | WSMessageSubscribed
  | WSMessageUnsubscribed
  | WSMessageSubscriptions
  | WSMessageSubscribedAll
  | WSMessageUnsubscribedAll;
