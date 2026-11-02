# Cloudinary image and media storage

The upload flow uses Cloudinary for creator profile images, brand logos, portfolio media, deliverables, and message attachments.

## Configure Cloudinary

1. Create a Cloudinary account and open its API credentials.
2. Create two **signed** upload presets in Cloudinary: an image preset limited to JPG, PNG, WebP, and AVIF with a 10 MB maximum, and a media preset limited to those image formats plus MP4/WebM with a 100 MB maximum.
3. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_IMAGE_UPLOAD_PRESET`, and `CLOUDINARY_MEDIA_UPLOAD_PRESET` in `.env.local` or your hosting provider's secret manager.
4. Keep the API secret server-only. Do not prefix it with `NEXT_PUBLIC_`.
5. Upload from the brand or creator portal. The server checks the signed-in role, upload purpose, MIME type, extension, declared size, and request rate, then signs a short-lived upload request. The configured Cloudinary preset enforces the maximum size at the provider.
6. In admin creator, brand, service, or blog forms, store the Cloudinary `secure_url` in the relevant image URL field.

Images are limited to 10 MB. MP4/WebM video uploads are limited to 100 MB. Uploaded files are stored in the Cloudinary account; MongoDB stores their URL and related record data, not the file bytes.

Do not upload identity documents, confidential contracts, or other sensitive material to publicly accessible media. Private-media access controls and automated deletion are not part of this simple image workflow.
