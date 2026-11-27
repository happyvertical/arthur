import { ChatMessage as ChatMessageBase } from '@happyvertical/smrt-chat';
import { smrt } from '@happyvertical/smrt-core';

@smrt({ replaceParent: true })
export class ChatMessage extends ChatMessageBase {}
