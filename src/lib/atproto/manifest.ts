/**
 * Build-pinned Tally → Prisma record mapping.
 * Tally question IDs are deployment configuration; the manifest pins the
 * mapping contract and the environment-variable names supplying those IDs.
 * No schema or mapping is fetched from GitHub while a webhook is running.
 */
export const ENROL_MANIFEST = {
  version: 1,
  atTapContracts: {
    hubProfile: {
      collection: 'events.prisma.hub.profile',
      schemaBlob: '6b4f54dda99680b7576ac1734bf81bc36d821aae',
      recordKey: 'self',
    },
    enrolRegistration: {
      collection: 'events.prisma.enrol.registration',
      appViewContractBlob: '5c53829b77bb164fe9a5d274e9d370cced297888',
      recordKey: 'tally-response-id',
      fields: ['registrationId', 'cardanoDid', 'role', 'createdAt'],
    },
  },
  tally: {
    formIdsEnv: 'ENROL_HUB_FORM_IDS',
    fields: {
      walletDid: 'ENROL_WALLET_FIELD',
      walletConsent: 'ENROL_CONSENT_FIELD',
      hubName: 'ENROL_NAME_FIELD',
      hubNameConsent: 'ENROL_NAME_CONSENT_FIELD',
      country: 'ENROL_COUNTRY_FIELD',
      countryConsent: 'ENROL_COUNTRY_CONSENT_FIELD',
    },
  },
} as const;

export type EnrolManifest = typeof ENROL_MANIFEST;
