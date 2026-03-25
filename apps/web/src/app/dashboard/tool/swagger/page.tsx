
export default async function Page() {
    const url = `${process.env.BASE_URL ?? ''}/api/docs`;
    return (
        <iframe
            src={url}
            title={'swagger'}
            style={{ width: '100%', height: 'calc(100vh - 64px)', border: 'none' }}
        />
    );
}