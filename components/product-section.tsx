export function ProductSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16 text-center">
      <h2 className="text-3xl font-bold mb-4">
        Share secrets that disappear
      </h2>

      <p className="text-muted-foreground mb-12">
        Open source & zero-knowledge secure sharing
      </p>

      <div className="grid gap-8 md:grid-cols-2 text-left">
        <div>
          <h3 className="font-semibold">AES-256 encrypted</h3>
          <p className="text-sm text-muted-foreground">
            Your data is encrypted with AES-256-GCM right in your browser. We never see the plaintext.
          </p>
        </div>

        <div>
          <h3 className="font-semibold">Self-destructing messages</h3>
          <p className="text-sm text-muted-foreground">
            Set custom expiration times or view limits. Once read, it's gone forever.
          </p>
        </div>

        <div>
          <h3 className="font-semibold">Zero-knowledge architecture</h3>
          <p className="text-sm text-muted-foreground">
            Encryption keys live in the URL fragment — they never touch our servers.
          </p>
        </div>

        <div>
          <h3 className="font-semibold">No data retention</h3>
          <p className="text-sm text-muted-foreground">
            We don’t log IPs, don’t track users, and can’t read your secrets even if we tried.
          </p>
        </div>

        <div>
          <h3 className="font-semibold">Instant sharing</h3>
          <p className="text-sm text-muted-foreground">
            No signup required for basic use. Create and share in seconds.
          </p>
        </div>

        <div>
          <h3 className="font-semibold">Open source</h3>
          <p className="text-sm text-muted-foreground">
            Fully auditable code on GitHub. Trust is earned through transparency.
          </p>
        </div>
      </div>
    </section>
  )
}
