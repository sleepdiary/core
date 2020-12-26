FROM node:latest
RUN \
    git clone https://github.com/wolfcw/libfaketime.git /tmp/libfaketime && \
    cd /tmp/libfaketime/src/ && \
    make install && \
    \
    npm install -g jsdoc jasmine google-closure-compiler xmldom timezonecomplete puppeteer && \
    cd /usr/local/lib/node_modules/puppeteer && PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true node install.js && \
    \
    apt update && \
    apt install -y chromium && \
    apt clean && \
    rm -rf /var/lib/apt/lists/* && \
    { echo '#!/bin/sh' ; echo '/usr/bin/chromium --no-sandbox "$@"' ; } > /usr/bin/chromium-no-sandbox && \
    chmod 755 /usr/bin/chromium-no-sandbox && \
    \
    echo && echo "All packages installed!"
ENV NODE_PATH=/usr/local/lib/node_modules
WORKDIR /app
CMD ["/app/bin/compile.sh"]
