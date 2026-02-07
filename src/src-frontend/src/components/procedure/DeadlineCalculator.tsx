import { useState, useMemo } from 'react';

/* ─── CPR Service Method table (CPR 6.26 / 6.14) ─── */
interface ServiceMethod {
    id: string;
    label: string;
    deemedRule: string;
    description: string;
}

const SERVICE_METHODS: ServiceMethod[] = [
    {
        id: 'first_class_post',
        label: 'First class post / DX',
        deemedRule: '2nd business day after posting',
        description: 'CPR 6.14 (claim form) / CPR 6.26 (other documents)',
    },
    {
        id: 'personal',
        label: 'Personal service',
        deemedRule: 'Same business day (if before 4:30pm), next business day otherwise',
        description: 'CPR 6.26',
    },
    {
        id: 'email',
        label: 'Email / electronic',
        deemedRule: 'Same business day (if sent before 4:30pm), next business day otherwise',
        description: 'CPR 6.26',
    },
    {
        id: 'fax',
        label: 'Fax',
        deemedRule: 'Same business day (if before 4:30pm), next business day otherwise',
        description: 'CPR 6.26',
    },
    {
        id: 'leaving_at_address',
        label: 'Leaving at permitted address',
        deemedRule: 'Next business day after leaving',
        description: 'CPR 6.26',
    },
];

/* ─── Deadline events the user can calculate from ─── */
interface DeadlineEvent {
    id: string;
    label: string;
    clearDays: number;
    cprRule: string;
    description: string;
}

const DEADLINE_EVENTS: DeadlineEvent[] = [
    {
        id: 'acknowledge_service',
        label: 'Acknowledgment of Service',
        clearDays: 14,
        cprRule: 'CPR r.10.3',
        description: '14 days from deemed service of the claim form',
    },
    {
        id: 'defence_no_ack',
        label: 'Defence (no acknowledgment filed)',
        clearDays: 14,
        cprRule: 'CPR r.15.4',
        description: '14 days from deemed service of the particulars of claim',
    },
    {
        id: 'defence_with_ack',
        label: 'Defence (acknowledgment filed)',
        clearDays: 28,
        cprRule: 'CPR r.15.4',
        description: '28 days from deemed service of the particulars of claim',
    },
    {
        id: 'appeal',
        label: 'Appeal (permission to appeal)',
        clearDays: 21,
        cprRule: 'CPR r.52.12',
        description: '21 days from the date of the decision being appealed',
    },
    {
        id: 'set_aside_default',
        label: 'Set aside default judgment',
        clearDays: 0,
        cprRule: 'CPR r.13.3',
        description: 'No fixed deadline — apply promptly. Delay reduces prospects.',
    },
    {
        id: 'pre_action_response',
        label: 'Pre-action letter response',
        clearDays: 14,
        cprRule: 'PD Pre-Action Conduct, para 6',
        description: '14 days for a straightforward claim (up to 3 months if complex)',
    },
];

/* ─── Date utilities ─── */

/** UK bank holidays — covers 2024–2027. */
const BANK_HOLIDAYS = new Set([
    // 2024
    '2024-01-01', '2024-03-29', '2024-04-01', '2024-05-06', '2024-05-27',
    '2024-08-26', '2024-12-25', '2024-12-26',
    // 2025
    '2025-01-01', '2025-04-18', '2025-04-21', '2025-05-05', '2025-05-26',
    '2025-08-25', '2025-12-25', '2025-12-26',
    // 2026
    '2026-01-01', '2026-04-03', '2026-04-06', '2026-05-04', '2026-05-25',
    '2026-08-31', '2026-12-25', '2026-12-28',
    // 2027
    '2027-01-01', '2027-03-26', '2027-03-29', '2027-05-03', '2027-05-31',
    '2027-08-30', '2027-12-27', '2027-12-28',
]);

function toDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function isWeekend(d: Date): boolean {
    const day = d.getDay();
    return day === 0 || day === 6;
}

function isBankHoliday(d: Date): boolean {
    return BANK_HOLIDAYS.has(toDateKey(d));
}

function isBusinessDay(d: Date): boolean {
    return !isWeekend(d) && !isBankHoliday(d);
}

function addCalendarDays(d: Date, n: number): Date {
    const result = new Date(d);
    result.setDate(result.getDate() + n);
    return result;
}

function nextBusinessDay(d: Date): Date {
    let result = new Date(d);
    result.setDate(result.getDate() + 1);
    while (!isBusinessDay(result)) {
        result.setDate(result.getDate() + 1);
    }
    return result;
}

function addBusinessDays(d: Date, n: number): Date {
    let result = new Date(d);
    let count = 0;
    while (count < n) {
        result.setDate(result.getDate() + 1);
        if (isBusinessDay(result)) count++;
    }
    return result;
}

