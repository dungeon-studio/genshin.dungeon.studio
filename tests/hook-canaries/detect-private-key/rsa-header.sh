#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail

# Built here so secret scanners don't flag the committed fixture.
printf -- '-----BEGIN %s-----\n' "RSA PRIVATE KEY" >canary.txt
