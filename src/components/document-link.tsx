import type { ComponentProps } from "react";
// Account/mode boundaries deliberately use full-document navigation to discard
// private React and router caches rather than keeping another account's UI.
export function DocumentLink(props: ComponentProps<"a">) {
  return <a {...props} />;
}
