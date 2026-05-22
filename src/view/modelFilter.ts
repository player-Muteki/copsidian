export interface ModelSelectOption {
  value: string;
  label: string;
}

export function filterCommonModelOptions(
  options: ModelSelectOption[],
  commonModels: string[] | undefined,
  _defaultModel: string,
): ModelSelectOption[] {
  if (!commonModels || commonModels.length === 0) return options;

  const byId = new Map(options.map((option) => [option.value, option]));
  return commonModels
    .map((id) => byId.get(id))
    .filter((option): option is ModelSelectOption => Boolean(option));
}
