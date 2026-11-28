# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

FROM ghcr.io/jdx/mise:2026.11.14@sha256:7178a0bc7eb30d5090f81237fc0a7830f57e52126b9d8df656e24547437a1e53 AS mise

FROM mcr.microsoft.com/devcontainers/typescript-node:24@sha256:d757292f5050d7b10bae4e0df80da615db98a68b6fdc412558caf24087452fd6

COPY --from=mise /usr/local/bin/mise /usr/local/bin/mise

USER 1000

# Claude Code keeps its settings and conversations here, on a named volume
# from devcontainer.json. Docker gives a new volume the owner of the directory
# it covers, so this directory must belong to node.
ENV CLAUDE_CONFIG_DIR=/home/node/.claude
RUN mkdir "${CLAUDE_CONFIG_DIR}"
