import { listCategories } from '@/lib/supabase-admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function CategoriesPage() {
  const categories = await listCategories({ limit: 200, offset: 0 }).catch(() => [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-[rgb(var(--muted-foreground))] mt-2">Default and custom categories</p>
      </div>

      <Card elevated>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="whoop-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Default</th>
                  <th>Language</th>
                  <th>Icon</th>
                  <th>Color</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[rgb(var(--muted-foreground))]">
                      No categories found
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c.id}>
                      <td className="font-mono text-sm">#{c.id}</td>
                      <td className="font-medium">{c.name}</td>
                      <td><Badge variant={c.type === 'income' ? 'green' : 'red'}>{c.type}</Badge></td>
                      <td>{c.is_default ? <Badge variant="yellow">Default</Badge> : '—'}</td>
                      <td>{c.language || 'en'}</td>
                      <td>{c.icon || '—'}</td>
                      <td>{c.color || '—'}</td>
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


