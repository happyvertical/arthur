import { ChatParticipant as ChatParticipantBase } from '@happyvertical/smrt-chat';
import { smrt } from '@happyvertical/smrt-core';

@smrt({ replaceParent: true })
export class ChatParticipant extends ChatParticipantBase {}
