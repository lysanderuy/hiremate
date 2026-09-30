export function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5"
      >
        Sign out
      </button>
    </form>
  );
}
