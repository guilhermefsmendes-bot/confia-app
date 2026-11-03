type AgeGateScreenProps = {
  language: string;
  checked: boolean;
  underageNotice: boolean;
  onCheckedChange: (checked: boolean) => void;
  onConfirm: () => void;
  onShowUnderageNotice: () => void;
};

export function AgeGateScreen({
  language,
  checked,
  underageNotice,
  onCheckedChange,
  onConfirm,
  onShowUnderageNotice,
}: AgeGateScreenProps) {
  const copy = language === "en"
    ? { title: "Welcome to Confia", intro: "Confia is intended for people aged 18 and over.", check: "I confirm that I am 18 years old or older.", continue: "Continue", under: "I am under 18", blocked: "You must be at least 18 years old to use Confia." }
    : language === "es"
    ? { title: "Bienvenido/a a Confia", intro: "Confia está destinada a personas mayores de 18 años.", check: "Confirmo que tengo 18 años o más.", continue: "Continuar", under: "Tengo menos de 18 años", blocked: "Debes tener al menos 18 años para utilizar Confia." }
    : language === "fr"
    ? { title: "Bienvenue sur Confia", intro: "Confia est destinée aux personnes âgées de 18 ans ou plus.", check: "Je confirme avoir 18 ans ou plus.", continue: "Continuer", under: "J’ai moins de 18 ans", blocked: "Vous devez avoir au moins 18 ans pour utiliser Confia." }
    : { title: "Bem-vindo/a à Confia", intro: "A Confia destina-se a pessoas com 18 anos ou mais.", check: "Confirmo que tenho 18 anos ou mais.", continue: "Continuar", under: "Tenho menos de 18 anos", blocked: "Tens de ter pelo menos 18 anos para utilizar a Confia." };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-5 text-[#2F2926]" lang={language}>
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-lg border border-[#E8DED4]" aria-labelledby="confia-age-title">
        <img src="/images/confia-icon.png" alt="Confia" className="mx-auto mb-5 h-16 w-16 rounded-2xl" />
        <h1 id="confia-age-title" className="mb-3 text-center text-2xl font-bold">{copy.title}</h1>
        <p className="mb-6 text-center leading-relaxed">{copy.intro}</p>
        {!underageNotice ? (
          <>
            <label className="mb-6 flex items-start gap-3 rounded-xl bg-[#FAF7F2] p-4 text-sm leading-relaxed">
              <input type="checkbox" checked={checked} onChange={(event) => onCheckedChange(event.target.checked)} className="mt-1 h-4 w-4 accent-[#B85F48]" />
              <span>{copy.check}</span>
            </label>
            <button type="button" disabled={!checked} onClick={onConfirm} className="mb-3 w-full rounded-xl bg-[#B85F48] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{copy.continue}</button>
            <button type="button" onClick={onShowUnderageNotice} className="w-full rounded-xl px-5 py-3 text-sm text-[#6B5D55] underline">{copy.under}</button>
          </>
        ) : (
          <p role="alert" className="rounded-xl bg-[#FAF0ED] p-4 text-center font-medium">{copy.blocked}</p>
        )}
      </section>
    </div>
  );
}
