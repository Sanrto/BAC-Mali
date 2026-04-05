'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { getSupabaseClient } from '../../../lib/supabaseClient'

export default function PremiumSuccessPage() {
  const { user, profile } = useAuth()
  const supabase = getSupabaseClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [canceled, setCanceled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setCanceled(params.get('canceled') === '1')
  }, [])

  async function startCheckout() {
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
    })
    const payload = await response.json()
    if (payload?.url) {
      window.location.href = payload.url
      return
    }
    alert(payload?.error || 'Impossible de démarrer le paiement.')
    setLoading(false)
  }

  return (
    <>
      <style>{`
        .premium-page { min-height: 80vh; background: linear-gradient(180deg, #0F2F1B 0%, #F7F8F5 45%); padding: 40px 16px 72px; }
        .premium-card { max-width: 860px; margin: 0 auto; background:white; border-radius: 28px; box-shadow: var(--shadow-lg); padding: 32px; }
        .premium-title { font-family: var(--font-display); font-size: clamp(30px, 5vw, 48px); color: var(--ink); margin-bottom: 8px; }
        .premium-title em { color: #7C3AED; font-style: italic; }
        .premium-sub { color: var(--ink-3); line-height: 1.7; margin-bottom: 22px; }
        .grid { display:grid; grid-template-columns: 1fr 320px; gap:18px; }
        .perk { background: var(--paper); border:1px solid var(--paper-2); border-radius:18px; padding:16px; margin-bottom:12px; }
        .cta { background: linear-gradient(135deg, #1E8A4A, #7C3AED); color:white; border-radius:24px; padding:24px; }
        .price { font-family: var(--font-display); font-size: 40px; margin-bottom: 6px; }
        .btn { width:100%; padding:14px; border:none; border-radius:14px; background:white; color:#1E8A4A; font-weight:800; cursor:pointer; }
        .status { display:inline-flex; padding:6px 12px; border-radius:999px; font-size:12px; font-weight:700; margin-bottom:14px; }
        .status.active { background:#DCFCE7; color:#166534; }
        .status.idle { background:#F3E8FF; color:#7C3AED; }
        @media (max-width: 820px) { .grid { grid-template-columns: 1fr; } }
      `}</style>
      <div className="premium-page">
        <div className="premium-card">
          <div className={`status ${profile?.is_premium ? 'active' : 'idle'}`}>
            {profile?.is_premium ? 'Premium actif' : 'Compte standard'}
          </div>
          <h1 className="premium-title">Passe en <em>Premium</em></h1>
          <p className="premium-sub">Débloque les messages vocaux jusqu’à 30 secondes, un badge Premium visible dans la communauté, et un socle prêt pour tes futures fonctions payantes.</p>
          {canceled && <div style={{ marginBottom: 16, color: '#B45309', background: '#FEF3C7', border: '1px solid #FCD34D', padding: 12, borderRadius: 12 }}>Paiement annulé. Tu peux réessayer quand tu veux.</div>}
          <div className="grid">
            <div>
              <div className="perk"><strong>🎙️ Messages vocaux</strong><div style={{ marginTop: 6, color: 'var(--ink-3)' }}>Publie des réponses audio dans le forum/commentaires.</div></div>
              <div className="perk"><strong>⭐ Badge Premium</strong><div style={{ marginTop: 6, color: 'var(--ink-3)' }}>Le badge apparaît dans le profil, la navbar et la communauté.</div></div>
              <div className="perk"><strong>🚀 Prêt pour la suite</strong><div style={{ marginTop: 6, color: 'var(--ink-3)' }}>Tu pourras ajouter plus tard pièces jointes, salons privés ou coaching.</div></div>
            </div>
            <aside className="cta">
              <div style={{ fontSize: 13, opacity: .8 }}>Abonnement mensuel • Stripe Checkout</div>
              <div className="price">Premium</div>
              <div style={{ fontSize: 14, opacity: .88, lineHeight: 1.6, marginBottom: 16 }}>Prix piloté depuis Stripe avec ton `STRIPE_PRICE_ID` de test.</div>
              <button className="btn" onClick={startCheckout} disabled={loading || profile?.is_premium}>{profile?.is_premium ? 'Déjà Premium' : loading ? 'Redirection…' : 'Devenir Premium'}</button>
              <div style={{ marginTop: 12, fontSize: 12, opacity: .8 }}>Connexion requise. Le paiement se fait sur Stripe en mode test.</div>
            </aside>
          </div>
          <div style={{ marginTop: 18 }}>
            <Link href="/profile" style={{ color: 'var(--green-700)', textDecoration: 'none' }}>← Retour au profil</Link>
          </div>
        </div>
      </div>
    </>
  )
}
