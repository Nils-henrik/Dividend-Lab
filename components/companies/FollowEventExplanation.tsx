import Link from "next/link";
import { FOLLOW_MITT_DIVLAB_EXPLANATION } from "@/lib/companies/follow-label";
import { MITT_DIVLAB_PATH } from "@/lib/companies/cross-navigation";

const MITT_DIVLAB_LABEL = "Mitt DivLab";

type Props = {
  className?: string;
  linkToMittDivlab?: boolean;
};

export default function FollowEventExplanation({
  className,
  linkToMittDivlab = false,
}: Props) {
  const [lead, tail] = FOLLOW_MITT_DIVLAB_EXPLANATION.split(MITT_DIVLAB_LABEL);

  return (
    <p className={className}>
      {lead}
      {linkToMittDivlab ? (
        <Link
          href={MITT_DIVLAB_PATH}
          className="font-semibold text-divlab-blue underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50"
        >
          {MITT_DIVLAB_LABEL}
        </Link>
      ) : (
        MITT_DIVLAB_LABEL
      )}
      {tail}
    </p>
  );
}
