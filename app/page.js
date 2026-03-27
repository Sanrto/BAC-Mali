'use client'

import { useState } from 'react'

const CENTRES = [
  'BAMAKO RIVE DROITE',
  'BAMAKO RIVE GAUCHE',
  'BAMAKO NORD',
  'KAYES',
  'KOULIKORO',
  'SIKASSO',
  'SEGOU',
  'MOPTI',
  'TOMBOUCTOU',
  'GAO',
  'KIDAL',
]

const ANNEES = Array.from(
  { length: new Date().getFullYear() - 2015 + 1 },
  (_, i) => new Date().getFullYear() - i
)

const MENTION_COLOR = {
  'EXCELLENT':  { bg: '#0D3D22', text: '#A8DDB8', label: 'Excellent' },
  'TRES-BIEN':  { bg: '#145A30', text: '#A8DDB8', label: 'Très bien' },
  'BIEN':       { bg: '#1B6B3A', text: '#D4EFDb', label: 'Bien' },
  'ASSEZ-BIEN': { bg: '#8B6914', text: '#F5E6C0', label: 'Assez bien' },
  'PASSABLE':   { bg: '#3A3D36', text: '#D4D6CF', label: 'Passable' },
}

export default function Home() {
  const [numero, setNumero]   = useState('')
  const [annee, setAnnee]     = useState(String(new Date().getFullYear()))
  const [centre, setCentre]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)   // null | { found: false } | { found: true, candidat: {} }
  const [error, setError]     = useState('')

  async function handleSearch(e) {
    e.preventDefault()
    if (!numero.trim() || !centre) return

    setLoading(true)
    setResult(null)
    setError('')

    try {
      const params = new URLSearchParams({ numero: numero.trim(), annee, centre })
      const res    = await fetch(`/api/recherche?${params}`)
      const data   = await res.json()

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue.')
      } else {
        setResult(data)
      }
    } catch {
      setError('Impossible de contacter le serveur. Vérifie ta connexion.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setError('')
    setNumero('')
  }

  const mention = result?.candidat?.mention
  const mentionStyle = MENTION_COLOR[mention] || MENTION_COLOR['PASSABLE']

  return (
    <>
      <style>{`
        /* ─── Page shell ─── */
        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* ─── Header ─── */
        .header {
          background: var(--green-800);
          color: var(--white);
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .header-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .flag {
          display: flex;
          border-radius: 4px;
          overflow: hidden;
          width: 30px;
          height: 20px;
          flex-shrink: 0;
        }
        .flag span {
          flex: 1;
          display: block;
        }
        .header-title {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 500;
          letter-spacing: -0.01em;
        }
        .header-badge {
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 500;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 20px;
          padding: 4px 12px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.85);
        }

        /* ─── Hero ─── */
        .hero {
          background: var(--green-800);
          color: var(--white);
          padding: 56px 24px 80px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 20% 50%, rgba(46,154,92,0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(201,151,43,0.10) 0%, transparent 40%);
          pointer-events: none;
        }
        .hero-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--gold-400);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .hero-eyebrow::before,
        .hero-eyebrow::after {
          content: '';
          width: 24px;
          height: 1px;
          background: var(--gold-400);
          opacity: 0.6;
        }
        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 400;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
        }
        .hero-title em {
          font-style: italic;
          color: var(--gold-400);
        }
        .hero-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.65);
          max-width: 420px;
          margin: 0 auto;
          font-weight: 300;
          line-height: 1.6;
        }

        /* ─── Card container ─── */
        .card-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 16px 48px;
          margin-top: -40px;
        }

        /* ─── Search card ─── */
        .search-card {
          background: var(--white);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          padding: 36px 32px 32px;
          width: 100%;
          max-width: 520px;
          animation: fadeUp 0.5s ease both;
        }
        .card-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-3);
          margin-bottom: 6px;
        }
        .card-field {
          margin-bottom: 18px;
        }
        .card-input {
          width: 100%;
          padding: 13px 16px;
          font-family: var(--font-body);
          font-size: 15px;
          color: var(--ink);
          background: var(--paper);
          border: 1.5px solid var(--paper-2);
          border-radius: var(--radius-md);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
        }
        .card-input:focus {
          border-color: var(--green-500);
          box-shadow: 0 0 0 3px rgba(46, 154, 92, 0.12);
          background: var(--white);
        }
        .card-input::placeholder {
          color: var(--ink-4);
        }
        .row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .btn-search {
          width: 100%;
          padding: 15px;
          font-family: var(--font-body);
          font-size: 15px;
          font-weight: 600;
          color: var(--white);
          background: var(--green-700);
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 6px;
          letter-spacing: 0.01em;
        }
        .btn-search:hover:not(:disabled) {
          background: var(--green-800);
        }
        .btn-search:active:not(:disabled) {
          transform: scale(0.99);
        }
        .btn-search:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        /* ─── Error ─── */
        .error-box {
          margin-top: 20px;
          padding: 14px 18px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: var(--radius-md);
          color: #991B1B;
          font-size: 14px;
          animation: fadeUp 0.3s ease both;
        }

        /* ─── Not found ─── */
        .not-found {
          margin-top: 20px;
          padding: 28px;
          background: var(--gold-50);
          border: 1px solid var(--gold-100);
          border-radius: var(--radius-lg);
          text-align: center;
          animation: fadeUp 0.4s ease both;
        }
        .not-found-icon {
          width: 48px;
          height: 48px;
          background: var(--gold-100);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          font-size: 22px;
        }
        .not-found h3 {
          font-family: var(--font-display);
          font-size: 19px;
          font-weight: 500;
          color: var(--gold-700);
          margin-bottom: 8px;
        }
        .not-found p {
          font-size: 13px;
          color: var(--gold-700);
          line-height: 1.6;
          opacity: 0.8;
        }

        /* ─── Result card ─── */
        .result-card {
          margin-top: 20px;
          background: var(--white);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          width: 100%;
          max-width: 520px;
          animation: fadeUp 0.5s ease both;
        }
        .result-header {
          padding: 28px 32px 24px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px solid var(--paper-2);
        }
        .result-name {
          font-family: var(--font-display);
          font-size: clamp(20px, 4vw, 26px);
          font-weight: 500;
          color: var(--ink);
          line-height: 1.2;
          letter-spacing: -0.01em;
        }
        .result-numero {
          font-size: 12px;
          color: var(--ink-3);
          margin-top: 5px;
          font-weight: 300;
        }
        .admis-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 100px;
          background: var(--green-50);
          border: 1.5px solid var(--green-200);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .admis-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--green-500);
          animation: pulse-ring 2s infinite;
          flex-shrink: 0;
        }
        .admis-text {
          font-size: 13px;
          font-weight: 600;
          color: var(--green-700);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .result-body {
          padding: 24px 32px;
        }
        .result-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 0;
          border-bottom: 1px solid var(--paper-2);
          gap: 16px;
        }
        .result-row:last-child {
          border-bottom: none;
        }
        .result-key {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink-3);
          flex-shrink: 0;
        }
        .result-val {
          font-size: 15px;
          font-weight: 500;
          color: var(--ink);
          text-align: right;
        }
        .mention-badge {
          display: inline-block;
          padding: 5px 14px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .result-footer {
          padding: 20px 32px;
          background: var(--paper);
          border-top: 1px solid var(--paper-2);
          display: flex;
          gap: 10px;
        }
        .btn-share {
          flex: 1;
          padding: 11px;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          background: var(--white);
          color: var(--ink-2);
          border: 1.5px solid var(--paper-2);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .btn-share:hover {
          background: var(--paper-2);
          border-color: var(--ink-4);
        }
        .btn-new {
          flex: 1;
          padding: 11px;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          background: var(--green-700);
          color: var(--white);
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-new:hover {
          background: var(--green-800);
        }

        /* ─── Stats strip ─── */
        .stats-strip {
          width: 100%;
          max-width: 520px;
          margin-top: 32px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          animation: fadeUp 0.6s 0.1s ease both;
        }
        .stat-box {
          background: var(--white);
          border-radius: var(--radius-lg);
          padding: 18px 14px;
          text-align: center;
          box-shadow: var(--shadow-sm);
        }
        .stat-num {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 400;
          color: var(--green-700);
          line-height: 1;
          margin-bottom: 5px;
        }
        .stat-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--ink-3);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* ─── Footer ─── */
        .footer {
          padding: 28px 24px;
          text-align: center;
          font-size: 12px;
          color: var(--ink-4);
          border-top: 1px solid var(--paper-2);
          background: var(--white);
          margin-top: auto;
        }
        .footer a {
          color: var(--green-600);
          text-decoration: none;
        }

        @media (max-width: 480px) {
          .hero { padding: 44px 20px 70px; }
          .search-card { padding: 28px 20px 24px; border-radius: var(--radius-lg); }
          .result-card { border-radius: var(--radius-lg); }
          .result-header, .result-body, .result-footer { padding-left: 20px; padding-right: 20px; }
          .row-2 { grid-template-columns: 1fr; }
          .header-badge { display: none; }
        }
      `}</style>

      <div className="page">

        {/* ─── Header ─── */}
        <header className="header">
          <div className="header-logo">
            <div className="flag">
              <span style={{ background: '#14A044' }} />
              <span style={{ background: '#FEDD00' }} />
              <span style={{ background: '#CE1126' }} />
            </div>
            <span className="header-title">BAC Mali</span>
          </div>
          <span className="header-badge">Session 2025</span>
        </header>

        {/* ─── Hero ─── */}
        <section className="hero">
          <p className="hero-eyebrow">Vérification officielle</p>
          <h1 className="hero-title">
            Consultez vos<br />
            résultats du <em>Baccalauréat</em>
          </h1>
          <p className="hero-sub">
            Entrez votre numéro de place pour accéder à vos résultats officiels de la session de juin.
          </p>
        </section>

        {/* ─── Card zone ─── */}
        <main className="card-wrap">

          {/* Search form */}
          {!result && (
            <div className="search-card">
              <form onSubmit={handleSearch}>
                <div className="card-field">
                  <div className="card-label">Numéro de place</div>
                  <input
                    className="card-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex : 2415"
                    value={numero}
                    onChange={e => setNumero(e.target.value.replace(/\D/g, ''))}
                    maxLength={8}
                    required
                    autoFocus
                  />
                </div>

                <div className="row-2">
                  <div className="card-field">
                    <div className="card-label">Année</div>
                    <select
                      className="card-input"
                      value={annee}
                      onChange={e => setAnnee(e.target.value)}
                      required
                    >
                      {ANNEES.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                  <div className="card-field">
                    <div className="card-label">Centre</div>
                    <select
                      className="card-input"
                      value={centre}
                      onChange={e => setCentre(e.target.value)}
                      required
                    >
                      <option value="">Choisir…</option>
                      {CENTRES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button className="btn-search" type="submit" disabled={loading}>
                  {loading ? (
                    <><div className="spinner" /> Recherche en cours…</>
                  ) : (
                    'Vérifier mes résultats'
                  )}
                </button>
              </form>

              {error && <div className="error-box">{error}</div>}
            </div>
          )}

          {/* Not found */}
          {result && !result.found && (
            <>
              <div className="search-card">
                <div className="not-found">
                  <div className="not-found-icon">?</div>
                  <h3>Candidat introuvable</h3>
                  <p>
                    Aucun résultat ne correspond au numéro <strong>{numero}</strong> pour le centre
                    de <strong>{centre}</strong> en <strong>{annee}</strong>.
                  </p>
                  <p style={{ marginTop: 10 }}>
                    Vérifie ton numéro de place sur ta convocation, et assure-toi d'avoir
                    sélectionné le bon centre et la bonne année.
                  </p>
                </div>
                <button
                  className="btn-search"
                  onClick={handleReset}
                  style={{ marginTop: 20 }}
                >
                  Faire une nouvelle recherche
                </button>
              </div>
            </>
          )}

          {/* Found */}
          {result && result.found && (
            <>
              <div className="result-card">
                <div className="result-header">
                  <div>
                    <div className="result-name">
                      {result.candidat.prenoms} {result.candidat.nom}
                    </div>
                    <div className="result-numero">
                      N° de place : {numero} &bull; {result.candidat.centre}
                    </div>
                  </div>
                  <div className="admis-pill">
                    <div className="admis-dot" />
                    <span className="admis-text">Admis</span>
                  </div>
                </div>

                <div className="result-body">
                  <div className="result-row">
                    <span className="result-key">Série</span>
                    <span className="result-val">{result.candidat.serie}</span>
                  </div>
                  <div className="result-row">
                    <span className="result-key">Mention</span>
                    <span
                      className="mention-badge"
                      style={{
                        background: mentionStyle.bg,
                        color: mentionStyle.text,
                      }}
                    >
                      {mentionStyle.label}
                    </span>
                  </div>
                  <div className="result-row">
                    <span className="result-key">Session</span>
                    <span className="result-val">Juin {result.candidat.annee}</span>
                  </div>
                  <div className="result-row">
                    <span className="result-key">Centre</span>
                    <span className="result-val" style={{ fontSize: 13 }}>
                      {result.candidat.centre}
                    </span>
                  </div>
                </div>

                <div className="result-footer">
                  <button
                    className="btn-share"
                    onClick={() => {
                      const msg = `J'ai obtenu mon BAC ${result.candidat.annee} avec la mention "${mentionStyle.label}" ! 🎓 Mali`
                      navigator.share
                        ? navigator.share({ title: 'Résultat BAC', text: msg })
                        : navigator.clipboard.writeText(msg)
                    }}
                  >
                    Partager
                  </button>
                  <button className="btn-new" onClick={handleReset}>
                    Nouvelle recherche
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Stats */}
          {!result && (
            <div className="stats-strip">
              <div className="stat-box">
                <div className="stat-num">8 353</div>
                <div className="stat-label">Admis 2025</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">6</div>
                <div className="stat-label">Séries</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">2015</div>
                <div className="stat-label">Depuis</div>
              </div>
            </div>
          )}
        </main>

        {/* ─── Footer ─── */}
        <footer className="footer">
          <p>
            Données officielles — Ministère de l'Éducation Nationale du Mali &bull; Session de juin 2025
          </p>
          <p style={{ marginTop: 6 }}>
            Un problème ? <a href="mailto:contact@example.com">Contacte-nous</a>
          </p>
        </footer>

      </div>
    </>
  )
}
