FROM node:latest
RUN npm install -g jsdoc jasmine google-closure-compiler xmldom timezonecomplete
ENV NODE_PATH=/usr/local/lib/node_modules
WORKDIR /app
CMD ["make"]
