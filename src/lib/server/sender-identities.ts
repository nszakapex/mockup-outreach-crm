import 'server-only';

import {
  RESINATE_CAMPAIGN_TYPE,
  hasNormalizedResinateFlooringData,
  isResinateCampaign,
  parseResinateConceptNotes,
} from '@/lib/resinate-data';

export type SenderProfileKey = 'apex' | 'resinate';

export type SenderProfile = {
  key: SenderProfileKey;
  providerName: 'gmail';
  senderLabel: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  senderEmail: string;
  configured: boolean;
  missingFields: string[];
  clientIdConfigured: boolean;
  clientSecretConfigured: boolean;
  refreshTokenConfigured: boolean;
  senderEmailConfigured: boolean;
};

export type SafeSenderProfile = Omit<SenderProfile, 'clientId' | 'clientSecret' | 'refreshToken' | 'senderEmail'>;

type ProspectSenderInput = {
  campaign_type?: string | null;
  mockups?: Array<{
    slug?: string | null;
    title?: string | null;
    mockup_url?: string | null;
    concept_notes?: string | null;
  }> | null;
  email_drafts?: Array<{ subject?: string | null; body?: string | null }> | null;
};

export function getSenderProfileForProspect(prospect: ProspectSenderInput): SenderProfile {
  const campaignType = getCampaignTypeForProspect(prospect);
  return getSenderProfileByKey(campaignType === 'resinate_flooring' ? 'resinate' : 'apex');
}

export function getCampaignTypeForProspect(prospect: ProspectSenderInput) {
  const directCampaignType = cleanString(prospect.campaign_type)?.toLowerCase();
  if (directCampaignType === RESINATE_CAMPAIGN_TYPE) return directCampaignType;

  for (const mockup of prospect.mockups || []) {
    const flooring = parseResinateConceptNotes(mockup.concept_notes);
    if (isResinateCampaign(flooring) || hasNormalizedResinateFlooringData(flooring)) return RESINATE_CAMPAIGN_TYPE;

    if (hasResinateTextSignal(mockup.concept_notes)) return RESINATE_CAMPAIGN_TYPE;
    if (
      hasFlooringArtifactSignal(mockup.slug) ||
      hasFlooringArtifactSignal(mockup.title) ||
      hasFlooringArtifactSignal(mockup.mockup_url)
    ) {
      return RESINATE_CAMPAIGN_TYPE;
    }
  }

  for (const draft of prospect.email_drafts || []) {
    if (hasFlooringArtifactSignal(draft.subject) || hasFlooringArtifactSignal(draft.body)) {
      return RESINATE_CAMPAIGN_TYPE;
    }
  }

  return 'apex_default';
}

export function getSenderProfileByKey(key: SenderProfileKey): SenderProfile {
  return key === 'resinate' ? getResinateSenderProfile() : getApexSenderProfile();
}

export function getSafeSenderProfile(profile: SenderProfile): SafeSenderProfile {
  const { clientId, clientSecret, refreshToken, senderEmail, ...safeProfile } = profile;
  void clientId;
  void clientSecret;
  void refreshToken;
  void senderEmail;
  return safeProfile;
}

export function getSenderProfilesDebug() {
  const apex = getApexSenderProfile();
  const resinate = getResinateSenderProfile();

  return {
    apex: getSafeSenderProfile(apex),
    resinate: getSafeSenderProfile(resinate),
    apexSenderConfigured: apex.configured,
    resinateSenderConfigured: resinate.configured,
  };
}

