"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type {
  ClientMessage,
  ClientRecord,
  ClientStatus,
} from "../cms-types";

type ClientDraft = {
  fullName: string;
  email: string;
  phone: string;
  service: string;
  source: string;
  status: ClientStatus;
  notes: string;
};

const emptyClient: ClientDraft = {
  fullName: "",
  email: "",
  phone: "",
  service: "General inquiry",
  source: "Manual entry",
  status: "new",
  notes: "",
};

const services = [
  "General inquiry",
  "Insurance",
  "Real Estate",
  "Tax Services",
  "Immigration",
  "Notary & Translation",
];

const statuses: Array<{ value: ClientStatus; label: string }> = [
  { value: "new", label: "New client" },
  { value: "contacted", label: "Contacted" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
];

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "Something went wrong.");
  return payload;
}

function shortDate(value: string | null): string {
  if (!value) return "No activity yet";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function clientDraft(client: ClientRecord): ClientDraft {
  return {
    fullName: client.fullName,
    email: client.email,
    phone: client.phone,
    service: client.service,
    source: client.source,
    status: client.status,
    notes: client.notes,
  };
}

export function ClientsPanel({ notify }: { notify: (message: string) => void }) {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<ClientDraft | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ClientStatus>("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClient, setNewClient] = useState<ClientDraft>({ ...emptyClient });
  const [messageOpen, setMessageOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const selected = clients.find((client) => client.id === selectedId) ?? null;

  useEffect(() => {
    let active = true;
    void requestJson<{ clients: ClientRecord[] }>("/api/admin/clients")
      .then((payload) => {
        if (!active) return;
        setClients(payload.clients);
        const firstClient = payload.clients[0];
        if (firstClient) {
          setSelectedId((current) => current ?? firstClient.id);
          setDetails(clientDraft(firstClient));
        }
      })
      .catch((error) => notify(error instanceof Error ? error.message : "Unable to load clients."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [notify]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    void requestJson<{ messages: ClientMessage[] }>(
      `/api/admin/clients/${selectedId}/messages`,
    )
      .then((payload) => active && setMessages(payload.messages))
      .catch((error) => notify(error instanceof Error ? error.message : "Unable to load messages."));
    return () => { active = false; };
  }, [selectedId, notify]);

  function chooseClient(client: ClientRecord) {
    setSelectedId(client.id);
    setDetails(clientDraft(client));
    setMessages([]);
  }

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      const matchesSearch =
        !query ||
        client.fullName.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.service.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [clients, search, statusFilter]);

  async function createClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = await requestJson<{ client: ClientRecord }>("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      setClients((current) => [payload.client, ...current]);
      setSelectedId(payload.client.id);
      setDetails(clientDraft(payload.client));
      setNewClient({ ...emptyClient });
      setNewClientOpen(false);
      notify("New client added.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to add client.");
    } finally {
      setBusy(false);
    }
  }

  async function saveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !details) return;
    setBusy(true);
    try {
      const payload = await requestJson<{ client: ClientRecord }>(
        `/api/admin/clients/${selected.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(details),
        },
      );
      setClients((current) =>
        current.map((client) => client.id === payload.client.id ? payload.client : client),
      );
      setDetails(clientDraft(payload.client));
      notify("Client details updated.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to update client.");
    } finally {
      setBusy(false);
    }
  }

  async function prepareEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      const payload = await requestJson<{ message: ClientMessage }>(
        `/api/admin/clients/${selected.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, body }),
        },
      );
      setMessages((current) => [payload.message, ...current]);
      setClients((current) =>
        current.map((client) =>
          client.id === selected.id
            ? {
                ...client,
                status: client.status === "new" ? "contacted" : client.status,
                messageCount: client.messageCount + 1,
                lastMessageAt: payload.message.createdAt,
                updatedAt: payload.message.createdAt,
              }
            : client,
        ),
      );
      setDetails((current) =>
        current && current.status === "new" ? { ...current, status: "contacted" } : current,
      );
      const mailto = `mailto:${encodeURIComponent(selected.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setMessageOpen(false);
      setSubject("");
      setBody("");
      notify("Message prepared. Complete sending in your email app.");
      window.location.href = mailto;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to prepare message.");
    } finally {
      setBusy(false);
    }
  }

  const newCount = clients.filter((client) => client.status === "new").length;
  const activeCount = clients.filter((client) => client.status === "active").length;
  const contactedCount = clients.filter((client) => client.status === "contacted").length;

  if (loading) {
    return <div className="loading-grid" aria-label="Loading clients">{Array.from({ length: 4 }, (_, index) => <span key={index} />)}</div>;
  }

  return (
    <div className="client-workspace">
      <section className="client-stat-grid">
        <article className="client-stat featured"><strong>{clients.length}</strong><span>Total clients</span></article>
        <article className="client-stat"><strong>{newCount}</strong><span>New</span></article>
        <article className="client-stat"><strong>{contactedCount}</strong><span>Follow-up</span></article>
        <article className="client-stat"><strong>{activeCount}</strong><span>Active</span></article>
      </section>

      <section className="content-panel client-panel">
        <div className="panel-toolbar">
          <div className="filter-group">
            <label className="search-field">
              <span className="sr-only">Search clients</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or service" />
            </label>
            <select aria-label="Filter clients by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | ClientStatus)}>
              <option value="all">All clients</option>
              {statuses.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}
            </select>
          </div>
          <button className="primary-button compact" type="button" onClick={() => setNewClientOpen(true)}>+ New client</button>
        </div>

        <div className="client-layout">
          <aside className="client-list" aria-label="Client list">
            {filteredClients.length === 0 ? (
              <div className="client-list-empty">No clients match this view.</div>
            ) : filteredClients.map((client) => (
              <button className={client.id === selectedId ? "selected" : ""} type="button" key={client.id} onClick={() => chooseClient(client)}>
                <span className="client-list-avatar">{client.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                <span className="client-list-copy"><strong>{client.fullName}</strong><small>{client.service}</small></span>
                <span className={`client-status ${client.status}`}>{client.status}</span>
              </button>
            ))}
          </aside>

          <div className="client-detail">
            {!selected || !details ? (
              <div className="empty-state"><span>PLS</span><h3>Select a client</h3><p>Contact details and conversations will appear here.</p></div>
            ) : (
              <>
                <div className="client-detail-header">
                  <div><p className="eyebrow">Client profile</p><h2>{selected.fullName}</h2><p>Added {shortDate(selected.createdAt)} via {selected.source}</p></div>
                  <div className="client-contact-actions">
                    <button className="primary-button compact" type="button" onClick={() => { setSubject(`A message from Positive Legacy Solutions`); setMessageOpen(true); }}>New message</button>
                    {selected.phone ? <a className="secondary-button compact" href={`tel:${selected.phone}`}>Call</a> : null}
                  </div>
                </div>

                <form className="client-details-form" onSubmit={saveDetails}>
                  <label className="form-field"><span>Full name</span><input required value={details.fullName} onChange={(event) => setDetails({ ...details, fullName: event.target.value })} /></label>
                  <label className="form-field"><span>Email</span><input type="email" required value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} /></label>
                  <label className="form-field"><span>Phone</span><input value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} /></label>
                  <label className="form-field"><span>Status</span><select value={details.status} onChange={(event) => setDetails({ ...details, status: event.target.value as ClientStatus })}>{statuses.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}</select></label>
                  <label className="form-field"><span>Service</span><select value={details.service} onChange={(event) => setDetails({ ...details, service: event.target.value })}>{services.map((service) => <option key={service}>{service}</option>)}</select></label>
                  <label className="form-field"><span>Source</span><input value={details.source} onChange={(event) => setDetails({ ...details, source: event.target.value })} /></label>
                  <label className="form-field client-notes"><span>Notes</span><textarea rows={4} value={details.notes} onChange={(event) => setDetails({ ...details, notes: event.target.value })} placeholder="Important details, next steps or preferences" /></label>
                  <div className="client-save-row"><button className="secondary-button compact" type="submit" disabled={busy}>{busy ? "Saving…" : "Save client"}</button></div>
                </form>

                <section className="message-history">
                  <div className="section-heading"><div><p className="eyebrow">Communication</p><h2>Message history</h2></div><span>{selected.messageCount} total</span></div>
                  {messages.length === 0 ? <p className="message-empty">No messages prepared for this client yet.</p> : messages.map((message) => (
                    <article key={message.id}><div><strong>{message.subject}</strong><small>Email prepared · {shortDate(message.createdAt)}</small></div><p>{message.body}</p></article>
                  ))}
                </section>
              </>
            )}
          </div>
        </div>
      </section>

      {newClientOpen && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Add client">
          <form className="small-modal" onSubmit={createClient}>
            <div className="modal-header"><div><p className="eyebrow">New relationship</p><h2>Add a client</h2></div><button className="close-button" type="button" onClick={() => setNewClientOpen(false)}>×</button></div>
            <label className="form-field"><span>Full name</span><input required value={newClient.fullName} onChange={(event) => setNewClient({ ...newClient, fullName: event.target.value })} /></label>
            <label className="form-field"><span>Email</span><input type="email" required value={newClient.email} onChange={(event) => setNewClient({ ...newClient, email: event.target.value })} /></label>
            <label className="form-field"><span>Phone</span><input value={newClient.phone} onChange={(event) => setNewClient({ ...newClient, phone: event.target.value })} /></label>
            <label className="form-field"><span>Service</span><select value={newClient.service} onChange={(event) => setNewClient({ ...newClient, service: event.target.value })}>{services.map((service) => <option key={service}>{service}</option>)}</select></label>
            <label className="form-field"><span>Source</span><input value={newClient.source} onChange={(event) => setNewClient({ ...newClient, source: event.target.value })} /></label>
            <div className="modal-footer"><button className="secondary-button" type="button" onClick={() => setNewClientOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={busy}>{busy ? "Adding…" : "Add client"}</button></div>
          </form>
        </div>
      )}

      {messageOpen && selected && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label="New message">
          <form className="small-modal" onSubmit={prepareEmail}>
            <div className="modal-header"><div><p className="eyebrow">Email {selected.fullName}</p><h2>New message</h2></div><button className="close-button" type="button" onClick={() => setMessageOpen(false)}>×</button></div>
            <label className="form-field"><span>Subject</span><input required value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
            <label className="form-field"><span>Message</span><textarea required rows={8} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write your message here" /></label>
            <p className="email-handoff-note">Your email app will open with this message ready. Review it there and press Send.</p>
            <div className="modal-footer"><button className="secondary-button" type="button" onClick={() => setMessageOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={busy}>{busy ? "Preparing…" : "Open email to send"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
