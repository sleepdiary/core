FROM node:latest
RUN git clone https://github.com/wolfcw/libfaketime.git /tmp/libfaketime && \
    cd /tmp/libfaketime/src/ && \
    make install && \
    npm install -g jsdoc jasmine google-closure-compiler xmldom timezonecomplete
ENV NODE_PATH=/usr/local/lib/node_modules
WORKDIR /app
CMD ["make"]
