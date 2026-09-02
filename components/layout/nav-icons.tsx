import {
  IconBudgets,
  IconCreditCard,
  IconDashboard,
  IconNetworth,
  IconSettings,
  IconTransactions,
} from "@/components/ui/Icons";
import type { NavLabel } from "@/lib/navigation";

export const navIconMap: Record<
  NavLabel,
  React.ComponentType<{ className?: string }>
> = {
  Dashboard: IconDashboard,
  Transactions: IconTransactions,
  Cards: IconCreditCard,
  Budgets: IconBudgets,
  Networth: IconNetworth,
  Settings: IconSettings,
};
