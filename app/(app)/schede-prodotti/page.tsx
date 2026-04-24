import { DocumentPreviewButton } from "@/components/app/document-preview-button";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createProductDocumentAction } from "@/app/(app)/schede-prodotti/actions";
import {
  getProductDocumentFormData,
  getProductDocuments,
} from "@/lib/product-documents/queries";
import { formatFinanceDate } from "@/lib/finance/format";

type ProductSheetsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductSheetsPage({
  searchParams,
}: ProductSheetsPageProps) {
  const params = await searchParams;
  const filters = {
    productId: single(params.productId),
    from: single(params.from),
    to: single(params.to),
  };

  const [{ products }, documents] = await Promise.all([
    getProductDocumentFormData(),
    getProductDocuments(filters),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schede Prodotti"
        subtitle="Archivio semplice dei PDF collegati ai prodotti acquistati, consultabili direttamente dal gestionale."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Archivio documenti prodotto</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="grid gap-4 rounded-[8px] border border-border bg-muted/30 p-4 lg:grid-cols-3">
              <label className="text-sm font-medium">
                Prodotto
                <select
                  className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  defaultValue={filters.productId ?? ""}
                  name="productId"
                >
                  <option value="">Tutti</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Dal
                <input
                  className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  defaultValue={filters.from ?? ""}
                  name="from"
                  type="date"
                />
              </label>
              <label className="text-sm font-medium">
                Al
                <input
                  className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  defaultValue={filters.to ?? ""}
                  name="to"
                  type="date"
                />
              </label>
            </form>

            <div className="overflow-hidden rounded-[8px] border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Prodotto</th>
                    <th className="px-4 py-3 text-left">Data acquisto</th>
                    <th className="px-4 py-3 text-left">Riferimento</th>
                    <th className="px-4 py-3 text-left">Documento</th>
                    <th className="px-4 py-3 text-left">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.map((document) => (
                    <tr key={document.id}>
                      <td className="px-4 py-3 font-medium">
                        {document.productMaterial.name}
                      </td>
                      <td className="px-4 py-3">
                        {formatFinanceDate(document.purchasedOn)}
                      </td>
                      <td className="px-4 py-3">
                        {document.referenceNumber ?? "-"}
                      </td>
                      <td className="px-4 py-3">{document.driveFile.name}</td>
                      <td className="px-4 py-3">
                        <DocumentPreviewButton
                          href={`/api/files/${document.driveFile.id}`}
                          title={document.driveFile.name}
                        />
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-6 text-muted-foreground"
                        colSpan={5}
                      >
                        Nessuna scheda prodotto caricata.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Allega PDF</h2>
            <p className="text-sm text-muted-foreground">
              Carica un documento PDF e associalo a un prodotto già presente in
              anagrafica.
            </p>
          </CardHeader>
          <CardContent>
            <form action={createProductDocumentAction} className="space-y-4">
              <label className="block text-sm font-medium">
                Prodotto / materiale
                <select
                  className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  name="productMaterialId"
                  required
                >
                  <option value="">Seleziona</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Data acquisto
                <input
                  className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  name="purchasedOn"
                  required
                  type="date"
                />
              </label>
              <label className="block text-sm font-medium">
                Riferimento bolla / fattura
                <input
                  className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  name="referenceNumber"
                />
              </label>
              <label className="block text-sm font-medium">
                Tipologia documento
                <input
                  className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  defaultValue="Scheda prodotto"
                  name="documentType"
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                PDF allegato
                <input
                  accept="application/pdf"
                  className="focus-ring mt-2 block w-full text-sm"
                  name="pdf"
                  required
                  type="file"
                />
              </label>
              <label className="block text-sm font-medium">
                Note
                <textarea
                  className="focus-ring mt-2 min-h-24 w-full rounded-[8px] border border-input bg-background px-3 py-2"
                  name="notes"
                />
              </label>
              <button
                className="focus-ring inline-flex h-10 items-center justify-center rounded-[8px] bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                type="submit"
              >
                Salva scheda prodotto
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
