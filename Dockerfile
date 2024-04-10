# Usa la imagen oficial de Node.js como imagen base
FROM node:14

# Actualiza los paquetes e instala las dependencias necesarias para Puppeteer
RUN apt-get update \
    && apt-get install -y wget gnupg ca-certificates procps libxss1 \
      libasound2 libatk-bridge2.0-0 libatspi2.0-0 libdrm2 libgbm1 libgtk-3-0 libnspr4 \
      libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 xauth xvfb \
    # Limpieza de archivos de paquetes descargados
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

RUN chown root:root /app

# Cambia al usuario 'root' (usuario no root proporcionado por la imagen base de root)
USER root

# Copia los archivos de definición de paquetes y los instala
COPY --chown=root:root package*.json ./
RUN npm install

# Copia el resto de tu código de aplicación
COPY --chown=root:root . .


# Expone el puerto que tu app utiliza
EXPOSE 3000

# Comando para ejecutar tu app
CMD ["node", "src/index.js"]
