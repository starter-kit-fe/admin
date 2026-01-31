export function SwaggerPage() {
  const url = process.env.BASE_URL;
  return (
    <iframe
      src={url}
      title="Swagger UI"
      style={{ width: '100%', height: 'calc(100vh - 64px)', border: 'none' }}
    />
  );
}
