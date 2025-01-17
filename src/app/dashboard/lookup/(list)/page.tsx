import { Metadata } from 'next';
import Index from './_components';

export const metadata: Metadata = {
  title: '字典列表',
};

export default function Page() {
  return <Index />;
}
