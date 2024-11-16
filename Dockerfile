# largely borrowed from https://github.com/pedroslopez/whatsapp-web.js/issues/2542
FROM zenika/alpine-chrome:with-puppeteer

# Set the working directory inside the container
WORKDIR /usr/src/app

USER chrome

# Copy package.json and install dependencies
COPY --chown=chrome:chrome package*.json ./
RUN npm install

# Run the Sentry wizard to set up source maps
RUN if [ -n "$SENTRY_ENV" ]; then npx @sentry/wizard@latest -i sourcemaps --saas; fi

# Copy the source code
COPY ./src ./

# Expose the necessary port
EXPOSE ${PORT:-3000}

# Start the application
CMD ["node", "app.js"]
