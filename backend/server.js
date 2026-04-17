require('dotenv').config();
const app = require('./src/app');
const { generateAlerts } = require('./src/services/notification.service');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor SH México corriendo en puerto ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);

  // Generar alertas al iniciar y cada 6 horas
  generateAlerts().catch(console.error);
  setInterval(() => generateAlerts().catch(console.error), 6 * 60 * 60 * 1000);
});