function getApexSenderProfile(): SenderProfile {
  return buildSenderProfile({
    key: 'apex',
    senderLabel: 'Apex',
    clientId: readEnv('APEX_GOOGLE_CLIENT_ID') || readEnv('GOOGLE_CLIENT_ID'),
    clientSecret: readEnv('APEX_GOOGLE_CLIENT_SECRET') || readEnv('GOOGLE_CLIENT_SECRET'),
    refreshToken: readEnv('APEX_GOOGLE_REFRESH_TOKEN') || readEnv('GOOGLE_REFRESH_TOKEN'),
    senderEmail: readEnv('APEX_GMAIL_SENDER_EMAIL') || readEnv('GMAIL_SENDER_EMAIL'),
    missingLabels: {
      clientId: 'APEX_GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID',
      clientSecret: 'APEX_GOOGLE_CLIENT_SECRET or GOOGLE_CLIENT_SECRET',
      refreshToken: 'APEX_GOOGLE_REFRESH_TOKEN or GOOGLE_REFRESH_TOKEN',
      senderEmail: 'APEX_GMAIL_SENDER_EMAIL or GMAIL_SENDER_EMAIL',
    },
  });
}

function getResinateSenderProfile(): SenderProfile {
  return buildSenderProfile({
    key: 'resinate',
    senderLabel: 'Resinate',
    clientId: readEnv('RESINATE_GOOGLE_CLIENT_ID'),
    clientSecret: readEnv('RESINATE_GOOGLE_CLIENT_SECRET'),
    refreshToken: readEnv('RESINATE_GOOGLE_REFRESH_TOKEN'),
    senderEmail: readEnv('RESINATE_GMAIL_SENDER_EMAIL'),
    missingLabels: {
      clientId: 'RESINATE_GOOGLE_CLIENT_ID',
      clientSecret: 'RESINATE_GOOGLE_CLIENT_SECRET',
      refreshToken: 'RESINATE_GOOGLE_REFRESH_TOKEN',
      senderEmail: 'RESINATE_GMAIL_SENDER_EMAIL',
    },
  });
}

function buildSenderProfile({
  key,
  senderLabel,
  clientId,
  clientSecret,
  refreshToken,
  senderEmail,
  missingLabels,
}: {
  key: SenderProfileKey;
  senderLabel: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  senderEmail: string;
  missingLabels: Record<'clientId' | 'clientSecret' | 'refreshToken' | 'senderEmail', string>;
}): SenderProfile {
  const missingFields = [
    clientId ? null : missingLabels.clientId,
    clientSecret ? null : missingLabels.clientSecret,
    refreshToken ? null : missingLabels.refreshToken,
    senderEmail ? null : missingLabels.senderEmail,
  ].filter((field): field is string => Boolean(field));

  return {
    key,
    providerName: 'gmail',
    senderLabel,
    clientId,
    clientSecret,
    refreshToken,
    senderEmail,
    configured: missingFields.length === 0,
    missingFields,
    clientIdConfigured: Boolean(clientId),
    clientSecretConfigured: Boolean(clientSecret),
    refreshTokenConfigured: Boolean(refreshToken),
    senderEmailConfigured: Boolean(senderEmail),
  };
}

function readEnv(name: string) {
  return process.env[name]?.trim() || '';
}

function cleanString(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hasResinateTextSignal(value: unknown) {
  const normalized = cleanString(value)?.toLowerCase();
  if (!normalized) return false;

  return (
    normalized.includes('"campaign_type"') && normalized.includes('resinate_flooring')
  ) || [
    'recommended_flooring_system',
    'buyer_type',
    'portfolio_or_property_context',
    'likely_surface_problem',
    'likely_surface_areas',
    'walkthrough_offer',
    'vendor_packet_angle',
    'surface_system_summary',
    'commercial surface',
    'resinate',
  ].some((field) => normalized.includes(field));
}

function hasFlooringArtifactSignal(value: unknown) {
  const normalized = cleanString(value)?.toLowerCase();
  if (!normalized) return false;

  return (
    /\[flooring audit link\]/i.test(normalized) ||
    /\[flooring brief link\]/i.test(normalized) ||
    /\[commercial surface brief link\]/i.test(normalized) ||
    /\[inline flooring brief\]/i.test(normalized) ||
    normalized.includes('/flooring-audits/') ||
    normalized.includes('flooring-audit') ||
    normalized.includes('flooring audit link') ||
    normalized.includes('flooring brief link') ||
    normalized.includes('commercial surface brief link') ||
    normalized.includes('inline flooring brief') ||
    normalized.includes('flooring brief') ||
    normalized.includes('commercial surface fit note')
  );
}
