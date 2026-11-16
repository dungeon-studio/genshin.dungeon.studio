# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

FROM ghcr.io/jdx/mise:2026.11.8@sha256:5c6e71a86c8c997c32d30a169b4269bec9d4681a804e29078bac8f44109f2edc AS mise

FROM mcr.microsoft.com/devcontainers/typescript-node:24@sha256:e1fd824e03c68d8f406ef45b574023a2d683a5acc98906743f8d60aaf78b0174

COPY --from=mise /usr/local/bin/mise /usr/local/bin/mise

USER 1000
