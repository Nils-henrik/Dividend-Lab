type Props = {
  email: string;
};

export default function AccountEmailField({ email }: Props) {
  return (
    <section className="divlab-card rounded-3xl p-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-divlab-text">E-postadress</h3>
        <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
          E-postadressen som kontot registrerades med.
        </p>
      </div>

      <div
        aria-readonly="true"
        className="divlab-input w-full break-all px-4 py-3 text-divlab-text"
      >
        {email}
      </div>
    </section>
  );
}
