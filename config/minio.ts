import env from '#start/env'

export default {
  endPoint: env.get('MINIO_HOST', 'localhost'),
  port: env.get('MINIO_PORT', 9000),
  useSSL: env.get('MINIO_USE_SSL', false),
  accessKey: env.get('MINIO_ACCESS_KEY'),
  secretKey: env.get('MINIO_SECRET_KEY'),
  region: env.get('MINIO_REGION', 'us-east-1'),
  buckets: {
    products: 'products',
    categories: 'categories',
    brands: 'brands',
    users: 'users',
  },
}
