import Link from 'next/link';
import Image from 'next/image';
import pkg from '../../package.json';
export default function Page() {
  return (
    <>
      <Image src="/pwa-512x512.png" height={40} width={40} alt="" />
      <span className="sr-only">{pkg.name.toUpperCase()}</span>
    </>
  );
}
