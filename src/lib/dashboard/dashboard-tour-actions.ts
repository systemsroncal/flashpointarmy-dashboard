/** Shell callbacks used while the dashboard tour runs. */
export type DashboardTourActions = {
  openSidebar: () => void;
  ensureSettingsExpanded: () => void;
  openProfileDrawer: () => void;
  closeProfileDrawer: () => void;
  setProfileEditMode: (edit: boolean) => void;
};

export function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Scroll target and any scrollable sidebar ancestor into view. */
export function scrollTourTargetIntoView(element: Element): void {
  const el = element as HTMLElement;
  const navScroll = document.querySelector('[data-tour="sidebar-nav-scroll"]') as HTMLElement | null;
  if (navScroll?.contains(el)) {
    const listRect = navScroll.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    if (elRect.top < listRect.top || elRect.bottom > listRect.bottom) {
      const offset =
        el.offsetTop - navScroll.clientHeight / 2 + el.offsetHeight / 2;
      navScroll.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
    }
  }
  el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
}

export function tourAttr(element: Element | undefined): string {
  return element?.getAttribute("data-tour") ?? "";
}

export function prepareSidebarTarget(element: Element | undefined, actions: DashboardTourActions): void {
  const attr = tourAttr(element);
  if (
    attr.startsWith("nav-") ||
    attr.startsWith("mobilize-") ||
    attr === "sidebar-profile" ||
    attr === "header-sign-out" ||
    attr === "nav-settings-group" ||
    attr === "sidebar-toggle"
  ) {
    actions.openSidebar();
    if (attr.startsWith("nav-") && attr !== "nav-settings-group") {
      actions.ensureSettingsExpanded();
    }
    if (attr === "nav-settings-group") {
      actions.ensureSettingsExpanded();
    }
  }
}
