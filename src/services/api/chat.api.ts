/**
 * CoBuddy Customer — Chat API Service
 * Maps to backend: src/modules/chat/chat.controller.ts
 */

import apiClient from './apiClient';

export interface Conversation {
  id: string;
  type: 'companion' | 'concierge';
  companionId?: string;
  companionName?: string;
  bookingId?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  companionAvatar?: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'customer' | 'companion' | 'concierge';
  text?: string;
  attachmentUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface MessagesResponse {
  data: ChatMessage[];
  total: number;
  page: number;
  limit: number;
}

// ─── List conversations ───────────────────────────────────────────────────────
export const listConversations = async (): Promise<Conversation[]> => {
  const res = await apiClient.get<Conversation[]>('/chat/conversations');
  return res.data;
};

// ─── Get or create companion conversation ─────────────────────────────────────
export const getOrCreateCompanionConversation = async (
  companionId: string,
  bookingId?: string,
): Promise<Conversation> => {
  const res = await apiClient.post<Conversation>('/chat/conversations/companion', { companionId, bookingId });
  return res.data;
};

// ─── Get or create concierge conversation ─────────────────────────────────────
export const getOrCreateConciergeConversation = async (): Promise<Conversation> => {
  const res = await apiClient.post<Conversation>('/chat/conversations/concierge');
  return res.data;
};

// ─── Get messages ─────────────────────────────────────────────────────────────
export const getMessages = async (
  conversationId: string,
  page = 1,
  limit = 50,
): Promise<MessagesResponse> => {
  const res = await apiClient.get<any>(
    `/chat/conversations/${conversationId}/messages`,
    { params: { page, limit } },
  );
  const raw = res.data;
  const list: ChatMessage[] = Array.isArray(raw)
    ? raw
    : (raw?.data || raw?.messages || []);
  return {
    data: list,
    total: raw?.total ?? list.length,
    page,
    limit,
  };
};

// ─── Send message ─────────────────────────────────────────────────────────────
export const sendMessage = async (
  conversationId: string,
  text: string,
  attachmentUrl?: string,
): Promise<ChatMessage> => {
  const res = await apiClient.post<ChatMessage>(
    `/chat/conversations/${conversationId}/messages`,
    { text, attachmentUrl },
  );
  return res.data;
};

// ─── Mark conversation as read ────────────────────────────────────────────────
export const markConversationAsRead = async (conversationId: string): Promise<{ message: string }> => {
  const res = await apiClient.patch<{ message: string }>(`/chat/conversations/${conversationId}/read`);
  return res.data;
};
