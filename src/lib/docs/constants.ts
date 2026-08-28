export const DOCS_ORIGIN = "https://docs.prisma.events";

export const IDENTITY_GUIDE_DOCS_PATH = "en/processes/enrolment/dids/user-guide";

export function docsReadPath(docsPath: string): string {
  return docsPath.replace(/^\/+/, "").replace(/\/+$/, "");
}

export function identityGuideDocsUrl(): string {
  return `${DOCS_ORIGIN}/${IDENTITY_GUIDE_DOCS_PATH}`;
}
