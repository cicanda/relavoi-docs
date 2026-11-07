import type { ReactNode, CSSProperties } from 'react';
import Layout from '@theme/Layout';

// Public reference for the design tokens shared across the tenant dashboard,
// operator console, and mobile SDKs.
//
// Every swatch is PAINTED from its CSS variable in src/css/custom.css, so this
// page cannot drift from the tokens it documents. The hex beside it is display
// text, and is the same value the variable holds.

interface Swatch {
  name: string;
  css: string;     // the variable the chip is painted from
  value: string;   // the same value as display text
  light?: boolean; // if true, render the label in Ink rather than paper
}

// Relay Teal carries the brand. Pulse Teal is the accent for dark grounds and
// is never text on white. Proxy Amber marks the proxy moment and nothing else,
// which is why the warning tone below is a separate colour.
const SWATCHES: Swatch[] = [
  { name: 'ink-900', css: 'var(--relavoi-ink)', value: '#0E1B2C' },
  { name: 'ink-800', css: 'var(--relavoi-ink-800)', value: '#25303E' },
  { name: 'ink-700', css: 'var(--relavoi-ink-700)', value: '#313D4A' },
  { name: 'ink-500', css: 'var(--relavoi-slate)', value: '#5B6B7A' },
  { name: 'ink-200', css: 'var(--relavoi-ink-200)', value: '#ECEDEE', light: true },
  { name: 'mist-100', css: 'var(--relavoi-mist)', value: '#EEF3F2', light: true },
  { name: 'paper', css: 'var(--relavoi-paper)', value: '#FFFFFF', light: true },
  { name: 'relay-500', css: 'var(--relavoi-relay)', value: '#0B7A6B' },
  { name: 'pulse-500', css: 'var(--relavoi-pulse)', value: '#2CC5AE', light: true },
  { name: 'amber-500', css: 'var(--relavoi-amber)', value: '#F5A524', light: true },
];

// Status tones, harmonised with the palette but deliberately distinct from the
// brand teal, so "active" never reads as "branded". Grace uses the warning
// tone and not Proxy Amber. Every pair below clears AA on its own tint.
const STATE_PILLS: Array<{ label: string; bg: string; fg: string; live?: boolean }> = [
  { label: 'active', bg: 'var(--relavoi-success-100)', fg: 'var(--relavoi-success-500)', live: true },
  { label: 'grace · 18m left', bg: 'var(--relavoi-warning-100)', fg: 'var(--relavoi-warning-500)' },
  { label: 'pending', bg: 'var(--relavoi-info-100)', fg: 'var(--relavoi-info-500)' },
  { label: 'expired', bg: 'var(--relavoi-ink-200)', fg: 'var(--relavoi-slate)' },
  { label: 'failed', bg: 'var(--relavoi-danger-100)', fg: 'var(--relavoi-danger-500)' },
  { label: 'quarantined', bg: 'var(--relavoi-danger-100)', fg: 'var(--relavoi-danger-500)' },
];

// Shared style fragments — keeps the JSX readable.
const eyebrow: CSSProperties = {
  fontSize: 11,
  fontFamily: 'var(--relavoi-font-mono)',
  color: 'var(--relavoi-slate)',
  textTransform: 'uppercase',
  letterSpacing: 0.1,
  marginBottom: 14,
};
const card: CSSProperties = {
  background: 'var(--relavoi-paper)',
  border: '1px solid var(--relavoi-ink-200)',
  borderRadius: 10,
  padding: 24,
};
const subheading: CSSProperties = {
  fontSize: 28,
  fontWeight: 600,
  letterSpacing: '-0.02em',
  marginTop: 6,
  color: 'var(--relavoi-ink)',
};

