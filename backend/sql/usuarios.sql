// Exportamos strings o funciones que devuelven queries parametrizadas
module.exports = {
  crearUsuario: `
    INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id)
    VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE nombre = $5))
    RETURNING id, nombre, apellido, email, (SELECT nombre FROM roles WHERE id = rol_id) as rol
  `,
  buscarPorEmail: `
    SELECT u.id, u.nombre, u.apellido, u.email, u.password_hash, r.nombre as rol
    FROM usuarios u
    JOIN roles r ON u.rol_id = r.id
    WHERE u.email = $1 AND u.activo = true
  `,
  buscarPorId: `
    SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, r.nombre as rol
    FROM usuarios u
    JOIN roles r ON u.rol_id = r.id
    WHERE u.id = $1
  `,
};