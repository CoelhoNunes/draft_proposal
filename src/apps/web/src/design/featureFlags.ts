const isProduction = import.meta.env.MODE === 'production';

const parseFlag = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

export const featureFlags = {
  chatAddToDraftGated: parseFlag(import.meta.env.VITE_FF_CHAT_ADD_TO_DRAFT_GATED, !isProduction),
  chatResizeToggle: parseFlag(import.meta.env.VITE_FF_CHAT_RESIZE_TOGGLE, !isProduction),
  archiveUniqueNames: parseFlag(import.meta.env.VITE_FF_ARCHIVE_UNIQUE_NAMES, !isProduction),
};

export type FeatureFlagKey = keyof typeof featureFlags;
