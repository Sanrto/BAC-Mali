'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { cleanText, parseListString, slugify } from '../../lib/content-utils'

export default function GuidePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guides, setGuides] = useState([])
  const [openId, setOpenId] = useState(null)
  const [filter, setFilter] = useState('Tous')

  useEffect(() => {
    let cancelled = false
    async function loadGuides() {
      setLoading(true)
      setError('')
      try {
        const { data, error: queryError } = await getSupabaseClient().from('procedures').select('*').order('id', { ascending: true })
        if (queryError) throw queryError
        if (!cancelled) setGuides(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Impossible de charger les procédures.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadGuides()
    return () => { cancelled = true }
  }, [])

  const categories = useMemo(() => ['Tous', ...new Set(guides.map(item => cleanText(item.type)).filter(Boolean))], [guides])
  const filtered = useMemo(() => (filter === 'Tous' ? guides : guides.filter(item => cleanText(item.type) === filter)), [filter, guides])

  return (
    <>
      <style>{`
        .guide-page { min-height: 80vh; display: flex; flex-direction: column; }
        .guide-hero { background: var(--green-800); color: white; padding: 48px 24px 72px; text-align: center; }
        .guide-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold-400); margin-bottom: 12px; }
        .guide-title { font-family: var(--font-display); font-size: clamp(26px, 4vw, 42px); font-weight: 400; line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 12px; }
        .guide-title em { font-style: italic; color: var(--gold-400); }
        .guide-sub { font-size: 15px; color: rgba(255,255,255,0.65); max-width: 520px; margin: 0 auto; }
        .guide-body { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 0 16px 56px; margin-top: -40px; }
        .guide-inner { width: 100%; max-width: 760px; }
        .filter-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; animation: fadeUp .4s ease both; }
        .filter-tab { padding: 6px 16px; border-radius: 100px; font-size: 13px; font-weight: 500; border: 1.5px solid var(--paper-2); background: var(--white); color: var(--ink-2); cursor: pointer; transition: all .15s; font-family: var(--font-body); }
        .filter-tab:hover { border-color: var(--green-300); color: var(--green-700); }
        .filter-tab.active { background: var(--green-700); border-color: var(--green-700); color: white; }
        .accordion-list { display: flex; flex-direction: column; gap: 10px; animation: fadeUp .5s ease both; }
        .accordion-item { background: var(--white); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; border: 1.5px solid var(--paper-2); transition: border-color .15s; }
        .accordion-item.open { border-color: var(--green-200); }
        .accordion-header { display: flex; align-items: center; gap: 14px; padding: 18px 20px; cursor: pointer; width: 100%; background: none; border: none; text-align: left; font-family: var(--font-body); transition: background .15s; }
        .accordion-header:hover { background: var(--paper); }
        .accordion-icon { font-size: 24px; flex-shrink: 0; }
        .accordion-info { flex: 1; }
        .accordion-cat { font-size: 11px; color: var(--ink-4); font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 3px; }
        .accordion-titre { font-size: 15px; font-weight: 600; color: var(--ink); }
        .accordion-arrow { color: var(--ink-4); font-size: 14px; flex-shrink: 0; transition: transform .2s; }
        .accordion-item.open .accordion-arrow { transform: rotate(180deg); }
        .accordion-body { padding: 0 20px 20px; border-top: 1px solid var(--paper-2); }
        .etapes-title { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3); margin: 16px 0 12px; }
        .etape-item { display: flex; gap: 14px; padding: 10px 0; border-bottom: 1px solid var(--paper-2); }
        .etape-item:last-child { border-bottom: none; }
        .etape-num { width: 26px; height: 26px; border-radius: 50%; background: var(--green-700); color: white; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
        .etape-titre { font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 4px; }
        .etape-desc { font-size: 13px; color: var(--ink-2); line-height: 1.6; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
        .meta-item { padding: 12px 14px; background: var(--paper); border-radius: var(--radius-md); }
        .meta-key { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-3); margin-bottom: 4px; }
        .meta-val { font-size: 13px; color: var(--ink-2); line-height: 1.6; }
        .docs-section { margin-top: 16px; }
        .docs-section-title { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3); margin-bottom: 10px; }
        .docs-items { list-style: none; display: flex; flex-direction: column; gap: 6px; }
        .docs-items li { font-size: 13px; color: var(--ink-2); display: flex; gap: 8px; align-items: flex-start; line-height: 1.55; }
        .state-box { background: var(--white); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); padding: 28px; width: 100%; max-width: 760px; text-align: center; }
        @media (max-width: 480px) { .guide-hero { padding: 36px 20px 64px; } .meta-grid { grid-template-columns: 1fr; } }
      `}</style>
      <div className="guide-page">
        <section className="guide-hero">
          <p className="guide-eyebrow">📋 Guide pratique</p>
          <h1 className="guide-title">Vos <em>démarches</em> depuis la base</h1>
          <p className="guide-sub">Les étapes, documents, conditions et résultats sont chargés depuis la table <strong>procedures</strong> de Supabase.</p>
        </section>
        <div className="guide-body">
          <div className="guide-inner">
            {loading && <div className="state-box"><h2 className="etapes-title" style={{ marginTop: 0 }}>Chargement</h2><p className="meta-val">Récupération des procédures depuis Supabase.</p></div>}
            {!loading && error && <div className="state-box"><h2 className="etapes-title" style={{ marginTop: 0 }}>Erreur</h2><p className="meta-val">{error}</p></div>}
            {!loading && !error && (
              <>
                <div className="filter-tabs">{categories.map(cat => <button key={cat} className={`filter-tab${filter === cat ? ' active' : ''}`} onClick={() => setFilter(cat)}>{cat}</button>)}</div>
                <div className="accordion-list">
                  {filtered.map(guide => {
                    const isOpen = openId === guide.id
                    const etapes = parseListString(guide.etapes)
                    const documents = parseListString(guide.documents)
                    const conditions = parseListString(guide.conditions)
                    const anchor = slugify(`${guide.type}-${guide.canal}-${guide.titre}-${guide.id}`)
                    return (
                      <div key={guide.id} id={anchor} className={`accordion-item${isOpen ? ' open' : ''}`}>
                        <button className="accordion-header" onClick={() => setOpenId(isOpen ? null : guide.id)}>
                          <span className="accordion-icon">{guide.type === 'cenou' ? '🏛️' : guide.canal === 'mobile' ? '📱' : '💻'}</span>
                          <div className="accordion-info"><div className="accordion-cat">{cleanText(guide.type)} · {cleanText(guide.canal)}</div><div className="accordion-titre">{cleanText(guide.titre)}</div></div>
                          <span className="accordion-arrow">▼</span>
                        </button>
                        {isOpen && (
                          <div className="accordion-body">
                            <p className="etapes-title">Étapes à suivre</p>
                            {etapes.map((etape, index) => <div key={index} className="etape-item"><div className="etape-num">{index + 1}</div><div><div className="etape-titre">Étape {index + 1}</div><div className="etape-desc">{etape}</div></div></div>)}
                            <div className="meta-grid">
                              <div className="meta-item"><div className="meta-key">Canal</div><div className="meta-val">{cleanText(guide.canal)}</div></div>
                              <div className="meta-item"><div className="meta-key">Type</div><div className="meta-val">{cleanText(guide.type)}</div></div>
                              <div className="meta-item" style={{ gridColumn: '1 / -1' }}><div className="meta-key">Résultat attendu</div><div className="meta-val">{cleanText(guide.resultat)}</div></div>
                              <div className="meta-item" style={{ gridColumn: '1 / -1' }}><div className="meta-key">Source</div><div className="meta-val">{cleanText(guide.source_document)}</div></div>
                            </div>
                            {!!conditions.length && <div className="docs-section"><div className="docs-section-title">Conditions</div><ul className="docs-items">{conditions.map((item, index) => <li key={index}><span>📌</span>{item}</li>)}</ul></div>}
                            {!!documents.length && <div className="docs-section"><div className="docs-section-title">Documents à préparer</div><ul className="docs-items">{documents.map((item, index) => <li key={index}><span>📄</span>{item}</li>)}</ul></div>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {!filtered.length && <div className="state-box" style={{ marginTop: 12 }}><p className="meta-val">Aucune procédure n'a été trouvée pour ce filtre.</p></div>}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
