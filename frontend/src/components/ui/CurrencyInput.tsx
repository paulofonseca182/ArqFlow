import { forwardRef } from "react";
import type { ChangeEvent, InputHTMLAttributes } from "react";
import { maskCurrencyInput } from "../../utils/currency";
import { Input } from "./Input";

type CurrencyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "inputMode" | "type"> & {
  label?: string;
  error?: string;
};

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(function CurrencyInput(
  { onChange, placeholder = "R$ 0,00", ...props },
  ref
) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    event.target.value = maskCurrencyInput(event.target.value);
    onChange?.(event);
  }

  return <Input {...props} inputMode="numeric" onChange={handleChange} placeholder={placeholder} ref={ref} type="text" />;
});
