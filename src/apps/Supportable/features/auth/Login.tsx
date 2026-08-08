import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PasswordField } from "../../../components/PasswordField";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "login") {
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage("Signed in successfully.");
      } else {
        const { error } = await supabase!.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Account created. Check your email if confirmation is required.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="supportable-auth">
      <h2>{mode === "login" ? "Sign in" : "Create an account"}</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
        </label>
        <PasswordField label="Password" value={password} onChange={setPassword} required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} />
        <button type="submit" disabled={loading}>{loading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
      {message && <p>{message}</p>}
      <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>
        {mode === "login" ? "Need an account?" : "Already have an account?"}
      </button>
    </section>
  );
}
