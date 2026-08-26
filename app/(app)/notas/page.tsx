import { getActiveTrip } from "@/lib/trips";
import { getAllNotes } from "@/lib/queries/notes";
import { NoteCard } from "@/components/notes/note-card";
import { AddNoteButton } from "@/components/notes/add-note-button";
import { EmptyTripsState } from "@/components/trips/empty-trips-state";

export default async function NotasPage() {
  const trip = await getActiveTrip();
  if (!trip) return <EmptyTripsState />;
  const notes = await getAllNotes(trip.id);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Notas</h1>
          <p className="text-sm text-neutral-400">
            {notes.length} {notes.length === 1 ? "nota" : "notas"}
          </p>
        </div>
        <AddNoteButton tripId={trip.id} />
      </div>

      {notes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 py-16 text-center text-sm text-neutral-400">
          Todavía no has añadido ninguna nota. Crea la primera con &quot;Nueva nota&quot;.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} tripId={trip.id} />
          ))}
        </div>
      )}
    </div>
  );
}
