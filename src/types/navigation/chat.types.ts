export interface ChatStackParamList {
  ChatListScreen: undefined;
  CompanionChatScreen: { companionName?: string; bookingId?: string; companionId?: string; conversationId?: string; isOnline?: boolean; } | undefined;
  ConciergeChatScreen: undefined;
  IncomingCallScreen: { callerName?: string } | undefined;
  VoiceCallScreen: { companionName?: string } | undefined;
};
