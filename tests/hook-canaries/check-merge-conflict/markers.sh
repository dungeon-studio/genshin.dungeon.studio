#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail

# Generated so no committed file holds markers that git tools and editors
# would take for a real conflict.
marker() { printf '%*s' 7 '' | tr ' ' "$1"; }
printf '%s ours\none\n%s\ntwo\n%s theirs\n' "$(marker '<')" "$(marker '=')" "$(marker '>')" >canary.txt
# The hook checks only while a merge is in progress.
git rev-parse HEAD >.git/MERGE_HEAD
printf 'Merge\n' >.git/MERGE_MSG
