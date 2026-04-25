import Pr27TransactionPreview from "./Pr27TransactionPreview";

export default function Pr27PreviewPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">PR #27 UI Preview</h1>
          <p className="text-sm text-muted-foreground">
            Type override UI only. Resize the viewport to inspect desktop and mobile behavior.
          </p>
        </div>
        <Pr27TransactionPreview />
      </div>
    </main>
  );
}
