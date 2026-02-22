/**
 * HeroVisual — DALL-E generated product mockup image for the hero section.
 * Server component (no client JS).
 */
export default function HeroVisual() {
  return (
    <div className="relative mx-auto max-w-md">
      {/* Floating "+37 pts" badge */}
      <div className="absolute -right-2 -top-2 z-10 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 shadow-sm">
        +37 pts
      </div>

      <img
        src="/images/hero-mockup.png"
        alt="ResumeMate product screenshot showing a resume analysis with score improvement from 47 to 84"
        className="w-full rounded-xl shadow-xl"
        width={480}
        height={480}
      />
    </div>
  );
}
