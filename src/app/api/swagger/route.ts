const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Mazzotini Rooms API',
    description:
      'API de gestão de salas de reunião — Mazzotini Advogados Associados.\n\n' +
      '**Autenticação:** todas as rotas protegidas exigem sessão válida via NextAuth (cookie `next-auth.session-token`). ' +
      'Rotas marcadas com 🔒 requerem `role: ADMIN`.',
    version: '1.0.0',
    contact: { name: 'Dev Mazzotini', email: 'dev.mazzotini@mazzotiniadvogados.com.br' },
  },
  servers: [
    { url: 'https://salas.mazzotiniadvogados.com.br', description: 'Produção' },
    { url: 'http://localhost:3000', description: 'Local' },
  ],
  tags: [
    { name: 'Bookings',      description: 'Reservas de salas' },
    { name: 'Rooms',         description: 'Gestão de salas' },
    { name: 'Users',         description: 'Gestão de usuários' },
    { name: 'Notifications', description: 'Notificações em tempo real' },
    { name: 'Upload',        description: 'Upload de imagens' },
  ],
  components: {
    schemas: {
      Room: {
        type: 'object',
        properties: {
          id:          { type: 'string', example: '6a03...' },
          name:        { type: 'string', example: 'Sala Executiva' },
          capacity:    { type: 'integer', example: 10 },
          imageUrl:    { type: 'string', nullable: true },
          amenities:   { type: 'array', items: { type: 'string' }, example: ['TV', 'Ar-condicionado'] },
          description: { type: 'string', nullable: true },
          isActive:    { type: 'boolean', example: true },
          createdAt:   { type: 'string', format: 'date-time' },
          updatedAt:   { type: 'string', format: 'date-time' },
        },
      },
      BookingStatus: {
        type: 'string',
        enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'RESCHEDULE_PENDING'],
      },
      MeetingType: {
        type: 'string',
        enum: ['IN_PERSON', 'ONLINE'],
      },
      Guest: {
        type: 'object',
        properties: {
          name:  { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id:                 { type: 'string' },
          title:              { type: 'string', example: 'Reunião de Alinhamento' },
          startTime:          { type: 'string', format: 'date-time' },
          endTime:            { type: 'string', format: 'date-time' },
          type:               { $ref: '#/components/schemas/MeetingType' },
          status:             { $ref: '#/components/schemas/BookingStatus' },
          onlineMeetingUrl:   { type: 'string', nullable: true },
          meetingId:          { type: 'string', nullable: true, description: 'ID do evento no Microsoft Graph' },
          cancelToken:        { type: 'string', nullable: true, description: 'Token único para cancelamento via e-mail' },
          guests:             { type: 'string', nullable: true, description: 'JSON stringified com lista de convidados' },
          requestedStartTime: { type: 'string', format: 'date-time', nullable: true },
          requestedEndTime:   { type: 'string', format: 'date-time', nullable: true },
          userId:             { type: 'string' },
          roomId:             { type: 'string' },
          createdAt:          { type: 'string', format: 'date-time' },
          updatedAt:          { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            properties: {
              name:  { type: 'string' },
              email: { type: 'string', format: 'email' },
            },
          },
          room: {
            type: 'object',
            properties: {
              name:      { type: 'string' },
              capacity:  { type: 'integer' },
              amenities: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id:    { type: 'string' },
          name:  { type: 'string' },
          email: { type: 'string', format: 'email' },
          image: { type: 'string', nullable: true },
          role:  { type: 'string', enum: ['USER', 'ADMIN'] },
          isVip: { type: 'boolean' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id:        { type: 'string' },
          type:      {
            type: 'string',
            enum: ['NEW_BOOKING','BOOKING_CONFIRMED','BOOKING_REJECTED','BOOKING_CANCELLED_BY_USER','RESCHEDULE_REQUESTED','RESCHEDULE_APPROVED','RESCHEDULE_REJECTED'],
          },
          title:     { type: 'string' },
          body:      { type: 'string', description: 'JSON com detalhes: roomName, userName, startTime, endTime, etc.' },
          bookingId: { type: 'string', nullable: true },
          forAdmin:  { type: 'boolean' },
          userId:    { type: 'string', nullable: true },
          read:      { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Mensagem de erro' },
        },
      },
    },
  },
  paths: {
    // ─── BOOKINGS ──────────────────────────────────────────────────────────
    '/api/bookings': {
      post: {
        tags: ['Bookings'],
        summary: 'Criar reserva',
        description: 'Cria uma nova solicitação de reserva com status PENDING. Valida antecedência mínima de 1h para usuários não-VIP e detecta conflitos de horário.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['roomId', 'userId', 'title', 'startTime', 'endTime'],
                properties: {
                  roomId:    { type: 'string' },
                  userId:    { type: 'string' },
                  title:     { type: 'string', example: 'Reunião de Alinhamento' },
                  startTime: { type: 'string', format: 'date-time' },
                  endTime:   { type: 'string', format: 'date-time' },
                  isOnline:  { type: 'boolean', default: false },
                  guests:    { type: 'array', items: { $ref: '#/components/schemas/Guest' } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Reserva criada com sucesso', content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } } },
          400: { description: 'Campos obrigatórios ausentes ou antecedência insuficiente', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: {
            description: 'Conflito de horário. Se houver sala alternativa, retorna `suggestion`.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error:      { type: 'string', example: 'Sala Ocupada' },
                    suggestion: {
                      type: 'object',
                      nullable: true,
                      properties: {
                        id:       { type: 'string' },
                        name:     { type: 'string' },
                        capacity: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      get: {
        tags: ['Bookings'],
        summary: 'Listar reservas',
        description: 'Retorna reservas filtradas por e-mail do usuário, roomId ou todas (parâmetro `all=true`). Inclui dados de sala e usuário.',
        parameters: [
          { name: 'email',  in: 'query', schema: { type: 'string', format: 'email' }, description: 'Filtrar pelo e-mail do usuário' },
          { name: 'roomId', in: 'query', schema: { type: 'string' }, description: 'Filtrar por sala' },
          { name: 'all',    in: 'query', schema: { type: 'string', enum: ['true'] }, description: 'Retornar todas as reservas (sem filtro)' },
        ],
        responses: {
          200: { description: 'Lista de reservas', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Booking' } } } } },
        },
      },
      put: {
        tags: ['Bookings'],
        summary: '🔒 Atualizar reserva (admin)',
        description: 'Permite ao admin aprovar, rejeitar ou remanejar uma reserva. Também processa pedidos de remanejamento via `action`.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: {
                  id:        { type: 'string', description: 'ID da reserva' },
                  status:    { $ref: '#/components/schemas/BookingStatus' },
                  roomId:    { type: 'string', description: 'Nova sala (opcional)' },
                  startTime: { type: 'string', format: 'date-time' },
                  endTime:   { type: 'string', format: 'date-time' },
                  action:    {
                    type: 'string',
                    enum: ['approve_reschedule', 'reject_reschedule'],
                    description: 'Ação sobre pedido de remanejamento do usuário',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Reserva atualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } } },
          401: { description: 'Não autenticado' },
          403: { description: 'Requer role ADMIN' },
          409: { description: 'Conflito de horário', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Bookings'],
        summary: 'Solicitar remanejamento (usuário)',
        description: 'Usuário autenticado pode solicitar alteração de horário de sua própria reserva CONFIRMED. A reserva vai para `RESCHEDULE_PENDING` aguardando aprovação do admin. Admins têm a alteração confirmada diretamente.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id', 'requestedStartTime', 'requestedEndTime'],
                properties: {
                  id:                 { type: 'string' },
                  requestedStartTime: { type: 'string', format: 'date-time' },
                  requestedEndTime:   { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Pedido registrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } } },
          400: { description: 'Reserva não está CONFIRMED ou horário inválido' },
          401: { description: 'Não autenticado' },
          403: { description: 'Reserva pertence a outro usuário' },
          409: { description: 'Novo horário já ocupado' },
        },
      },
      delete: {
        tags: ['Bookings'],
        summary: 'Cancelar reserva',
        description: 'Remove a reserva do banco e deleta o evento do calendário Microsoft. Envia e-mail de cancelamento.',
        parameters: [
          { name: 'id', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          204: { description: 'Cancelada com sucesso' },
          404: { description: 'Reserva não encontrada' },
        },
      },
    },
    '/api/bookings/cancel': {
      get: {
        tags: ['Bookings'],
        summary: 'Cancelar via token (e-mail)',
        description: 'Cancela uma reserva usando o token enviado no e-mail de confirmação. Não requer autenticação. Redireciona para `/cancelar-reserva` com status no query param.',
        parameters: [
          { name: 'token', in: 'query', required: true, schema: { type: 'string' }, description: 'cancelToken único da reserva' },
        ],
        responses: {
          302: { description: 'Redirect para /cancelar-reserva?status=cancelado ou ?error=...' },
        },
      },
    },

    // ─── ROOMS ─────────────────────────────────────────────────────────────
    '/api/rooms': {
      get: {
        tags: ['Rooms'],
        summary: 'Listar salas',
        description: 'Retorna todas as salas cadastradas.',
        responses: {
          200: { description: 'Lista de salas', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Room' } } } } },
        },
      },
      post: {
        tags: ['Rooms'],
        summary: '🔒 Criar sala',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'capacity'],
                properties: {
                  name:        { type: 'string' },
                  capacity:    { type: 'integer' },
                  imageUrl:    { type: 'string' },
                  amenities:   { type: 'array', items: { type: 'string' } },
                  description: { type: 'string' },
                  isActive:    { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Sala criada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
        },
      },
    },
    '/api/rooms/{id}': {
      get: {
        tags: ['Rooms'],
        summary: 'Buscar sala por ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Sala encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
          404: { description: 'Sala não encontrada' },
        },
      },
      put: {
        tags: ['Rooms'],
        summary: '🔒 Atualizar sala',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name:        { type: 'string' },
                  capacity:    { type: 'integer' },
                  imageUrl:    { type: 'string' },
                  amenities:   { type: 'array', items: { type: 'string' } },
                  description: { type: 'string' },
                  isActive:    { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Sala atualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
        },
      },
      delete: {
        tags: ['Rooms'],
        summary: '🔒 Deletar sala',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Sala deletada' },
          404: { description: 'Sala não encontrada' },
        },
      },
    },

    // ─── USERS ─────────────────────────────────────────────────────────────
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: '🔒 Listar usuários',
        description: 'Lista usuários com paginação e busca por nome/e-mail.',
        parameters: [
          { name: 'page',   in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',  in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Busca por nome ou e-mail' },
        ],
        responses: {
          200: {
            description: 'Lista paginada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users:       { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    total:       { type: 'integer' },
                    totalPages:  { type: 'integer' },
                    currentPage: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['Users'],
        summary: '🔒 Atualizar usuário',
        description: 'Atualiza `role` e/ou `isVip` de um usuário. Admins protegidos (PERMANENT_ADMINS) não podem ter o role alterado.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: {
                  id:    { type: 'string' },
                  role:  { type: 'string', enum: ['USER', 'ADMIN'] },
                  isVip: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Usuário atualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          403: { description: 'Tentativa de alterar admin protegido' },
        },
      },
    },
    '/api/users/invite': {
      post: {
        tags: ['Users'],
        summary: '🔒 Convidar usuário',
        description: 'Cria um usuário pré-cadastrado e envia e-mail de convite com link de acesso via Azure AD.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email'],
                properties: {
                  name:  { type: 'string' },
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Convite enviado' },
          409: { description: 'E-mail já cadastrado' },
        },
      },
    },

    // ─── NOTIFICATIONS ─────────────────────────────────────────────────────
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Listar notificações',
        description: 'Admins recebem notificações com `forAdmin: true`. Usuários recebem as suas próprias. Retorna as 30 mais recentes.',
        responses: {
          200: { description: 'Lista de notificações', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Notification' } } } } },
          401: { description: 'Não autenticado' },
        },
      },
      patch: {
        tags: ['Notifications'],
        summary: 'Marcar como lida',
        description: 'Marca uma notificação específica ou todas como lidas.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id:      { type: 'string', description: 'ID de uma notificação específica' },
                  markAll: { type: 'boolean', description: 'Se true, marca todas como lidas' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Atualizado', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } } },
          401: { description: 'Não autenticado' },
        },
      },
    },

    // ─── UPLOAD ────────────────────────────────────────────────────────────
    '/api/upload': {
      post: {
        tags: ['Upload'],
        summary: '🔒 Upload de imagem',
        description: 'Faz upload de uma imagem para o storage e retorna a URL pública.',
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } },
        },
        responses: {
          200: {
            description: 'URL da imagem',
            content: { 'application/json': { schema: { type: 'object', properties: { url: { type: 'string' } } } } },
          },
        },
      },
    },
  },
};

export function GET() {
  return new Response(JSON.stringify(spec), {
    headers: { 'Content-Type': 'application/json' },
  });
}
