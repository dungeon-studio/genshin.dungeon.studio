#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# BuildKit applies the OCI labels from docker/metadata-action, and a build-time
# --label overrides any Dockerfile LABEL with the same key. A Dockerfile linter
# never sees the shipped values, so the published manifest is the only place to
# check them.

set -euo pipefail
set -x

IMAGE_URI="${IMAGE_URI:?Error: IMAGE_URI is required}"
EXPECTED_REVISION="${EXPECTED_REVISION:?Error: EXPECTED_REVISION is required}"

REQUIRED_LABELS=(source revision created licenses title description url)

LABELS=$(
  docker buildx imagetools inspect "$IMAGE_URI" --format '{{json .Image.Config.Labels}}' |
    jq --arg ns org.opencontainers.image. '
      (. // {})
      | with_entries(select(.key | startswith($ns)) | .key |= ltrimstr($ns))
    '
)

MISSING=$(jq -r --args '
  . as $labels
  | $ARGS.positional
  | map(select(($labels[.] // "") == ""))
  | join(", ")
' "${REQUIRED_LABELS[@]}" <<<"$LABELS")

[ -z "$MISSING" ] || {
  echo "missing OCI labels: $MISSING" >&2
  exit 1
}

REVISION=$(jq -r '.revision' <<<"$LABELS")

[ "$REVISION" = "$EXPECTED_REVISION" ] || {
  echo "revision mismatch: image=$REVISION expected=$EXPECTED_REVISION" >&2
  exit 1
}
