import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

// Recreated from the design canvas's Cover artboard (Relavoi Frontend.html):
// ink-900 hero, atmospheric grid, radial signal-green glow, IBM Plex pairing,
// 4 stat counters in mono. Public marketing-facing landing page for docs.

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
        background: '#0B1220',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '88vh',
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      }}
    >
      {/* Atmospheric grid — subtle */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          backgroundImage:
            'linear-gradient(#CBD5E1 1px, transparent 1px), linear-gradient(90deg, #CBD5E1 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Radial signal-green glow */}
      <div
        style={{
          position: 'absolute',
          right: -120,
          top: -120,
          width: 520,
          height: 520,
          borderRadius: 999,
          background:
            'radial-gradient(circle, oklch(0.72 0.16 145 / 0.18) 0%, transparent 60%)',
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
            <div
              style={{
                width: 42,
                height: 42,
                background: 'oklch(0.72 0.16 145)',
                color: '#0B1220',
                display: 'grid',
                placeItems: 'center',
                borderRadius: 9,
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 700,
                fontSize: 22,
              }}
            >
              R
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
                Relavoi
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#94A3B8',
                  fontFamily: "'IBM Plex Mono', monospace",
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
              color: '#94A3B8',
              fontFamily: "'IBM Plex Mono', monospace",
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
              color: 'white',
            }}
          >
            The full surface area
            <br />
            of{' '}
            <span style={{ color: 'oklch(0.72 0.16 145)' }}>Relavoi</span>, documented.
          </h1>
          <p
            style={{
              marginTop: 28,
              fontSize: 18,
              color: '#CBD5E1',
              maxWidth: 780,
              lineHeight: 1.5,
            }}
          >
            The privacy-preserving telephony platform for the Nigerian market — masked phone
            calls, SMS, push notifications, and call verification, behind a single API.
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
                background: 'oklch(0.72 0.16 145)',
                color: '#0B1220',
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
                color: 'white',
                border: '1px solid #334155',
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
                color: '#94A3B8',
                fontFamily: "'IBM Plex Mono', monospace",
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
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}
                >
                  {s.k}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#94A3B8',
                    fontFamily: "'IBM Plex Mono', monospace",
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
              color: '#64748B',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            v1.1 architecture · NDPR-aligned · NCC type-approved CPaaS
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
