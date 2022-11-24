#!/bin/bash

declare -a files=(
[0]="index.html"
[1]="*.js"
[2]="*.css"
[3]="*.svg"
[4]="*.png"
[5]="*.webmanifest"
[6]="*.txt"
[7]="*.xml"
[8]="LICENSE"
)

declare -a caches=(
[0]="no-caches"
[1]="max-age=31536000 immutable"
[2]="max-age=31536000 immutable"
[3]="max-age=31536000 immutable"
[4]="max-age=31536000 immutable"
[5]="max-age=31536000 immutable"
[6]="max-age=31536000 immutable"
[7]="max-age=31536000 immutable"
[8]=""
)

declare -a contentTypes=(
[0]="text/html; charset=utf-8"
[1]="application/javascript; charset=utf-8"
[2]="text/css; charset=utf-8"
[3]="image/svg+xml; charset=utf-8"
[4]="image/png; charset=utf-8"
[5]="application/manifest+json; charset=utf-8"
[6]="text/plain; charset=utf-8"
[7]="application/xml; charset=utf-8"
[8]=""
)

for i in "${!files[@]}"
do
    echo "Uploading ${files[$i]}"

    aws s3 sync $ARTIFACT_NAME s3://$AWS_S3_BUCKET \
          --delete \
          --acl public-read \
          --exclude "*" \
          --include "${files[$i]}" \
          --cache-control "${caches[$i]}" \
          --content-type "${contentTypes[$i]}" \
          /
done