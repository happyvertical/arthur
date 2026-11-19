import { host } from '$lib/server/smrt';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = (event) => host.history(event);
