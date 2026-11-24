"use client";

import { SocialUrlShareDialog } from "@/components/dashboard/SocialUrlShareDialog";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import { absoluteMobilizePostShareUrl } from "@/lib/mobilize/social/post-share-url";
import { useMemo } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  post: UnifiedFeedPost;
};

export function MobilizePostShareDialog({ open, onClose, post }: Props) {
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return absoluteMobilizePostShareUrl(window.location.origin, post) ?? "";
  }, [post]);

  const authorName = post.author.display_name?.trim() || "Member";
  const subject = `Post from ${authorName} on FlashPoint Army`;

  return (
    <SocialUrlShareDialog
      open={open}
      onClose={onClose}
      shareUrl={shareUrl}
      subject={subject}
      title="Share this post"
      linkLabel="Post link"
      description={
        <>
          Share <strong style={{ color: "#1a1a1a" }}>{authorName}&apos;s</strong> post. The link opens the feed with
          this post in a popup (sign-in required).
        </>
      }
    />
  );
}