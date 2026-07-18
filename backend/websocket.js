// backend/websocket.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const config = require('./config/config');
const pool = require('./config/database');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    const urlParams = new URLSearchParams(req.url.slice(1));
    const token = urlParams.get('token');
    if (!token) {
      ws.close(4001, 'Token requerido');
      return;
    }

    let userId, userRole, userName;
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      userId = decoded.id;
      userRole = decoded.rol;
      userName = decoded.nombre;
    } catch (e) {
      ws.close(4002, 'Token inválido');
      return;
    }

    ws.userId = userId;
    ws.userRole = userRole;
    ws.userName = userName;

    console.log(`Cliente conectado: ${userName} (${userRole})`);

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'chat' && msg.pedidoId && msg.text && msg.to) {
          // Guardar en BD
          await pool.query(
            `INSERT INTO mensajes (pedido_id, remitente_id, destinatario_id, mensaje) VALUES ($1, $2, $3, $4)`,
            [msg.pedidoId, userId, msg.to, msg.text]
          );

          // Transmitir a los otros usuarios del mismo pedido
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN &&
                client.userId && client.userId !== userId &&
                (client.userId === msg.to || client.userRole === 'repartidor')) {
              client.send(JSON.stringify({
                type: 'chat',
                pedidoId: msg.pedidoId,
                from: userId,
                nombre: ws.userName,
                text: msg.text,
                timestamp: new Date().toISOString()
              }));
            }
          });
        }
      } catch (err) {
        console.error('Error en mensaje WS:', err);
      }
    });

    ws.on('close', () => {
      console.log('Cliente desconectado');
    });

    ws.send(JSON.stringify({ type: 'info', message: 'Conectado al chat en tiempo real' }));
  });
}

module.exports = setupWebSocket;