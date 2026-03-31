import { useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Home from './components/Home.jsx'
import Browse from './components/Browse.jsx'
import TemplateDetail from './components/TemplateDetail.jsx'
import Submit from './components/Submit.jsx'

/**
 * Navigation state shape:
 * {
 *   page: 'home' | 'browse' | 'detail',
 *   templateId: string | null,
 *   // Browse page initial state
 *   query: string,
 *   contentType: string | null,
 *   verified: boolean,
 *   trending: boolean,
 * }
 */
const defaultNav = {
  page: 'home',
  templateId: null,
  query: '',
  contentType: null,
  verified: false,
  trending: false,
}

export default function App() {
  const [nav, setNav] = useState(defaultNav)

  const navigate = (newNav) => {
    setNav({ ...defaultNav, ...newNav })
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#0D0B16] text-[#F0EEF9]">
      <Navbar currentPage={nav.page} navigate={navigate} />

      {nav.page === 'home' && (
        <Home navigate={navigate} />
      )}

      {nav.page === 'browse' && (
        <Browse
          navigate={navigate}
          initialQuery={nav.query || ''}
          initialContentType={nav.contentType || null}
          initialVerified={nav.verified || false}
          initialTrending={nav.trending || false}
        />
      )}

      {nav.page === 'detail' && (
        <TemplateDetail
          templateId={nav.templateId}
          navigate={navigate}
        />
      )}

      {nav.page === 'submit' && (
        <Submit navigate={navigate} />
      )}
    </div>
  )
}
