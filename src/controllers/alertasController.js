// src/controllers/alertasController.js
export const obtenerAlertas = async (req, res) => {
  try {
    // Lógica para obtener alertas
    res.json({ message: 'Alertas obtenidas' });
  } catch (error) {
    console.error('Error al obtener lotes vencidos:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
