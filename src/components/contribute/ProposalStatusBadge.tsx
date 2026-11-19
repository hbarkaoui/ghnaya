import { Check, Clock, X } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/Badge";
import type { ProposalStatus } from "@/types/proposal";

const STYLES = {
  pending: { tone: "warning", Icon: Clock },
  approved: { tone: "success", Icon: Check },
  rejected: { tone: "error", Icon: X },
} as const;

/** Statut d'une proposition : libellé, icône et couleur, jamais la couleur seule. */
export async function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const t = await getTranslations("contributions");
  const { tone, Icon } = STYLES[status];
  return (
    <Badge tone={tone} icon={<Icon aria-hidden="true" className="size-3.5" />}>
      <span className="sr-only">{t("statusLabel")} </span>
      {t(`status.${status}`)}
    </Badge>
  );
}
