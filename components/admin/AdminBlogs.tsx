"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ApiError } from "@/lib/api/client";
import {
  activateBlog,
  createBlog,
  deactivateBlog,
  getAdminBlogs,
  updateBlog,
} from "@/lib/api/admin";
import type { AdminBlog } from "@/lib/types";

const inputClass =
  "w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary";

export function AdminBlogs() {
  const { user, getIdToken } = useAuth();
  const [blogs, setBlogs] = useState<AdminBlog[] | null>(null);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [rssUrl, setRssUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editRssUrl, setEditRssUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    setBlogs(await getAdminBlogs(token));
  }, [getIdToken]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !domain.trim() || !rssUrl.trim()) {
      setFormError("모든 항목을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("missing token");
      await createBlog(token, {
        name: name.trim(),
        domain: domain.trim(),
        rssUrl: rssUrl.trim(),
      });
      setName("");
      setDomain("");
      setRssUrl("");
      await load();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        setFormError("이미 등록된 도메인이에요.");
      } else if (caught instanceof ApiError && caught.status === 400) {
        setFormError("입력값을 확인해 주세요.");
      } else {
        setFormError("추가에 실패했어요. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function toggle(blog: AdminBlog) {
    setPendingId(blog.id);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("missing token");
      if (blog.active) await deactivateBlog(token, blog.id);
      else await activateBlog(token, blog.id);
      await load();
    } catch {
      setFormError("상태 변경에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPendingId(null);
    }
  }

  function startEdit(blog: AdminBlog) {
    setEditingId(blog.id);
    setEditName(blog.name);
    setEditRssUrl(blog.rssUrl);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function saveEdit(id: number) {
    if (!editName.trim() || !editRssUrl.trim()) {
      setEditError("이름과 RSS URL을 입력해 주세요.");
      return;
    }
    setSavingEdit(true);
    setEditError(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("missing token");
      await updateBlog(token, id, { name: editName.trim(), rssUrl: editRssUrl.trim() });
      setEditingId(null);
      await load();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 400) {
        setEditError("입력값을 확인해 주세요.");
      } else {
        setEditError("수정에 실패했어요. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="이름 (예: 우아한형제들)"
            className={inputClass}
          />
          <input
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="도메인 (예: techblog.woowahan.com)"
            className={`${inputClass} font-mono`}
          />
          <input
            value={rssUrl}
            onChange={(event) => setRssUrl(event.target.value)}
            placeholder="RSS URL"
            className={`${inputClass} font-mono`}
          />
        </div>
        {formError && <p className="text-sm text-danger mt-3">{formError}</p>}
        <div className="flex justify-end mt-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center bg-primary text-primary-fg px-5 py-2.5 rounded-[9px] font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "추가 중…" : "블로그 추가"}
          </button>
        </div>
      </form>

      {blogs === null ? (
        <div className="bg-card border border-border rounded-2xl px-5 py-10 text-center text-sm text-muted">
          불러오는 중…
        </div>
      ) : blogs.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl px-5 py-16 text-center text-sm text-muted">
          등록된 블로그가 없어요.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="font-semibold px-5 py-3">이름</th>
                  <th className="font-semibold px-5 py-3">도메인</th>
                  <th className="font-semibold px-5 py-3">RSS</th>
                  <th className="font-semibold px-5 py-3">상태</th>
                  <th className="font-semibold px-5 py-3 text-right">관리</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => {
                  const editing = editingId === blog.id;
                  return (
                    <tr key={blog.id} className="border-b border-border last:border-0 align-top">
                      <td className="px-5 py-4 font-medium whitespace-nowrap">
                        {editing ? (
                          <input
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                            placeholder="이름"
                            className={`${inputClass} min-w-[160px]`}
                          />
                        ) : (
                          blog.name
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-muted whitespace-nowrap">
                        {blog.domain}
                      </td>
                      <td className="px-5 py-4">
                        {editing ? (
                          <input
                            value={editRssUrl}
                            onChange={(event) => setEditRssUrl(event.target.value)}
                            placeholder="RSS URL"
                            className={`${inputClass} font-mono min-w-[240px]`}
                          />
                        ) : (
                          <a
                            href={blog.rssUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block max-w-[260px] truncate font-mono text-xs text-muted hover:text-primary"
                          >
                            {blog.rssUrl}
                          </a>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            blog.active ? "bg-primary-soft text-primary" : "bg-chip-bg text-muted"
                          }`}
                        >
                          {blog.active ? "활성" : "정지됨"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {editing ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => saveEdit(blog.id)}
                                disabled={savingEdit}
                                className="inline-flex items-center bg-primary text-primary-fg px-3.5 py-1.5 rounded-[9px] font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {savingEdit ? "저장 중…" : "저장"}
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={savingEdit}
                                className="inline-flex items-center px-3.5 py-1.5 rounded-[9px] font-bold text-xs border border-border text-muted hover:text-fg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                취소
                              </button>
                            </div>
                            {editError && <p className="text-xs text-danger m-0">{editError}</p>}
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => startEdit(blog)}
                              disabled={pendingId === blog.id}
                              className="inline-flex items-center px-3.5 py-1.5 rounded-[9px] font-bold text-xs border border-border text-muted hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => toggle(blog)}
                              disabled={pendingId === blog.id}
                              className={`inline-flex items-center px-3.5 py-1.5 rounded-[9px] font-bold text-xs border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                blog.active
                                  ? "border-border text-muted hover:border-danger hover:text-danger"
                                  : "border-primary text-primary hover:bg-primary-soft"
                              }`}
                            >
                              {pendingId === blog.id ? "처리 중…" : blog.active ? "정지" : "재개"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
