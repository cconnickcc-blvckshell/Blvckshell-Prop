export default function SignOutForm({
  className,
  formClassName = "inline",
  label = "Log out",
}: {
  className: string;
  formClassName?: string;
  label?: string;
}) {
  return (
    <form method="post" action="/api/auth/logout" className={formClassName} data-auth-form="logout">
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
