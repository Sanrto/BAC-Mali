'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { buildDisplayName } from '../../lib/profile-utils'

const LINKS = [
  { href: '/', label: 'Résultats BAC', icon: '🎓' },
  { href: '/orientation', label: 'Orientation', icon: '🧭' },
  { href: '/cenou', label: 'CENOU / Bourse', icon: '🏛️' },
  { href: '/guide', label: 'Guide', icon: '📋' },
  { href: '/forum', label: 'Forum', icon: '💬' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user, profile, loading } = useAuth()
  const displayName = buildDisplayName(profile, user)

  const isPathActive = (href) => pathname === href || pathname?.startsWith(`${href}/`)

  async function signOut() {
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    setOpen(false)
  }

  return (
    <>
      <style>{`
        .nav {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 60px;
          padding: 0 18px;
          background: rgba(15,47,27,0.96);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(18px);
        }
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .nav-flag {
          display: flex;
          width: 22px;
          height: 15px;
          border-radius: 3px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .nav-flag span { flex: 1; display: block; }
        .nav-brand-text {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 500;
          color: var(--white);
          letter-spacing: -0.01em;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          list-style: none;
        }
        .nav-link {
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.68);
          text-decoration: none;
          transition: background .15s ease, color .15s ease;
          white-space: nowrap;
        }
        .nav-link:hover,
        .nav-link.active {
          color: white;
          background: rgba(255,255,255,0.11);
        }
        .nav-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .btn-login,
        .btn-logout {
          border-radius: 999px;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: background .15s ease, border-color .15s ease, color .15s ease;
        }
        .btn-login {
          padding: 8px 16px;
          background: rgba(255,255,255,0.12);
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .btn-login:hover { background: rgba(255,255,255,0.2); }
        .nav-user {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-user-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: rgba(255,255,255,0.9);
        }
        .nav-username {
          font-size: 13px;
          color: rgba(255,255,255,0.82);
        }
        .premium-pill {
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          background: rgba(255,255,255,0.14);
          color: #FDE68A;
          border: 1px solid rgba(253,230,138,0.32);
        }
        .btn-logout {
          padding: 7px 12px;
          background: transparent;
          color: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.14);
        }
        .btn-logout:hover {
          color: white;
          border-color: rgba(255,255,255,0.35);
        }
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
        }
        .hamburger span {
          display: block;
          width: 20px;
          height: 2px;
          background: rgba(255,255,255,0.85);
          border-radius: 1px;
        }
        .mobile-menu {
          display: none;
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          background: rgba(15,47,27,0.98);
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding: 10px 12px 18px;
          z-index: 99;
          flex-direction: column;
          gap: 2px;
          backdrop-filter: blur(18px);
        }
        .mobile-menu.open { display: flex; }
        .mobile-link {
          padding: 11px 14px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.78);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: background .15s ease;
        }
        .mobile-link:hover,
        .mobile-link.active {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        .mobile-divider {
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin: 8px 0;
        }
        .mobile-auth-btn {
          margin: 4px 0;
          padding: 11px 14px;
          border-radius: 12px;
          background: rgba(255,255,255,0.08);
          color: white;
          border: none;
          font-family: var(--font-body);
          font-size: 14px;
          cursor: pointer;
          text-align: left;
          width: 100%;
        }
        @media (max-width: 840px) {
          .nav-links,
          .nav-right { display: none; }
          .hamburger { display: flex; }
        }
      `}</style>

      <nav className="nav">
        <Link href="/" className="nav-brand">
          <div className="nav-flag">
            <span style={{ background: '#14A044' }} />
            <span style={{ background: '#FEDD00' }} />
            <span style={{ background: '#CE1126' }} />
          </div>
          <span className="nav-brand-text">BAC Mali</span>
        </Link>

        <ul className="nav-links">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={`nav-link${isPathActive(link.href) ? ' active' : ''}`}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-right">
          {!loading && (
            user ? (
              <div className="nav-user">
                <Link href="/profile" className="nav-user-link">
                  <span className="nav-username">👤 {displayName}</span>
                  {profile?.is_premium && <span className="premium-pill">Premium</span>}
                </Link>
                <button className="btn-logout" onClick={signOut} type="button">Déco.</button>
              </div>
            ) : (
              <Link href="/login" className="btn-login">Connexion</Link>
            )
          )}
        </div>

        <button className="hamburger" onClick={() => setOpen((value) => !value)} aria-label="Menu">
          <span />
          <span />
          <span />
        </button>
      </nav>

      <div className={`mobile-menu${open ? ' open' : ''}`}>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`mobile-link${isPathActive(link.href) ? ' active' : ''}`}
            onClick={() => setOpen(false)}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}

        <div className="mobile-divider" />

        {!loading && (
          user ? (
            <>
              <Link href="/profile" className="mobile-link" onClick={() => setOpen(false)}>
                <span>👤</span>
                {displayName}
                {profile?.is_premium && <span className="premium-pill">Premium</span>}
              </Link>
              <span style={{ padding: '6px 14px', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                {user.email}
              </span>
              <button className="mobile-auth-btn" onClick={signOut} type="button">🚪 Se déconnecter</button>
            </>
          ) : (
            <Link href="/login" className="mobile-link" onClick={() => setOpen(false)}>
              <span>🔑</span>
              Connexion / Inscription
            </Link>
          )
        )}
      </div>
    </>
  )
}
