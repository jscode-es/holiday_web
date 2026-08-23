import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Accommodation } from "@/lib/queries/accommodations";

export function AccommodationCard({ accommodation }: { accommodation: Accommodation }) {
  return (
    <Link href={`/alojamientos/${accommodation.id}`}>
      <Card className="h-full hover:bg-accent">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            {accommodation.name}
            <Badge variant={accommodation.status === "pendiente" ? "destructive" : "secondary"}>
              {accommodation.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>
            {accommodation.checkIn} → {accommodation.checkOut}
          </p>
          {accommodation.cost != null && (
            <p>
              {accommodation.cost} {accommodation.currency}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
