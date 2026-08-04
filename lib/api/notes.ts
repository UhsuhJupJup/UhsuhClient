import { authedFetch } from "@/lib/api/client";
import type { Note, NoteGraph, NoteRecommendation } from "@/lib/types";

export async function getNotes(token: string): Promise<Note[]> {
  return (await authedFetch("/api/notes", token)).json();
}

export async function getNote(token: string, id: number | string): Promise<Note> {
  return (await authedFetch(`/api/notes/${id}`, token)).json();
}

export async function createNote(
  token: string,
  title: string,
  content: string,
): Promise<Note> {
  const response = await authedFetch("/api/notes", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  return response.json();
}

export async function updateNote(
  token: string,
  id: number | string,
  title: string,
  content: string,
): Promise<Note> {
  const response = await authedFetch(`/api/notes/${id}`, token, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  return response.json();
}

export async function deleteNote(token: string, id: number | string): Promise<void> {
  await authedFetch(`/api/notes/${id}`, token, { method: "DELETE" });
}

export async function getRecommendations(
  token: string,
  id: number | string,
): Promise<NoteRecommendation> {
  return (await authedFetch(`/api/notes/${id}/recommendations`, token)).json();
}

export async function getNoteGraph(
  token: string,
  id: number | string,
): Promise<NoteGraph> {
  return (await authedFetch(`/api/notes/${id}/graph`, token)).json();
}
