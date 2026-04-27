import { API_BASE_URL } from "../constants";
import {
  CommentaryResponse,
  CreateCommentaryInput,
  CreateCommentaryResponse,
  CreateMatchInput,
  CreateMatchResponse,
  MatchResponse,
  UpdateMatchScoreInput,
  UpdateMatchScoreResponse,
} from "../types";

export const fetchMatches = async (limit = 50): Promise<MatchResponse> => {
  try {
    console.log("data122222 response11 :: ");
    const response = await fetch(`${API_BASE_URL}/matches?limit=${limit}`, {
      method: "GET",
    });
    console.log("data122222 response :: ", response);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.log("data122222 response11 error :: ", error);
    // Propagate error to be handled by the UI layer
    throw error;
  }
};

export const createMatch = async (
  payload: CreateMatchInput,
): Promise<CreateMatchResponse> => {
  const response = await fetch(`${API_BASE_URL}/matches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      text || `API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};

export const updateMatchScore = async (
  matchId: string | number,
  payload: UpdateMatchScoreInput,
): Promise<UpdateMatchScoreResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/matches/${matchId}/score`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      text || `API error: ${response.status} ${response.statusText}`,
    );
  }

  const text = await response.text().catch(() => "");
  if (!text.trim()) {
    return {};
  }
  try {
    return JSON.parse(text) as UpdateMatchScoreResponse;
  } catch {
    return {};
  }
};

export const fetchMatchCommentary = async (
  matchId: string | number,
  limit = 100,
): Promise<CommentaryResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/matches/${matchId}/commentary?limit=${limit}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const createMatchCommentary = async (
  matchId: string | number,
  payload: CreateCommentaryInput,
): Promise<CreateCommentaryResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/matches/${matchId}/commentary`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      text || `API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};
