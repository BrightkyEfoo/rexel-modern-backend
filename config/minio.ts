import env from '#start/env'

export default {
  endPoint: env.get('MINIO_ENDPOINT', env.get('MINIO_HOST', 'localhost')),
  port: env.get('MINIO_PORT', 9000),
  publicEndPoint: env.get('MINIO_PUBLIC_ENDPOINT', 'http://localhost:9000'),
  useSSL: env.get('MINIO_USE_SSL', false),
  accessKey: env.get('MINIO_ACCESS_KEY', env.get('MINIO_ROOT_USER', 'minioadmin')),
  secretKey: env.get('MINIO_SECRET_KEY', env.get('MINIO_ROOT_PASSWORD', 'minioadmin')),
  region: env.get('MINIO_REGION', 'us-east-1'),
  buckets: {
    public: 'rexel-public',
    products: 'products',
    categories: 'categories',
    brands: 'brands',
    users: 'users',
  },
}
