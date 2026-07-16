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
  image_url: string;
  href: string;
  className?: string;
  elementId?: string;
};

export type MobilizeFeedAdCarouselBlock = {
  id: string;
  type: "carousel";
  sort_order: number;
  slides: MobilizeFeedAdCarouselSlide[];
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
