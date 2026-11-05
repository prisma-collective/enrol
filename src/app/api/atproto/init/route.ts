import { NextRequest, NextResponse } from 'next/server';
import { pdsFromEnv } from '@/lib/atproto/enrol';
import { logger } from '@/lib/logger';
import { verifyInfraRequest } from '@/lib/private-auth';

export const runtime = 'nodejs';

/**
 * POST /api/atproto/init: creates enrol's own repo on the PDS, once, and
 * returns its DIDs. Set ENROL_REPO_DID to `repoDid`, and give `repoDid` to
 * the AppView as a trusted enrol (its ENROL_DIDS).
 *
 * Infra only: Authorization: Bearer <PRIVATE_API_TOKEN>.
 */
export async function POST(request: NextRequest) {
  const unauthorized = verifyInfraRequest(request);
  if (unauthorized) return unauthorized;

  const pds = pdsFromEnv();
  if (!pds) return NextResponse.json({ error: 'ATPDS_URL and ENROL_SIGNING_KEY must be set' }, { status: 503 });

  try {
    const repoDid = await pds.initiateRepo('Prisma enrol');
    logger.info('enrol repo created.', { repoDid, cardanoDid: pds.did });
    return NextResponse.json({ cardanoDid: pds.did, repoDid });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('enrol repo creation failed.', { message });
    return NextResponse.json({ error: message, cardanoDid: pds.did }, { status: 502 });
  }
}
