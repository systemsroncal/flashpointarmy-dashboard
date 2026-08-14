export type MobilizeFeedAdLinkTarget = {
  href: string;
  className?: string;
  elementId?: string;
};

export type MobilizeFeedAdCarouselSlide = MobilizeFeedAdLinkTarget & {
  image_url: string;
};

export type MobilizeFeedAdImageBlock = {
  id: string;
  type: "image";
  sort_order: number;
  /** Optional heading above the image block. */
  title?: string;
  image_url: string;
  href: string;
  className?: string;
  elementId?: string;
};

export type MobilizeFeedAdCarouselBlock = {
  id: string;
  type: "carousel";
  sort_order: number;
  /** Optional heading above the carousel. */
  title?: string;
  slides: MobilizeFeedAdCarouselSlide[];
  /** Advance slides automatically. Default true. */
  autoplay?: boolean;
  /** Autoplay interval (discrete) or full-loop duration (continuous), in ms. */
  speed_ms?: number;
  /** Seamless horizontal scroll instead of one-slide-at-a-time. */
  continuous_rotation?: boolean;
  className?: string;
  elementId?: string;
};

export type MobilizeFeedAdRichTextBlock = {
  id: string;
  type: "rich_text";
  sort_order: number;
  html: string;
  className?: string;
  elementId?: string;
};

export type MobilizeFeedAdBlock =
  | MobilizeFeedAdImageBlock
  | MobilizeFeedAdCarouselBlock
  | MobilizeFeedAdRichTextBlock;
