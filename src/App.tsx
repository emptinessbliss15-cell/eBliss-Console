import { FormEvent, useEffect, useState } from 'react'
import { X, LogIn, LogOut, ChevronDown } from 'lucide-react'
import { PasswordField } from './components/PasswordField'
import AppTree, { TreeNode } from './components/AppTree'
import Supportable from './apps/SupportableView'
import { createSupportableTreeProvider, SupportableView } from './apps/SupportableTree'
import { createListsTreeProvider } from './apps/ListsTree'
import { supabase } from './lib/supabase'

type ThemeName = 'default' | 'light' | 'midnight'
const themes: Record<ThemeName, string> = { default: 'Default', light: 'Light', midnight: 'Midnight' }
const buildVersion = import.meta.env.VITE_BUILD_VERSION || 'dev'
type AppName = 'Supportable' | 'Lists'

export default function App() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [loginError, setLoginError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [theme, setTheme] = useState<ThemeName>('default')
  const [activeApp, setActiveApp] = useState<AppName | null>(null)
  const [supportableView, setSupportableView] = useState<SupportableView>('Work')
  const authenticated = !!userEmail

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => { if (mounted) setUserEmail(data.session?.user.email ?? '') })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { if (mounted) setUserEmail(session?.user.email ?? '') })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoginError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setLoginError(error.message); return }
    setPassword(''); setLoginOpen(false); setActiveApp(null); setSupportableView('Work')
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) setLoginError(error.message)
    setActiveApp(null); setSupportableView('Work')
  }

  function selectSupportable(view: SupportableView) {
    setActiveApp('Supportable')
    setSupportableView(view)
  }

  const treeProviders = [
    createSupportableTreeProvider(selectSupportable),
    createListsTreeProvider(() => setActiveApp('Lists')),
  ]
  const treeNodes: TreeNode[] = treeProviders.flatMap((provider) => provider.getTree())

  const activeTreeId = activeApp === 'Lists'
    ? 'lists'
    : activeApp === 'Supportable'
      ? `supportable-${supportableView.toLowerCase()}`
      : null

  return <div className={`console theme-${theme}`}>
    <header className="console-header">
      <div className="header-brand"><img className="header-logo" src="/logoicon.png" alt="eBliss" /><div className="brand">eBliss Console</div></div>
      <div className="header-actions">
        <div className="build-watch" title={`Cloudflare dev build · ${buildVersion}`}><span className="build-dot">●</span><span>CF · dev</span><span className="build-version">{buildVersion !== 'dev' ? ` ${buildVersion}` : ''}</span></div>
        {authenticated ? <><span className="user-email">{userEmail}</span><label className="theme-picker"><span className="sr-only">Theme</span><select value={theme} onChange={(event) => setTheme(event.target.value as ThemeName)}>{Object.entries(themes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={15} /></label><button className="header-account-button" onClick={handleLogout} title="Log out"><LogOut size={16} /><span>Logout</span></button></> : <button className="header-account-button" onClick={() => { setLoginError(''); setLoginOpen(true) }} title="Log in"><LogIn size={16} /><span>Login</span></button>}
      </div>
    </header>
    {authenticated && <div className="console-workspace">
      <AppTree nodes={treeNodes} activeId={activeTreeId} />
      <main className="app-pane">
        {activeApp === 'Supportable' && <Supportable view={supportableView} />}
        {activeApp === 'Lists' && <section className="app-placeholder"><div className="app-kicker">eB-Lists</div><h1>Lists</h1><p className="app-lead">Lists app will load here.</p></section>}
      </main>
    </div>}
    {!authenticated && <main className="app-container"><section className="welcome-view"><div className="app-kicker">eBliss Console</div><h1>Welcome.</h1><p className="app-lead">Use Login in the upper-right.</p></section></main>}
    {loginOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setLoginOpen(false)}><section className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close login" onClick={() => setLoginOpen(false)}><X size={20} /></button><h2 id="login-title">eBliss Login</h2><p className="modal-description">Sign in with your eBliss account.</p><form onSubmit={handleLogin}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label><PasswordField label="Password" value={password} onChange={setPassword} placeholder="Password" autoComplete="current-password" required />{loginError && <div className="login-error" role="alert">{loginError}</div>}<button className="primary-button" type="submit">Sign in</button></form></section></div>}
  </div>
}
