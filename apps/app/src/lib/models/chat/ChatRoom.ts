import { ChatRoom as ChatRoomBase } from '@happyvertical/smrt-chat';
import { smrt } from '@happyvertical/smrt-core';

@smrt({ replaceParent: true })
export class ChatRoom extends ChatRoomBase {}
