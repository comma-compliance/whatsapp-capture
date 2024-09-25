# largely borrowed from https://github.com/pedroslopez/whatsapp-web.js/issues/2542
FROM zenika/alpine-chrome:with-puppeteer

# Set the working directory inside the container
WORKDIR /usr/src/app

USER chrome

# Copy package.json and install dependencies
COPY --chown=chrome:chrome package*.json ./
RUN npm install

# Copy the source code
COPY ./src ./

# Expose the necessary port
EXPOSE 3000

