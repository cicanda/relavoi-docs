import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';

// Public marketing-facing landing page for the docs site.
// Ink hero, atmospheric grid, radial Pulse Teal glow, Sora and IBM Plex Mono.
// Every colour and font here reads a token from src/css/custom.css; nothing
// on this page names a colour or a typeface of its own.

const COVER_STATS: Array<{ k: string; v: string }> = [
  { k: '5', v: 'frontend surfaces' },
  { k: '2', v: 'consoles · admin + tenant' },
  { k: '3', v: 'mobile SDK moments' },
  { k: '1', v: 'design language' },
];

function Cover() {
  return (
    <section
      style={{
        background: 'var(--relavoi-ink)',
        color: 'var(--relavoi-paper)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '88vh',
        fontFamily: 'var(--relavoi-font-sans)',
      }}
    >
      {/* Atmospheric grid — subtle */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          backgroundImage:
            'linear-gradient(var(--relavoi-mist) 1px, transparent 1px), linear-gradient(90deg, var(--relavoi-mist) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Radial Pulse Teal glow: an accent on a dark ground, per the guidelines. */}
      <div
        style={{
          position: 'absolute',
          right: -120,
          top: -120,
          width: 520,
          height: 520,
          borderRadius: 999,
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--relavoi-pulse) 18%, transparent) 0%, transparent 60%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          padding: '80px 8vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '88vh',
        }}
      >
        <div>
          {/* Brand mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <img
                src={useBaseUrl('/img/logo-footer.svg')}
                alt="Relavoi"
                style={{ height: 48, width: 'auto', display: 'block' }}
              />
              <div
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  color: 'var(--relavoi-ink-400)',
                  fontFamily: 'var(--relavoi-font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.1,
                }}
              >
                Privacy telephony infrastructure
              </div>
            </div>
          </div>

          {/* Eyebrow + headline */}
          <div
            style={{
              marginTop: 96,
              fontSize: 14,
              color: 'var(--relavoi-ink-400)',
              fontFamily: 'var(--relavoi-font-mono)',
              textTransform: 'uppercase',
              letterSpacing: 0.1,
            }}
          >
            Documentation · v0.1
          </div>
          <h1
            style={{
              marginTop: 20,
              fontSize: 'clamp(48px, 7vw, 84px)',
              lineHeight: 0.96,
              fontWeight: 500,
              letterSpacing: '-0.035em',
              maxWidth: 1100,
              color: 'var(--relavoi-paper)',
            }}
          >
            The full surface area
            <br />
            of{' '}
            <span style={{ color: 'var(--relavoi-pulse)' }}>Relavoi</span>, documented.
          </h1>
          <p
            style={{
              marginTop: 28,
              fontSize: 18,
              color: 'var(--relavoi-mist)',
              maxWidth: 780,
              lineHeight: 1.5,
            }}
          >
            The privacy-preserving telephony platform for the Nigerian market: masked phone
            calls and in-call verification, behind a single API.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
            <Link
              to="/introduction"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 44,
                padding: '0 22px',
                borderRadius: 8,
                background: 'var(--relavoi-pulse)',
                color: 'var(--relavoi-ink)',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Read the docs →
            </Link>
            <Link
              to="/getting-started/first-session"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 44,
                padding: '0 22px',
                borderRadius: 8,
                background: 'transparent',
                color: 'var(--relavoi-paper)',
                border: '1px solid var(--relavoi-slate)',
                fontWeight: 500,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Quick start
            </Link>
            <Link
              to="/design"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 44,
                padding: '0 22px',
                borderRadius: 8,
                background: 'transparent',
                color: 'var(--relavoi-ink-400)',
                fontFamily: 'var(--relavoi-font-mono)',
                fontSize: 13,
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: 0.06,
              }}
            >
              ↗ Design language
            </Link>
          </div>
        </div>

        {/* Footer stats row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 64,
            flexWrap: 'wrap',
            gap: 32,
          }}
        >
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            {COVER_STATS.map((s) => (
              <div key={s.v}>
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    fontFamily: 'var(--relavoi-font-mono)',
                  }}
                >
                  {s.k}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--relavoi-ink-400)',
                    fontFamily: 'var(--relavoi-font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.08,
                    marginTop: 4,
                  }}
                >
                  {s.v}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--relavoi-slate)',
              fontFamily: 'var(--relavoi-font-mono)',
            }}
          >
            v1.1 architecture · NDPR-aligned · NCC type-approved carrier
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <Cover />
    </Layout>
  );
}
