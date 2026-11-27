export const cloudPromotionEnabled = true;

export const hiddenMarketingPath = (path: string) => /^(?:\/)?(?:cloud|legal)(?:[/.#?]|$)/.test(path);
