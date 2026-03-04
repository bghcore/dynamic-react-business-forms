import { IOption } from "../types/IOption";

/** Sort options alphabetically by label */
export function SortOptions(options: IOption[]): IOption[] {
  return [...options].sort((a, b) => {
    const aLabel = a.label?.toLowerCase() ?? "";
    const bLabel = b.label?.toLowerCase() ?? "";
    return aLabel < bLabel ? -1 : aLabel > bLabel ? 1 : 0;
  });
}
