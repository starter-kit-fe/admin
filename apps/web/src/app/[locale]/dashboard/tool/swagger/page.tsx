import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('Tool');
  const url = process.env.BASE_URL;
  return (
    <iframe
      src={url}
      title={t('swagger.title')}
      style={{ width: '100%', height: 'calc(100vh - 64px)', border: 'none' }}
    />
  );
}
