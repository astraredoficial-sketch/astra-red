"use client";

import { VipPaywall } from "@/components/VipPaywall";

interface VipPaywallModalProps {
  userName?: string;
  onClose?: () => void;
}

export function VipPaywallModal({
  userName = "Usuario",
  onClose,
}: VipPaywallModalProps) {
  return <VipPaywall name={userName} onClose={onClose} />;
}
