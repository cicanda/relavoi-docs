import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'introduction',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/signup',
        'getting-started/first-session',
        'getting-started/concepts',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/call-flow',
        'guides/sdk-tokens',
        'guides/webhook-integration',
        'guides/failover',
        'guides/security',
      ],
    },
  ],

  api: [
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api-reference/authentication',
        'api-reference/config',
        'api-reference/sessions',
        'api-reference/target-swap',
        'api-reference/calls',
        'api-reference/numbers',
        'api-reference/devices',
        'api-reference/analytics',
        'api-reference/billing',
        'api-reference/webhooks',
        'api-reference/health',
        'api-reference/errors',
        'api-reference/rate-limits',
        'api-reference/tools',
      ],
    },
  ],

  sdks: [
    {
      type: 'category',
      label: 'Android SDK (Kotlin)',
      items: [
        'sdks/android/installation',
        'sdks/android/initialization',
        'sdks/android/sessions',
        'sdks/android/call-verification',
        'sdks/android/events',
        'sdks/android/permissions',
      ],
    },
    {
      type: 'category',
      label: 'iOS SDK (Swift)',
      items: [
        'sdks/ios/installation',
        'sdks/ios/initialization',
        'sdks/ios/sessions',
        'sdks/ios/call-verification',
        'sdks/ios/events',
        'sdks/ios/live-activities',
      ],
    },
    {
      type: 'category',
      label: 'Flutter SDK (Dart)',
      items: [
        'sdks/flutter/installation',
        'sdks/flutter/initialization',
        'sdks/flutter/sessions',
        'sdks/flutter/verification',
        'sdks/flutter/events',
        'sdks/flutter/presence',
      ],
    },
  ],
};

export default sidebars;
