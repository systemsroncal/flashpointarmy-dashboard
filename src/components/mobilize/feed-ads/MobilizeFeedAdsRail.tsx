"use client";

import { MobilizeFeedHtml } from "@/components/mobilize/social/MobilizeFeedHtml";
import { MobilizeRecommendationsCard } from "@/components/mobilize/social/MobilizeProfileSidebarCard";
import type { MobilizeFeedAdBlock } from "@/lib/mobilize/feed-ads-types";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { Box, Stack } from "@mui/material";
import Link from "next/link";
import { MobilizeFeedAdsCarousel } from "./MobilizeFeedAdsCarousel";

type Props = {
  items: MobilizeFeedAdBlock[];
};

function AdImageBlock({
  image_url,
  href,
  className,
  elementId,
}: {
  image_url: string;
  href: string;
  className?: string;
  elementId?: string;
}) {
  const img = (
    <Box
      component="img"
      src={publicAssetSrc(image_url)}
      alt=""
      sx={{
        width: "100%",
        display: "block",
        borderRadius: 1.5,
        objectFit: "cover",
      }}
    />
  );

  if (href.trim()) {
    return (
      <Link
        href={href.trim()}
        target={href.startsWith("/") ? undefined : "_blank"}
        rel={href.startsWith("/") ? undefined : "noopener noreferrer"}
        className={className}
        id={elementId}
        style={{ display: "block" }}
      >
        {img}
      </Link>
    );
  }

  return (
    <Box id={elementId} className={className}>
      {img}
    </Box>
  );
}

export function MobilizeFeedAdsRail({ items }: Props) {
  if (!items.length) return null;

  return (
    <MobilizeRecommendationsCard title="Featured">
      <Stack spacing={2}>
        {items.map((block) => {
          if (block.type === "image") {
            return (
              <AdImageBlock
                key={block.id}
                image_url={block.image_url}
                href={block.href}
                className={block.className}
                elementId={block.elementId}
              />
            );
          }
          if (block.type === "carousel") {
            return (
              <MobilizeFeedAdsCarousel
                key={block.id}
                slides={block.slides}
                className={block.className}
                elementId={block.elementId}
              />
            );
          }
          return (
            <Box key={block.id} id={block.elementId} className={block.className}>
              <MobilizeFeedHtml html={block.html} />
            </Box>
          );
        })}
      </Stack>
    </MobilizeRecommendationsCard>
  );
}
