import { tickerItems } from '../../data/tech';

export default function Ticker() {
  // Rendered twice so the -50% translate loops seamlessly. The second copy is
  // purely visual — aria-hidden stops a screen reader announcing the whole
  // list twice, which is what it did before.
  const items = [...tickerItems.map((t) => [t, false]), ...tickerItems.map((t) => [t, true])];

  return (
    <div className="overflow-hidden border-y border-line bg-paper py-[22px]">
      <div className="flex w-max animate-tick gap-14 whitespace-nowrap">
        {items.map(([item, isClone], i) => (
          <span
            key={`${item}-${i}`}
            aria-hidden={isClone || undefined}
            className="flex items-center gap-14 text-[13px] uppercase tracking-[0.14em] text-muted"
          >
            {item}
            <span aria-hidden="true" className="h-[5px] w-[5px] rounded-full bg-accent" />
          </span>
        ))}
      </div>
    </div>
  );
}
