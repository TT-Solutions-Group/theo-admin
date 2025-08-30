import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { listTransactions } from '@/lib/supabase-admin'

export default async function TransactionsPage() {
  const transactions = await listTransactions({ limit: 100, offset: 0 }).catch(() => [])

  function formatDate(date: string) {
    try {
      return new Date(date).toLocaleString()
    } catch {
      return date
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-[rgb(var(--muted-foreground))] mt-2">Latest financial transactions</p>
      </div>

      <Card elevated>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="whoop-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Source</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-[rgb(var(--muted-foreground))]">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((t: any) => (
                    <tr key={t.id}>
                      <td className="font-mono text-sm">#{t.id}</td>
                      <td>
                        {t.user ? (
                          <span>
                            {t.user.display_name || [t.user.first_name, t.user.last_name].filter(Boolean).join(' ') || t.user.username || `User #${t.user_id}`}
                          </span>
                        ) : (
                          <span>#{t.user_id}</span>
                        )}
                      </td>
                      <td>{t.category?.name || `#${t.category_id}`}</td>
                      <td>{t.description || '—'}</td>
                      <td>
                        <Badge variant={t.type === 'income' ? 'green' : 'red'}>
                          {t.type}
                        </Badge>
                      </td>
                      <td>{t.amount}</td>
                      <td className="uppercase">{t.currency || 'USD'}</td>
                      <td>{t.source || 'manual'}</td>
                      <td className="text-sm text-[rgb(var(--muted-foreground))]">{formatDate(t.date)}</td>
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


