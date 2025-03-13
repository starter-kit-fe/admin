import Email from './email';
import Password from './pwd';
import Register from './register';
import { useStore, AuthStep } from '@/app/auth/store';

export default function Page() {
  const { currentStep } = useStore();
  return (
    <>
      {currentStep === AuthStep.Email && <Email />}
      {currentStep === AuthStep.Password && <Password />}
      {currentStep === AuthStep.Register && <Register />}
    </>
  );
}