function PulseDot(): ReactNode {
  return (
    <>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: 'currentColor',
          position: 'relative',
          display: 'inline-block',
        }}
      />
      <style>{`
        @keyframes relavoi-pulse {
          0%   { transform: scale(0.6); opacity: 0.55; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </>
  );
}

function StyleGuide() {
  return (
    <section
      style={{
        background: 'var(--relavoi-mist)',
        color: 'var(--relavoi-ink)',
        fontFamily: 'var(--relavoi-font-sans)',
        padding: '48px max(48px, 8vw)',
        minHeight: '88vh',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 36,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={eyebrow}>Foundation</div>
          <h1 style={{ ...subheading, fontSize: 34 }}>Design language</h1>
        </div>
        <div
          style={{
            fontSize: 11,
            fontFamily: 'var(--relavoi-font-mono)',
            color: 'var(--relavoi-slate)',
            textAlign: 'right',
          }}
        >
          <div>Sora · IBM Plex Mono</div>
          <div style={{ marginTop: 4 }}>mist surfaces · ink chrome · relay teal accents</div>
        </div>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 32,
        }}
      >
        {/* Type scale */}
        <div>
          <div style={eyebrow}>Type scale</div>
          <div style={card}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 600,
                letterSpacing: '-0.025em',
                lineHeight: 1,
              }}
            >
              Display · 48
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--relavoi-slate)',
                fontFamily: 'var(--relavoi-font-mono)',
                marginTop: 4,
              }}
            >
              Sora · 600 · -2.5%
            </div>

            <div style={{ height: 1, background: 'var(--relavoi-ink-200)', margin: '18px 0' }} />
            <div
              style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}
            >
              Page title · 24
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--relavoi-slate)',
                fontFamily: 'var(--relavoi-font-mono)',
                marginTop: 4,
              }}
            >
              Sora · 600 · -2%
            </div>

            <div style={{ height: 1, background: 'var(--relavoi-ink-200)', margin: '18px 0' }} />
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              Body: used everywhere for paragraph copy, descriptions and form labels. Designed
              for readability at standard interface densities.
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--relavoi-slate)',
                fontFamily: 'var(--relavoi-font-mono)',
                marginTop: 8,
              }}
            >
              Sora · 400 · 14/21
            </div>

            <div style={{ height: 1, background: 'var(--relavoi-ink-200)', margin: '18px 0' }} />
            <div style={{ fontFamily: 'var(--relavoi-font-mono)', fontSize: 14 }}>
              +234 900 000 0100 · sess_7f3a8b2c
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--relavoi-slate)',
                fontFamily: 'var(--relavoi-font-mono)',
                marginTop: 6,
              }}
            >
              Plex Mono · IDs, phone numbers, code, metrics
            </div>
          </div>
        </div>

        {/* Color tokens */}
        <div>
          <div style={eyebrow}>Color tokens</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {SWATCHES.map((s) => (
              <div
                key={s.name}
                style={{
                  background: s.css,
                  color: s.light ? 'var(--relavoi-ink)' : 'var(--relavoi-paper)',
                  borderRadius: 8,
                  padding: 14,
                  height: 78,
                  border: s.name === 'paper' ? '1px solid var(--relavoi-ink-200)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: 'var(--relavoi-font-mono)',
                  }}
                >
                  --{s.name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--relavoi-font-mono)',
                    opacity: 0.85,
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* State pills */}
      <div style={{ marginTop: 32 }}>
        <div style={eyebrow}>State pills · the language of Relavoi</div>
        <div
          style={{
            ...card,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
            padding: '20px 24px',
          }}
        >
          {STATE_PILLS.map((p) => (
            <span
              key={p.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 22,
                padding: '0 8px',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: 0.02,
                borderRadius: 999,
                background: p.bg,
                color: p.fg,
                position: 'relative',
              }}
            >
              {p.live ? <PulseDot /> : null}
              {p.label}
            </span>
          ))}
          <span style={{ flex: 1 }} />
          <span
            style={{
              fontSize: 12,
              color: 'var(--relavoi-slate)',
              fontFamily: 'var(--relavoi-font-mono)',
            }}
          >
            States echo the lifecycle FSM in the architecture doc.
          </span>
        </div>
      </div>

      {/* Theme split note */}
      <div style={{ marginTop: 32, ...card }}>
        <div style={eyebrow}>Two chrome treatments</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div
            style={{
              flex: 1,
              minWidth: 240,
              background: 'var(--relavoi-paper)',
              border: '1px solid var(--relavoi-ink-200)',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Tenant console (light)</div>
            <div style={{ fontSize: 13, color: 'var(--relavoi-slate)', lineHeight: 1.5 }}>
              Mist page background, white cards, ink-200 borders. For builders integrating
              the platform: calm, document-oriented, low contrast.
            </div>
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 240,
              background: 'var(--relavoi-ink)',
              color: 'var(--relavoi-mist)',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Operator console (dark)</div>
            <div style={{ fontSize: 13, color: 'var(--relavoi-ink-400)', lineHeight: 1.5 }}>
              Ink-900 page, ink-800 chrome and cards, pulse teal active states. For Relavoi
              operations: NOC-style, high-density, status-first.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function DesignPage(): ReactNode {
  return (
    <Layout
      title="Design language"
      description="Tokens, typography, and state semantics shared by the Relavoi tenant dashboard, operator console, and mobile SDKs."
    >
      <StyleGuide />
    </Layout>
  );
}
