class WSClient {
  constructor() {
    this.ws = null;
    this.token = null;
    this.listeners = {};
  }

  connect(token) {
    this.token = token;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname === 'localhost' ? 'localhost:3000' : window.location.host;
    this.ws = new WebSocket(`${protocol}://${host}/ws?token=${token}`);

    this.ws.onopen = () => console.log('WebSocket conectado');
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type && this.listeners[msg.type]) {
        this.listeners[msg.type].forEach(cb => cb(msg));
      }
    };
    this.ws.onclose = () => setTimeout(() => this.connect(token), 3000);
  }

  on(type, callback) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(callback);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

export default new WSClient();