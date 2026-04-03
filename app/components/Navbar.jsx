'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { buildDisplayName } from '../../lib/profile-utils'

const LINKS = [
  { href: '/',            label: 'Résultats BAC',  icon: '🎓' },
  { href: '/orientation', label: 'Orientation',    icon: '🧭' },
  { href: '/cenou',       label: 'CENOU / Bourse', icon: '🏛️' },
  { href: '/guide',       label: 'Guide',          icon: '📋' },
  { href: '/forum',       label: 'Forum',          icon: '💬' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user, profile, loading } = useAuth()

  async function signOut() {
    await getSupabaseClient().auth.signOut()
    setOpen(false)
  }

  const displayName = buildDisplayName(profile, user)

  return (
    <>
      <style>{`
        .nav {
          position: sticky; top: 0; z-index: 100;
          background: var(--green-900);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 0 20px; height: 56px;
        }
        .nav-brand {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
        }
        .nav-flag {
          display: flex; border-radius: 3px; overflow: hidden;
          width: 22px; height: 15px; flex-shrink: 0;
        }
        .nav-flag span { flex: 1; display: block; }
        .nav-brand-text {
          font-family: var(--font-display); font-size: 15px;
          font-weight: 500; color: var(--white); letter-spacing: -0.01em;
        }
        .nav-links { display: flex; align-items: center; gap: 2px; list-style: none; }
        .nav-link {
          padding: 6px 11px; border-radius: 8px; font-size: 13px;
          font-weight: 500; color: rgba(255,255,255,0.68);
          text-decoration: none; transition: background .15s, color .15s;
          white-space: nowrap;
        }
        .nav-link:hover  { color: white; background: rgba(255,255,255,0.08); }
        .nav-link.active { color: white; background: rgba(255,255,255,0.13); }
        .nav-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .btn-login {
          padding: 7px 16px; border-radius: 8px;
          font-family: var(--font-body); font-size: 13px; font-weight: 600;
          background: rgba(255,255,255,0.12); color: white;
          border: 1px solid rgba(255,255,255,0.2);
          cursor: pointer; text-decoration: none; transition: background .15s;
        }
        .btn-login:hover { background: rgba(255,255,255,0.2); }
        .nav-user { display: flex; align-items: center; gap: 8px; }
        .nav-user-link {
          display: inline-flex; align-items: center; gap: 8px; text-decoration: none;
          color: rgba(255,255,255,0.88);
        }
        .premium-pill {
          padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700;
          background: rgba(255,255,255,0.14); color: #FDE68A; border: 1px solid rgba(253,230,138,0.32);
        }
        .nav-username { font-size: 13px; color: rgba(255,255,255,0.8); }
        .btn-logout {
          padding: 5px 11px; border-radius: 7px; font-size: 12px;
          font-weight: 500; background: transparent;
          color: rgba(255,255,255,0.45); font-family: var(--font-body);
          border: 1px solid rgba(255,255,255,0.15); cursor: pointer;
          transition: all .15s;
        }
        .btn-logout:hover { color: white; border-color: rgba(255,255,255,0.4); }
        .hamburger {
          display: none; flex-direction: column; gap: 5px;
          background: none; border: none; cursor: pointer; padding: 8px;
        }
        .hamburger span {
          display: block; width: 20px; height: 2px;
          background: rgba(255,255,255,0.85); border-radius: 1px;
        }
        .mobile-menu {
          display: none; position: fixed; top: 56px; left: 0; right: 0;
          background: var(--green-900); border-bottom: 1px solid rgba(255,255,255,0.1);
          padding: 10px 12px 18px; z-index: 99;
          flex-direction: column; gap: 2px;
        }
        .mobile-menu.open { display: flex; }
        .mobile-link {
          padding: 11px 14px; border-radius: 10px; font-size: 14px;
          font-weight: 500; color: rgba(255,255,255,0.78); text-decoration: none;
          display: flex; align-items: center; gap: 10px; transition: background .15s;
        }
        .mobile-link:hover, .mobile-link.active { background: rgba(255,255,255,0.1); color: white; }
        .mobile-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 8px 0; }
        .mobile-auth-btn {
          margin: 4px 0; padding: 11px 14px; border-radius: 10px;
          background: rgba(255,255,255,0.08); color: white; border: none;
          font-family: var(--font-body); font-size: 14px; cursor: pointer;
          text-align: left; width: 100%;
        }
        @media (max-width: 820px) {
          .nav-links, .nav-right { display: none; }
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
          {LINKS.map(l => (
            <li key={l.href}>
              <Link href={l.href} className={`nav-link${pathname === l.href ? ' active' : ''}`}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-right">
          {!loading && (
            user ? (
              <div className="nav-user">
                <Link href="/profil" className="nav-user-link">
                  <span className="nav-username">👤 {displayName}</span>
                  {profile?.is_premium && <span className="premium-pill">Premium</span>}
                </Link>
                <button className="btn-logout" onClick={signOut}>Déco.</button>
              </div>
            ) : (
              <Link href="/compte" className="btn-login">Connexion</Link>
            )
          )}
        </div>

        <button className="hamburger" onClick={() => setOpen(!open)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>

      <div className={`mobile-menu${open ? ' open' : ''}`}>
        {LINKS.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`mobile-link${pathname === l.href ? ' active' : ''}`}
            onClick={() => setOpen(false)}
          >
            <span>{l.icon}</span>{l.label}
          </Link>
        ))}
        <div className="mobile-divider" />
        {!loading && (
          user ? (
            <>
              <Link href="/profil" className="mobile-link" onClick={() => setOpen(false)}>
                <span>👤</span>{displayName}
                {profile?.is_premium && <span className="premium-pill">Premium</span>}
              </Link>
              <span style={{ padding: '6px 14px', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                {user.email}
              </span>
              <button className="mobile-auth-btn" onClick={signOut}>🚪 Se déconnecter</button>
            </>
          ) : (
            <Link href="/compte" className="mobile-link" onClick={() => setOpen(false)}>
              <span>🔑</span>Connexion / Inscription
            </Link>
          )
        )}
      </div>
    </>
  )
}
