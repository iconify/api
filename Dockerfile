ARG ARCH=amd64
ARG NODE_VERSION=18
ARG OS=bullseye-slim
ARG ICONIFY_API_VERSION=3.1.1
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
    mkdir -p /data/iconify-api && \
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
ARG SRC_PATH

# Copy package files, install dependencies
COPY ${SRC_PATH}*.json ./
RUN npm ci

# Copy src and icons
COPY ${SRC_PATH}src/ /data/iconify-api/src/
COPY ${SRC_PATH}icons/ /data/iconify-api/icons/

# Build API
RUN npm run build

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
    org.label-schema.name="Iconify API" \
    org.label-schema.version=${BUILD_VERSION} \
    org.label-schema.description="Node.js version of api.iconify.design" \
    org.label-schema.url="https://github.com/iconify/api" \
    org.label-schema.vcs-ref=${BUILD_REF} \
    org.label-schema.vcs-type="Git" \
    org.label-schema.vcs-url="https://github.com/iconify/api" \
    org.label-schema.arch=${ARCH} \
    authors="Vjacheslav Trushkin"

RUN rm -rf /tmp/*

# Env variables
ENV ICONIFY_API_VERSION=$ICONIFY_API_VERSION

# Expose the listening port of Iconify API
EXPOSE 3000

# Add a healthcheck (default every 30 secs)
HEALTHCHECK CMD curl http://localhost:3000/ || exit 1

CMD ["npm", "run", "start"]
