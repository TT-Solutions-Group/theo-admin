import { listCategoryTranslations } from '@/lib/supabase-admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CategoryTranslationsPage() {
  const translations = await listCategoryTranslations({ limit: 200, offset: 0 }).catch(() => [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Category Translations</h1>
        <p className="text-[rgb(var(--muted-foreground))] mt-2">Localized names and descriptions</p>
      </div>

      <Card elevated>
        <CardHeader>
          <CardTitle>Translations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="whoop-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Language</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {translations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[rgb(var(--muted-foreground))]">
                      No translations found
                    </td>
                  </tr>
                ) : (
                  translations.map((t) => (
                    <tr key={t.id}>
                      <td className="font-mono text-sm">#{t.id}</td>
                      <td>#{t.category_id}</td>
                      <td>{t.language}</td>
                      <td className="font-medium">{t.name}</td>
                      <td>{t.description || '—'}</td>
                      <td>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</td>
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


