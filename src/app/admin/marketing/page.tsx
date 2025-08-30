import { listMarketingEvents } from '@/lib/supabase-admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function MarketingPage() {
  const events = await listMarketingEvents({ limit: 200, offset: 0 }).catch(() => [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing Events</h1>
        <p className="text-[rgb(var(--muted-foreground))] mt-2">Events sent to marketing systems</p>
      </div>

      <Card elevated>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="whoop-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Source</th>
                  <th>Action Source</th>
                  <th>User</th>
                  <th>Value</th>
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-[rgb(var(--muted-foreground))]">
                      No events found
                    </td>
                  </tr>
                ) : (
                  events.map((e: any) => (
                    <tr key={e.id}>
                      <td className="font-mono text-sm">#{e.id}</td>
                      <td className="font-medium">{e.event_name}</td>
                      <td>{e.source}</td>
                      <td>{e.action_source}</td>
                      <td>
                        {e.user ? (
                          <span>
                            {e.user.display_name || [e.user.first_name, e.user.last_name].filter(Boolean).join(' ') || e.user.username || `User #${e.user_id}`}
                          </span>
                        ) : (
                          <span>#{e.user_id || e.telegram_id || '—'}</span>
                        )}
                      </td>
                      <td>{e.value ?? '—'}</td>
                      <td>{e.currency || '—'}</td>
                      <td>{e.status || '—'}</td>
                      <td>{e.created_at ? new Date(e.created_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


