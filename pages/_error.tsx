// Custom error page to prevent Next.js SSG <Html> conflict
// This overrides the default _error page that tries to import next/document Html
import type { NextPageContext } from 'next'

function ErrorPage({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      background: '#F8FAFC'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 48, fontWeight: 'bold', color: '#082545', margin: 0 }}>
          {statusCode || 'Erreur'}
        </h1>
        <p style={{ color: '#64748B', marginTop: 8 }}>
          {statusCode === 404
            ? 'Page introuvable'
            : 'Une erreur est survenue'}
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: 24,
            padding: '12px 24px',
            background: '#2EC6F3',
            color: 'white',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Retour au dashboard
        </a>
      </div>
    </div>
  )
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default ErrorPage
