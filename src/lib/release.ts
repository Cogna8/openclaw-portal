export const RELEASE_VERSION = "v0.4";
export const RELEASE_VERSIONS = ["v0.1", "v0.2", "v0.3", "v0.4"] as const;
export type ReleaseVersion = (typeof RELEASE_VERSIONS)[number];
