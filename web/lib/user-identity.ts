export function normalizeUsername(username: string) {
  return username.trim().toLocaleLowerCase("en-US");
}

export function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase("en-US");
}

export function slugifyIdentityPart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function publicIdBase(firstName: string, lastName: string) {
  const base = [slugifyIdentityPart(firstName), slugifyIdentityPart(lastName)]
    .filter(Boolean)
    .join("-");
  return base || "diver";
}

export function publicIdCandidate(base: string, attempt: number) {
  return attempt === 0 ? base : `${base}-${attempt + 1}`;
}
