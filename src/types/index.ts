export type Category = 
  | 'job' 
  | 'internship' 
  | 'scholarship' 
  | 'free-course' 
  | 'udemy-coupon' 
  | 'opportunity' 
  | 'blog'
  | string;

export interface Post {
  id: string;
  title: string;
  slug: string;
  category: Category;
  description: string; // rich text / markdown
  thumbnail: string; // image URL
  externalLink: string;
  deadline: any | null; // Firestore Timestamp
  isFeatured: boolean;
  isActive: boolean;
  tags: string[];
  views: number;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  authorUid: string;
  location?: string;
  salary?: string;
  // SEO Fields
  seoTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  ogImage?: string;
  ctaText?: string;
  ctaColor?: string;
  whatsappNumber?: string;
  whatsappButtonText?: string;
  externalLinkText?: string;
}

export interface Subscriber {
  id?: string;
  email: string;
  subscribedAt: any; // Firestore Timestamp
}

export interface CategoryConfig {
  id: string;
  name: string;
  slug: string;
  icon: string; // emoji or lucide icon name
  color: string; // hex color
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export interface SocialLink {
  id: string;
  label: string;
  url: string;
  icon: string;
  isActive: boolean;
}

export interface TelegramBotConfig {
  botToken: string;
  channelId: string;
  isAutoPostEnabled: boolean;
  messageTemplate: string;
}

export interface SocialLinks {
  whatsappGroup?: SocialLink;
  whatsappChannel?: SocialLink;
  telegramGroup?: SocialLink;
  telegramChannel?: SocialLink;
  twitter?: SocialLink;
  instagram?: SocialLink;
  facebook?: SocialLink;
  youtube?: SocialLink;
  linkedin?: SocialLink;
  tiktok?: SocialLink;
  telegram?: SocialLink; // Added for general telegram link
  whatsapp?: SocialLink; // Added for general whatsapp link
  telegramBot?: TelegramBotConfig;
}

export interface SiteConfig {
  siteName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  copyrightText: string;
  metaDescription: string;
  metaKeywords: string;
  googleAnalyticsId: string;
  isMaintenanceMode: boolean;
  showFeaturedOnHome: boolean;
  // Hero Banner Settings
  heroHeadline?: string;
  heroSubtitle?: string;
  showHeroText?: boolean;
  heroBgColor?: string;
  heroTextColor?: string;
  // Global SEO Settings
  googleSearchConsoleId?: string;
  bingWebmasterId?: string;
  facebookPixelId?: string;
}

export interface BannerConfig {
  message: string;
  link: string;
  linkLabel: string;
  bgColor: string;
  textColor: string;
  isEnabled: boolean;
  expiryDate: any | null; // Firestore Timestamp
}

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  displayName?: string;
  fullName?: string;
  photoURL?: string;
  role: 'admin';
  lastLogin?: any; // Firestore Timestamp
}

export interface AdNetworkConfig {
  name: string;
  isEnabled: boolean;
  publisherId: string;
  autoAdsEnabled: boolean;
  scriptCode: string;
}

export interface AdZoneConfig {
  enabled: boolean;
  adCode: string;
  network?: string;
}

export interface MonetizationConfig {
  masterSwitch: boolean;
  
  // Homepage Settings
  homepageAdsEnabled: boolean;
  homepageAdNetwork: string;
  homepageAdCode: string;
  homepageAdFrequency: number;
  homepageMaxAds: number;
  heroAdEnabled: boolean;
  heroAdCode: string;

  // Article Settings
  articleAdsEnabled: boolean;
  articleAdNetwork: string;
  articleAdCode: string;
  articleAdFrequency: number;
  articleMaxAds: number;
  aboveArticleAdEnabled: boolean;
  belowArticleAdEnabled: boolean;
  sidebarAdEnabled: boolean;
  sidebarAdCode: string;

  // Blog/Category Settings
  blogAdsEnabled: boolean;

  // AdsTarget Global
  adsTargetGlobalScript: string;

  // Legacy/General
  adsenseEnabled: boolean;
  adsensePublisherId: string;
  adsenseInArticleSlot: string;
  adsenseAutoAdsEnabled: boolean;
  
  adsterraEnabled: boolean;
  adsterraInArticleCode: string;
  adsterraSocialBarCode: string;
  adsterraPopunderCode: string;
  
  monetagEnabled: boolean;
  monetagSiteId: string;
  monetagInPagePushCode: string;
  monetagInArticleCode: string;
  monetagPushNotificationsEnabled: boolean;
  
  adFrequency: number;
  maxAdsPerArticle: number;
  hideAdsOnMobile: boolean;
  hideAdsForAdmin: boolean;
  
  zones?: {
    [key: string]: AdZoneConfig;
  };
}
