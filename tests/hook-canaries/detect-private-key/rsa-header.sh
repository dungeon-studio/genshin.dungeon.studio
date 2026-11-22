#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail

# Generated so secret scanners never see a private key header in the repository.
printf -- '-----BEGIN %s-----\n' "RSA PRIVATE KEY" >canary.txt
