"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading, login, logout } = useAuth();

  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginFail, setLoginFail] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginFail(false);

    try {
      await login({ email: loginEmail, password: loginPassword });
    } catch {
      setLoginFail(true);
    }
  };

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (!user) {
    return (
      <>
        <h1>Login</h1>
        <form onSubmit={handleLogin}>
          {loginFail && <p>Wrong credentials!</p>}
          <input
            type="email"
            name="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />
          <input
            type="password"
            name="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />
          <input
            type="submit"
            value="Login"
            disabled={!loginEmail || !loginPassword}
          />
        </form>
      </>
    );
  }

  return <>
    Hello {user.username}
    <button onClick={logout}>Logout</button>
  </>;
}
