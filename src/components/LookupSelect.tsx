type LookupOption = { value: string; label: string };

type LookupSelectProps = {
  value: string;
  options: LookupOption[];
  onChange: (value: string) => void;
};

export function LookupSelect({ value, options, onChange }: LookupSelectProps) {
  return <select value={value} onChange={(event) => onChange(event.target.value)}>
    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
  </select>;
}
