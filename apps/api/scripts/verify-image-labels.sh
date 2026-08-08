#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Assert that a pushed image carries the OCI provenance labels, and that its
# recorded revision is the commit it was built from.
#
# The labels are applied by BuildKit from docker/metadata-action rather than by
# LABEL instructions, because a build-time --label overrides any LABEL of the
# same key. That puts them beyond the reach of a Dockerfile linter, leaving the
# published manifest as the only place they can be checked.

set -euo pipefail

IMAGE_URI="${1:?Error: image URI is required as first argument}"
EXPECTED_REVISION="${2:?Error: expected revision is required as second argument}"

REQUIRED_LABELS=(source revision created licenses title description url)

LABELS=$(docker buildx imagetools inspect "$IMAGE_URI" --format '{{json .Image.Config.Labels}}')

MISSING=$(jq -r --args '
  . as $labels
  | $ARGS.positional
  | map("org.opencontainers.image." + .)
  | map(select(($labels[.] // "") == ""))
  | join(", ")
' "${REQUIRED_LABELS[@]}" <<< "$LABELS")

[ -z "$MISSING" ] || { echo "missing OCI labels: $MISSING" >&2; exit 1; }

REVISION=$(jq -r '.["org.opencontainers.image.revision"]' <<< "$LABELS")

# A complete label set pointing at the wrong commit is the failure that
# matters, since consumers read this as the image's provenance.
[ "$REVISION" = "$EXPECTED_REVISION" ] || {
  echo "revision mismatch: image=$REVISION expected=$EXPECTED_REVISION" >&2
  exit 1
}
