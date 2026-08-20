import { FormEvent, useEffect, useState } from 'react'
import { Menu, X, LogIn, LogOut, ChevronDown } from 'lucide-react'
import { PasswordField } from './components/PasswordField'
import Supportable from './apps/SupportableView'
import { supabase } from './lib/supabase'

type ThemeName = 'default' | 'light' | 'midnight'
const themes: Record<ThemeName, string> = { default: 'Default', light: 'Light', midnight: 'Midnight' }

const buildVersion = import.meta.env.VITE_BUILD_VERSION || 'dev'

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [loginError, setLoginError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [theme, setTheme] = useState<ThemeName>('default')
  const [activeApp, setActiveApp] = useState('Supportable')

  const authenticated = !!userEmail

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUserEmail(data.session?.user.email ?? '')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUserEmail(session?.user.email ?? '')
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setLoginError(error.message); return }
    setPassword('')
    setLoginOpen(false)
    setMenuOpen(false)
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) setLoginError(error.message)
    setMenuOpen(false)
  }

  return <div className={`console theme-${theme}`}>
    <header className="console-header">
      <div className="build-watch" title={`Cloudflare dev build · ${buildVersion}`}><span className="build-dot">●</span><span>CF · dev</span><span className="build-version">{buildVersion}</span></div>
      <button className="icon-button" aria-label="Open app menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      <div className="brand">eBliss Console</div>
      <div className="header-actions">
        {authenticated ? <><span className="user-email">{userEmail}</span><label className="theme-picker"><span className="sr-only">Theme</span><select value={theme} onChange={(event) => setTheme(event.target.value as ThemeName)}>{Object.entries(themes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={15} /></label><button className="header-account-button" onClick={handleLogout} title="Log out"><LogOut size={16} /><span>Logout</span></button></> : <button className="header-account-button" onClick={() => { setLoginError(''); setLoginOpen(true) }} title="Log in"><LogIn size={16} /><span>Login</span></button>}
      </div>
    </header>
    {menuOpen && <aside className="app-menu">
      <div className="menu-title">Apps</div>
      {authenticated && <button className={`app-link ${activeApp === 'Supportable' ? 'active' : ''}`} onClick={() => { setActiveApp('Supportable'); setMenuOpen(false) }}>Supportable</button>}
      <div className="menu-divider" />
      <div className="menu-note">More eBliss apps can live in src/apps.</div>
    </aside>}
    <main className="app-container">{!authenticated ? <section className="welcome-view"><div className="app-kicker">eBliss Console</div><h1>Welcome.</h1><p className="app-lead">Use Login in the upper-right.</p></section> : activeApp === 'Supportable' && <Supportable />}</main>
    {loginOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setLoginOpen(false)}><section className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close login" onClick={() => setLoginOpen(false)}><X size={20} /></button><h2 id="login-title">eBliss Login</h2><p className="modal-description">Sign in with your eBliss account.</p><form onSubmit={handleLogin}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label><PasswordField label="Password" value={password} onChange={setPassword} placeholder="Password" autoComplete="current-password" required />{loginError && <div className="login-error" role="alert">{loginError}</div>}<button className="primary-button" type="submit">Sign in</button></form></section></div>}
  </div>
}
