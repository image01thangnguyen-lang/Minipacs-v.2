'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, Boxes, Lock, User, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        username,
        password,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError("Đã xảy ra lỗi hệ thống");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-vin-root text-vin-text flex items-center justify-center p-4 selection:bg-vin-accent/30">
      <div className="absolute inset-0 bg-vin-shell/10 mix-blend-screen pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-vin-shell/40 via-vin-root to-vin-root" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-vin-accent rounded-2xl mb-4 shadow-lg shadow-vin-accent/20 ring-1 ring-vin-accent/50">
            <Boxes className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-vin-text2 bg-clip-text text-transparent">
            Mini PACS
          </h1>
          <p className="text-vin-muted mt-2 text-sm font-medium">Hệ thống lưu trữ & truyền tải hình ảnh Y Tế</p>
        </div>

        <div className="bg-vin-shell/80 backdrop-blur-xl border border-vin-borderStrong p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-vin-muted uppercase tracking-wider mb-2 ml-1">
                  Tên đăng nhập
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-vin-faint group-focus-within:text-vin-accent transition-colors">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="block w-full pl-11 pr-4 py-3.5 bg-vin-panel border border-vin-border rounded-xl text-vin-text placeholder-vin-faint focus:outline-none focus:ring-2 focus:ring-vin-accent/50 focus:border-vin-accent/50 transition-all sm:text-sm"
                    placeholder="Nhập username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-vin-muted uppercase tracking-wider mb-2 ml-1">
                  Mật khẩu
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-vin-faint group-focus-within:text-vin-accent transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="block w-full pl-11 pr-4 py-3.5 bg-vin-panel border border-vin-border rounded-xl text-vin-text placeholder-vin-faint focus:outline-none focus:ring-2 focus:ring-vin-accent/50 focus:border-vin-accent/50 transition-all sm:text-sm"
                    placeholder="Nhập password"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-vin-accent/20 text-sm font-semibold text-white bg-vin-accent hover:bg-vin-accentHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-vin-root focus:ring-vin-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                  Đang xác thực...
                </>
              ) : (
                'Đăng Nhập Hệ Thống'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
