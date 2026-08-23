import { notFound } from "next/navigation";
import { getAccommodationById } from "@/lib/queries/accommodations";
import { AccommodationForm } from "@/components/accommodations/accommodation-form";

export default async function AccommodationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") {
    return (
      <div className="space-y-6 px-8 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Nuevo alojamiento</h1>
        <AccommodationForm />
      </div>
    );
  }

  const accommodation = await getAccommodationById(Number(id));
  if (!accommodation) notFound();

  return (
    <div className="space-y-6 px-8 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{accommodation.name}</h1>
      <AccommodationForm accommodation={accommodation} />
    </div>
  );
}
