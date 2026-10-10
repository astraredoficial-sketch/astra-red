"use client";

export type ChatMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string;
};

export type ConversationSummary = {
  otherId: string;
  lastMessage: string;
  updatedAt: string;
};

const KEY = "astrared:chat:v1";

function readMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];

  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(KEY) ?? "[]"
    );

    if (!Array.isArray(value)) return [];

    return value.filter(
      (item): item is ChatMessage =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.senderId === "string" &&
        typeof item.recipientId === "string" &&
        typeof item.text === "string" &&
        typeof item.createdAt === "string"
    );
  } catch {
    return [];
  }
}

export function getChatMessages(
  userId: string,
  otherId: string
): ChatMessage[] {
  return readMessages()
    .filter(
      (message) =>
        (message.senderId === userId &&
          message.recipientId === otherId) ||
        (message.senderId === otherId &&
          message.recipientId === userId)
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
    );
}

export function getConversations(
  userId: string
): ConversationSummary[] {
  const latest = new Map<string, ConversationSummary>();

  for (const message of readMessages()) {
    if (
      message.senderId !== userId &&
      message.recipientId !== userId
    ) {
      continue;
    }

    const otherId =
      message.senderId === userId
        ? message.recipientId
        : message.senderId;

    const previous = latest.get(otherId);

    if (
      !previous ||
      new Date(message.createdAt).getTime() >
        new Date(previous.updatedAt).getTime()
    ) {
      latest.set(otherId, {
        otherId,
        lastMessage: message.text,
        updatedAt: message.createdAt,
      });
    }
  }

  return [...latest.values()].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() -
      new Date(a.updatedAt).getTime()
  );
}

export function sendChatMessage(
  senderId: string,
  recipientId: string,
  text: string
): ChatMessage {
  const cleanText = text.trim();

  if (!senderId || !recipientId || senderId === recipientId) {
    throw new Error("La conversación no es válida.");
  }

  if (!cleanText) {
    throw new Error("Escribe un mensaje antes de enviarlo.");
  }

  if (typeof window === "undefined") {
    throw new Error("El chat solo está disponible en el navegador.");
  }

  const messages = readMessages();

  const message: ChatMessage = {
    id: crypto.randomUUID(),
    senderId,
    recipientId,
    text: cleanText,
    createdAt: new Date().toISOString(),
  };

  messages.push(message);
  window.localStorage.setItem(KEY, JSON.stringify(messages));

  return message;
}

