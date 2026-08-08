import { useState } from 'react'
import { Menu, X, LogIn, ChevronDown } from 'lucide-react'
import Supportable from './apps/Supportable'

type ThemeName = 'default' | 'light' | 'midnight'

const themes: Record<ThemeName, string> = {
  default: 'Default',
  light: 'Light',
  midnight: 'Midnight',
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [theme, setTheme] = useState<ThemeName>('default')
  const [activeApp, setActiveApp] = useState('Supportable')

  return (
    <div className={`console theme-${theme}`}>
      <header className="console-header">
        <button className="icon-button" aria-label="Open app menu" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="brand">eBliss</div>

        <div className="header-actions">
          <label className="theme-picker">
            <span className="sr-only">Theme</span>
            <select value={theme} onChange={(event) => setTheme(event.target.value as ThemeName)}>
              {Object.entries(themes).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDown size={15} />
          </label>
          <button className="login-button" onClick={() => setLoginOpen(true)}>
            <LogIn size={17} />
            <span>Login</span>
          </button>
        </div>
      </header>

      {menuOpen && (
        <aside className="app-menu">
          <div className="menu-title">Apps</div>
          <button
            className={`app-link ${activeApp === 'Supportable' ? 'active' : ''}`}
            onClick={() => { setActiveApp('Supportable'); setMenuOpen(false) }}
          >
            Supportable
          </button>
          <div className="menu-note">More eBliss apps can live in src/apps.</div>
        </aside>
      )}

      <main className="app-container">
        {activeApp === 'Supportable' && <Supportable />}
      </main>

      {loginOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setLoginOpen(false)}>
          <section className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close login" onClick={() => setLoginOpen(false)}><X size={20} /></button>
            <h2 id="login-title">eBliss Login</h2>
            <p className="modal-description">Development login for the console.</p>
            <form onSubmit={(event) => { event.preventDefault(); setLoginOpen(false) }}>
              <label>
                Password
                <input name="password" type="password" autoFocus placeholder="Environment password" />
              </label>
              <button className="primary-button" type="submit">Continue</button>
            </form>
            <p className="modal-note">Authentication will move to the configured environment/identity service as the console evolves.</p>
          </section>
        </div>
      )}
    </div>
  )
}
