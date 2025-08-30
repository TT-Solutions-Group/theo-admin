import { listUserSubscriptions } from '@/lib/supabase-admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function SubscriptionsPage() {
  const subs = await listUserSubscriptions({ limit: 200, offset: 0 }).catch(() => [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <p className="text-[rgb(var(--muted-foreground))] mt-2">User subscription states</p>
      </div>

      <Card elevated>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="whoop-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Next Payment</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {subs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-[rgb(var(--muted-foreground))]">
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  subs.map((s) => (
                    <tr key={s.id}>
                      <td className="font-mono text-sm">#{s.id}</td>
                      <td>
                        {s.user?.[0] ? (
                          <span>
                            {s.user[0].display_name || [s.user[0].first_name, s.user[0].last_name].filter(Boolean).join(' ') || s.user[0].username || `User #${s.user_id}`}
                          </span>
                        ) : (
                          <span>#{s.user_id}</span>
                        )}
                      </td>
                      <td>{s.status ? <Badge variant={s.status === 'active' ? 'green' : 'yellow'}>{s.status}</Badge> : '—'}</td>
                      <td>{s.plan_type}</td>
                      <td>{s.amount}</td>
                      <td className="uppercase">{s.currency}</td>
                      <td>{s.next_payment_date ? new Date(s.next_payment_date).toLocaleDateString() : '—'}</td>
                      <td>{s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}</td>
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


