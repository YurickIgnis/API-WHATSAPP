const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    // const token = req.headers['authorization'];
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).send({ message: "Se requiere token para autenticación" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        console.error("Error al verificar el token:", error);
        return res.status(401).send({ message: "Token inválido", error: error.message });
    }
}

module.exports = verificarToken;
