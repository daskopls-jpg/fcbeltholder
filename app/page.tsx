import Link from "next/link";

const cards = [
  {
    href: "/tournaments",
    title: "Historique des Tournois",
    description: "Suivez chaque tournoi mineur ou majeur, les participants, les dates et le gagnant.",
  },
  {
    href: "/belt-holder",
    title: "Détenteur de Ceinture",
    description: "Affichez instantanément les champions actuels et le tournoi où ils ont pris la ceinture.",
  },
  {
    href: "/tier-list",
    title: "Évaluateur d'Équipes",
    description: "Classez les équipes FC de 1 à 10 avec un drag-and-drop rapide et persistant.",
  },
];

export default function Home() {
  return (
    <main className="px-4 pb-12 pt-8 md:pt-14">
      <section className="section-shell">
        <div className="glass-panel relative overflow-hidden rounded-3xl p-8 md:p-12">
          <div className="absolute -top-14 -right-12 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-emerald-300/20 blur-3xl" />

          <p className="status-chip mb-4">Dashboard Competition FC</p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Pilotez vos rivalites FC
          </h1>
          <p className="mt-4 text-slate-300 text-base md:text-lg max-w-3xl">
            Centralisez vos tournois, visualisez les ceintures en cours et construisez une tier list claire.
            Toutes les donnees sont synchronisees et securisees.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/tournaments" className="brand-btn px-5 py-2.5 text-sm">
              Ouvrir les tournois
            </Link>
            <Link href="/tier-list" className="outline-btn px-5 py-2.5 text-sm">
              Voir la tier list
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="glass-panel rounded-2xl p-6 transition hover:-translate-y-0.5 hover:border-white/40"
            >
              <h2 className="text-2xl font-semibold mb-2">{card.title}</h2>
              <p className="text-slate-300 text-sm leading-relaxed">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
