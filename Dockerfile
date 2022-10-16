ARG ARCH=amd64
ARG NODE_VERSION=16
ARG OS=bullseye-slim
ARG ICONIFY_API_VERSION=3.0.0
ARG SRC_PATH=./

#### Stage BASE ########################################################################################################
FROM ${ARCH}/node:${NODE_VERSION}-${OS} AS base

# This gives node.js apps access to the OS CAs
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

# This handles using special APT sources during build only (it is safe to comment these 3 following lines out):
RUN cp /etc/apt/sources.list /etc/apt/sources.list.original
COPY tmp/sources.list /tmp/sources.list.tmp
RUN ([ -s /tmp/sources.list.tmp ] && mv -f /tmp/sources.list.tmp /etc/apt/sources.list && cat /etc/apt/sources.list) || (cat /etc/apt/sources.list)

# Add temporary CERTs needed during build (it is safe to comment the following 1 line out):
COPY tmp/build-ca-cert.crt /usr/local/share/ca-certificates/build-ca-cert.crt

# Install tools, create data dir, add user and set rights
RUN set -ex && \
    apt-get update && \
    apt-get install --no-install-recommends -y \
        ca-certificates \
        bash \
        curl \
        nano \
        git && \
    npm install --location=global pnpm && \
    mkdir -p /data/iconify-api && \
    deluser --remove-home node && \
    useradd --home-dir /data/iconify-api --uid 1000 --shell /bin/bash iconify-api && \
    chown -R iconify-api:root /data/iconify-api && chmod -R g+rwX /data/iconify-api && \
    apt-get clean && \
    rm -rf /tmp/* && \
    # Restore the original sources.list
    ([ -s /etc/apt/sources.list.original ] && mv /etc/apt/sources.list.original /etc/apt/sources.list) && \
    # Remove the temporary build CA cert
    rm -f /usr/local/share/ca-certificates/build-ca-cert.crt

# Set work directory
WORKDIR /data/iconify-api

#### Stage iconify-api-install #########################################################################################
FROM base AS iconify-api-install

# Make CERTAIN peer dependencies are installed, otherwise this will very likely fail

COPY ${SRC_PATH} /data/iconify-api/
COPY init.sh /init.sh

RUN cp -fR /data/iconify-api/src/config /data/config_default && \
    pnpm install

#### Stage RELEASE #####################################################################################################
FROM iconify-api-install AS RELEASE
ARG BUILD_DATE
ARG BUILD_VERSION
ARG BUILD_REF
ARG ICONIFY_API_VERSION
ARG ARCH
ARG TAG_SUFFIX=default

LABEL org.label-schema.build-date=${BUILD_DATE} \
    org.label-schema.docker.dockerfile="Dockerfile" \
    org.label-schema.license="MIT" \
    org.label-schema.name="Iconify API.js" \
    org.label-schema.version=${BUILD_VERSION} \
    org.label-schema.description="Node.js version of api.iconify.design" \
    org.label-schema.url="https://github.com/iconify/api.js" \
    org.label-schema.vcs-ref=${BUILD_REF} \
    org.label-schema.vcs-type="Git" \
    org.label-schema.vcs-url="https://github.com/iconify/api.js" \
    org.label-schema.arch=${ARCH} \
    authors="Vjacheslav Trushkin"

RUN rm -rf /tmp/*

# Env variables
ENV ICONIFY_API_VERSION=$ICONIFY_API_VERSION

# Expose the listening port of Iconify API
EXPOSE 3000

# Add a healthcheck (default every 30 secs)
HEALTHCHECK CMD curl http://localhost:3000/ || exit 1

ENTRYPOINT ["/init.sh"]
