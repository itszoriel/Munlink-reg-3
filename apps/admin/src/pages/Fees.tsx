import { useEffect, useState } from 'react'
import { documentsAdminApi, handleApiError } from '../lib/api'
import { useAdminStore } from '../lib/store'

type DocType = {
  id: number
  name: string
  authority_level: string
  fee: number
  fee_confirmed: boolean
  processing_days: number | null
  fee_tiers?: Record<string, number> | null
}

type Draft = { fee: string; days: string }

/**
 * Fees and processing times for the documents this office issues. Residents see an
 * unconfirmed fee labelled "provisional"; confirming it here removes the label.
 */
export default function Fees() {
  const isAuthBootstrapped = useAdminStore((s) => s.isAuthBootstrapped)
  const [types, setTypes] = useState<DocType[] | null>(null)
  const [drafts, setDrafts] = useState<Record<number, Draft>>({})
  const [saving, setSaving] = useState<number | null>(null)
  const [message, setMessage] = useState<{ id: number; text: string; ok: boolean } | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthBootstrapped) return
    documentsAdminApi.listDocumentTypes()
      .then((res) => {
        const list: DocType[] = res?.types || []
        setTypes(list)
        setDrafts(Object.fromEntries(list.map((t) => [t.id, { fee: String(Number(t.fee || 0)), days: String(t.processing_days ?? 1) }])))
      })
      .catch((err) => setLoadError(handleApiError(err)))
  }, [isAuthBootstrapped])

  const save = async (t: DocType) => {
    const draft = drafts[t.id]
    const fee = Number(draft?.fee)
    const days = Number(draft?.days)
    if (!Number.isFinite(fee) || fee < 0) { setMessage({ id: t.id, text: 'Enter the fee in pesos, for example 50 or 150.50.', ok: false }); return }
    if (!Number.isInteger(days) || days < 0) { setMessage({ id: t.id, text: 'Enter processing time as whole working days.', ok: false }); return }
    setSaving(t.id)
    setMessage(null)
    try {
      const res: any = await documentsAdminApi.updateDocumentFee(t.id, { fee, processing_days: days, fee_confirmed: true })
      const updated: DocType = res?.type
      setTypes((list) => (list || []).map((x) => (x.id === t.id ? { ...x, ...updated } : x)))
      setMessage({ id: t.id, text: 'Saved and confirmed. Residents now see this as the official fee.', ok: true })
    } catch (err) {
      setMessage({ id: t.id, text: handleApiError(err), ok: false })
    } finally {
      setSaving(null)
    }
  }

  const provisional = (types || []).filter((t) => !t.fee_confirmed).length

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-semibold text-slate-900">Fees and processing times</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          These appear on the public Citizen's Charter. Until you confirm a fee, residents see it labelled
          “provisional” with a note that the office will confirm the final amount. Every change is recorded in the audit log.
        </p>
      </header>

      {loadError && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{loadError}</div>}

      {types === null && !loadError ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 w-full" />)}</div>
      ) : types && types.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-700">Your office has no document types set up yet.</p>
      ) : types && (
        <>
          <p className="text-sm text-slate-700">
            {provisional === 0 ? 'All fees are confirmed.' : `${provisional} of ${types.length} still provisional.`}
          </p>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Document</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Fee (₱)</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Working days</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                  <th scope="col" className="px-4 py-2.5"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {types.map((t) => (
                  <tr key={t.id} className="align-top">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">{t.name}</span>
                      <span className="block text-xs capitalize text-slate-600">{t.authority_level}</span>
                      {t.fee_tiers && <span className="block text-xs text-slate-600">Has business-type tiers; the fee here is the base amount.</span>}
                      {message?.id === t.id && (
                        <span className={`mt-1 block text-xs ${message.ok ? 'text-emerald-800' : 'text-red-700'}`} role="status">{message.text}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <label className="sr-only" htmlFor={`fee-${t.id}`}>Fee for {t.name}</label>
                      <input
                        id={`fee-${t.id}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        className="input-field w-28 tabular-nums"
                        value={drafts[t.id]?.fee ?? ''}
                        onChange={(e) => setDrafts((d) => ({ ...d, [t.id]: { ...d[t.id], fee: e.target.value } }))}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <label className="sr-only" htmlFor={`days-${t.id}`}>Working days for {t.name}</label>
                      <input
                        id={`days-${t.id}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step="1"
                        className="input-field w-20 tabular-nums"
                        value={drafts[t.id]?.days ?? ''}
                        onChange={(e) => setDrafts((d) => ({ ...d, [t.id]: { ...d[t.id], days: e.target.value } }))}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {t.fee_confirmed
                        ? <span className="pill border border-emerald-200 bg-emerald-50 text-emerald-800">Confirmed</span>
                        : <span className="pill border border-amber-300 bg-amber-50 text-amber-900">Provisional</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" className="btn-primary" onClick={() => save(t)} disabled={saving === t.id}>
                        {saving === t.id ? 'Saving…' : t.fee_confirmed ? 'Save' : 'Confirm'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
