/**
 * CoBuddy Customer — Support API Service
 * Maps to backend: src/modules/support/support.controller.ts
 */

import apiClient from './apiClient';

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  lastReply?: string;
  createdAt: string;
  updatedAt?: string;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  sender: 'customer' | 'support';
  text: string;
  createdAt: string;
}

export interface SupportCategory {
  id: string;
  label: string;
  icon?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  categoryId?: string;
}

// ─── List tickets ─────────────────────────────────────────────────────────────
export const listTickets = async (): Promise<SupportTicket[]> => {
  const res = await apiClient.get<SupportTicket[]>('/support/tickets');
  return res.data;
};

// ─── Create ticket ────────────────────────────────────────────────────────────
export const createTicket = async (data: {
  subject: string;
  category: string;
  message: string;
}): Promise<SupportTicket> => {
  const res = await apiClient.post<SupportTicket>('/support/tickets', data);
  return res.data;
};

// ─── Get ticket detail ────────────────────────────────────────────────────────
export const getTicketDetail = async (id: string): Promise<SupportTicket> => {
  const res = await apiClient.get<SupportTicket>(`/support/tickets/${id}`);
  return res.data;
};

// ─── Reply to ticket ──────────────────────────────────────────────────────────
export const replyToTicket = async (id: string, text: string): Promise<TicketMessage> => {
  const res = await apiClient.post<TicketMessage>(`/support/tickets/${id}/reply`, { text });
  return res.data;
};

// ─── Get categories ───────────────────────────────────────────────────────────
export const getSupportCategories = async (): Promise<SupportCategory[]> => {
  const res = await apiClient.get<SupportCategory[]>('/support/categories');
  return res.data;
};

// ─── Get FAQs ─────────────────────────────────────────────────────────────────
export const getFaqs = async (search?: string, categoryId?: string): Promise<FAQ[]> => {
  const res = await apiClient.get<FAQ[]>('/support/faqs', { params: { search, categoryId } });
  return res.data;
};
