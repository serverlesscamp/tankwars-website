BUCKET=`awk '/s3_bucket:/{print $2;}' _config.yml`
DIST_ID=`awk '/cloudfront_dist:/{print $2;}' _config.yml`
TS=`date +%Y%m%d%H%M%S`

BATCH='{"Paths": {"Quantity": 2,"Items": ["/index.html", "/pages/*"]},"CallerReference": "invalidation '$TS'"}'
JEKYLL_ENV=production jekyll build
aws s3 sync _site/ s3://$BUCKET --cache-control="max-age=86400" --exclude "*.html" --exclude "*.xml" --acl public-read
aws s3 sync _site/ s3://$BUCKET --cache-control="max-age=600" --exclude "*" --include "*.html" --include "*.xml" --acl public-read
aws cloudfront create-invalidation --invalidation-batch "$BATCH" --distribution-id $DIST_ID

echo check status using
echo aws cloudfront list-invalidations --distribution-id $DIST_ID \| grep "InProgress" -A 2
