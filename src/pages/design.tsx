import type { ReactNode, CSSProperties } from 'react';
import Layout from '@theme/Layout';

// Recreated from the design canvas's StyleGuide artboard (Relavoi Frontend.html).
// Public reference for the design tokens shared across the tenant dashboard,
// operator console, and mobile SDKs.

interface Swatch {
  name: string;
  value: string; // CSS color string used to render the chip
  raw?: string;  // sRGB hex shown alongside oklch values
  light?: boolean; // if true, render label in dark ink
}

const SWATCHES: Swatch[] = [
  { name: 'ink-900', value: '#0B1220' },
  { name: 'ink-800', value: '#131C2E' },
  { name: 'ink-700', value: '#1E293B' },
  { name: 'ink-500', value: '#64748B' },
  { name: 'ink-200', value: '#E2E8F0', light: true },
  { name: 'bone-100', value: '#F5F2EC', light: true },
  { name: 'paper', value: '#FFFFFF', light: true },
  { name: 'signal-500', value: 'oklch(0.72 0.16 145)', raw: '#5BC97A' },
  { name: 'amber-500', value: 'oklch(0.78 0.14 75)', raw: '#E8A857' },
  { name: 'terra-500', value: 'oklch(0.65 0.16 35)', raw: '#D45A4A' },
  { name: 'iris-500', value: 'oklch(0.62 0.14 270)', raw: '#7B7BD9' },
];

const STATE_PILLS: Array<{ label: string; bg: string; fg: string; live?: boolean }> = [
  { label: 'active', bg: 'oklch(0.96 0.04 145)', fg: 'oklch(0.62 0.17 145)', live: true },
  { label: 'grace · 18m left', bg: 'oklch(0.96 0.04 75)', fg: 'oklch(0.45 0.14 75)' },
  { label: 'pending', bg: 'oklch(0.96 0.03 270)', fg: 'oklch(0.55 0.14 270)' },
  { label: 'expired', bg: '#EEF2F7', fg: '#334155' },
  { label: 'failed', bg: 'oklch(0.96 0.04 35)', fg: 'oklch(0.55 0.17 35)' },
  { label: 'quarantined', bg: 'oklch(0.96 0.04 35)', fg: 'oklch(0.55 0.17 35)' },
];

// Shared style fragments — keeps the JSX readable.
const eyebrow: CSSProperties = {
  fontSize: 11,
  fontFamily: "'IBM Plex Mono', monospace",
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: 0.1,
  marginBottom: 14,
};
const card: CSSProperties = {
  background: 'white',
  border: '1px solid #E2E8F0',
  borderRadius: 10,
  padding: 24,
};
const subheading: CSSProperties = {
  fontSize: 28,
  fontWeight: 600,
  letterSpacing: '-0.02em',
  marginTop: 6,
  color: '#0B1220',
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
        background: '#FAF8F3',
        color: '#0B1220',
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
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
            fontFamily: "'IBM Plex Mono', monospace",
            color: '#64748B',
            textAlign: 'right',
          }}
        >
          <div>IBM Plex Sans · IBM Plex Mono</div>
          <div style={{ marginTop: 4 }}>warm bone surfaces · ink chrome · signal-green accents</div>
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
                color: '#64748B',
                fontFamily: "'IBM Plex Mono', monospace",
                marginTop: 4,
              }}
            >
              Plex Sans · 600 · -2.5%
            </div>

            <div style={{ height: 1, background: '#EEF2F7', margin: '18px 0' }} />
            <div
              style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}
            >
              Page title · 24
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#64748B',
                fontFamily: "'IBM Plex Mono', monospace",
                marginTop: 4,
              }}
            >
              Plex Sans · 600 · -2%
            </div>

            <div style={{ height: 1, background: '#EEF2F7', margin: '18px 0' }} />
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              Body — used everywhere for paragraph copy, descriptions and form labels. Designed
              for readability at standard interface densities.
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#64748B',
                fontFamily: "'IBM Plex Mono', monospace",
                marginTop: 8,
              }}
            >
              Plex Sans · 400 · 14/21
            </div>

            <div style={{ height: 1, background: '#EEF2F7', margin: '18px 0' }} />
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14 }}>
              +234 800 042 1183 · sess_7f3a8b2c
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#64748B',
                fontFamily: "'IBM Plex Mono', monospace",
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
                  background: s.raw ?? s.value,
                  color: s.light ? '#0B1220' : 'white',
                  borderRadius: 8,
                  padding: 14,
                  height: 78,
                  border: s.name === 'paper' ? '1px solid #E2E8F0' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  --{s.name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: "'IBM Plex Mono', monospace",
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
              color: '#64748B',
              fontFamily: "'IBM Plex Mono', monospace",
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
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Tenant console — light</div>
            <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
              Bone-100 page background, white cards, ink-200 borders. For builders integrating
              the platform: warm, document-oriented, low contrast.
            </div>
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 240,
              background: '#0B1220',
              color: '#E2E8F0',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Operator console — dark</div>
            <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>
              Ink-900 page, ink-800 chrome and cards, signal-green active states. For Relavoi
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
