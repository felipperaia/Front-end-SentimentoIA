import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { authApi, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Shield } from "lucide-react";

export default function MFAVerify() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login",
  });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replaceAll(/\D/g, "").slice(0, 6);
    setCode(value);
    if (error) setError("");
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Código deve ter 6 dígitos");
      return;
    }

    if (!getToken()) {
      setError("Sessão expirada. Faça login novamente.");
      setLocation("/login");
      return;
    }

    setLoading(true);
    try {
      await authApi.verifyMfa({ code });
      setSuccess(true);
      setTimeout(() => setLocation("/search"), 1200);
    } catch (err) {
      setCode("");
      setError(err instanceof Error ? err.message : "Erro ao verificar código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(0deg, transparent 24%, rgba(0, 255, 255, 0.05) 25%, rgba(0, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, 0.05) 75%, rgba(0, 255, 255, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 255, 0.05) 25%, rgba(0, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, 0.05) 75%, rgba(0, 255, 255, 0.05) 76%, transparent 77%, transparent)",
          backgroundSize: "50px 50px"
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="border-2 border-cyan-500 bg-black/50 backdrop-blur-sm p-8 relative">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-pink-500" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-pink-500" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-pink-500" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-pink-500" />

          <div className="flex justify-center mb-4">
            <Shield className="w-12 h-12 text-pink-500" style={{ filter: "drop-shadow(0 0 10px rgba(255, 0, 255, 0.8))" }} />
          </div>

          <h1 className="text-3xl font-bold text-pink-500 mb-2 text-center font-mono tracking-widest" style={{ textShadow: "0 0 10px rgba(255, 0, 255, 0.8)" }}>
            VERIFICAÇÃO MFA
          </h1>
          <p className="text-cyan-400 text-center mb-6 text-sm font-mono">Digite o código de 6 dígitos do seu autenticador</p>

          {success && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-500 rounded flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-400 text-sm">Verificação bem-sucedida!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-cyan-400 font-mono text-xs mb-2 block">CÓDIGO AUTENTICADOR</Label>
              <Input
                type="text"
                value={code}
                onChange={handleChange}
                placeholder="000000"
                maxLength={6}
                className="bg-black/50 border border-cyan-500 text-white placeholder-gray-600 focus:border-pink-500 focus:outline-none font-mono text-2xl text-center tracking-widest"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500 rounded flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 font-mono tracking-wider disabled:opacity-50"
            >
              {loading ? "VERIFICANDO..." : "VERIFICAR"}
            </Button>
          </form>

          <p className="text-center text-cyan-400 text-xs mt-4 font-mono">
            Use o código atual do seu aplicativo autenticador vinculado.
          </p>
        </div>
      </div>
    </div>
  );
}
