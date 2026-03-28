import Link from "next/link";

const cards = [
  {
    href: "/tournaments",
    title: "Historique des tournois",
    description: "Suivez chaque tournoi mineur ou majeur, les participants, les dates et le gagnant.",
  },
  {
    href: "/belt-holder",
    title: "Détenteurs de ceintures",
    description: "Affichez instantanément les champions actuels et le tournoi où ils ont pris la ceinture.",
  },
  {
    href: "/tier-list",
    title: "Tier-list",
    description: "Classez les équipes FC de 1 à 10 avec une tier list en drag-and-drop.",
  },
  {
    href: "/tournament-creator",
    title: "Générateur de tournois",
    description: "Créez un tournoi pas à pas avec bans, draft de 8 équipes et arbre final interactif.",
  },
];

export default function Home() {
  return (
    <main className="px-4 pb-12 pt-8 md:pt-14">
      <section className="section-shell">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
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
