'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { cleanText, formatFcfa, humanizeModeAcces, parseListString } from '../../lib/content-utils'

function buildSeriesOptions(rows) {
  const unique = [...new Set(rows.map(row => cleanText(row.serie_bac)).filter(Boolean))]
  return unique.map(serie => ({ id: serie, label: serie, desc: `${rows.filter(row => cleanText(row.serie_bac) === serie).length} filière(s) trouvée(s)` }))
}

export default function OrientationPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [programs, setPrograms] = useState([])
  const [selectedSerie, setSelectedSerie] = useState('')
  const [step, setStep] = useState(1)

  useEffect(() => {
    let cancelled = false
    async function loadPrograms() {
      setLoading(true)
      setError('')
      try {
        const { data, error: queryError } = await getSupabaseClient().from('orientation').select('*').order('serie_bac').order('etablissement').order('filiere')
        if (queryError) throw queryError
        if (cancelled) return
        const rows = Array.isArray(data) ? data : []
        setPrograms(rows)
        const firstSerie = rows.find(row => cleanText(row.serie_bac))?.serie_bac || ''
        if (firstSerie) setSelectedSerie(firstSerie)
      } catch (err) {
        if (!cancelled) setError(err.message || "Impossible de charger les données d'orientation.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadPrograms()
    return () => { cancelled = true }
  }, [])

  const series = useMemo(() => buildSeriesOptions(programs), [programs])
  const filteredPrograms = useMemo(() => programs.filter(row => cleanText(row.serie_bac) === cleanText(selectedSerie)), [programs, selectedSerie])

  function feeLine(label, value) {
    if (!value) return null
    return <div className="filiere-meta-item"><strong>{label} :</strong> {formatFcfa(value)}</div>
  }

  return (
    <>
      <style>{`
        .ori-page { min-height: 80vh; display: flex; flex-direction: column; }
        .ori-hero { background: var(--green-800); color: white; padding: 48px 24px 72px; text-align: center; position: relative; }
        .ori-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 30% 60%, rgba(46,154,92,0.15) 0%, transparent 55%); pointer-events: none; }
        .ori-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold-400); margin-bottom: 12px; }
        .ori-title { font-family: var(--font-display); font-size: clamp(28px, 4vw, 44px); font-weight: 400; line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 12px; }
        .ori-title em { font-style: italic; color: var(--gold-400); }
        .ori-sub { font-size: 15px; color: rgba(255,255,255,0.65); max-width: 540px; margin: 0 auto; }
        .ori-body { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 0 16px 56px; margin-top: -40px; }
        .steps-wrap { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; animation: fadeUp .4s ease both; }
        .step-dot { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; border: 2px solid var(--paper-2); color: var(--ink-3); background: var(--white); transition: all .2s; }
        .step-dot.done { background: var(--green-700); border-color: var(--green-700); color: white; }
        .step-dot.active { border-color: var(--green-500); color: var(--green-700); }
        .step-line { width: 40px; height: 2px; background: var(--paper-2); }
        .step-line.done { background: var(--green-500); }
        .card { background: var(--white); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); padding: 32px; width: 100%; max-width: 880px; animation: fadeUp .5s ease both; }
        .card-title { font-family: var(--font-display); font-size: 22px; font-weight: 500; color: var(--ink); margin-bottom: 6px; }
        .card-desc { font-size: 14px; color: var(--ink-3); margin-bottom: 24px; line-height: 1.6; }
        .serie-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
        .serie-btn { padding: 18px 16px; border-radius: var(--radius-lg); border: 2px solid var(--paper-2); background: var(--paper); cursor: pointer; text-align: left; transition: all .15s; font-family: var(--font-body); }
        .serie-btn:hover { border-color: var(--green-300); background: var(--green-50); }
        .serie-btn.selected { border-color: var(--green-500); background: var(--green-50); }
        .serie-label { font-size: 16px; font-weight: 700; color: var(--green-700); }
        .serie-desc { font-size: 12px; color: var(--ink-3); margin-top: 4px; line-height: 1.4; }
        .btn-next, .btn-reset { width: 100%; margin-top: 24px; padding: 15px; border-radius: var(--radius-md); font-family: var(--font-body); font-size: 15px; font-weight: 600; cursor: pointer; transition: background .15s, border-color .15s; }
        .btn-next { background: var(--green-700); color: white; border: none; }
        .btn-next:hover:not(:disabled) { background: var(--green-800); }
        .btn-next:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-reset { background: var(--paper); color: var(--ink-2); border: 1.5px solid var(--paper-2); }
        .btn-reset:hover { background: var(--paper-2); }
        .results-header { margin-bottom: 16px; }
        .results-serie-tag { display: inline-block; padding: 4px 12px; border-radius: 100px; background: var(--green-50); border: 1px solid var(--green-200); font-size: 12px; font-weight: 600; color: var(--green-700); letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 8px; }
        .filiere-list { display: flex; flex-direction: column; gap: 14px; }
        .filiere-card { padding: 18px 20px; border-radius: var(--radius-lg); border: 1.5px solid var(--paper-2); background: var(--white); transition: border-color .15s, box-shadow .15s; }
        .filiere-card:hover { border-color: var(--green-300); box-shadow: var(--shadow-sm); }
        .filiere-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
        .filiere-nom { font-size: 16px; font-weight: 700; color: var(--ink); }
        .filiere-ecole { font-size: 12px; color: var(--ink-3); margin-top: 3px; line-height: 1.5; }
        .badge { padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; white-space: nowrap; flex-shrink: 0; border: 1.5px solid var(--green-200); background: var(--green-50); color: var(--green-700); }
        .filiere-desc { font-size: 14px; color: var(--ink-2); line-height: 1.7; margin-bottom: 12px; }
        .filiere-meta { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
        .filiere-meta-item { font-size: 12px; color: var(--ink-3); background: var(--paper); padding: 8px 10px; border-radius: 10px; }
        .filiere-meta-item strong { color: var(--ink-2); font-weight: 600; }
        .debouches-wrap { margin-top: 8px; }
        .debouches-title { font-size: 12px; font-weight: 700; color: var(--ink-3); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 8px; }
        .debouches-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .debouche-pill { background: var(--gold-50); border: 1px solid var(--gold-100); color: var(--gold-700); padding: 6px 10px; border-radius: 999px; font-size: 12px; }
        .state-box { background: var(--white); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); padding: 28px; width: 100%; max-width: 760px; text-align: center; }
        .info-box { margin-top: 16px; padding: 14px 18px; background: var(--gold-50); border: 1px solid var(--gold-100); border-radius: var(--radius-md); font-size: 13px; color: var(--gold-700); line-height: 1.6; }
        @media (max-width: 480px) { .card { padding: 24px 18px; } .ori-hero { padding: 36px 20px 64px; } .filiere-top { flex-direction: column; } }
      `}</style>
      <div className="ori-page">
        <section className="ori-hero">
          <p className="ori-eyebrow">🧭 Module d'orientation</p>
          <h1 className="ori-title">Filières selon les <em>données officielles</em></h1>
          <p className="ori-sub">Cette page lit directement les données importées dans Supabase. Aucune filière n'est inventée en dehors de la base fournie.</p>
        </section>
        <div className="ori-body">
          <div className="steps-wrap">
            <div className={`step-dot ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}>1</div>
            <div className={`step-line ${step > 1 ? 'done' : ''}`} />
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
          </div>
          {loading && <div className="state-box"><h2 className="card-title">Chargement…</h2><p className="card-desc">Récupération des données d'orientation depuis Supabase.</p></div>}
          {!loading && error && <div className="state-box"><h2 className="card-title">Impossible de charger l'orientation</h2><p className="card-desc">{error}</p></div>}
          {!loading && !error && step === 1 && (
            <div className="card">
              <h2 className="card-title">Votre série du BAC</h2>
              <p className="card-desc">Les choix proposés ci-dessous sont générés depuis les valeurs réellement présentes dans la table <strong>orientation</strong>.</p>
              <div className="serie-grid">
                {series.map(serie => (
                  <button key={serie.id} className={`serie-btn${selectedSerie === serie.id ? ' selected' : ''}`} onClick={() => setSelectedSerie(serie.id)}>
                    <div className="serie-label">{serie.label}</div>
                    <div className="serie-desc">{serie.desc}</div>
                  </button>
                ))}
              </div>
              {!series.length && <div className="info-box">Aucune donnée n'a encore été importée dans la table orientation.</div>}
              <button className="btn-next" disabled={!selectedSerie} onClick={() => setStep(2)}>Voir les filières →</button>
            </div>
          )}
          {!loading && !error && step === 2 && (
            <div className="card">
              <div className="results-header">
                <span className="results-serie-tag">Série {selectedSerie}</span>
                <h2 className="card-title">Filières disponibles</h2>
                <p className="card-desc">{filteredPrograms.length} résultat(s) trouvé(s) dans la base pour cette série.</p>
              </div>
              <div className="filiere-list">
                {filteredPrograms.map(program => {
                  const debouches = parseListString(program.debouches)
                  return (
                    <div key={program.id} className="filiere-card">
                      <div className="filiere-top">
                        <div>
                          <div className="filiere-nom">{cleanText(program.filiere)}</div>
                          <div className="filiere-ecole">📍 {cleanText(program.etablissement)}{program.structure ? ` — ${cleanText(program.structure)}` : ''}</div>
                        </div>
                        <span className="badge">{cleanText(program.type_diplome) || 'Formation'}</span>
                      </div>
                      {program.description && <p className="filiere-desc">{cleanText(program.description)}</p>}
                      <div className="filiere-meta">
                        {program.conditions && <div className="filiere-meta-item"><strong>Conditions :</strong> {cleanText(program.conditions)}</div>}
                        {program.mode_acces && <div className="filiere-meta-item"><strong>Accès :</strong> {humanizeModeAcces(program.mode_acces)}</div>}
                        {program.age_max && <div className="filiere-meta-item"><strong>Âge max :</strong> {program.age_max} ans</div>}
                        {program.duree && <div className="filiere-meta-item"><strong>Durée :</strong> {cleanText(program.duree)}</div>}
                        {program.prerequis && <div className="filiere-meta-item"><strong>Prérequis :</strong> {cleanText(program.prerequis)}</div>}
                        {feeLine('Inscription', program.frais_inscription)}
                        {feeLine('Candidature', program.frais_candidature)}
                        {feeLine('Carte étudiant', program.frais_carte_etudiant)}
                        {feeLine('Frais pédagogiques', program.frais_pedagogiques)}
                      </div>
                      {!!debouches.length && (
                        <div className="debouches-wrap">
                          <div className="debouches-title">Débouchés</div>
                          <div className="debouches-list">{debouches.map((item, index) => <span key={`${program.id}-${index}`} className="debouche-pill">{item}</span>)}</div>
                        </div>
                      )}
                      {(program.autres_frais || program.source_note) && (
                        <div className="info-box">
                          {program.autres_frais && <div><strong>Autres frais :</strong> {cleanText(program.autres_frais)}</div>}
                          {program.source_note && <div style={{ marginTop: program.autres_frais ? 8 : 0 }}><strong>Note source :</strong> {cleanText(program.source_note)}</div>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {!filteredPrograms.length && <div className="info-box">Aucune filière n'a été trouvée pour cette série dans la base importée.</div>}
              <button className="btn-reset" onClick={() => setStep(1)}>← Changer de série</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
