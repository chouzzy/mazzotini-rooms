import { prisma } from './prisma';

export type NotificationType =
  | 'NEW_BOOKING'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED_BY_USER'
  | 'RESCHEDULE_REQUESTED'
  | 'RESCHEDULE_APPROVED'
  | 'RESCHEDULE_REJECTED';

interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: Record<string, unknown>;
  bookingId?: string;
  forAdmin?: boolean;
  userId?: string;
}

export async function createNotification(data: NotificationPayload) {
  try {
    await prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        body: JSON.stringify(data.body),
        bookingId: data.bookingId,
        forAdmin: data.forAdmin ?? false,
        userId: data.userId,
      },
    });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
  }
}
