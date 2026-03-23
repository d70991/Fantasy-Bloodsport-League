#!/usr/bin/env bash
set -euo pipefail

# Deploy static site files to S3 and optionally invalidate CloudFront cache.
# Usage:
#   ./deploy-aws.sh <bucket-name> [cloudfront-distribution-id]
# Example:
#   ./deploy-aws.sh my-site-bucket E123ABC456XYZ

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <bucket-name> [cloudfront-distribution-id]"
  exit 1
fi

BUCKET_NAME="$1"
DISTRIBUTION_ID="${2:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Syncing site files to s3://$BUCKET_NAME ..."

aws s3 sync . "s3://$BUCKET_NAME" \
  --delete \
  --exclude ".*" \
  --exclude "deploy-aws.sh" \
  --exclude "README*" \
  --exclude "node_modules/*" \
  --exclude "*.log"

echo "Upload complete."

if [[ -n "$DISTRIBUTION_ID" ]]; then
  echo "Creating CloudFront invalidation for distribution $DISTRIBUTION_ID ..."
  aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*"
  echo "Invalidation created."
else
  echo "No CloudFront distribution ID provided; skipping invalidation."
  echo "If you use CloudFront, run:"
  echo "  aws cloudfront create-invalidation --distribution-id <ID> --paths '/*'"
fi

echo "Done."
