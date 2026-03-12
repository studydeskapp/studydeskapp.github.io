// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  CHAT MANAGEMENT LOGIC                                                       │
// │  Handles chat history, titles, and persistence                              │
// └──────────────────────────────────────────────────────────────────────────────┘

import { callGemini } from '../utils/gemini';

export function createNewChat() {
  return {
    id: Date.now().toString(),
    title: 'New Chat',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export async function generateChatTitle(messages) {
  if (messages.length === 0) return 'New Chat';
  
  // Get first few messages for context
  const context = messages.slice(0, 4).map(m => m.text).join('\n');
  
  try {
    const prompt = `Generate a brief, minimal title (3-5 words max) for this chat conversation. Return ONLY the title, nothing else:\n\n${context.slice(0, 500)}`;
    const title = await callGemini(prompt, 'You generate brief chat titles.');
    return title.trim().replace(/^["']|["']$/g, '').slice(0, 50);
  } catch (error) {
    console.error('Failed to generate title:', error);
    // Fallback: use first message
    const firstUserMsg = messages.find(m => m.role === 'user');
    if (firstUserMsg) {
      return firstUserMsg.text.slice(0, 40) + (firstUserMsg.text.length > 40 ? '...' : '');
    }
    return 'New Chat';
  }
}

export function getTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now - then) / 1000);
  
  if (seconds < 10) return 'now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export function getLastMessage(messages) {
  if (messages.length === 0) return 'No messages yet';
  const last = messages[messages.length - 1];
  const text = last.text.replace(/<[^>]*>/g, '').trim(); // Strip HTML
  return text.slice(0, 60) + (text.length > 60 ? '...' : '');
}

export function sortChatsByRecent(chats) {
  return [...chats].sort((a, b) => 
    new Date(b.updatedAt) - new Date(a.updatedAt)
  );
}

export function searchChats(chats, query) {
  if (!query.trim()) return chats;
  
  const q = query.toLowerCase();
  return chats.filter(chat => 
    chat.title.toLowerCase().includes(q) ||
    chat.messages.some(m => m.text.toLowerCase().includes(q))
  );
}
