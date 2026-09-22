import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/WishlistView";

export const metadata: Metadata = {
  title: "Curtidos — Scathon",
  description: "Os produtos que você curtiu ou salvou como favoritos.",
};

export default function WishlistPage() {
  return <WishlistView />;
}
