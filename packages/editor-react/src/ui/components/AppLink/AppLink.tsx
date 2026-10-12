import { createContext, useContext, type ComponentPropsWithRef, type ComponentType } from 'react';

export type AppLinkProps = Omit<ComponentPropsWithRef<'a'>, 'href'> & { href: string };

const LinkContext = createContext<ComponentType<AppLinkProps> | null>(null);

export const LinkProvider = LinkContext.Provider;

export function AppLink(props: AppLinkProps) {
  const Link = useContext(LinkContext);
  if (Link) return <Link {...props} />;
  return <a {...props} />;
}
