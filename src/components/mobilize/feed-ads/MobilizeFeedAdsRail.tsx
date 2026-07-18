"use client";

import { MobilizeFeedHtml } from "@/components/mobilize/social/MobilizeFeedHtml";
import { MobilizeRecommendationsCard } from "@/components/mobilize/social/MobilizeProfileSidebarCard";
import type { MobilizeFeedAdBlock } from "@/lib/mobilize/feed-ads-types";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { Box, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { feedAdImageSx, MobilizeFeedAdsCarousel } from "./MobilizeFeedAdsCarousel";

type Props = {
  items: MobilizeFeedAdBlock[];
};

function AdImageBlock({
  title,
  image_url,
  href,
  className,
  elementId,
}: {
  title?: string;
  image_url: string;
  href: string;
  className?: string;
  elementId?: string;
}) {
  const heading = title?.trim();
  const img = (
    <Box component="img" src={publicAssetSrc(image_url)} alt="" sx={feedAdImageSx} />
  );

  const content = href.trim() ? (
    <Link
      href={href.trim()}
      target={href.startsWith("/") ? undefined : "_blank"}
      rel={href.startsWith("/") ? undefined : "noopener noreferrer"}
      className={className}
      id={elementId}
      style={{ display: "block", lineHeight: 0 }}
    >
      {img}
    </Link>
  ) : (
    <Box id={elementId} className={className} sx={{ lineHeight: 0 }}>
      {img}
    </Box>
  );

  return (
    <Box>
      {heading ? (
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.25, letterSpacing: "-0.01em", color: "#0d0d0d" }}>
          {heading}
        </Typography>
      ) : null}
      {content}
    </Box>
  );
}

export function MobilizeFeedAdsRail({ items }: Props) {
  if (!items.length) return null;

  return (
    <MobilizeRecommendationsCard sticky={false} variant="groupFeed">
      <Stack spacing={2.5}>
        {items.map((block) => {
          if (block.type === "image") {
            return (
              <AdImageBlock
                key={block.id}
                title={block.title}
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
                title={block.title}
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
