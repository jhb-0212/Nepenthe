import LoginForm from '@/components/LoginForm';

export const metadata = { title: '后台登录' };

export default function LoginPage() {
  return (
    <div className="admin-shell">
      <LoginForm />
    </div>
  );
}
