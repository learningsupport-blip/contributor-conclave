import { TextField } from "@/components/ui/text-field";

export function Field(
  props: {
    id: string;
    label: string;
    name: string;
    type?: string;
    autoComplete?: string;
    value?: string;
    onChange?: (value: string) => void;
    describedBy?: string;
    invalid?: boolean;
    errors?: string[];
  },
) {
  return <TextField required {...props} />;
}
