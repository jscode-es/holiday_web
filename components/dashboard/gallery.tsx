const seeds = ["fukuoka", "yufuin", "beppu", "naoshima", "osaka", "nagoya", "hakone", "tokyo"];

export function Gallery() {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
      {seeds.map((seed) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={seed}
          src={`https://picsum.photos/seed/${seed}/300/300`}
          alt=""
          loading="lazy"
          className="aspect-square w-full rounded-xl object-cover"
        />
      ))}
    </div>
  );
}
