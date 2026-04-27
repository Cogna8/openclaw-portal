import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@cogna8/ui/components/ui/card";

/**
 * A short, hand-written note from the Cogna8 team to OpenClaw users.
 * Rendered at the top of every support article by [slug]/page.tsx.
 *
 * Uses the @cogna8/ui Card primitive plus the maintained "polished card"
 * gradient + shadow-xs pattern (same treatment as console section-cards).
 * No local design tokens or hand-rolled styles.
 */
export function FromTheTeam() {
  return (
    <Card className="mt-2 mb-10 gap-5 py-7 bg-gradient-to-t from-white/[0.03] to-card shadow-xs">
      <CardHeader className="pb-1">
        <CardTitle className="text-xl tracking-tight">From the team</CardTitle>
        <p className="text-sm text-muted-foreground">
          A short note to the OpenClaw community.
        </p>
      </CardHeader>
      <CardContent className="space-y-5 text-[15px] leading-relaxed text-card-foreground">
        <p>
          We think the question of trust in this new realm of intelligence is a long road
          ahead, and what you&apos;ll find here are just first, mechanical steps into a much
          bigger area of collaboration with this new kind of intelligence.
        </p>
        <p>
          This is from our team to the OpenClaw community, as early adopters of automated
          AI workflows, to help with the bumps that come with adopting something this new.
        </p>
        <p>
          There are no hooks. No double intent. No data collection. Just a small step to
          give something, even if little, that&apos;s meaningful and, more importantly,
          useful to fellow explorers.
        </p>
        <p className="pt-2 text-muted-foreground">The Cogna8 team</p>
      </CardContent>
    </Card>
  );
}

export default FromTheTeam;
