import { listBudgets } from '@/lib/supabase-admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function BudgetsPage() {
  const rows = await listBudgets({ limit: 200, offset: 0 }).catch(() => [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Limits</h1>
        <p className="text-[rgb(var(--muted-foreground))] mt-2">Per-user spending limits by category</p>
      </div>

      <Card elevated>
        <CardHeader>
          <CardTitle>All Limits</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="whoop-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Start</th>
                  <th>End</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[rgb(var(--muted-foreground))]">
                      No limits found
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id}>
                      <td className="font-mono text-sm">#{r.id}</td>
                      <td>{r.user?.[0] ? (r.user[0].display_name || [r.user[0].first_name, r.user[0].last_name].filter(Boolean).join(' ') || r.user[0].username || `User #${r.user_id}`) : `#${r.user_id}`}</td>
                      <td>{r.category?.[0]?.name || `#${r.category_id}`}</td>
                      <td>{r.amount}</td>
                      <td className="uppercase">{r.currency || 'USD'}</td>
                      <td>{new Date(r.start_date).toLocaleDateString()}</td>
                      <td>{new Date(r.end_date).toLocaleDateString()}</td>
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


