#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail

ln -s README.md canary-link
git add canary-link
git commit --quiet --message='add link'
# A checkout without symlink support writes the link's target as file content.
rm canary-link
printf 'README.md' >canary-link
