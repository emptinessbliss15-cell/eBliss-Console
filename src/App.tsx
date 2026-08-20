import { FormEvent, useState } from 'react'
import { X, LogIn, LogOut, ChevronDown, LifeBuoy } from 'lucide-react'
import { PasswordField } from './components/PasswordField'
import Supportable from './apps/SupportableView'

type ThemeName = 'default' | 'light' | 'midnight'
const themes: Record<ThemeName, string> = { default: 'Default', light: 'Light', midnight: 'Midnight' }
const devPassword = import.meta.env.VITE_DEV_PASSWORD as string | undefined

export default function App() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [password, setPassword] = useState('')
  const [theme, setTheme] = useState<ThemeName>('default')
  const [activeApp, setActiveApp] = useState('Supportable')

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!devPassword) { setLoginError('Development password is not configured.'); return }
    if (password !== devPassword) { setLoginError('Incorrect password.'); return }
    setAuthenticated(true); setPassword(''); setLoginError(''); setLoginOpen(false)
  }

  function handleLogout() {
    setAuthenticated(false)
    setLoginOpen(false)
    setPassword('')
    setLoginError('')
  }

  return <div className={`console theme-${theme}`}>
    <header className="console-header">
      <img className="console-logo" src="/logoicon.png" alt="eBliss" />
      <div className="brand">eBliss</div>
      {authenticated && <div className="header-actions">
        <label className="theme-picker"><span className="sr-only">Theme</span><select value={theme} onChange={(event) => setTheme(event.target.value as ThemeName)}>{Object.entries(themes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={15} /></label>
      </div>}
    </header>
    <aside className="app-menu" aria-label="Apps">
      <div className="menu-title">Apps</div>
      {authenticated && <button className={`app-link ${activeApp === 'Supportable' ? 'active' : ''}`} title="Supportable" aria-label="Supportable" onClick={() => setActiveApp('Supportable')}><LifeBuoy size={24} /></button>}
      <div className="menu-divider" />
      {!authenticated ? <button className="app-link menu-action" title="Login" aria-label="Login" onClick={() => { setLoginError(''); setLoginOpen(true) }}><LogIn size={22} /></button> : <button className="app-link menu-action" title="Logout" aria-label="Logout" onClick={handleLogout}><LogOut size={22} /></button>}
      <div className="menu-note">Hover an icon for its name.</div>
    </aside>
    <main className="app-container">{!authenticated ? <section className="welcome-view"><div className="app-kicker">eBliss Console</div><h1>Welcome.</h1><p className="app-lead">Use the menu to log in.</p></section> : activeApp === 'Supportable' && <Supportable />}</main>
    {loginOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setLoginOpen(false)}><section className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close login" onClick={() => setLoginOpen(false)}><X size={20} /></button><h2 id="login-title">eBliss Login</h2><p className="modal-description">Development login for the console.</p><form onSubmit={handleLogin}><PasswordField label="Password" value={password} onChange={setPassword} placeholder="Environment password" autoComplete="current-password" required />{loginError && <div className="login-error" role="alert">{loginError}</div>}<button className="primary-button" type="submit">Continue</button></form><p className="modal-note">Uses the configured <code>VITE_DEV_PASSWORD</code> environment variable. No password is stored in the repository.</p></section></div>}
  </div>
}