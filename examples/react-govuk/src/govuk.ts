import type { GovukModule } from 'govuk-frontend';
import { useCallback } from 'react';

export function initGovuk(Module: GovukModule | undefined, root: Element | null) {
  if (!root || !Module || !document.body.classList.contains('govuk-frontend-supported')) return;
  if (!root.hasAttribute(`data-${Module.moduleName}-init`)) new Module(root);
}

export const useGovuk = (Module?: GovukModule) => useCallback((root: Element | null) => initGovuk(Module, root), [Module]);
