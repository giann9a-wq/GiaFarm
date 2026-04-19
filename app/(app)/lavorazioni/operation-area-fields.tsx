"use client";

import { useMemo, useState } from "react";

type AreaGroup = {
  id: string;
  label: string;
  areaHa: number;
  fieldIds: string[];
};

type AreaField = {
  id: string;
  label: string;
  areaHa: number;
};

type OperationAreaFieldsProps = {
  groups: AreaGroup[];
  fields: AreaField[];
  defaultFieldGroupId: string;
  defaultFieldIds: string[];
  defaultAreaHa: string;
};

function formatAreaInput(value: number) {
  return value > 0 ? value.toFixed(4).replace(".", ",") : "";
}

export function OperationAreaFields({
  groups,
  fields,
  defaultFieldGroupId,
  defaultFieldIds,
  defaultAreaHa
}: OperationAreaFieldsProps) {
  const [selectedGroupId, setSelectedGroupId] = useState(defaultFieldGroupId);
  const [selectedFieldIds, setSelectedFieldIds] = useState(defaultFieldIds);
  const [treatedAreaHa, setTreatedAreaHa] = useState(defaultAreaHa);

  const fieldsById = useMemo(() => new Map(fields.map((field) => [field.id, field])), [fields]);

  function suggestedArea(groupId: string, fieldIds: string[]) {
    const group = groups.find((item) => item.id === groupId);
    const selectedIds = new Set(fieldIds);
    const groupFieldIds = new Set(group?.fieldIds ?? []);
    const fieldsArea = Array.from(selectedIds).reduce((sum, fieldId) => {
      if (groupFieldIds.has(fieldId)) return sum;
      return sum + (fieldsById.get(fieldId)?.areaHa ?? 0);
    }, 0);

    return (group?.areaHa ?? 0) + fieldsArea;
  }

  function updateGroup(groupId: string) {
    setSelectedGroupId(groupId);
    setTreatedAreaHa(formatAreaInput(suggestedArea(groupId, selectedFieldIds)));
  }

  function updateField(fieldId: string, checked: boolean) {
    const nextFieldIds = checked
      ? Array.from(new Set([...selectedFieldIds, fieldId]))
      : selectedFieldIds.filter((item) => item !== fieldId);

    setSelectedFieldIds(nextFieldIds);
    setTreatedAreaHa(formatAreaInput(suggestedArea(selectedGroupId, nextFieldIds)));
  }

  return (
    <>
      <label className="text-sm font-medium">
        Gruppo campi
        <select
          className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
          name="fieldGroupId"
          value={selectedGroupId}
          onChange={(event) => updateGroup(event.target.value)}
        >
          <option value="">Nessun gruppo</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.label}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="rounded-[8px] border border-border p-4 lg:col-span-2">
        <legend className="px-1 text-sm font-semibold">Campi singoli coinvolti</legend>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {fields.map((field) => (
            <label className="flex items-center gap-2 text-sm" key={field.id}>
              <input
                className="h-4 w-4"
                checked={selectedFieldIds.includes(field.id)}
                name="fieldIds"
                type="checkbox"
                value={field.id}
                onChange={(event) => updateField(field.id, event.target.checked)}
              />
              <span>{field.label}</span>
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Se scegli un gruppo, i campi del gruppo restano comunque noti al sistema. Puoi
          aggiungere campi singoli solo quando serve.
        </p>
      </fieldset>

      <label className="text-sm font-medium">
        Superficie trattata ha
        <input
          className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
          inputMode="decimal"
          name="treatedAreaHa"
          value={treatedAreaHa}
          onChange={(event) => setTreatedAreaHa(event.target.value)}
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          Precompilata dalla superficie coltivata selezionata. Puoi ridurla,
          non aumentarla oltre il totale.
        </span>
      </label>
    </>
  );
}
