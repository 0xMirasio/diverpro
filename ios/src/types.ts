export type Locale = "en" | "fr" | "es";
export type Visibility = "PUBLIC" | "PRIVATE";

export type User = {
  id: string;
  publicId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: "USER" | "ADMIN";
  locale?: Locale;
  birthDate?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  profileVisibility?: Visibility;
  logbookVisibility?: Visibility;
};

export type MediaRef = { id: string };
export type Dive = { id: string; date: string; siteName: string; depthM: number; durationMinutes: number; groupCount: number; details: string | null; latitude: number | null; longitude: number | null; visibility: Visibility; photos: MediaRef[] };
export type Plan = { id: string; plannedFor: string; plannedUntil: string; siteName: string; details: string | null; latitude: number | null; longitude: number | null; visibility: Visibility };
export type Review = { id: string; siteId?: string | null; siteName: string; latitude: number; longitude: number; rating: number; comment: string | null; photos: MediaRef[]; site?: { id: string; name: string; description?: string | null } };
export type Diver = { publicId: string; username: string; firstName: string | null; lastName: string | null; avatarUrl: string | null; relationship?: { id: string; status: string; incoming: boolean } | null; friendshipId?: string; requestId?: string };
export type Place = { name?: string; displayName?: string; label?: string; latitude: number; longitude: number; type?: string };
export type Site = { id: string; name?: string; siteName?: string; latitude: number; longitude: number; description?: string | null; source?: string; siteSource?: string; countryName?: string | null; seaName?: string | null; locationLabel?: string | null; maxDepthM?: number | null; reviewCount?: number; reviews?: Array<Review & { user?: { publicId: string | null; username: string | null } }> };
export type MapPoint = { id: string; type: "dive" | "plan" | "site"; source?: "self" | "friend" | "community"; siteName: string; latitude: number; longitude: number; date?: string; endDate?: string; visibility?: Visibility; owner?: { publicId: string | null; username: string | null }; siteSource?: string; description?: string | null; reviewCount?: number };

export type PublicProfile = {
  publicId: string; username: string; firstName: string | null; lastName: string | null;
  bio: string | null; avatarUrl: string | null; age: number | null; createdAt: string;
  full: boolean; self: boolean; relationship: { id?: string; status: string; incoming: boolean } | null;
  dives: Dive[]; plans: Plan[]; reviews: Review[];
};
