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
        'guides/sms-masking',
        'guides/call-recording',
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
        'api-reference/sessions',
        'api-reference/calls',
        'api-reference/sms',
        'api-reference/numbers',
        'api-reference/analytics',
        'api-reference/billing',
        'api-reference/webhooks',
        'api-reference/errors',
        'api-reference/rate-limits',
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
        'sdks/android/push-notifications',
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
        'sdks/ios/push-notifications',
        'sdks/ios/events',
        'sdks/ios/live-activities',
      ],
    },
  ],
};

export default sidebars;
