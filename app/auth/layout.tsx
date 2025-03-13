import { GoogleOAuthProvider } from '@react-oauth/google';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_AUTH_KEY!}>
            {children}
        </GoogleOAuthProvider>
    );
}
