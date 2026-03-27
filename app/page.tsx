import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Détenteur de Ceinture FC</h1>
      <p className="text-lg mb-8 text-center max-w-2xl">
        Gérez vos matchs FIFA/FC contre votre ami : suivez les tournois, les détenteurs de ceintures, et créez des listes de niveaux.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/tournaments" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h2 className="text-2xl font-semibold mb-2">Historique des Tournois</h2>
          <p>Voir et gérer les tournois mineurs et majeurs.</p>
        </Link>
        <Link href="/belt-holder" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h2 className="text-2xl font-semibold mb-2">Détenteur de Ceinture</h2>
          <p>Voir qui détient les ceintures mineure et majeure.</p>
        </Link>
        <Link href="/tier-list" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h2 className="text-2xl font-semibold mb-2">Évaluateur d'Équipes</h2>
          <p>Évaluez les équipes FC sur une échelle de 1 à 10.</p>
        </Link>
      </div>
    </div>
  );
}
