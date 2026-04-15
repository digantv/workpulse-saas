import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../utils/apiError';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FormField, formControlClassName } from '../components/ui/FormField';

export default function LoginPage() {
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const validate = () => {
    const next = {};
    const u = username.trim();
    if (!u) {
      next.username = 'Username is required';
    }
    if (!password) {
      next.password = 'Password is required';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setSubmitError(
        getApiErrorMessage(
          err,
          'Unable to sign in. Please check your credentials and try again.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = formControlClassName();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-white to-brand-100/40 px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.35) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mb-10 max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Employee Attendance
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Sign in to your account
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Use your company username and password to continue.
        </p>
      </div>

      <Card className="relative w-full max-w-md border-slate-200/90 p-8 sm:p-10">
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          {submitError ? (
            <Alert variant="error" className="shadow-none">
              {submitError}
            </Alert>
          ) : null}

          <FormField
            label="Username"
            htmlFor="login-username"
            error={fieldErrors.username}
          >
            <input
              id="login-username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setSubmitError('');
                if (fieldErrors.username) {
                  setFieldErrors((prev) => ({ ...prev, username: undefined }));
                }
              }}
              disabled={submitting}
              placeholder="Enter your username"
              className={inputClass}
            />
          </FormField>

          <FormField
            label="Password"
            htmlFor="login-password"
            error={fieldErrors.password}
          >
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setSubmitError('');
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              disabled={submitting}
              placeholder="Enter your password"
              className={inputClass}
            />
          </FormField>

          <Button
            type="submit"
            loading={submitting}
            loadingLabel="Signing in…"
            className="w-full px-4"
          >
            Sign in
          </Button>
        </form>
      </Card>

      <p className="relative mt-8 max-w-md text-center text-xs text-slate-500">
        Secure session · Use only your authorized credentials
      </p>
    </div>
  );
}
