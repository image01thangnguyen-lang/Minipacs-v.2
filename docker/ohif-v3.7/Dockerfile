# syntax=docker/dockerfile:1

# Build OHIF from the upstream source repository, pinned to the v3.7 release.
# This follows the OHIF development flow: yarn install --frozen-lockfile,
# then yarn run build, and packages platform/app/dist behind nginx.

ARG OHIF_REPO=https://github.com/OHIF/Viewers.git
ARG OHIF_GIT_REF=v3.7.0

FROM node:18.16.1-slim AS source

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src
COPY ohif-viewer app

# Tối ưu hoá: Chỉ copy các file package.json và yarn.lock ra một thư mục riêng để cache yarn install
RUN mkdir -p /usr/src/json-only/app && \
    cd /usr/src/app && \
    find . -name "package.json" -exec cp --parents {} /usr/src/json-only/app/ \; && \
    cp yarn.lock preinstall.js /usr/src/json-only/app/

FROM node:18.16.1-slim AS builder

RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential python3 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy chỉ các file package.json vào trước
COPY --from=source /usr/src/json-only/app .

RUN yarn config set workspaces-experimental true
RUN yarn install --frozen-lockfile --verbose

# Sau khi yarn install xong mới copy toàn bộ source code vào
COPY --from=source /usr/src/app .

RUN yarn install --frozen-lockfile --verbose

ENV PATH=/usr/src/app/node_modules/.bin:$PATH
ENV QUICK_BUILD=true
ENV PUBLIC_URL=/viewer/

RUN sed -i 's|PUBLIC_URL=/|PUBLIC_URL=/viewer/|g' package.json platform/app/package.json || true
RUN yarn run build

FROM nginxinc/nginx-unprivileged:1.25-alpine AS final

ENV PORT=80

RUN rm /etc/nginx/conf.d/default.conf

USER nginx
COPY --chown=nginx:nginx --from=source /usr/src/app/.docker/Viewer-v3.x /usr/src
RUN chmod 777 /usr/src/entrypoint.sh

COPY --from=builder /usr/src/app/platform/app/dist /usr/share/nginx/html

USER root
RUN sed -i "s|https://[^\"']*polyfill\\.io[^\"']*|https://cdnjs.cloudflare.com/ajax/libs/polyfill/3.41.0/polyfill.min.js|g" /usr/share/nginx/html/index.html \
  && sed -i "/ohif-custom\\.css/d" /usr/share/nginx/html/index.html \
  && sed -i "/ohif-custom\\.js/d" /usr/share/nginx/html/index.html \
  && sed -i "s|</head>|<link rel=\"stylesheet\" href=\"/viewer/ohif-custom.css?v=mpacs-20260624-ohif370-source\"></head>|" /usr/share/nginx/html/index.html \
  && sed -i "s|</body>|<script src=\"/viewer/ohif-custom.js?v=mpacs-20260624-ohif370-source\"></script></body>|" /usr/share/nginx/html/index.html \
  && chmod 666 /usr/share/nginx/html/app-config.js

USER nginx

ENTRYPOINT ["/usr/src/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