function calculateDeemedService(dispatchDate: Date, method: string, beforeCutoff: boolean): Date {
    switch (method) {
        case 'first_class_post':
            return addBusinessDays(dispatchDate, 2);
        case 'personal':
        case 'fax':
            if (beforeCutoff && isBusinessDay(dispatchDate)) {
                return new Date(dispatchDate);
            }
            return nextBusinessDay(dispatchDate);
        case 'email':
            if (beforeCutoff && isBusinessDay(dispatchDate)) {
                return new Date(dispatchDate);
            }
            return nextBusinessDay(dispatchDate);
        case 'leaving_at_address':
            return nextBusinessDay(dispatchDate);
        default:
            return addBusinessDays(dispatchDate, 2);
    }
}

function calculateDeadline(deemedServiceDate: Date, clearDays: number): Date {
    let deadline = addCalendarDays(deemedServiceDate, clearDays);
    while (!isBusinessDay(deadline)) {
        deadline = addCalendarDays(deadline, 1);
    }
    return deadline;
}

function formatDateLong(d: Date): string {
    return d.toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
}

function sameDay(a: Date, b: Date): boolean {
    return toDateKey(a) === toDateKey(b);
}

/* ─── Calendar component ─── */
interface CalendarProps {
    dispatch: Date;
    deemedService: Date;
    deadline: Date | null;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function CalendarView({ dispatch, deemedService, deadline }: CalendarProps) {
    // Determine which months to show (may span 1-2 months)
    const startMonth = new Date(dispatch.getFullYear(), dispatch.getMonth(), 1);
    const endDate = deadline || deemedService;
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    const months: Date[] = [startMonth];
    if (startMonth.getTime() !== endMonth.getTime()) {
        // Add all months between start and end
        let cur = new Date(startMonth);
        while (true) {
            cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
            months.push(cur);
            if (cur.getFullYear() === endMonth.getFullYear() && cur.getMonth() === endMonth.getMonth()) break;
            if (months.length > 3) break; // safety cap
        }
    }

    return (
        <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            marginTop: '1rem',
        }}>
            {months.map((monthStart) => (
                <MonthGrid
                    key={toDateKey(monthStart)}
                    monthStart={monthStart}
                    dispatch={dispatch}
                    deemedService={deemedService}
                    deadline={deadline}
                />
            ))}
        </div>
    );
}

