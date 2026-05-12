import { prisma } from '@/lib/prisma';
import { sendCancellationEmail } from '@/lib/email';
import { deleteCalendarEvent } from '@/lib/microsoftGraph';
import { createNotification } from '@/lib/notifications';
import { BookingStatus } from '@prisma/client';

const redirect = (url: string) =>
  new Response(null, { status: 302, headers: { Location: url } });

export async function GET(request: Request) {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://salas.mazzotiniadvogados.com.br';
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return redirect(`${baseUrl}/cancelar-reserva?error=token_invalido`);
  }

  try {
    const booking = await prisma.booking.findFirst({
      where: { cancelToken: token },
      include: { user: true, room: true }
    });

    if (!booking) {
      return redirect(`${baseUrl}/cancelar-reserva?error=nao_encontrado`);
    }

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REJECTED) {
      return redirect(`${baseUrl}/cancelar-reserva?status=ja_cancelado`);
    }

    if (booking.meetingId) {
      await deleteCalendarEvent(booking.meetingId);
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CANCELLED }
    });

    if (booking.user.email) {
      await sendCancellationEmail(
        booking.user.email, booking.title, booking.room.name,
        booking.startTime, booking.endTime
      );
    }

    await createNotification({
      type: 'BOOKING_CANCELLED_BY_USER',
      title: `Reserva cancelada: ${booking.title}`,
      body: { userName: booking.user.name || booking.user.email, roomName: booking.room.name, startTime: booking.startTime, endTime: booking.endTime },
      bookingId: booking.id,
      forAdmin: true,
    });

    return redirect(
      `${baseUrl}/cancelar-reserva?status=cancelado&titulo=${encodeURIComponent(booking.title)}`
    );
  } catch (error) {
    console.error('Erro ao cancelar reserva via token:', error);
    return redirect(`${baseUrl}/cancelar-reserva?error=erro_interno`);
  }
}
