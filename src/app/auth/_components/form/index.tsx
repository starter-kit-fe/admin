import Email from './email';
import Password from './pwd';
import Register from './register';
import { useAuthStore, AuthStep } from '@/app/auth/_store';

export default function Page() {
  const { currentStep } = useAuthStore();
  return (
    <>
      {currentStep === AuthStep.Email && <Email />}
      {currentStep === AuthStep.Password && <Password />}
      {currentStep === AuthStep.Register && <Register />}
    </>
  );
}
