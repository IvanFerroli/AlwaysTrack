import { ArrowLeftRight, CalendarPlus, Check, Clock3, RefreshCw, Save, ShieldAlert, X } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import type { CurrentUser } from "@alwaystrack/shared";
import { keyboardTabIndex } from "../accessibility/tabs";
import { api } from "../api";
import { ConfirmButton, OperationalState } from "../components/operational";
import {
  formatSupportTime,
  isSupportManager,
  supportDateInputValue,
  supportSlotDateTimeIso,
  type SupportPausePolicy,
  type SupportPausesResponse
} from "../support-operations";
import "../support-operations.css";

type PauseTab = "schedule" | "swaps" | "management";

const pauseTabs = [
  ["schedule", "Agenda"],
  ["swaps", "Trocas"]
] as const;

function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback;
}

function addTimeMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function CoverageTimeline({ data }: { data: SupportPausesResponse }) {
  if (!data.timeline.length) {
    return <OperationalState state="empty" title="Sem intervalos para exibir" detail="Cadastre slots para formar a timeline do dia." />;
  }
  const maxAgents = Math.max(data.summary.activeAgents, 1);
  return (
    <figure className="support-timeline" aria-labelledby="support-timeline-title">
      <div className="support-section-heading">
        <div>
          <p className="eyebrow">Cobertura simultânea</p>
          <h2 id="support-timeline-title">Timeline de pausas</h2>
        </div>
        <div className="support-chart-legend" aria-label="Legenda">
          <span><i className="available" /> Disponíveis</span>
          <span><i className="paused" /> Em pausa</span>
          <span><i className="critical" /> Cobertura crítica</span>
        </div>
      </div>
      <ol className="support-timeline-bars">
        {data.timeline.map((item) => {
          const availableHeight = `${Math.max((item.availableCount / maxAgents) * 100, 4)}%`;
          const pausedHeight = `${Math.max((item.pausedCount / maxAgents) * 100, item.pausedCount ? 4 : 0)}%`;
          const label = `${formatSupportTime(item.startsAt, data.policy.timezone)} a ${formatSupportTime(item.endsAt, data.policy.timezone)}: ${item.availableCount} disponíveis, ${item.pausedCount} em pausa${item.critical ? ", cobertura crítica" : ""}.`;
          return (
            <li key={`${item.startsAt}-${item.endsAt}`} className={item.critical ? "critical" : ""} aria-label={label}>
              <div className="support-timeline-stack" aria-hidden="true">
                <span className="available" style={{ height: availableHeight } as CSSProperties} />
                <span className="paused" style={{ height: pausedHeight } as CSSProperties} />
              </div>
              <time dateTime={item.startsAt}>{formatSupportTime(item.startsAt, data.policy.timezone)}</time>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

export function SupportPausesView({ user }: { user: CurrentUser }) {
  const canManage = isSupportManager(user);
  const [tab, setTab] = useState<PauseTab>("schedule");
  const [date, setDate] = useState(supportDateInputValue);
  const [data, setData] = useState<SupportPausesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [policyDraft, setPolicyDraft] = useState<SupportPausePolicy | null>(null);
  const [slotDraft, setSlotDraft] = useState({ label: "", date, startsAt: "12:00", endsAt: "13:15", capacity: "1" });
  const [swapDraft, setSwapDraft] = useState({ requesterBookingId: "", targetBookingId: "", note: "" });
  const [overrideDraft, setOverrideDraft] = useState({ slotId: "", userId: "", reason: "", confirmImpact: false });

  async function load(showLoading = true) {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const result = await api<SupportPausesResponse>(`/v1/support/pauses?date=${encodeURIComponent(date)}`);
      setData(result);
      setPolicyDraft(result.policy);
      setSlotDraft((current) => ({
        ...current,
        date: result.date,
        endsAt: addTimeMinutes(current.startsAt, result.policy.pauseDurationMinutes)
      }));
    } catch (caught) {
      setError(errorMessage(caught, "Falha ao carregar a agenda de pausas."));
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [date]);

  async function perform(actionKey: string, action: () => Promise<unknown>, success: string) {
    setBusyAction(actionKey);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(success);
      await load(false);
      return true;
    } catch (caught) {
      setError(errorMessage(caught, "Não foi possível concluir a operação."));
      return false;
    } finally {
      setBusyAction(null);
    }
  }

  const myBookings = useMemo(
    () => data?.slots.flatMap((slot) => slot.myBooking ? [{ ...slot.myBooking, slot }] : []) ?? [],
    [data]
  );
  const targetBookings = useMemo(
    () => data?.slots.flatMap((slot) => slot.bookings.filter((booking) => booking.userId !== user.id).map((booking) => ({ ...booking, slot }))) ?? [],
    [data, user.id]
  );
  const incomingSwaps = data?.swaps.filter((swap) => swap.status === "PENDING" && swap.targetBooking.userId === user.id) ?? [];
  const visibleTabs: ReadonlyArray<readonly [PauseTab, string]> = canManage
    ? [...pauseTabs, ["management", "Configuração"] as const]
    : pauseTabs;

  async function bookSlot(slotId: string) {
    await perform(
      `book-${slotId}`,
      () => api(`/v1/support/pauses/slots/${slotId}/book`, { method: "POST", body: "{}" }),
      "Pausa reservada."
    );
  }

  async function cancelBooking(bookingId: string, overrideReason?: string | null) {
    const reason = overrideReason ? window.prompt("Motivo da revogação da exceção:") : null;
    if (overrideReason && !reason?.trim()) return;
    await perform(
      `cancel-${bookingId}`,
      () => api(`/v1/support/pauses/bookings/${bookingId}`, {
        method: "DELETE",
        body: JSON.stringify(reason ? { reason: reason.trim() } : {})
      }),
      "Pausa cancelada."
    );
  }

  async function requestSwap(event: FormEvent) {
    event.preventDefault();
    const completed = await perform(
      "request-swap",
      () => api("/v1/support/pauses/swaps", {
        method: "POST",
        body: JSON.stringify({
          requesterBookingId: swapDraft.requesterBookingId,
          targetBookingId: swapDraft.targetBookingId,
          note: swapDraft.note || null
        })
      }),
      "Troca solicitada."
    );
    if (completed) setSwapDraft({ requesterBookingId: "", targetBookingId: "", note: "" });
  }

  async function decideSwap(swapId: string, decision: "ACCEPTED" | "DECLINED") {
    await perform(
      `swap-${swapId}`,
      () => api(`/v1/support/pauses/swaps/${swapId}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision })
      }),
      decision === "ACCEPTED" ? "Troca aceita." : "Troca recusada."
    );
  }

  async function cancelSwap(swapId: string) {
    await perform(
      `swap-${swapId}`,
      () => api(`/v1/support/pauses/swaps/${swapId}`, { method: "DELETE" }),
      "Solicitação cancelada."
    );
  }

  async function createOverride(event: FormEvent) {
    event.preventDefault();
    if (!canManage) return;
    const completed = await perform(
      "override",
      () => api(`/v1/support/pauses/slots/${overrideDraft.slotId}/book`, {
        method: "POST",
        body: JSON.stringify({
          userId: overrideDraft.userId,
          overrideCoverage: true,
          overrideReason: overrideDraft.reason,
          confirmImpact: overrideDraft.confirmImpact
        })
      }),
      "Exceção registrada com impacto auditado."
    );
    if (completed) setOverrideDraft({ slotId: "", userId: "", reason: "", confirmImpact: false });
  }

  async function savePolicy(event: FormEvent) {
    event.preventDefault();
    if (!canManage || !policyDraft) return;
    await perform(
      "policy",
      () => api("/v1/support/pauses/policy", {
        method: "PUT",
        body: JSON.stringify({
          timezone: policyDraft.timezone,
          minimumCoverage: policyDraft.minimumCoverage,
          slotMinutes: policyDraft.slotMinutes,
          pauseDurationMinutes: policyDraft.pauseDurationMinutes,
          boundaryBufferMinutes: policyDraft.boundaryBufferMinutes,
          shiftWindows: policyDraft.shiftWindows,
          templateStarts: policyDraft.templateStarts,
          active: policyDraft.active
        })
      }),
      "Política atualizada."
    );
  }

  async function createSlot(event: FormEvent) {
    event.preventDefault();
    if (!canManage) return;
    const completed = await perform(
      "slot",
      () => api("/v1/support/pauses/slots", {
        method: "POST",
        body: JSON.stringify({
          label: slotDraft.label || null,
          startsAt: supportSlotDateTimeIso(slotDraft.date, slotDraft.startsAt),
          endsAt: supportSlotDateTimeIso(slotDraft.date, slotDraft.endsAt),
          capacity: Number(slotDraft.capacity)
        })
      }),
      "Slot criado."
    );
    if (completed) setSlotDraft((current) => ({ ...current, label: "" }));
  }

  async function generateSlots() {
    if (!canManage) return;
    await perform(
      "generate-slots",
      () => api("/v1/support/pauses/slots/generate", {
        method: "POST",
        body: JSON.stringify({ date: slotDraft.date, capacity: Number(slotDraft.capacity) })
      }),
      "Grade-base gerada sem duplicar horários existentes."
    );
  }

  if (loading && !data) {
    return <OperationalState state="loading" title="Carregando pausas" detail="Consultando slots, cobertura e trocas do dia." />;
  }
  if (error && !data) {
    return <OperationalState state="error" title="Agenda indisponível" detail={error} />;
  }
  if (!data) return null;

  return (
    <section className="support-operations support-pauses-view">
      <header className="support-view-header">
        <div>
          <p className="eyebrow">Operação SAC</p>
          <h1>Pausas e cobertura</h1>
        </div>
        <div className="support-date-control">
          <label htmlFor="support-pause-date">Data</label>
          <input id="support-pause-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <button className="secondary support-icon-button" type="button" aria-label="Atualizar agenda" title="Atualizar agenda" onClick={() => void load()}>
            <RefreshCw size={17} />
          </button>
        </div>
      </header>

      <div className="segmented-control support-tabs" role="tablist" aria-label="Áreas de pausas">
        {visibleTabs.map(([key, label], index) => (
          <button
            id={`support-pauses-${key}-tab`}
            key={key}
            type="button"
            role="tab"
            className={tab === key ? "active" : ""}
            aria-controls={`support-pauses-${key}-panel`}
            aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
            onKeyDown={(event) => {
              const nextIndex = keyboardTabIndex(event.key, index, visibleTabs.length);
              if (nextIndex === null) return;
              event.preventDefault();
              setTab(visibleTabs[nextIndex][0]);
              event.currentTarget.parentElement?.querySelectorAll<HTMLElement>("[role=tab]")[nextIndex]?.focus();
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {notice ? <p className="support-notice" role="status">{notice}</p> : null}
      {error ? <p className="error" role="alert">{error}</p> : null}

      {tab === "schedule" ? (
        <div id="support-pauses-schedule-panel" role="tabpanel" aria-labelledby="support-pauses-schedule-tab" className="support-tab-panel">
          <div className="support-metrics-grid">
            <div className="support-metric-card"><span>Agentes ativos</span><strong>{data.summary.activeAgents}</strong></div>
            <div className="support-metric-card"><span>Cobertura mínima</span><strong>{data.summary.minimumCoverage}</strong></div>
            <div className="support-metric-card"><span>Pausas reservadas</span><strong>{data.summary.bookedPauses}</strong></div>
            <div className={`support-metric-card ${data.summary.criticalIntervals ? "critical" : ""}`}><span>Intervalos críticos</span><strong>{data.summary.criticalIntervals}</strong></div>
          </div>
          <CoverageTimeline data={data} />
          <section className="support-unframed-section" aria-labelledby="support-slots-title">
            <div className="support-section-heading">
              <div><p className="eyebrow">Disponibilidade</p><h2 id="support-slots-title">Slots do dia</h2></div>
              <span className="support-count">{data.slots.length} slot(s)</span>
            </div>
            {data.slots.length ? (
              <div className="support-slot-grid">
                {data.slots.map((slot) => {
                  const slotStarted = new Date(slot.startsAt).getTime() <= Date.now();
                  return <article className={`support-slot-card ${slot.myBooking ? "selected" : ""} ${slotStarted ? "elapsed" : ""}`} key={slot.id}>
                    <header>
                      <div>
                        <time dateTime={slot.startsAt}>{formatSupportTime(slot.startsAt, data.policy.timezone)}</time>
                        <span aria-hidden="true">-</span>
                        <time dateTime={slot.endsAt}>{formatSupportTime(slot.endsAt, data.policy.timezone)}</time>
                      </div>
                      {slot.myBooking ? <span className="support-status active">Minha pausa</span> : slotStarted ? <span className="support-status closed">Encerrado</span> : null}
                    </header>
                    <h3>{slot.label || "Pausa"}</h3>
                    <p>{slot.bookedCount} de {slot.capacity} vaga(s) ocupada(s)</p>
                    {slot.bookings.length ? (
                      <ul className="support-person-list" aria-label="Reservas do slot">
                        {slot.bookings.map((booking) => (
                          <li key={booking.id} className={booking.overrideReason ? "override" : ""}>
                            <span>{booking.user.name}{booking.overrideReason ? " · exceção" : ""}</span>
                            {canManage ? (
                              <button
                                className="support-inline-icon"
                                type="button"
                                aria-label={`Cancelar pausa de ${booking.user.name}`}
                                title={booking.overrideReason ? "Revogar exceção" : "Cancelar pausa"}
                                disabled={busyAction !== null}
                                onClick={() => void cancelBooking(booking.id, booking.overrideReason)}
                              >
                                <X size={13} />
                              </button>
                            ) : null}
                            {booking.overrideReason ? (
                              <small title={booking.overrideReason}>
                                Cobertura {booking.coverageBefore ?? "-"} para {booking.coverageAfter ?? "-"} · mínimo {booking.minimumCoverage ?? "-"}
                              </small>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : <span className="muted">Sem reservas</span>}
                    {!canManage ? (
                      <footer>
                        {slotStarted ? (
                          <button type="button" disabled title="Este horário já começou e permanece apenas como histórico.">
                            <Clock3 size={16} /> Horário encerrado
                          </button>
                        ) : slot.myBooking ? (
                          <ConfirmButton
                            confirmLabel="Confirmar cancelamento"
                            disabled={busyAction !== null}
                            onConfirm={() => void cancelBooking(slot.myBooking!.id)}
                          >
                            Cancelar pausa
                          </ConfirmButton>
                        ) : (
                          <button type="button" disabled={!slot.remainingCapacity || busyAction !== null} onClick={() => void bookSlot(slot.id)}>
                            <Check size={16} /> Escolher pausa
                          </button>
                        )}
                      </footer>
                    ) : null}
                  </article>;
                })}
              </div>
            ) : <OperationalState state="empty" title="Nenhum slot cadastrado" detail={canManage ? "Use a configuração para criar os horários do dia." : "A gestão ainda não publicou horários para esta data."} />}
          </section>
        </div>
      ) : null}

      {tab === "swaps" ? (
        <div id="support-pauses-swaps-panel" role="tabpanel" aria-labelledby="support-pauses-swaps-tab" className="support-tab-panel support-split-layout">
          {!canManage ? (
            <section className="support-form-section" aria-labelledby="support-swap-request-title">
              <div className="support-section-heading"><div><p className="eyebrow">Nova solicitação</p><h2 id="support-swap-request-title">Solicitar troca</h2></div></div>
              <form className="support-form-grid" onSubmit={requestSwap}>
                <label>Minha pausa
                  <select required value={swapDraft.requesterBookingId} onChange={(event) => setSwapDraft((current) => ({ ...current, requesterBookingId: event.target.value }))}>
                    <option value="">Selecione</option>
                    {myBookings.map((booking) => <option key={booking.id} value={booking.id}>{formatSupportTime(booking.slot.startsAt)} - {formatSupportTime(booking.slot.endsAt)}</option>)}
                  </select>
                </label>
                <label>Trocar com
                  <select required value={swapDraft.targetBookingId} onChange={(event) => setSwapDraft((current) => ({ ...current, targetBookingId: event.target.value }))}>
                    <option value="">Selecione</option>
                    {targetBookings.map((booking) => <option key={booking.id} value={booking.id}>{booking.user.name} · {formatSupportTime(booking.slot.startsAt)} - {formatSupportTime(booking.slot.endsAt)}</option>)}
                  </select>
                </label>
                <label className="support-full-span">Observação
                  <textarea maxLength={300} rows={2} value={swapDraft.note} onChange={(event) => setSwapDraft((current) => ({ ...current, note: event.target.value }))} />
                </label>
                <div className="support-form-actions support-full-span">
                  <button type="submit" disabled={!myBookings.length || !targetBookings.length || busyAction !== null}><ArrowLeftRight size={16} /> Solicitar troca</button>
                </div>
              </form>
            </section>
          ) : null}
          <section className="support-table-section" aria-labelledby="support-swaps-title">
            <div className="support-section-heading"><div><p className="eyebrow">Solicitações</p><h2 id="support-swaps-title">Histórico de trocas</h2></div></div>
            {!canManage && incomingSwaps.length ? <p className="support-attention">Você tem {incomingSwaps.length} troca(s) aguardando decisão.</p> : null}
            {data.swaps.length ? (
              <div className="table-scroll">
                <table aria-label="Trocas de pausa">
                  <thead><tr><th scope="col">Solicitante</th><th scope="col">Horário atual</th><th scope="col">Destino</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead>
                  <tbody>
                    {data.swaps.map((swap) => {
                      const canDecide = swap.status === "PENDING" && (canManage || swap.targetBooking.userId === user.id);
                      const canCancel = swap.status === "PENDING" && (canManage || swap.requestedById === user.id);
                      const statusLabel = swap.status === "PENDING" ? "Pendente" : swap.status === "ACCEPTED" ? "Aceita" : swap.status === "DECLINED" ? "Recusada" : swap.status === "EXPIRED" ? "Expirada" : "Cancelada";
                      return (
                        <tr key={swap.id}>
                          <td><strong>{swap.requesterBooking.user.name}</strong>{swap.note ? <small>{swap.note}</small> : null}</td>
                          <td>{formatSupportTime(swap.requesterBooking.slot.startsAt)} - {formatSupportTime(swap.requesterBooking.slot.endsAt)}</td>
                          <td>{swap.targetBooking.user.name}<small>{formatSupportTime(swap.targetBooking.slot.startsAt)} - {formatSupportTime(swap.targetBooking.slot.endsAt)}</small></td>
                          <td><span className={`support-status ${swap.status.toLowerCase()}`}>{statusLabel}</span>{swap.status === "PENDING" && swap.expiresAt ? <small>Expira {formatSupportTime(swap.expiresAt)}</small> : null}</td>
                          <td>{canDecide || canCancel ? <div className="inline-actions">{canDecide ? <><button className="small" type="button" disabled={busyAction !== null} onClick={() => void decideSwap(swap.id, "ACCEPTED")}><Check size={15} /> Aceitar</button><button className="secondary small" type="button" disabled={busyAction !== null} onClick={() => void decideSwap(swap.id, "DECLINED")}><X size={15} /> Recusar</button></> : null}{canCancel ? <button className="secondary small" type="button" disabled={busyAction !== null} onClick={() => void cancelSwap(swap.id)}><X size={15} /> Cancelar</button> : null}</div> : "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <OperationalState state="empty" title="Nenhuma troca registrada" />}
          </section>
        </div>
      ) : null}

      {tab === "management" && canManage && policyDraft ? (
        <div id="support-pauses-management-panel" role="tabpanel" aria-labelledby="support-pauses-management-tab" className="support-tab-panel support-management-grid">
          <section className="support-form-section" aria-labelledby="support-policy-title">
            <div className="support-section-heading"><div><p className="eyebrow">Cobertura</p><h2 id="support-policy-title">Política de pausas</h2></div></div>
            <form className="support-form-grid" onSubmit={savePolicy}>
              <label className="support-full-span">Fuso horário<input required value={policyDraft.timezone} onChange={(event) => setPolicyDraft((current) => current ? { ...current, timezone: event.target.value } : current)} /></label>
              <label>Cobertura mínima<input required min={1} max={500} type="number" value={policyDraft.minimumCoverage} onChange={(event) => setPolicyDraft((current) => current ? { ...current, minimumCoverage: Number(event.target.value) } : current)} /></label>
              <label>Duração da pausa<input required min={15} max={180} step={5} type="number" value={policyDraft.pauseDurationMinutes} onChange={(event) => setPolicyDraft((current) => current ? { ...current, pauseDurationMinutes: Number(event.target.value) } : current)} /></label>
              <label>Granularidade<input required min={5} max={60} step={5} type="number" value={policyDraft.slotMinutes} onChange={(event) => setPolicyDraft((current) => current ? { ...current, slotMinutes: Number(event.target.value) } : current)} /></label>
              <label>Margem do turno<input required min={5} max={120} step={5} type="number" value={policyDraft.boundaryBufferMinutes} onChange={(event) => setPolicyDraft((current) => current ? { ...current, boundaryBufferMinutes: Number(event.target.value) } : current)} /></label>
              {policyDraft.shiftWindows.map((window, index) => <div className="support-shift-fields" key={`${index}-${window.start}`}>
                <label>Turno {index + 1} · início<input required type="time" value={window.start} onChange={(event) => setPolicyDraft((current) => current ? { ...current, shiftWindows: current.shiftWindows.map((item, itemIndex) => itemIndex === index ? { ...item, start: event.target.value } : item) } : current)} /></label>
                <label>Turno {index + 1} · fim<input required type="time" value={window.end} onChange={(event) => setPolicyDraft((current) => current ? { ...current, shiftWindows: current.shiftWindows.map((item, itemIndex) => itemIndex === index ? { ...item, end: event.target.value } : item) } : current)} /></label>
              </div>)}
              <div className="support-full-span"><span className="support-field-label">Grade-base</span><ul className="support-template-times">{policyDraft.templateStarts.map((time) => <li key={time}>{time}</li>)}</ul></div>
              <label className="support-check support-full-span"><input type="checkbox" checked={policyDraft.active} onChange={(event) => setPolicyDraft((current) => current ? { ...current, active: event.target.checked } : current)} /> Política ativa</label>
              <div className="support-form-actions support-full-span"><button type="submit" disabled={busyAction !== null}><Save size={16} /> Salvar política</button></div>
            </form>
          </section>
          <section className="support-form-section" aria-labelledby="support-slot-create-title">
            <div className="support-section-heading"><div><p className="eyebrow">Capacidade</p><h2 id="support-slot-create-title">Criar slot</h2></div></div>
            <form className="support-form-grid" onSubmit={createSlot}>
              <label className="support-full-span">Identificação<input maxLength={80} placeholder="Ex.: almoço" value={slotDraft.label} onChange={(event) => setSlotDraft((current) => ({ ...current, label: event.target.value }))} /></label>
              <label>Data<input required type="date" value={slotDraft.date} onChange={(event) => setSlotDraft((current) => ({ ...current, date: event.target.value }))} /></label>
              <label>Capacidade<input required min={1} max={100} type="number" value={slotDraft.capacity} onChange={(event) => setSlotDraft((current) => ({ ...current, capacity: event.target.value }))} /></label>
              <label>Início<input required type="time" value={slotDraft.startsAt} onChange={(event) => setSlotDraft((current) => ({ ...current, startsAt: event.target.value, endsAt: addTimeMinutes(event.target.value, policyDraft.pauseDurationMinutes) }))} /></label>
              <label>Fim<input readOnly type="time" value={slotDraft.endsAt} /></label>
              <div className="support-form-actions support-full-span"><button className="secondary" type="button" disabled={busyAction !== null} onClick={() => void generateSlots()}><CalendarPlus size={16} /> Gerar grade-base</button><button type="submit" disabled={busyAction !== null}><CalendarPlus size={16} /> Criar slot</button></div>
            </form>
          </section>
          <section className="support-form-section support-full-span" aria-labelledby="support-override-title">
            <div className="support-section-heading"><div><p className="eyebrow">Exceção auditada</p><h2 id="support-override-title">Autorizar pausa fora da política</h2></div><ShieldAlert size={20} aria-hidden="true" /></div>
            <form className="support-form-grid" onSubmit={createOverride}>
              <label>Atendente
                <select required value={overrideDraft.userId} onChange={(event) => setOverrideDraft((current) => ({ ...current, userId: event.target.value }))}>
                  <option value="">Selecione</option>
                  {data.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                </select>
              </label>
              <label>Slot
                <select required value={overrideDraft.slotId} onChange={(event) => setOverrideDraft((current) => ({ ...current, slotId: event.target.value }))}>
                  <option value="">Selecione</option>
                  {data.slots.map((slot) => <option key={slot.id} value={slot.id}>{formatSupportTime(slot.startsAt)} - {formatSupportTime(slot.endsAt)} · {slot.bookedCount}/{slot.capacity}</option>)}
                </select>
              </label>
              <label className="support-full-span">Motivo
                <textarea required maxLength={300} rows={2} value={overrideDraft.reason} onChange={(event) => setOverrideDraft((current) => ({ ...current, reason: event.target.value }))} />
              </label>
              <label className="support-check support-full-span"><input required type="checkbox" checked={overrideDraft.confirmImpact} onChange={(event) => setOverrideDraft((current) => ({ ...current, confirmImpact: event.target.checked }))} /> Confirmo o impacto sobre capacidade ou cobertura mínima</label>
              <div className="support-form-actions support-full-span"><button type="submit" disabled={!overrideDraft.slotId || !overrideDraft.userId || !overrideDraft.reason.trim() || !overrideDraft.confirmImpact || busyAction !== null}><ShieldAlert size={16} /> Registrar exceção</button></div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
