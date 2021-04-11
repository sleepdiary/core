FROM node:latest
RUN \
    git clone --depth 1 https://github.com/wolfcw/libfaketime.git /tmp/libfaketime && \
    sed -i -e 's/\/usr\/local/\/tmp\/libfaketime/' /tmp/libfaketime/Makefile /tmp/libfaketime/*/Makefile && \
    make -j -C /tmp/libfaketime/src && \
    ln -s . /tmp/libfaketime/lib && \
    ln -s src /tmp/libfaketime/faketime && \
    \
    npm install -g jsdoc google-closure-compiler jasmine xmldom timezonecomplete puppeteer exceljs && \
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
