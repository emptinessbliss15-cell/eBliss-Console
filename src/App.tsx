import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Headphones, List, LogIn, LogOut, X } from 'lucide-react'
import { AppPanel, AppDefinition } from '@ebliss/app-panel'
import { Tree, TreeNode } from '@ebliss/tree'
import { PasswordField } from './components/PasswordField'
import Supportable from './apps/SupportableView'
import { createSupportableTree, SupportableView } from './apps/SupportableTree'
import { supabase } from './lib/supabase'

type ThemeName = 'default' | 'light' | 'midnight'
const themes: Record<ThemeName, string> = { default: 'Default', light: 'Light', midnight: 'Midnight' }
const buildVersion = import.meta.env.VITE_BUILD_VERSION || 'dev'
type AppName = 'Supportable' | 'Lists'
const LISTS_APP_URL = 'https://dev-eb-lists.emptinessbliss15.workers.dev/'
const LISTS_ORIGIN = new URL(LISTS_APP_URL).origin

export default function App() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [loginError, setLoginError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [theme, setTheme] = useState<ThemeName>('default')
  const [activeApp, setActiveApp] = useState<AppName | null>(null)
  const [supportableView, setSupportableView] = useState<SupportableView>('Work')
  const listsFrameRef = useRef<HTMLIFrameElement | null>(null)
  const authenticated = !!userEmail
  const supportableTreeNodes = useMemo(() => createSupportableTree(), [])

  function sendListsSession(session: { access_token: string; refresh_token: string } | null) {
    listsFrameRef.current?.contentWindow?.postMessage(
      { type: 'eb-auth-session', source: 'eBliss-Console', session },
      LISTS_ORIGIN,
    )
  }

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setUserEmail(data.session?.user.email ?? '')
      if (data.session) sendListsSession(data.session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUserEmail(session?.user.email ?? '')
      sendListsSession(session ? { access_token: session.access_token, refresh_token: session.refresh_token } : null)
    })
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

  function selectApp(app: AppDefinition) {
    const next = app.id.toLowerCase() === 'lists' ? 'Lists' : 'Supportable'
    setActiveApp(next)
  }

  const apps: AppDefinition[] = useMemo(() => [
    { id: 'lists', name: 'Lists', icon: <List size={21} /> },
    { id: 'supportable', name: 'Supportable', icon: <Headphones size={21} /> },
  ], [])

  const treeNodes: TreeNode[] = activeApp === 'Supportable' ? supportableTreeNodes : []
  const activeTreeId = activeApp === 'Supportable' ? `supportable-${supportableView.toLowerCase()}` : undefined

  function handleTreeSelect(node: TreeNode) {
    if (node.id === 'supportable') { setSupportableView('Work'); return }
    if (node.id === 'supportable-work') { setSupportableView('Work'); return }
    if (node.id === 'supportable-manage') { setSupportableView('Manage') }
  }

  return <div className={`console theme-${theme}`}>
    <header className="console-header">
      <div className="header-brand"><img className="header-logo" src="/logoicon.png" alt="eBliss" /><div className="brand">eBliss Console</div></div>
      <div className="header-actions">
        <div className="build-watch" title={`Cloudflare dev build · ${buildVersion}`}><span className="build-dot">●</span><span>CF · dev</span><span className="build-version">{buildVersion !== 'dev' ? ` ${buildVersion}` : ''}</span></div>
        {authenticated ? <><span className="user-email">{userEmail}</span><label className="theme-picker"><span className="sr-only">Theme</span><select value={theme} onChange={(event) => setTheme(event.target.value as ThemeName)}>{Object.entries(themes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={15} /></label><button className="header-account-button" onClick={handleLogout} title="Log out"><LogOut size={16} /><span>Logout</span></button></> : <button className="header-account-button" onClick={() => { setLoginError(''); setLoginOpen(true) }} title="Log in"><LogIn size={16} /><span>Login</span></button>}
      </div>
    </header>
    {authenticated && <div className="console-workspace">
      <AppPanel apps={apps} selectedAppId={activeApp?.toLowerCase()} onSelect={selectApp} />
      {activeApp === 'Supportable' && <aside className="app-tree" aria-label="Supportable navigation"><Tree nodes={treeNodes} selectedId={activeTreeId} onSelect={handleTreeSelect} /></aside>}
      <main className="app-pane">
        {activeApp === 'Supportable' && <Supportable view={supportableView} />}
        {activeApp === 'Lists' && <iframe ref={listsFrameRef} onLoad={() => { supabase.auth.getSession().then(({ data }) => sendListsSession(data.session)) }} src={LISTS_APP_URL} title="eB Lists" style={{ display: 'block', width: '100%', height: 'calc(100vh - 64px)', minHeight: '700px', border: 0, background: '#fff' }} />}
        {!activeApp && <section className="app-placeholder"><div className="app-kicker">eBliss Console</div><h1>Select an app.</h1><p className="app-lead">Choose Lists or Supportable from the App Panel.</p></section>}
      </main>
    </div>}
    {!authenticated && <main className="app-container"><section className="welcome-view"><div className="app-kicker">eBliss Console</div><h1>Welcome.</h1><p className="app-lead">Use Login in the upper-right.</p></section></main>}
    {loginOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setLoginOpen(false)}><section className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close login" onClick={() => setLoginOpen(false)}><X size={20} /></button><h2 id="login-title">eBliss Login</h2><p className="modal-description">Sign in with your eBliss account.</p><form onSubmit={handleLogin}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label><PasswordField label="Password" value={password} onChange={setPassword} placeholder="Password" autoComplete="current-password" required />{loginError && <div className="login-error" role="alert">{loginError}</div>}<button className="primary-button" type="submit">Sign in</button></form></section></div>}
  </div>
}
