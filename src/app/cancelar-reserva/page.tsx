import Link from 'next/link';

interface Props {
  searchParams: { status?: string; titulo?: string; error?: string };
}

export default function CancelarReservaPage({ searchParams }: Props) {
  const { status, titulo, error } = searchParams;

  const isCancelled = status === 'cancelado';
  const isAlreadyCancelled = status === 'ja_cancelado';

  const getContent = () => {
    if (isCancelled) {
      return {
        icon: '✅',
        title: 'Reserva Cancelada',
        color: '#16a34a',
        bg: '#f0fdf4',
        border: '#16a34a',
        message: titulo
          ? `A reserva "${decodeURIComponent(titulo)}" foi cancelada com sucesso. A sala já está liberada para outros colaboradores.`
          : 'Sua reserva foi cancelada com sucesso.',
      };
    }
    if (isAlreadyCancelled) {
      return {
        icon: '⚠️',
        title: 'Reserva Já Cancelada',
        color: '#d97706',
        bg: '#fffbeb',
        border: '#d97706',
        message: 'Esta reserva já havia sido cancelada anteriormente.',
      };
    }
    return {
      icon: '❌',
      title: 'Não Foi Possível Cancelar',
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#dc2626',
      message:
        error === 'nao_encontrado'
          ? 'Link de cancelamento inválido ou expirado.'
          : 'Ocorreu um erro ao processar o cancelamento. Por favor, acesse a plataforma e cancele diretamente.',
    };
  };

  const content = getContent();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        padding: '24px',
      }}
    >
      <div
        style={{
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div
          style={{
            backgroundColor: '#1e3a8a',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ color: 'white', margin: 0, fontSize: '22px' }}>Mazzotini Rooms</h1>
        </div>

        <div style={{ padding: '40px 32px' }}>
          <div
            style={{
              backgroundColor: content.bg,
              border: `2px solid ${content.border}`,
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              marginBottom: '32px',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>{content.icon}</div>
            <h2 style={{ color: content.color, margin: '0 0 12px 0', fontSize: '20px' }}>
              {content.title}
            </h2>
            <p style={{ color: '#334155', margin: 0, lineHeight: '1.6', fontSize: '15px' }}>
              {content.message}
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link
              href="/minhas-reservas"
              style={{
                display: 'inline-block',
                backgroundColor: '#1e3a8a',
                color: '#ffffff',
                padding: '12px 28px',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              Ver Meus Agendamentos
            </Link>
          </div>
        </div>

        <div
          style={{
            textAlign: 'center',
            padding: '16px',
            borderTop: '1px solid #334155',
            color: '#64748b',
            fontSize: '12px',
          }}
        >
          &copy; {new Date().getFullYear()} Mazzotini Advogados
        </div>
      </div>
    </div>
  );
}
