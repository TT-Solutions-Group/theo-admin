"use client"
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

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
              .map(b => ({ text: b.text?.trim(), url: sanitizeUrl(b.url || ''), web_app: !!b.web_app }))
              .filter(b => b.text && b.url),
            buttons_per_row: buttonsPerRow,
          }),
        })
      } else {
        const fd = new FormData()
        if (tg) fd.append('html', tg)
        if (photoFile) fd.append('photo', photoFile)
        if (videoFile) fd.append('video', videoFile)
        fd.append('disable_web_page_preview', String(disablePreview))
        fd.append('protect_content', String(protectContent))
        if (buttons && buttons.length > 0) {
          const btns = buttons
            .map(b => ({ text: b.text?.trim(), url: sanitizeUrl(b.url || ''), web_app: !!b.web_app }))
            .filter(b => b.text && b.url)
          if (btns.length > 0) {
            fd.append('buttons', JSON.stringify(btns))
            fd.append('buttons_per_row', String(buttonsPerRow))
          }
        }
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Broadcast Notifications</h1>
      <p className="text-sm text-gray-500 mb-6">Sends a bot message with formatting and optional media to allowlisted users (PROD_NOTIFICATIONS_IDS) only.</p>
      <div className="grid grid-cols-1 gap-4 max-w-3xl">
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
                      onChange={e => setButtons(prev => prev.map((it, i) => i === idx ? { ...it, web_app: e.target.checked } : it))}
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
      </div>
    </div>
  )
}


