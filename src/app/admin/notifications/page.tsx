"use client"
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

export default function NotificationsBroadcastPage() {
  const router = useRouter()
  const [html, setHtml] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [disablePreview, setDisablePreview] = useState(true)
  const [protectContent, setProtectContent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [tgHtml, setTgHtml] = useState('')
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [buttons, setButtons] = useState<Array<{ id: string; text: string; url: string; web_app: boolean }>>([])
  const [buttonsPerRow, setButtonsPerRow] = useState<number>(2)
  const idCounterRef = useRef(0)
  const [broadcastId, setBroadcastId] = useState('')
  // Mini App builder state (per-button)
  const [miniAppBuilders, setMiniAppBuilders] = useState<Record<string, { page: string; query: string }>>({})

  // History state
  type SentItem = {
    id: number
    telegram_id: number
    message_id: number
    sent_at: string
    broadcast_id?: string | null
    media_type?: string | null
    html?: string | null
    caption?: string | null
    buttons?: string | null
    protect_content?: boolean
    disable_web_page_preview?: boolean
    deleted_at?: string | null
  }
  const [history, setHistory] = useState<SentItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyLimit, setHistoryLimit] = useState(50)
  const [historyOffset, setHistoryOffset] = useState(0)
  const [historyBroadcastId, setHistoryBroadcastId] = useState('')
  const [historyGrouped, setHistoryGrouped] = useState(false)

  // Segmentation state
  type FieldMeta = { group: string; field: string; label: string; type: 'string' | 'number' | 'timestamp' | 'boolean' }
  type Operator = 'eq' | 'neq' | 'in' | 'not_in' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'before' | 'after' | 'within_days' | 'is_null' | 'not_null'
  type Filter = { field: string; op: Operator; value?: any }
  type Logic = 'and' | 'or'
  const [fields, setFields] = useState<FieldMeta[]>([])
  const [operatorsByType, setOperatorsByType] = useState<Record<string, Operator[]>>({})
  const [optionsByField, setOptionsByField] = useState<Record<string, Array<{ value: any; label: string }>>>({})
  const [filters, setFilters] = useState<Filter[]>([])
  const [preview, setPreview] = useState<{ count: number; sample: Array<{ id: number; username: string | null; display_name: string | null; language: string | null }> } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [logic, setLogic] = useState<Logic>('and')

  useEffect(() => {
    fetch('/api/admin/notifications/filters')
      .then(r => r.json())
      .then(d => {
        if (d?.ok) {
          setFields(d.fields || [])
          setOperatorsByType(d.operators || {})
          setOptionsByField(d.options || {})
        }
      })
      .catch(() => {})
  }, [])

  // No base URL needed; we generate t.me deep links using bot username

  const groupedFields = useMemo(() => {
    const groups: Record<string, FieldMeta[]> = {}
    for (const f of fields) {
      groups[f.group] = groups[f.group] || []
      groups[f.group].push(f)
    }
    return groups
  }, [fields])

  // Human-friendly operator labels and ordering by type
  const OP_LABELS: Record<Operator, string> = {
    eq: 'is',
    neq: 'is not',
    in: 'is any of',
    not_in: 'is none of',
    gt: 'greater than',
    gte: 'greater or equal',
    lt: 'less than',
    lte: 'less or equal',
    between: 'between',
    before: 'before',
    after: 'after',
    within_days: 'in the last N days',
    is_null: 'is empty',
    not_null: 'is set',
  }

  function operatorOptionsFor(type: FieldMeta['type']): { value: Operator; label: string }[] {
    const ops = operatorsByType[type] || []
    const orderByType: Operator[] = type === 'timestamp'
      ? ['within_days','between','after','before','not_null','is_null']
      : type === 'boolean'
        ? ['eq','neq']
        : ['eq','neq','in','not_in','between','gt','gte','lt','lte','not_null','is_null']
    const ordered = orderByType.filter(o => ops.includes(o))
    // Append any missing ones at the end
    ops.forEach(o => { if (!ordered.includes(o)) ordered.push(o) })
    return ordered.map(o => ({ value: o, label: OP_LABELS[o] || o }))
  }

  // Timestamp helpers to convert between input and ISO
  function toInputDateTimeLocal(iso?: string | null): string {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return ''
      const pad = (n: number) => String(n).padStart(2, '0')
      const yyyy = d.getFullYear()
      const mm = pad(d.getMonth() + 1)
      const dd = pad(d.getDate())
      const hh = pad(d.getHours())
      const mi = pad(d.getMinutes())
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
    } catch { return '' }
  }

  function fromInputDateTimeLocal(val?: string | null): string | null {
    if (!val) return null
    try {
      const d = new Date(val)
      if (isNaN(d.getTime())) return null
      return d.toISOString()
    } catch { return null }
  }

  async function runPreview() {
    setPreviewLoading(true)
    try {
      const res = await fetch('/api/admin/notifications/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filters, logic })
      })
      const data = await res.json().catch(() => ({}))
      if (data?.ok) setPreview({ count: data.count || 0, sample: data.sample || [] })
    } finally {
      setPreviewLoading(false)
    }
  }

  function genId() {
    idCounterRef.current += 1
    return `btn-${Date.now()}-${idCounterRef.current}-${Math.random().toString(36).slice(2, 8)}`
  }

  function exec(cmd: string, value?: string) {
    try { document.execCommand(cmd, false, value) } catch {}
    if (editorRef.current) {
      const raw = editorRef.current.innerHTML
      setHtml(raw)
      setTgHtml(toTelegramHtml(raw))
    }
  }

  function sanitizeUrl(href: string): string | null {
    try {
      const u = new URL(href)
      if (['http:', 'https:'].includes(u.protocol)) return u.toString()
      return null
    } catch { return null }
  }

  function resolveBotUsername(): string {
    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : ''
      const isLocalHost = /localhost|127\.0\.0\.1|\.local$/i.test(host)
      const isProd = process.env.NODE_ENV === 'production' && !isLocalHost
      return isProd ? 'theoai_uz_bot' : 'finumio_bot'
    } catch {
      return (process.env.NODE_ENV === 'production') ? 'theoai_uz_bot' : 'finumio_bot'
    }
  }

  function encodeStartParam(payload: { path: string; params?: Record<string, any> }): string {
    try {
      const json = JSON.stringify(payload)
      // UTF-8 safe base64 → then URI-encode for query
      return encodeURIComponent(btoa(unescape(encodeURIComponent(json))))
    } catch {
      return ''
    }
  }

  function parseQueryToParams(q: string): Record<string, string> | undefined {
    const query = (q || '').trim()
    if (!query) return undefined
    try {
      const sp = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query)
      const obj: Record<string, string> = {}
      sp.forEach((v, k) => { obj[k] = v })
      return Object.keys(obj).length ? obj : undefined
    } catch {
      return undefined
    }
  }

  function escapeText(t: string): string {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function nodeToTelegramHtml(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return escapeText(node.textContent || '')
    if (!(node instanceof HTMLElement)) return ''
    const tag = node.tagName.toLowerCase()
    const child = () => Array.from(node.childNodes).map(nodeToTelegramHtml).join('')
    if (tag === 'br') return '\n'
    if (tag === 'b' || tag === 'strong') return `<b>${child()}</b>`
    if (tag === 'i' || tag === 'em') return `<i>${child()}</i>`
    if (tag === 'u' || tag === 'ins') return `<u>${child()}</u>`
    if (tag === 's' || tag === 'strike' || tag === 'del') return `<s>${child()}</s>`
    if (tag === 'code') return `<code>${child()}</code>`
    if (tag === 'pre') return `<pre>${child()}</pre>`
    // Map styled span to Telegram tags
    if (tag === 'span') {
      const style = (node.getAttribute('style') || '').toLowerCase()
      let out = child()
      if (/text-decoration[^;]*line-through/.test(style) || /text-decoration-line[^;]*line-through/.test(style)) {
        out = `<s>${out}</s>`
      }
      if (/text-decoration[^;]*underline/.test(style) || /text-decoration-line[^;]*underline/.test(style)) {
        out = `<u>${out}</u>`
      }
      if (/font-style\s*:\s*italic/.test(style)) {
        out = `<i>${out}</i>`
      }
      if (/font-weight\s*:\s*(bold|[6-9]00)/.test(style)) {
        out = `<b>${out}</b>`
      }
      return out
    }
    if (tag === 'a') {
      const href = sanitizeUrl(node.getAttribute('href') || '')
      const body = child() || escapeText(node.textContent || '')
      return href ? `<a href="${href}">${body}</a>` : body
    }
    // Headings → bold + newline
    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
      return `<b>${child()}</b>\n`
    }
    if (tag === 'ul' || tag === 'ol') {
      let i = 1
      return Array.from(node.children).map(li => {
        const line = nodeToTelegramHtml(li)
        if (tag === 'ol') return `${i++}. ${line}\n`
        return `• ${line}\n`
      }).join('')
    }
    if (tag === 'li') return child()
    if (tag === 'p' || tag === 'div') return child() + '\n'
    return child()
  }

  function toTelegramHtml(input: string): string {
    const tmp = document.createElement('div')
    tmp.innerHTML = input
    const out = nodeToTelegramHtml(tmp)
    return out.replace(/\n{3,}/g, '\n\n').trim()
  }

  async function submit() {
    setBusy(true)
    setResult(null)
    try {
      const content = editorRef.current?.innerHTML || html
      const tg = toTelegramHtml(content)
      setTgHtml(tg)
      const bid = (broadcastId && broadcastId.trim()) ? broadcastId.trim() : `bd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
      if (!broadcastId.trim()) setBroadcastId(bid)
      let res: Response
      if (!photoFile && !videoFile) {
        res = await fetch('/api/admin/notifications/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            html: tg,
            disable_web_page_preview: disablePreview,
            protect_content: protectContent,
            buttons: buttons
              .map(b => {
                const text = b.text?.trim()
                const url = sanitizeUrl(b.url || '')
                const isTme = !!url && /https:\/\/t\.me\//i.test(url)
                const web_app = !!b.web_app && !isTme
                return { text, url, web_app }
              })
              .filter(b => b.text && b.url),
            buttons_per_row: buttonsPerRow,
            filters,
            logic,
            broadcast_id: bid,
          }),
        })
      } else {
        const fd = new FormData()
        if (tg) fd.append('html', tg)
        if (photoFile) fd.append('photo', photoFile)
        if (videoFile) fd.append('video', videoFile)
        fd.append('disable_web_page_preview', String(disablePreview))
        fd.append('protect_content', String(protectContent))
        fd.append('broadcast_id', bid)
        if (buttons && buttons.length > 0) {
          const btns = buttons
            .map(b => {
              const text = b.text?.trim()
              const url = sanitizeUrl(b.url || '')
              const isTme = !!url && /https:\/\/t\.me\//i.test(url)
              const web_app = !!b.web_app && !isTme
              return { text, url, web_app }
            })
            .filter(b => b.text && b.url)
          if (btns.length > 0) {
            fd.append('buttons', JSON.stringify(btns))
            fd.append('buttons_per_row', String(buttonsPerRow))
          }
        }
        if (filters && filters.length > 0) fd.append('filters', JSON.stringify(filters))
        fd.append('logic', logic)
        res = await fetch('/api/admin/notifications/broadcast', { method: 'POST', body: fd })
      }
      const data = await res.json().catch(() => ({}))
      setResult({ status: res.status, data })
    } catch (e) {
      setResult({ error: String(e) })
    } finally {
      setBusy(false)
    }
  }

  async function loadHistory(opts?: { reset?: boolean; grouped?: boolean }) {
    setHistoryLoading(true)
    try {
      const limit = historyLimit
      const offset = opts?.reset ? 0 : historyOffset
      const params = new URLSearchParams()
      params.set('limit', String(limit))
      params.set('offset', String(offset))
      const bid = historyBroadcastId.trim()
      if (bid) params.set('broadcast_id', bid)
      const grouped = opts?.grouped ?? historyGrouped
      if (grouped) params.set('group', '1')
      if (opts?.grouped !== undefined) setHistoryGrouped(!!opts.grouped)
      const res = await fetch(`/api/admin/notifications/history?${params}`)
      const data = await res.json().catch(() => ({}))
      if (data?.ok && Array.isArray(data.items)) {
        setHistory(opts?.reset ? data.items : [...history, ...data.items])
        setHistoryOffset(offset + limit)
      }
    } finally {
      setHistoryLoading(false)
    }
  }

  async function deleteOne(item: SentItem) {
    const payload = { chat_id: item.telegram_id, message_ids: [item.message_id] }
    const res = await fetch('/api/admin/notifications/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json().catch(() => ({}))
    if (data?.ok) {
      // Soft update UI
      setHistory(prev => prev.map(it => (it.telegram_id === item.telegram_id && it.message_id === item.message_id) ? { ...it, deleted_at: new Date().toISOString() } : it))
    }
  }

  async function deleteByBroadcast() {
    const bid = historyBroadcastId.trim()
    if (!bid) return
    const res = await fetch('/api/admin/notifications/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ broadcast_id: bid }) })
    await res.json().catch(() => ({}))
    await loadHistory({ reset: true })
  }

  async function editText(item: SentItem) {
    const val = prompt('New message text (HTML allowed):', item.html || '')
    if (val == null) return
    const payload = { chat_id: item.telegram_id, message_id: item.message_id, mode: 'text', text: val }
    const res = await fetch('/api/admin/notifications/edit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    await res.json().catch(() => ({}))
  }

  async function editCaption(item: SentItem) {
    const val = prompt('New caption (HTML allowed):', item.caption || '')
    if (val == null) return
    const payload = { chat_id: item.telegram_id, message_id: item.message_id, mode: 'caption', caption: val }
    const res = await fetch('/api/admin/notifications/edit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    await res.json().catch(() => ({}))
  }

  async function editBatchText(bid: string) {
    const val = prompt('New message text for entire batch (HTML allowed):', '')
    if (val == null) return
    const payload = { broadcast_id: bid, mode: 'text', text: val }
    const res = await fetch('/api/admin/notifications/edit', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    await res.json().catch(() => ({}))
  }

  async function editBatchCaption(bid: string) {
    const val = prompt('New caption for entire batch (HTML allowed):', '')
    if (val == null) return
    const payload = { broadcast_id: bid, mode: 'caption', caption: val }
    const res = await fetch('/api/admin/notifications/edit', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    await res.json().catch(() => ({}))
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Broadcast Notifications</h1>
      <p className="text-sm text-gray-500 mb-6">Sends a bot message with formatting and optional media to allowlisted users (PROD_NOTIFICATIONS_IDS) only.</p>
      <div className="grid grid-cols-1 gap-4 max-w-3xl">
        {/* Segmentation */}
        <div className="grid gap-3 border border-[rgb(var(--border))] rounded">
          <div className="px-3 py-2 flex items-center justify-between border-b border-[rgb(var(--border))]">
            <span className="text-sm font-medium">Audience filters</span>
            <div className="flex items-center gap-2">
                <label className="text-xs flex items-center gap-2">
                  <span>Combine with</span>
                  <select className="border rounded px-2 py-1 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]" value={logic} onChange={e => setLogic((e.target.value === 'or' ? 'or' : 'and'))}>
                    <option value="and">AND</option>
                    <option value="or">OR</option>
                  </select>
                </label>
              <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => setFilters(prev => [...prev, { field: fields[0]?.field || 'users.language', op: 'in', value: [] }])}>+ Add filter</button>
              <div className="relative group">
                <button type="button" className="px-2 py-1 text-xs border rounded">Presets</button>
                <div className="absolute right-0 mt-1 hidden group-hover:block z-10 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded shadow-min w-56">
                  <button type="button" className="w-full text-left px-3 py-2 text-xs hover:bg-[rgb(var(--card-hover))]" onClick={() => setFilters([
                    { field: 'user_subscriptions.status', op: 'eq', value: 'active' },
                    { field: 'marketing_events.event_time', op: 'within_days', value: 7 },
                  ])}>Active subs in last 7 days</button>
                  <button type="button" className="w-full text-left px-3 py-2 text-xs hover:bg-[rgb(var(--card-hover))]" onClick={() => setFilters([
                    { field: 'users.language', op: 'in', value: ['uz','ru'] },
                    { field: 'transactions.date', op: 'within_days', value: 14 },
                  ])}>UZ/RU users with tx in 14 days</button>
                  <button type="button" className="w-full text-left px-3 py-2 text-xs hover:bg-[rgb(var(--card-hover))]" onClick={() => setFilters([
                    { field: 'users.is_premium', op: 'eq', value: false },
                    { field: 'marketing_events.event_name', op: 'eq', value: 'InitiateCheckout' },
                    { field: 'marketing_events.event_time', op: 'within_days', value: 30 },
                  ])}>Checkout started but not premium (30d)</button>
                </div>
              </div>
            </div>
          </div>
          {filters.length === 0 && <span className="text-xs text-gray-500 px-3 py-2">No filters. The bot will use its allowlist defaults.</span>}
          <div className="px-3 py-2 grid gap-2">
          {filters.map((f, idx) => {
            const meta = fields.find(m => m.field === f.field)
            const ops = meta ? (operatorsByType[meta.type] || []) : []
            return (
              <div key={`flt-${idx}`} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <select className="w-full border rounded px-2 py-1 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]"
                    value={f.field}
                    onChange={e => {
                      const nf = fields.find(m => m.field === e.target.value)
                      setFilters(prev => prev.map((it, i) => i === idx ? { field: e.target.value, op: (nf ? (operatorsByType[nf.type] || ['eq'])[0] : 'eq'), value: undefined } : it))
                    }}>
                    {Object.entries(groupedFields).map(([g, arr]) => (
                      <optgroup key={g} label={g}>
                        {arr.map(it => <option key={it.field} value={it.field}>{it.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <select className="w-full border rounded px-2 py-1 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]"
                    value={f.op}
                    onChange={e => setFilters(prev => prev.map((it, i) => i === idx ? { ...it, op: e.target.value as Operator, value: undefined } : it))}>
                    {operatorOptionsFor(meta?.type || 'string').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="col-span-4">
                  {/* Value editor with select options if available */}
                  {(() => {
                    const m = meta
                    const op = f.op
                    if (!m) return null
                    if (op === 'is_null' || op === 'not_null') return <span className="text-xs text-gray-500">—</span>
                    const opts = optionsByField[f.field]
                    // Render multi-select for in/not_in if options provided
                    if ((op === 'in' || op === 'not_in') && Array.isArray(opts) && opts.length > 0) {
                      const selected = Array.isArray(f.value) ? f.value : []
                      return (
                        <select multiple className="w-full border rounded px-2 py-1 bg-[rgb(var(--card))] text-[rgb(var(--foreground))] h-24"
                          value={selected.map(String)}
                          onChange={e => {
                            const arr = Array.from(e.target.selectedOptions).map(o => o.value)
                            const casted = (m.type === 'number') ? arr.map(v => Number(v)) : arr
                            setFilters(prev => prev.map((it, i) => i === idx ? { ...it, value: casted } : it))
                          }}>
                          {opts.map(o => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
                        </select>
                      )
                    }
                    // Render single select for eq/neq when options provided
                    if ((op === 'eq' || op === 'neq') && Array.isArray(opts) && opts.length > 0) {
                      return (
                        <select className="w-full border rounded px-2 py-1 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]"
                          value={f.value ?? ''}
                          onChange={e => setFilters(prev => prev.map((it, i) => i === idx ? { ...it, value: (m.type === 'number') ? Number(e.target.value) : e.target.value } : it))}>
                          <option value="">—</option>
                          {opts.map(o => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
                        </select>
                      )
                    }
                    if (m.type === 'boolean') {
                      return (
                        <select className="w-full border rounded px-2 py-1 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]"
                          value={String(Boolean(f.value))}
                          onChange={e => setFilters(prev => prev.map((it, i) => i === idx ? { ...it, value: e.target.value === 'true' } : it))}>
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      )
                    }
                    if (op === 'between') {
                      if (m.type === 'timestamp') {
                        return (
                          <div className="flex gap-2">
                            <input type="datetime-local" className="flex-1 border rounded px-2 py-1 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]"
                              value={toInputDateTimeLocal(Array.isArray(f.value) ? f.value[0] : undefined)}
                              onChange={e => setFilters(prev => prev.map((it, i) => i === idx ? { ...it, value: [fromInputDateTimeLocal(e.target.value), Array.isArray(it.value) ? it.value?.[1] : null] } : it))} />
                            <input type="datetime-local" className="flex-1 border rounded px-2 py-1 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]"
                              value={toInputDateTimeLocal(Array.isArray(f.value) ? f.value[1] : undefined)}
                              onChange={e => setFilters(prev => prev.map((it, i) => i === idx ? { ...it, value: [Array.isArray(it.value) ? it.value?.[0] : null, fromInputDateTimeLocal(e.target.value)] } : it))} />
                          </div>
                        )
                      }
                      return (
                        <div className="flex gap-2">
                          <input className="flex-1 border rounded px-2 py-1 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]" placeholder={'from'} value={Array.isArray(f.value) ? f.value[0] ?? '' : ''}
                            onChange={e => setFilters(prev => prev.map((it, i) => i === idx ? { ...it, value: [e.target.value, Array.isArray(it.value) ? it.value?.[1] : ''] } : it))} />
                          <input className="flex-1 border rounded px-2 py-1 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]" placeholder={'to'} value={Array.isArray(f.value) ? f.value[1] ?? '' : ''}
                            onChange={e => setFilters(prev => prev.map((it, i) => i === idx ? { ...it, value: [Array.isArray(it.value) ? it.value?.[0] : '', e.target.value] } : it))} />
                        </div>
                      )
                    }
                    if (op === 'in' || op === 'not_in') {
                      return (
                        <input className="w-full border rounded px-2 py-1 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]" placeholder="comma,separated"
                          value={Array.isArray(f.value) ? f.value.join(',') : ''}
                          onChange={e => {
                            const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            setFilters(prev => prev.map((it, i) => i === idx ? { ...it, value: (m.type === 'number') ? arr.map(x => Number(x)) : arr } : it))
                          }} />
                      )
                    }
                    if (m.type === 'timestamp' && (op === 'before' || op === 'after')) {
                      return (
                        <input type="datetime-local" className="w-full border rounded px-2 py-1 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]"
                          value={toInputDateTimeLocal(f.value)}
                          onChange={e => setFilters(prev => prev.map((it, i) => i === idx ? { ...it, value: fromInputDateTimeLocal(e.target.value) } : it))} />
                      )
                    }
                    if (m.type === 'timestamp' && op === 'within_days') {
                      return (
                        <input className="w-full border rounded px-2 py-1 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]" placeholder="days"
                          value={f.value ?? ''}
                          onChange={e => setFilters(prev => prev.map((it, i) => i === idx ? { ...it, value: Number(e.target.value || '0') } : it))} />
                      )
                    }
                    if (m.type === 'number' && (op === 'gt' || op === 'gte' || op === 'lt' || op === 'lte' || op === 'eq' || op === 'neq')) {
                      return (
                        <input type="number" className="w-full border rounded px-2 py-1 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]" placeholder="value"
                          value={f.value ?? ''}
                          onChange={e => setFilters(prev => prev.map((it, i) => i === idx ? { ...it, value: (e.target.value === '' ? '' : Number(e.target.value)) } : it))} />
                      )
                    }
                    return (
                      <input className="w-full border rounded px-2 py-1 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]" placeholder="value"
                        value={f.value ?? ''}
                        onChange={e => setFilters(prev => prev.map((it, i) => i === idx ? { ...it, value: e.target.value } : it))} />
                    )
                  })()}
                </div>
                <div className="col-span-1 text-right">
                  <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => setFilters(prev => prev.filter((_, i) => i !== idx))}>Remove</button>
                </div>
              </div>
            )})}
          </div>
          {/* Compact badges summary */}
          {filters.length > 0 && (
            <div className="px-3 py-2 border-t border-[rgb(var(--border))] flex flex-wrap gap-2">
              {filters.map((f, i) => {
                const meta = fields.find(m => m.field === f.field)
                const label = meta?.label || f.field
                const opLabel = OP_LABELS[f.op] || f.op
                let val: string = ''
                if (Array.isArray(f.value)) val = f.value.join(', ')
                else if (typeof f.value === 'boolean') val = f.value ? 'true' : 'false'
                else if (typeof f.value === 'string') val = f.value
                else if (f.value == null) val = ''
                else val = String(f.value)
                return (
                  <span key={`badge-${i}`} className="text-[10px] px-2 py-1 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--foreground))]">
                    {label}: {opLabel}{val ? ` ${val}` : ''}
                  </span>
                )
              })}
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-[rgb(var(--border))]">
            <button type="button" className="px-3 py-1 rounded border border-[rgb(var(--border))]" onClick={runPreview} disabled={previewLoading}>{previewLoading ? 'Previewing…' : 'Preview audience'}</button>
            {preview && <span className="text-xs text-gray-500">Matched: {preview.count}</span>}
          </div>
          {preview?.sample?.length ? (
            <div className="mx-3 mb-3 border border-[rgb(var(--border))] rounded p-2">
              <div className="text-xs text-gray-500 mb-1">Sample users</div>
              <div className="text-xs grid gap-1">
                {preview.sample.map(u => (
                  <div key={`s-${u.id}`} className="flex gap-2">
                    <span className="w-16">#{u.id}</span>
                    <span className="w-40">{u.username || '-'}</span>
                    <span className="flex-1">{u.display_name || '-'}</span>
                    <span className="w-10">{u.language || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm">Message (rich text)</span>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="px-3 py-1 rounded border border-[rgb(var(--border))]" onClick={() => exec('bold')}>Bold</button>
              <button type="button" className="px-3 py-1 rounded border border-[rgb(var(--border))]" onClick={() => exec('italic')}>Italic</button>
              <button type="button" className="px-3 py-1 rounded border border-[rgb(var(--border))]" onClick={() => exec('underline')}>Underline</button>
              <button type="button" className="px-3 py-1 rounded border border-[rgb(var(--border))]" onClick={() => exec('insertUnorderedList')}>Bullets</button>
              <button type="button" className="px-3 py-1 rounded border border-[rgb(var(--border))]" onClick={() => { const href = prompt('Link URL (https://)') || ''; const ok = sanitizeUrl(href); if (ok) exec('createLink', ok) }}>Link</button>
            </div>
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[240px] border border-[rgb(var(--border))] rounded p-3 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]"
              onInput={(e) => {
                const raw = (e.target as HTMLDivElement).innerHTML
                setHtml(raw)
                setTgHtml(toTelegramHtml(raw))
              }}
              suppressContentEditableWarning
            />
            <span className="text-xs text-gray-500">Supports bold, italics, underline, links, bullets. Converted to Telegram HTML on send.</span>
            {tgHtml && (
              <>
                <span className="text-xs text-gray-500 mt-2">Telegram HTML preview</span>
                <pre className="p-2 rounded text-xs overflow-x-auto border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--foreground))]">{tgHtml}</pre>
              </>
            )}
          </div>
          <div className="grid gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Broadcast ID (optional)</span>
              <input className="border border-[rgb(var(--border))] rounded p-2 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]" placeholder="e.g. promo_2025_10" value={broadcastId} onChange={e => setBroadcastId(e.target.value)} />
              <span className="text-xs text-gray-500">Used to group messages for later edit/delete.</span>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Photo (optional)</span>
              <input className="border border-[rgb(var(--border))] rounded p-2 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]" type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Video (optional)</span>
              <input className="border border-[rgb(var(--border))] rounded p-2 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]" type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} />
            </label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={disablePreview} onChange={e => setDisablePreview(e.target.checked)} />
                <span className="text-sm">Disable link preview</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={protectContent} onChange={e => setProtectContent(e.target.checked)} />
                <span className="text-sm">Protect content</span>
              </label>
            </div>
          </div>
        </div>
        {/* Inline buttons editor */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Inline buttons</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Buttons per row</span>
              <select
                className="border rounded px-2 py-1 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]"
                value={buttonsPerRow}
                onChange={e => setButtonsPerRow(Math.max(1, Math.min(4, Number(e.target.value) || 2)))}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
          </div>
          {/* Mini App base URL not required; using t.me deep links */}
          <div className="flex flex-col gap-3">
            {buttons.map((b, idx) => (
              <div key={b.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs">Text</span>
                    <input
                      className="border rounded px-3 py-2 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]"
                      value={b.text}
                      onChange={e => setButtons(prev => prev.map((it, i) => i === idx ? { ...it, text: e.target.value } : it))}
                      placeholder="Button title"
                    />
                  </label>
                </div>
                <div className="col-span-6">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs">URL</span>
                    <input
                      className="border rounded px-3 py-2 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]"
                      value={b.url}
                      onChange={e => setButtons(prev => prev.map((it, i) => i === idx ? { ...it, url: e.target.value } : it))}
                      placeholder="https://..."
                    />
                  </label>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={b.web_app}
                      onChange={e => {
                        const next = e.target.checked
                        setButtons(prev => prev.map((it, i) => i === idx ? { ...it, web_app: next } : it))
                        if (next) {
                          setMiniAppBuilders(prev => ({ ...prev, [b.id]: prev[b.id] || { page: '/subscribe', query: '' } }))
                        }
                      }}
                    />
                    <span className="text-xs">WebApp</span>
                  </label>
                </div>
                <div className="col-span-12 flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-1 rounded border border-[rgb(var(--border))]"
                    onClick={() => setButtons(prev => prev.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </div>
                {/* Mini App link builder (visible when WebApp is checked) */}
                {b.web_app && (
                  <div className="col-span-12 grid grid-cols-12 gap-2 border border-[rgb(var(--border))] rounded p-2 mt-2">
                    <div className="col-span-4">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs">Mini App Page</span>
                        <select
                          className="border rounded px-2 py-2 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]"
                          value={miniAppBuilders[b.id]?.page || '/subscribe'}
                          onChange={e => setMiniAppBuilders(prev => ({ ...prev, [b.id]: { page: e.target.value, query: prev[b.id]?.query || '' } }))}
                        >
                          <option value="/">Home</option>
                          <option value="/subscribe">Subscribe</option>
                          <option value="/subscription">Subscription</option>
                          <option value="/budget-goals">Budget goals</option>
                          <option value="/categories">Categories</option>
                          <option value="/analytics">Analytics</option>
                          <option value="/transactions">Transactions</option>
                          <option value="/add-card">Add card</option>
                        </select>
                      </label>
                    </div>
                    <div className="col-span-6">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs">Query (key=value&key2=value2)</span>
                        <input
                          className="border rounded px-3 py-2 bg-[rgb(var(--card))] text-[rgb(var(--foreground))]"
                          placeholder="plan=pro"
                          value={miniAppBuilders[b.id]?.query || ''}
                          onChange={e => setMiniAppBuilders(prev => ({ ...prev, [b.id]: { page: prev[b.id]?.page || '/subscribe', query: e.target.value } }))}
                        />
                      </label>
                    </div>
                    <div className="col-span-2 flex items-end">
                      <button
                        type="button"
                        className="px-3 py-2 rounded border border-[rgb(var(--border))] w-full"
                        onClick={() => {
                          const conf = miniAppBuilders[b.id] || { page: '/subscribe', query: '' }
                          const path = conf.page || '/'
                          const params = parseQueryToParams(conf.query || '')
                          const startParam = encodeStartParam({ path, params })
                          const tme = `https://t.me/${resolveBotUsername()}?startapp=${startParam}`
                          const ok = sanitizeUrl(tme)
                          if (!ok) {
                            alert('Failed to build deep link')
                            return
                          }
                          // Use URL button for t.me deep link; disable web_app to avoid Bot API rejecting the URL
                          setButtons(prev => prev.map((it, i) => i === idx ? { ...it, url: ok, web_app: false } : it))
                        }}
                      >
                        Generate t.me Link
                      </button>
                    </div>
                    <div className="col-span-12">
                      <span className="text-[10px] text-gray-500">Generates a Main Mini App deep link (URL button). The WebApp flag is disabled automatically.</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div>
              <button
                type="button"
                className="px-3 py-1 rounded border border-[rgb(var(--border))]"
                onClick={() => setButtons(prev => [...prev, { id: genId(), text: '', url: '', web_app: false }])}
              >
                + Add button
              </button>
            </div>
            {buttons.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Preview</span>
                <div className="mt-1 border border-[rgb(var(--border))] rounded p-2 inline-block">
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${buttonsPerRow}, minmax(0, 1fr))` }}>
                    {buttons.map((b) => (
                      <div key={`pv-${b.id}`} className="text-center text-xs border rounded px-2 py-1 bg-[rgb(var(--card))] text-[rgb(var(--foreground))] truncate">
                        {b.text || '(untitled)'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <button className="bg-black text-white px-4 py-2 rounded disabled:opacity-50" disabled={busy} onClick={submit}>
          {busy ? 'Sending…' : 'Send broadcast'}
        </button>
        {result && (
          <pre className="p-3 rounded text-xs overflow-x-auto border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--foreground))]">{JSON.stringify(result, null, 2)}</pre>
        )}
        {/* History */}
        <div className="mt-6 border border-[rgb(var(--border))] rounded">
          <div className="px-3 py-2 flex items-center justify-between border-b border-[rgb(var(--border))]">
            <span className="text-sm font-medium">Notifications history</span>
            <div className="flex items-center gap-2">
              <input className="border rounded px-2 py-1 text-xs bg-[rgb(var(--card))] text-[rgb(var(--foreground))]" placeholder="Filter by Broadcast ID" value={historyBroadcastId} onChange={e => setHistoryBroadcastId(e.target.value)} />
              <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => { setHistory([]); setHistoryOffset(0); loadHistory({ reset: true, grouped: false }) }} disabled={historyLoading}>{historyLoading ? 'Loading…' : 'Load'}</button>
              <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => { setHistory([]); setHistoryOffset(0); loadHistory({ reset: true, grouped: true }) }} disabled={historyLoading}>Load grouped</button>
              <button type="button" className="px-2 py-1 text-xs border rounded" onClick={deleteByBroadcast} disabled={!historyBroadcastId.trim()}>Delete all with ID</button>
            </div>
          </div>
          <div className="p-2 text-xs grid gap-2">
            {history.length === 0 ? (
              <span className="text-gray-500">No items loaded.</span>
            ) : (
              history.map((it: any, idx: number) => {
                const isGroup = typeof it?.message_count === 'number' && !!it?.broadcast_id
                return isGroup ? (
                  <div key={`g_${it.broadcast_id || 'null'}_${idx}`} className="border border-[rgb(var(--border))] rounded p-2">
                    <div className="flex flex-wrap gap-3 items-center">
                      <span>Broadcast: {it.broadcast_id || '(no id)'}</span>
                      <span>Msgs: {typeof it.message_count === 'number' ? it.message_count : 0}</span>
                      <span>First: {it.first_sent_at ? new Date(it.first_sent_at).toLocaleString() : '-'}</span>
                      <span>Last: {it.last_sent_at ? new Date(it.last_sent_at).toLocaleString() : '-'}</span>
                    </div>
                  <div className="mt-1 line-clamp-2 break-words opacity-80">{(it.preview_text || '').slice(0, 200)}</div>
                  <div className="mt-2 flex items-center gap-2">
                      <button className="px-2 py-1 border rounded" onClick={() => editBatchText(it.broadcast_id)}>Edit all texts</button>
                      <button className="px-2 py-1 border rounded" onClick={() => editBatchCaption(it.broadcast_id)}>Edit all captions</button>
                      <button className="px-2 py-1 border rounded" onClick={deleteByBroadcast}>Delete all</button>
                    </div>
                  </div>
                ) : (
                  <div key={`${it.telegram_id}_${it.message_id}_${it.sent_at || idx}`} className="border border-[rgb(var(--border))] rounded p-2">
                    <div className="flex flex-wrap gap-3 items-center">
                      <span>Chat: {it.telegram_id}</span>
                      <span>Msg: {it.message_id}</span>
                      <span>Sent: {it.sent_at ? new Date(it.sent_at).toLocaleString() : '-'}</span>
                      {it.broadcast_id ? <span>Broadcast: {it.broadcast_id}</span> : null}
                      {it.deleted_at ? <span className="text-red-500">Deleted</span> : null}
                    </div>
                    <div className="mt-1 line-clamp-2 break-words opacity-80">{(it.caption || it.html || '').slice(0, 160)}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <button className="px-2 py-1 border rounded" onClick={() => editText(it)}>Edit text</button>
                      <button className="px-2 py-1 border rounded" onClick={() => editCaption(it)}>Edit caption</button>
                      <button className="px-2 py-1 border rounded" onClick={() => deleteOne(it)}>Delete</button>
                    </div>
                  </div>
                )
              })
            )}
            {history.length > 0 && (
              <button type="button" className="px-2 py-1 text-xs border rounded w-max" onClick={() => loadHistory({ grouped: historyGrouped })}>Load more</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


