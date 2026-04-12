import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().min(1, 'Name is required').max(60, 'Name too long').trim(),
  description: z.string().max(200, 'Description too long').optional(),
  welcomeMessage: z.string().max(300, 'Welcome message too long').optional(),
  duration: z.number().min(15).max(720),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color'),
  autoOpenHour: z.number().min(0).max(23).nullable().optional(),
  autoCloseHour: z.number().min(0).max(23).nullable().optional(),
});

export const updateRoomSchema = createRoomSchema.partial().extend({
  id: z.string().uuid(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(500).trim(),
  sessionId: z.string().uuid(),
  alias: z.string().min(1).max(40),
  aliasColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  isStaff: z.boolean().default(false),
});

export const joinRoomSchema = z.object({
  displayName: z.string().min(1).max(30).trim().optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