function MonthGrid({ monthStart, dispatch, deemedService, deadline }: CalendarProps & { monthStart: Date }) {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // First day of month: 0=Sun -> we want Mon=0
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Mon=0, Tue=1 ... Sun=6

    const cells: (number | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    // Calculate date range for the counting period (between deemed service and deadline)
    const isInCountingPeriod = (d: Date) => {
        if (!deadline) return false;
        return d > deemedService && d < deadline;
    };

    return (
        <div style={{
            flex: '1 1 260px',
            minWidth: 260,
            maxWidth: 320,
        }}>
            <div style={{
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: '#1e293b',
                padding: '0.375rem 0',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '0.375rem',
            }}>
                {MONTH_NAMES[month]} {year}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '2px',
            }}>
                {/* Day headers */}
                {DAY_LABELS.map((label) => (
                    <div key={label} style={{
                        textAlign: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: '#94a3b8',
                        padding: '0.25rem 0',
                    }}>
                        {label}
                    </div>
                ))}

                {/* Day cells */}
                {cells.map((dayNum, i) => {
                    if (dayNum === null) {
                        return <div key={`empty-${i}`} />;
                    }

                    const d = new Date(year, month, dayNum, 12, 0, 0);
                    const key = toDateKey(d);
                    const weekend = isWeekend(d);
                    const bankHol = isBankHoliday(d);
                    const isDispatch = sameDay(d, dispatch);
                    const isDeemed = sameDay(d, deemedService);
                    const isDeadline = deadline && sameDay(d, deadline);
                    const isCounting = isInCountingPeriod(d);

                    let bg = 'transparent';
                    let color = '#1e293b';
                    let fontWeight = 400;
                    let border = 'none';
                    let title = '';

                    if (weekend) {
                        bg = '#f1f5f9';
                        color = '#94a3b8';
                        title = weekend ? (d.getDay() === 0 ? 'Sunday' : 'Saturday') : '';
                    }
                    if (bankHol) {
                        bg = '#fef3c7';
                        color = '#92400e';
                        title = 'Bank holiday';
                    }
                    if (isCounting && !isDispatch && !isDeemed && !isDeadline) {
                        bg = weekend || bankHol ? bg : '#f0f9ff';
                    }
                    if (isDispatch) {
                        bg = '#e2e8f0';
                        color = '#475569';
                        fontWeight = 700;
                        border = '2px solid #475569';
                        title = 'Dispatched';
                    }
                    if (isDeemed) {
                        bg = '#dbeafe';
                        color = '#1e40af';
                        fontWeight = 700;
                        border = '2px solid #3b82f6';
                        title = 'Deemed served';
                    }
                    if (isDeadline) {
                        bg = '#fee2e2';
                        color = '#991b1b';
                        fontWeight = 700;
                        border = '2px solid #ef4444';
                        title = 'DEADLINE';
                    }

                    return (
                        <div
                            key={key}
                            title={title}
                            style={{
                                textAlign: 'center',
                                fontSize: '0.75rem',
                                fontWeight,
                                color,
                                background: bg,
                                border,
                                borderRadius: '0.25rem',
                                padding: '0.3rem 0.125rem',
                                position: 'relative',
                                cursor: title ? 'help' : 'default',
                                lineHeight: 1.3,
                            }}
                        >
                            {dayNum}
                            {bankHol && !isDispatch && !isDeemed && !isDeadline && (
                                <span style={{ display: 'block', fontSize: '0.5rem', lineHeight: 1 }}>BH</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Legend ─── */
function CalendarLegend() {
    const items = [
        { bg: '#e2e8f0', border: '2px solid #475569', label: 'Dispatched' },
        { bg: '#dbeafe', border: '2px solid #3b82f6', label: 'Deemed served' },
        { bg: '#fee2e2', border: '2px solid #ef4444', label: 'Deadline' },
        { bg: '#f1f5f9', border: 'none', label: 'Weekend' },
        { bg: '#fef3c7', border: 'none', label: 'Bank holiday' },
    ];
    return (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem', fontSize: '0.7rem' }}>
            {items.map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{
                        display: 'inline-block',
                        width: 14, height: 14,
                        background: item.bg,
                        border: item.border,
                        borderRadius: '0.2rem',
                    }} />
                    <span style={{ color: '#6b7280' }}>{item.label}</span>
                </div>
            ))}
        </div>
    );
}

/* ─── Main Component ─── */
export default function DeadlineCalculator() {
    const [dispatchDate, setDispatchDate] = useState('');
    const [serviceMethod, setServiceMethod] = useState('first_class_post');
    const [beforeCutoff, setBeforeCutoff] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState('acknowledge_service');

    const selectedMethodInfo = SERVICE_METHODS.find((m) => m.id === serviceMethod)!;
    const selectedEventInfo = DEADLINE_EVENTS.find((e) => e.id === selectedEvent)!;

    const showCutoffOption = serviceMethod === 'personal' || serviceMethod === 'fax' || serviceMethod === 'email';

    const result = useMemo(() => {
        if (!dispatchDate) return null;

        const dispatch = new Date(dispatchDate + 'T12:00:00');
        if (isNaN(dispatch.getTime())) return null;

        const deemedService = calculateDeemedService(dispatch, serviceMethod, beforeCutoff);
        const deadline = selectedEventInfo.clearDays > 0
            ? calculateDeadline(deemedService, selectedEventInfo.clearDays)
            : null;

        return { dispatch, deemedService, deadline };
    }, [dispatchDate, serviceMethod, beforeCutoff, selectedEvent]);

    return (
        <div style={{
            background: 'white',
            border: '1px solid var(--color-border)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginTop: '2rem',
        }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 0.25rem' }}>
                📅 CPR Deadline Calculator
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
                Calculate deemed service dates and response deadlines using CPR rules.
                Weekends and UK bank holidays are automatically excluded from business day counts.
            </p>

            {/* Input form */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
            }}>
                {/* Dispatch date */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem', color: '#374151' }}>
                        Date document was sent / dispatched
                    </label>
                    <input
                        type="date"
                        value={dispatchDate}
                        onChange={(e) => setDispatchDate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.85rem',
                            border: '1px solid var(--color-border)',
                            borderRadius: '0.375rem',
                            background: 'white',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                {/* Service method */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem', color: '#374151' }}>
                        Method of service
                    </label>
                    <select
                        value={serviceMethod}
                        onChange={(e) => setServiceMethod(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.85rem',
                            border: '1px solid var(--color-border)',
                            borderRadius: '0.375rem',
                            background: 'white',
                            boxSizing: 'border-box',
                        }}
                    >
                        {SERVICE_METHODS.map((m) => (
                            <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                    </select>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                        {selectedMethodInfo.description}
                    </p>
                </div>

                {/* Deadline event */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem', color: '#374151' }}>
                        Deadline to calculate
                    </label>
                    <select
                        value={selectedEvent}
                        onChange={(e) => setSelectedEvent(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.85rem',
                            border: '1px solid var(--color-border)',
                            borderRadius: '0.375rem',
                            background: 'white',
                            boxSizing: 'border-box',
                        }}
                    >
                        {DEADLINE_EVENTS.map((e) => (
                            <option key={e.id} value={e.id}>{e.label}</option>
                        ))}
                    </select>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                        {selectedEventInfo.cprRule} — {selectedEventInfo.description}
                    </p>
                </div>
            </div>

            {/* Cutoff option for personal/fax */}
            {showCutoffOption && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 0.75rem',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '0.375rem',
                    marginBottom: '1.25rem',
                    fontSize: '0.85rem',
                }}>
                    <input
                        type="checkbox"
                        id="before-cutoff"
                        checked={beforeCutoff}
                        onChange={(e) => setBeforeCutoff(e.target.checked)}
                        style={{ accentColor: '#f59e0b' }}
                    />
                    <label htmlFor="before-cutoff" style={{ color: '#92400e' }}>
                        Document served before 4:30pm on a business day
                    </label>
                </div>
            )}

            {/* Results */}
            {result && (
                <div>
                    {/* Summary cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '0.75rem',
                        marginBottom: '0.25rem',
                    }}>
                        {/* Dispatch */}
                        <div style={{
                            padding: '0.875rem 1rem',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderLeft: '4px solid #475569',
                            borderRadius: '0.5rem',
                        }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 600, margin: '0 0 0.25rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                ① Dispatched
                            </p>
                            <p style={{ fontSize: '0.9rem', margin: 0, color: '#1e293b', fontWeight: 600 }}>
                                {formatDateLong(result.dispatch)}
                            </p>
                            <p style={{ fontSize: '0.7rem', margin: '0.25rem 0 0', color: '#6b7280' }}>
                                via {selectedMethodInfo.label}
                                {showCutoffOption && (beforeCutoff ? ' · before 4:30pm' : ' · after 4:30pm')}
                            </p>
                        </div>

                        {/* Deemed service */}
                        <div style={{
                            padding: '0.875rem 1rem',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderLeft: '4px solid #3b82f6',
                            borderRadius: '0.5rem',
                        }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 600, margin: '0 0 0.25rem', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                ② Deemed served
                            </p>
                            <p style={{ fontSize: '0.9rem', margin: 0, color: '#1e293b', fontWeight: 600 }}>
                                {formatDateLong(result.deemedService)}
                            </p>
                            <p style={{ fontSize: '0.7rem', margin: '0.25rem 0 0', color: '#6b7280' }}>
                                {selectedMethodInfo.deemedRule}
                            </p>
                        </div>

                        {/* Deadline */}
                        {result.deadline ? (
                            <div style={{
                                padding: '0.875rem 1rem',
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderLeft: '4px solid #ef4444',
                                borderRadius: '0.5rem',
                            }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 600, margin: '0 0 0.25rem', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    ③ Deadline — {selectedEventInfo.label}
                                </p>
                                <p style={{ fontSize: '0.9rem', margin: 0, color: '#991b1b', fontWeight: 700 }}>
                                    {formatDateLong(result.deadline)}
                                </p>
                                <p style={{ fontSize: '0.7rem', margin: '0.25rem 0 0', color: '#6b7280' }}>
                                    {selectedEventInfo.cprRule} · {selectedEventInfo.clearDays} clear days
                                </p>
                            </div>
                        ) : (
                            <div style={{
                                padding: '0.875rem 1rem',
                                background: '#fffbeb',
                                border: '1px solid #fde68a',
                                borderLeft: '4px solid #f59e0b',
                                borderRadius: '0.5rem',
                            }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 600, margin: '0 0 0.25rem', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    ③ Deadline
                                </p>
                                <p style={{ fontSize: '0.85rem', margin: 0, color: '#92400e' }}>
                                    No fixed period — apply promptly
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Visual calendar */}
                    <CalendarView
                        dispatch={result.dispatch}
                        deemedService={result.deemedService}
                        deadline={result.deadline}
                    />
                    <CalendarLegend />
                </div>
            )}

            {/* CPR rules reference */}
            <div style={{
                marginTop: '1.5rem',
                padding: '0.875rem 1rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                color: '#64748b',
                lineHeight: 1.7,
            }}>
                <strong>How this works:</strong>
                <ul style={{ margin: '0.375rem 0 0', paddingLeft: '1.25rem' }}>
                    <li><strong>Deemed service</strong> — CPR 6.14 (claim forms) / 6.26 (other documents). Depends on the method of service.</li>
                    <li><strong>Business day</strong> — excludes Saturdays, Sundays, bank holidays, Christmas Day, and Good Friday (CPR 6.2(b)).</li>
                    <li><strong>Clear days</strong> — CPR 2.8: the day of service and the deadline day itself are both excluded from the count.</li>
                    <li><strong>Non-business day deadline</strong> — if a deadline falls on a weekend or bank holiday, it moves to the next business day (CPR 2.8(5)).</li>
                </ul>
            </div>
        </div>
    );
}
