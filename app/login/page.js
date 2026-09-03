"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (signUpError) {
        setError(traducirError(signUpError.message));
      } else {
        setNotice(
          "Cuenta creada. Revisa tu correo para confirmar tu cuenta antes de entrar. Al entrar por primera vez quedas con rol de solo lectura, hasta que un super admin te suba el rol en Configuración -> Usuarios."
        );
        setMode("signin");
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(traducirError(signInError.message));
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <div className="page-center">
      <div className="card">
        <h1 style={{ textAlign: "center" }}>🛡️ NEXUS</h1>
        <p className="subtitle" style={{ textAlign: "center" }}>
          {mode === "signin"
            ? "Seguimiento del PESV y del SG-SST. Entra con tu correo y contraseña."
            : "Registra tu cuenta para empezar a usar la plataforma."}
        </p>

        {error && <div className="message error">{error}</div>}
        {notice && <div className="message success">{notice}</div>}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <label htmlFor="fullName">Nombre completo</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </>
          )}

          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Contraseña</label>
          <div className="password-field">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              tabIndex={-1}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button type="submit" className="full-width" disabled={loading}>
            {loading
              ? "Un momento..."
              : mode === "signin"
              ? "Entrar"
              : "Crear cuenta"}
          </button>
        </form>

        <div className="toggle-row">
          {mode === "signin" ? (
            <>
              ¿No tienes cuenta?{" "}
              <button type="button" onClick={() => setMode("signup")}>
                Regístrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <button type="button" onClick={() => setMode("signin")}>
                Inicia sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function traducirError(message) {
  const mapa = {
    "Invalid login credentials": "Correo o contraseña incorrectos.",
    "User already registered": "Ya existe una cuenta con ese correo.",
    "Email not confirmed": "Debes confirmar tu correo antes de entrar.",
  };
  return mapa[message] || message;
}
