import { PageHeader } from "@/components/ui";
import { DevShowcase } from "./components/DevShowcase";

export function DevPage() {
  return (
    <div className="space-y-8 p-4 md:p-8">
      <PageHeader titleKey="dev-page-title" subtitleKey="dev-page-subtitle" />
      <DevShowcase />
    </div>
  );
}

export default DevPage;
