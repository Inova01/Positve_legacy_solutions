"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BlogPost, CmsDocument, PostStatus } from "../cms-types";
import { ClientsPanel } from "./ClientsPanel";

type View = "overview" | "posts" | "documents" | "clients";
type User = { name: string; email: string };
type PostDraft = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  status: PostStatus;
  featuredImageUrl: string;
  author: string;
};
type DocumentDraft = {
  id: string;
  title: string;
  description: string;
  status: PostStatus;
};
type DeleteTarget = { kind: "post" | "document"; id: string; title: string };

const emptyPost: PostDraft = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "Community",
  tags: "",
  status: "draft",
  featuredImageUrl: "",
  author: "Positive Legacy Solutions",
};

const categories = [
  "Insurance",
  "Real Estate",
  "Tax",
  "Immigration",
  "Community",
];

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;
  if (!response.ok) throw new Error(payload.error || "Something went wrong.");
  return payload;
}

function formatDate(value: string | null): string {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatSize(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function initials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PL";
}

export function DashboardClient({
  user,
  signOutPath,
}: {
  user: User;
  signOutPath: string;
}) {
  const [view, setView] = useState<View>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [documents, setDocuments] = useState<CmsDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PostStatus>("all");
  const [postEditorOpen, setPostEditorOpen] = useState(false);
  const [postDraft, setPostDraft] = useState<PostDraft>(emptyPost);
  const [documentEditor, setDocumentEditor] = useState<DocumentDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadStatus, setUploadStatus] = useState<PostStatus>("published");

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const [postPayload, documentPayload] = await Promise.all([
        jsonRequest<{ posts: BlogPost[] }>("/api/admin/posts"),
        jsonRequest<{ documents: CmsDocument[] }>("/api/admin/documents"),
      ]);
      setPosts(postPayload.posts);
      setDocuments(documentPayload.documents);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to load content.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadContent(), 0);
    return () => window.clearTimeout(timer);
  }, [loadContent]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesStatus = statusFilter === "all" || post.status === statusFilter;
      const matchesQuery =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.category.toLowerCase().includes(query) ||
        post.tags.some((tag) => tag.toLowerCase().includes(query));
      return matchesStatus && matchesQuery;
    });
  }, [posts, search, statusFilter]);

  const publishedPosts = posts.filter((post) => post.status === "published").length;
  const draftPosts = posts.length - publishedPosts;

  function changeView(nextView: View) {
    setView(nextView);
    setMobileNavOpen(false);
  }

  function openNewPost() {
    setPostDraft({ ...emptyPost });
    setPostEditorOpen(true);
  }

  function openPost(post: BlogPost) {
    setPostDraft({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      tags: post.tags.join(", "),
      status: post.status,
      featuredImageUrl: post.featuredImageUrl,
      author: post.author,
    });
    setPostEditorOpen(true);
  }

  async function savePost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const editing = Boolean(postDraft.id);
      const payload = await jsonRequest<{ post: BlogPost }>(
        editing ? `/api/admin/posts/${postDraft.id}` : "/api/admin/posts",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postDraft),
        },
      );
      setPosts((current) => {
        const next = current.filter((post) => post.id !== payload.post.id);
        return [payload.post, ...next];
      });
      setPostEditorOpen(false);
      notify(editing ? "Post updated." : "Post created.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to save post.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadPdf(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadFile) {
      notify("Choose a PDF first.");
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", uploadFile);
      form.append("title", uploadTitle);
      form.append("description", uploadDescription);
      form.append("status", uploadStatus);
      const payload = await jsonRequest<{ document: CmsDocument }>(
        "/api/admin/documents",
        { method: "POST", body: form },
      );
      setDocuments((current) => [payload.document, ...current]);
      setUploadFile(null);
      setUploadTitle("");
      setUploadDescription("");
      setUploadStatus("published");
      const input = document.getElementById("pdf-file") as HTMLInputElement | null;
      if (input) input.value = "";
      notify("PDF uploaded.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to upload PDF.");
    } finally {
      setBusy(false);
    }
  }

  async function saveDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!documentEditor) return;
    setBusy(true);
    try {
      const payload = await jsonRequest<{ document: CmsDocument }>(
        `/api/admin/documents/${documentEditor.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(documentEditor),
        },
      );
      setDocuments((current) =>
        current.map((item) =>
          item.id === payload.document.id ? payload.document : item,
        ),
      );
      setDocumentEditor(null);
      notify("PDF details updated.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to update PDF.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteContent() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const url =
        deleteTarget.kind === "post"
          ? `/api/admin/posts/${deleteTarget.id}`
          : `/api/admin/documents/${deleteTarget.id}`;
      await jsonRequest<{ ok: true }>(url, { method: "DELETE" });
      if (deleteTarget.kind === "post") {
        setPosts((current) => current.filter((post) => post.id !== deleteTarget.id));
      } else {
        setDocuments((current) =>
          current.filter((item) => item.id !== deleteTarget.id),
        );
      }
      setDeleteTarget(null);
      notify(deleteTarget.kind === "post" ? "Post deleted." : "PDF deleted.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to delete item.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-shell">
      <button
        className="mobile-nav-button"
        type="button"
        aria-label="Open navigation"
        onClick={() => setMobileNavOpen(true)}
      >
        Menu
      </button>
      {mobileNavOpen && (
        <button
          className="nav-scrim"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">PLS</span>
          <span>
            <strong>Positive Legacy</strong>
            <small>Content Manager</small>
          </span>
        </div>

        <nav className="admin-nav" aria-label="Dashboard navigation">
          <button
            type="button"
            className={view === "overview" ? "active" : ""}
            onClick={() => changeView("overview")}
          >
            <span className="nav-index">01</span> Overview
          </button>
          <button
            type="button"
            className={view === "posts" ? "active" : ""}
            onClick={() => changeView("posts")}
          >
            <span className="nav-index">02</span> Blog posts
          </button>
          <button
            type="button"
            className={view === "documents" ? "active" : ""}
            onClick={() => changeView("documents")}
          >
            <span className="nav-index">03</span> PDF library
          </button>
          <button
            type="button"
            className={view === "clients" ? "active" : ""}
            onClick={() => changeView("clients")}
          >
            <span className="nav-index">04</span> Clients
          </button>
        </nav>

        <div className="sidebar-footer">
          <a href="https://inova01.github.io/Positve_legacy_solutions/" target="_blank">
            View public website <span aria-hidden="true">↗</span>
          </a>
          <a href={signOutPath}>Sign out</a>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Positive Legacy Solutions</p>
            <h1>
              {view === "overview"
                ? "Content overview"
                : view === "posts"
                  ? "Blog posts"
                  : view === "documents"
                    ? "PDF library"
                    : "Client relationships"}
            </h1>
          </div>
          <div className="user-chip">
            <span className="user-avatar">{initials(user.name)}</span>
            <span>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </span>
          </div>
        </header>

        {loading ? (
          <DashboardLoading />
        ) : view === "overview" ? (
          <Overview
            posts={posts}
            documents={documents}
            publishedPosts={publishedPosts}
            draftPosts={draftPosts}
            onNewPost={openNewPost}
            onDocuments={() => changeView("documents")}
            onPosts={() => changeView("posts")}
          />
        ) : view === "posts" ? (
          <section className="content-panel">
            <div className="panel-toolbar">
              <div className="filter-group">
                <label className="search-field">
                  <span className="sr-only">Search posts</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search title, category or tag"
                  />
                </label>
                <select
                  aria-label="Filter posts by status"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as "all" | PostStatus)
                  }
                >
                  <option value="all">All statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                </select>
              </div>
              <button className="primary-button compact" type="button" onClick={openNewPost}>
                <span aria-hidden="true">+</span> New post
              </button>
            </div>

            <div className="data-list" aria-live="polite">
              {filteredPosts.length === 0 ? (
                <EmptyState
                  title="No posts found"
                  copy="Create a first article or change the current filters."
                  action="Create post"
                  onAction={openNewPost}
                />
              ) : (
                filteredPosts.map((post) => (
                  <article className="post-row" key={post.id}>
                    <div className="post-thumb">
                      {post.featuredImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.featuredImageUrl} alt="" />
                      ) : (
                        <span>{post.category.slice(0, 1)}</span>
                      )}
                    </div>
                    <div className="post-row-copy">
                      <div className="row-kicker">
                        <span className={`status-pill ${post.status}`}>{post.status}</span>
                        <span>{post.category}</span>
                      </div>
                      <h2>{post.title}</h2>
                      <p>{post.excerpt || "No excerpt added yet."}</p>
                    </div>
                    <div className="row-meta">
                      <small>{formatDate(post.publishedAt || post.updatedAt)}</small>
                      <div className="row-actions">
                        <button type="button" onClick={() => openPost(post)}>Edit</button>
                        {post.status === "published" && (
                          <a
                            href={`https://inova01.github.io/Positve_legacy_solutions/blog-single.html?slug=${encodeURIComponent(post.slug)}`}
                            target="_blank"
                          >
                            View ↗
                          </a>
                        )}
                        <button
                          className="danger-link"
                          type="button"
                          onClick={() =>
                            setDeleteTarget({ kind: "post", id: post.id, title: post.title })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : view === "documents" ? (
          <section className="documents-layout">
            <form className="upload-card" onSubmit={uploadPdf}>
              <div>
                <p className="eyebrow">New resource</p>
                <h2>Upload a PDF</h2>
                <p>PDF only, up to 20 MB. Published files appear on the public blog.</p>
              </div>
              <label className="drop-field" htmlFor="pdf-file">
                <span className="drop-icon">PDF</span>
                <strong>{uploadFile ? uploadFile.name : "Choose a PDF file"}</strong>
                <small>{uploadFile ? formatSize(uploadFile.size) : "Click to browse"}</small>
                <input
                  id="pdf-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <label className="form-field">
                <span>Display title</span>
                <input
                  value={uploadTitle}
                  onChange={(event) => setUploadTitle(event.target.value)}
                  placeholder="Defaults to the filename"
                />
              </label>
              <label className="form-field">
                <span>Description</span>
                <textarea
                  value={uploadDescription}
                  onChange={(event) => setUploadDescription(event.target.value)}
                  rows={3}
                  placeholder="A short explanation for visitors"
                />
              </label>
              <label className="form-field">
                <span>Visibility</span>
                <select
                  value={uploadStatus}
                  onChange={(event) => setUploadStatus(event.target.value as PostStatus)}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </label>
              <button className="primary-button" disabled={busy} type="submit">
                {busy ? "Uploading…" : "Upload PDF"} <span aria-hidden="true">↑</span>
              </button>
            </form>

            <div className="document-library">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Resource library</p>
                  <h2>{documents.length} PDF{documents.length === 1 ? "" : "s"}</h2>
                </div>
              </div>
              {documents.length === 0 ? (
                <EmptyState
                  title="No PDFs uploaded"
                  copy="Your downloadable resources will appear here."
                />
              ) : (
                <div className="document-grid">
                  {documents.map((item) => (
                    <article className="document-card" key={item.id}>
                      <div className="document-card-top">
                        <span className="pdf-badge">PDF</span>
                        <span className={`status-pill ${item.status}`}>{item.status}</span>
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.description || item.filename}</p>
                      <div className="document-meta">
                        <span>{formatSize(item.size)}</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                      <div className="row-actions">
                        {item.status === "published" && (
                          <a href={item.downloadUrl} target="_blank">Open ↗</a>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setDocumentEditor({
                              id: item.id,
                              title: item.title,
                              description: item.description,
                              status: item.status,
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="danger-link"
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              kind: "document",
                              id: item.id,
                              title: item.title,
                            })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          <ClientsPanel notify={notify} />
        )}
      </main>

      {postEditorOpen && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Post editor">
          <form className="editor-modal" onSubmit={savePost}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">{postDraft.id ? "Edit article" : "New article"}</p>
                <h2>{postDraft.id ? postDraft.title || "Untitled post" : "Create a blog post"}</h2>
              </div>
              <button
                className="close-button"
                type="button"
                aria-label="Close editor"
                onClick={() => setPostEditorOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="editor-grid">
              <div className="editor-main-column">
                <label className="form-field">
                  <span>Title</span>
                  <input
                    required
                    value={postDraft.title}
                    onChange={(event) =>
                      setPostDraft((draft) => ({ ...draft, title: event.target.value }))
                    }
                    placeholder="Give the article a clear title"
                  />
                </label>
                <label className="form-field">
                  <span>Short excerpt</span>
                  <textarea
                    value={postDraft.excerpt}
                    onChange={(event) =>
                      setPostDraft((draft) => ({ ...draft, excerpt: event.target.value }))
                    }
                    rows={3}
                    placeholder="A concise summary shown on the blog page"
                  />
                </label>
                <label className="form-field grow-field">
                  <span>Article body <small>Markdown supported</small></span>
                  <textarea
                    required
                    value={postDraft.content}
                    onChange={(event) =>
                      setPostDraft((draft) => ({ ...draft, content: event.target.value }))
                    }
                    rows={16}
                    placeholder={"Start writing here…\n\nUse ## for section headings and - for lists."}
                  />
                </label>
              </div>
              <aside className="editor-side-column">
                <label className="form-field">
                  <span>Status</span>
                  <select
                    value={postDraft.status}
                    onChange={(event) =>
                      setPostDraft((draft) => ({
                        ...draft,
                        status: event.target.value as PostStatus,
                      }))
                    }
                  >
                    <option value="draft">Save as draft</option>
                    <option value="published">Publish</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>Category</span>
                  <select
                    value={postDraft.category}
                    onChange={(event) =>
                      setPostDraft((draft) => ({ ...draft, category: event.target.value }))
                    }
                  >
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>URL slug</span>
                  <input
                    value={postDraft.slug}
                    onChange={(event) =>
                      setPostDraft((draft) => ({ ...draft, slug: event.target.value }))
                    }
                    placeholder="Generated from title"
                  />
                </label>
                <label className="form-field">
                  <span>Tags</span>
                  <input
                    value={postDraft.tags}
                    onChange={(event) =>
                      setPostDraft((draft) => ({ ...draft, tags: event.target.value }))
                    }
                    placeholder="family, taxes, jacksonville"
                  />
                </label>
                <label className="form-field">
                  <span>Featured image URL</span>
                  <input
                    type="url"
                    value={postDraft.featuredImageUrl}
                    onChange={(event) =>
                      setPostDraft((draft) => ({
                        ...draft,
                        featuredImageUrl: event.target.value,
                      }))
                    }
                    placeholder="https://…"
                  />
                </label>
                <label className="form-field">
                  <span>Author</span>
                  <input
                    value={postDraft.author}
                    onChange={(event) =>
                      setPostDraft((draft) => ({ ...draft, author: event.target.value }))
                    }
                  />
                </label>
              </aside>
            </div>
            <div className="modal-footer">
              <button className="secondary-button" type="button" onClick={() => setPostEditorOpen(false)}>
                Cancel
              </button>
              <button className="primary-button" disabled={busy} type="submit">
                {busy ? "Saving…" : postDraft.status === "published" ? "Save and publish" : "Save draft"}
              </button>
            </div>
          </form>
        </div>
      )}

      {documentEditor && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Edit PDF">
          <form className="small-modal" onSubmit={saveDocument}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">PDF details</p>
                <h2>Edit resource</h2>
              </div>
              <button className="close-button" type="button" onClick={() => setDocumentEditor(null)}>×</button>
            </div>
            <label className="form-field">
              <span>Display title</span>
              <input
                required
                value={documentEditor.title}
                onChange={(event) =>
                  setDocumentEditor((draft) =>
                    draft ? { ...draft, title: event.target.value } : draft,
                  )
                }
              />
            </label>
            <label className="form-field">
              <span>Description</span>
              <textarea
                rows={4}
                value={documentEditor.description}
                onChange={(event) =>
                  setDocumentEditor((draft) =>
                    draft ? { ...draft, description: event.target.value } : draft,
                  )
                }
              />
            </label>
            <label className="form-field">
              <span>Visibility</span>
              <select
                value={documentEditor.status}
                onChange={(event) =>
                  setDocumentEditor((draft) =>
                    draft
                      ? { ...draft, status: event.target.value as PostStatus }
                      : draft,
                  )
                }
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
            <div className="modal-footer">
              <button className="secondary-button" type="button" onClick={() => setDocumentEditor(null)}>Cancel</button>
              <button className="primary-button" disabled={busy} type="submit">{busy ? "Saving…" : "Save changes"}</button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-layer" role="alertdialog" aria-modal="true" aria-label="Confirm deletion">
          <div className="confirm-modal">
            <span className="warning-mark">!</span>
            <p className="eyebrow">Permanent action</p>
            <h2>Delete “{deleteTarget.title}”?</h2>
            <p>
              This {deleteTarget.kind === "post" ? "post" : "PDF and its file"} cannot be recovered after deletion.
            </p>
            <div className="modal-footer">
              <button className="secondary-button" type="button" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="danger-button" disabled={busy} type="button" onClick={() => void deleteContent()}>
                {busy ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function Overview({
  posts,
  documents,
  publishedPosts,
  draftPosts,
  onNewPost,
  onDocuments,
  onPosts,
}: {
  posts: BlogPost[];
  documents: CmsDocument[];
  publishedPosts: number;
  draftPosts: number;
  onNewPost: () => void;
  onDocuments: () => void;
  onPosts: () => void;
}) {
  return (
    <div className="overview-stack">
      <section className="stat-grid">
        <article className="stat-card featured">
          <span className="stat-number">{posts.length.toString().padStart(2, "0")}</span>
          <div><strong>Total posts</strong><small>All blog content</small></div>
        </article>
        <article className="stat-card">
          <span className="stat-number">{publishedPosts.toString().padStart(2, "0")}</span>
          <div><strong>Published</strong><small>Visible on the website</small></div>
        </article>
        <article className="stat-card">
          <span className="stat-number">{draftPosts.toString().padStart(2, "0")}</span>
          <div><strong>Drafts</strong><small>Still being prepared</small></div>
        </article>
        <article className="stat-card">
          <span className="stat-number">{documents.length.toString().padStart(2, "0")}</span>
          <div><strong>PDF resources</strong><small>Client downloads</small></div>
        </article>
      </section>

      <section className="quick-actions">
        <button type="button" onClick={onNewPost}>
          <span className="action-symbol">+</span>
          <span><strong>Write a new article</strong><small>Start with a draft or publish immediately</small></span>
          <span aria-hidden="true">→</span>
        </button>
        <button type="button" onClick={onDocuments}>
          <span className="action-symbol">PDF</span>
          <span><strong>Upload a client resource</strong><small>Add brochures, checklists or guides</small></span>
          <span aria-hidden="true">→</span>
        </button>
      </section>

      <section className="overview-columns">
        <div className="overview-card">
          <div className="section-heading">
            <div><p className="eyebrow">Recently updated</p><h2>Latest posts</h2></div>
            <button type="button" onClick={onPosts}>View all</button>
          </div>
          {posts.length === 0 ? (
            <EmptyState title="No posts yet" copy="Your newest articles will appear here." />
          ) : (
            <div className="mini-list">
              {posts.slice(0, 4).map((post) => (
                <article key={post.id}>
                  <span className={`status-dot ${post.status}`} />
                  <div><strong>{post.title}</strong><small>{post.category} · {formatDate(post.updatedAt)}</small></div>
                  <span className={`status-pill ${post.status}`}>{post.status}</span>
                </article>
              ))}
            </div>
          )}
        </div>
        <div className="overview-card">
          <div className="section-heading">
            <div><p className="eyebrow">Download center</p><h2>Recent PDFs</h2></div>
            <button type="button" onClick={onDocuments}>Manage</button>
          </div>
          {documents.length === 0 ? (
            <EmptyState title="No PDFs yet" copy="Uploaded resources will appear here." />
          ) : (
            <div className="mini-list">
              {documents.slice(0, 4).map((item) => (
                <article key={item.id}>
                  <span className="mini-pdf">PDF</span>
                  <div><strong>{item.title}</strong><small>{formatSize(item.size)} · {formatDate(item.createdAt)}</small></div>
                  <span className={`status-pill ${item.status}`}>{item.status}</span>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyState({
  title,
  copy,
  action,
  onAction,
}: {
  title: string;
  copy: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state">
      <span>PLS</span>
      <h3>{title}</h3>
      <p>{copy}</p>
      {action && onAction && <button type="button" onClick={onAction}>{action}</button>}
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="loading-grid" aria-label="Loading dashboard">
      {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
    </div>
  );
}
