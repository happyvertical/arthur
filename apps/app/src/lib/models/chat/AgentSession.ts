import { AgentSession as AgentSessionBase } from '@happyvertical/smrt-chat';
import { smrt } from '@happyvertical/smrt-core';

@smrt({ replaceParent: true })
export class AgentSession extends AgentSessionBase {}
