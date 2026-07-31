"use client";

import { ChapterInviteShareDialog } from "@/components/dashboard/national-overview/ChapterInviteShareDialog";
import { useEffect, useState } from "react";

const SHARE_ITEM_CLASS = "container-share-item";

/**
 * Anywhere in the dashboard (including Mobilize): clicking an element with
 * class `container-share-item` opens the chapter invite share dialog
 * (social networks + Community in Action notification on share).
 */
export function GlobalContainerShareItemListener() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const hit = target.closest(`.${SHARE_ITEM_CLASS}`);
      if (!hit) return;

      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    const styleId = "fp-container-share-item-style";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `.${SHARE_ITEM_CLASS}{cursor:pointer;}`;
    document.head.appendChild(style);
  }, []);

  return <ChapterInviteShareDialog open={open} onClose={() => setOpen(false)} />;
}
