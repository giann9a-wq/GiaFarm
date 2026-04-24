import {
  createOutboundDdtAction,
  updateOutboundDdtAction,
} from "@/app/(app)/bolle-ddt/actions";
import { DdtFormClient } from "@/app/(app)/bolle-ddt/ddt-form-client";
import { getDdtFormData, getOutboundDdt } from "@/lib/warehouse/queries";

export async function OutboundDdtForm({ ddtId }: { ddtId?: string }) {
  const [{ customers, products, units, balances, fieldProductSuggestions }, ddt] =
    await Promise.all([
      getDdtFormData(),
      ddtId ? getOutboundDdt(ddtId) : Promise.resolve(null),
    ]);
  const action = ddt
    ? updateOutboundDdtAction.bind(null, ddt.id)
    : createOutboundDdtAction;
  const balanceByProductId = new Map(
    balances.map((balance) => [balance.productMaterialId, Number(balance.quantity)])
  );

  return (
    <DdtFormClient
      action={action}
      customers={customers.map((customer) => ({
        id: customer.id,
        businessName: customer.businessName,
        address: customer.address,
        destinations: customer.destinations.map((destination) => ({
          id: destination.id,
          name: destination.name,
          address: destination.address,
        })),
      }))}
      defaultCustomerId={ddt?.customerId ?? ""}
      defaultDestinationAddress={ddt?.destination?.address ?? ""}
      defaultDestinationName={ddt?.destination?.name ?? ddt?.destinationText ?? ""}
      defaultDriverSignature={ddt?.driverSignature ?? ""}
      defaultIssuedOn={ddt?.issuedOn.toISOString().slice(0, 10)}
      defaultKind={ddt?.kind ?? "WAREHOUSE"}
      defaultNotes={ddt?.notes ?? ""}
      defaultPackageAppearance={ddt?.packageAppearance ?? ""}
      defaultPackageCount={ddt?.packageCount ?? ""}
      defaultRecipientSignature={ddt?.recipientSignature ?? ""}
      defaultRows={(ddt?.rows ?? []).map((row) => ({
        productMaterialId: row.productMaterialId ?? "",
        description: row.description ?? "",
        quantity: row.quantity ? String(row.quantity).replace(".", ",") : "",
        unit: row.unit ?? "",
        lot: row.lot ?? "",
        notes: row.notes ?? "",
      }))}
      defaultTransportReason={ddt?.transportReason ?? ""}
      defaultTransportStartsAt={ddt?.transportStartsAt?.toISOString().slice(0, 16)}
      defaultTransportedBy={ddt?.transportedBy ?? ""}
      fieldProductSuggestions={fieldProductSuggestions.map((item) => item.description)}
      products={products.map((product) => ({
        id: product.id,
        name: product.name,
        unit: product.unit,
        stock: balanceByProductId.get(product.id) ?? 0,
      }))}
      submitLabel={ddt ? "Salva modifiche DDT" : "Emetti DDT"}
      units={units.map((unit) => ({ id: unit.id, code: unit.code }))}
    />
  );
}
