import type { Metadata } from "next";
import { ReviewInviteView } from "@/components/reviews/ReviewInviteView";

export const metadata: Metadata = {
  title: "Avaliar Produto — Scathon",
  description: "Deixe sua avaliação sobre o produto que você comprou.",
};

interface ReviewInvitePageParams {
  token: string;
}

export default async function ReviewInvitePage({ params }: { params: Promise<ReviewInvitePageParams> }) {
  const { token } = await params;
  return <ReviewInviteView token={token} />;
}
