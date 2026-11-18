export const cloudPromotionEnabled = false;

export const hiddenMarketingPath = (path: string) => /^(?:\/)?(?:cloud|legal)(?:[/.#?]|$)/.test(path);
