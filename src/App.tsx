import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ChevronDown, Headphones, List, LogIn, LogOut, X } from 'lucide-react'
import { AppPanel, AppDefinition } from '@ebliss/app-panel'
import { Tree, TreeNode } from '@ebliss/tree'
import { PasswordField } from './components/PasswordField'
import Supportable from './apps/SupportableView'
import { createSupportableTree, SupportableView } from './apps/SupportableTree'
import { useListsTree } from './apps/ListsTree'
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
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [supportableView, setSupportableView] = useState<SupportableView>('Work')
  const authenticated = !!userEmail
  const listsTreeNodes = useListsTree()
  const supportableTreeNodes = useMemo(() => createSupportableTree(), [])

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
    setPassword(''); setLoginOpen(false); setActiveApp(null); setActiveListId(null); setSupportableView('Work')
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) setLoginError(error.message)
    setActiveApp(null); setActiveListId(null); setSupportableView('Work')
  }

  function selectApp(app: AppDefinition) {
    const next = app.id === 'lists' ? 'Lists' : 'Supportable'
    setActiveApp(next)
    if (next !== 'Lists') setActiveListId(null)
  }

  function selectList(id: string) {
    setActiveApp('Lists')
    setActiveListId(id)
  }

  function selectSupportable(view: SupportableView) {
    setActiveApp('Supportable')
    setActiveListId(null)
    setSupportableView(view)
  }

  const apps: AppDefinition[] = useMemo(() => [
    { id: 'lists', name: 'Lists', icon: <List size={21} /> },
    { id: 'supportable', name: 'Supportable', icon: <Headphones size={21} /> },
  ], [])

  const treeNodes: TreeNode[] = activeApp === 'Lists'
    ? listsTreeNodes
    : activeApp === 'Supportable'
      ? supportableTreeNodes
      : []

  const activeTreeId = activeApp === 'Lists'
    ? activeListId ? `list-${activeListId}` : 'lists'
    : activeApp === 'Supportable'
      ? `supportable-${supportableView.toLowerCase()}`
      : undefined

  function handleTreeSelect(node: TreeNode) {
    if (node.id === 'lists') { setActiveApp('Lists'); setActiveListId(null); return }
    if (node.id.startsWith('list-')) { selectList(node.id.slice(5)); return }
    if (node.id === 'supportable') { selectSupportable('Work'); return }
    if (node.id === 'supportable-work') { selectSupportable('Work'); return }
    if (node.id === 'supportable-manage') { selectSupportable('Manage') }
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
      {activeApp && <aside className="app-tree" aria-label={`${activeApp} navigation`}><Tree nodes={treeNodes} selectedId={activeTreeId} onSelect={handleTreeSelect} /></aside>}
      <main className="app-pane">
        {activeApp === 'Supportable' && <Supportable view={supportableView} />}
        {activeApp === 'Lists' && <section className="app-placeholder"><div className="app-kicker">eB-Lists</div><h1>Lists</h1><p className="app-lead">{activeListId ? `List selected: ${activeListId}` : 'Select a list from the tree.'}</p></section>}
        {!activeApp && <section className="app-placeholder"><div className="app-kicker">eBliss Console</div><h1>Select an app.</h1><p className="app-lead">Choose Lists or Supportable from the App Panel.</p></section>}
      </main>
    </div>}
    {!authenticated && <main className="app-container"><section className="welcome-view"><div className="app-kicker">eBliss Console</div><h1>Welcome.</h1><p className="app-lead">Use Login in the upper-right.</p></section></main>}
    {loginOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setLoginOpen(false)}><section className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close login" onClick={() => setLoginOpen(false)}><X size={20} /></button><h2 id="login-title">eBliss Login</h2><p className="modal-description">Sign in with your eBliss account.</p><form onSubmit={handleLogin}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label><PasswordField label="Password" value={password} onChange={setPassword} placeholder="Password" autoComplete="current-password" required />{loginError && <div className="login-error" role="alert">{loginError}</div>}<button className="primary-button" type="submit">Sign in</button></form></section></div>}
  </div>
}
