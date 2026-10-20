import GoogleButton from "./google-button";

const messages: Record<string, string> = {
  forbidden: "That Google account isn't an authorized administrator.",
  callback: "Sign-in could not be completed. Please try again.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; email?: string }> }) {
  const { error, email } = await searchParams;
  return (
    <main className="login">
      <div className="login-card">
        <p className="eyebrow">Color Field</p>
        <h1>Admin console</h1>
        <p className="muted">Restricted area. Sign in with an administrator Google account.</p>
        {error && <p className="alert" role="alert">{messages[error] ?? messages.callback}{error === "forbidden" && email ? ` (signed in as ${email})` : ""}</p>}
        <GoogleButton />
      </div>
    </main>
  );
}
