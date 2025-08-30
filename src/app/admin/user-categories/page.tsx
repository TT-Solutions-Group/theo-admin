import { listUserCategories } from '@/lib/supabase-admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function UserCategoriesPage() {
  const rows = await listUserCategories({ limit: 200, offset: 0 }).catch(() => [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Categories</h1>
        <p className="text-[rgb(var(--muted-foreground))] mt-2">Per-user category settings</p>
      </div>

      <Card elevated>
        <CardHeader>
          <CardTitle>Mappings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="whoop-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Category</th>
                  <th>Enabled</th>
                  <th>Pinned</th>
                  <th>Alias</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-[rgb(var(--muted-foreground))]">
                      No mappings found
                    </td>
                  </tr>
                ) : (
                  rows.map((r: any, idx: number) => (
                    <tr key={`${r.user_id}-${r.category_id}-${idx}`}>
                      <td>
                        {r.user ? (
                          <span>
                            {r.user.display_name || [r.user.first_name, r.user.last_name].filter(Boolean).join(' ') || r.user.username || `User #${r.user_id}`}
                          </span>
                        ) : (
                          <span>#{r.user_id}</span>
                        )}
                      </td>
                      <td>{r.category?.name || `#${r.category_id}`}</td>
                      <td>{r.is_enabled ? <Badge variant="green">Yes</Badge> : <Badge variant="red">No</Badge>}</td>
                      <td>{r.is_pinned ? <Badge variant="yellow">Pinned</Badge> : '—'}</td>
                      <td>{r.user_alias || '—'}</td>
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


