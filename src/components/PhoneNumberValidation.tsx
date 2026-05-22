"use client";

import React, { useState, useEffect } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Label } from "./ui/label";
import "./PhoneNumberValidation.css";

type PhoneNumberValidationProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  hideLabel?: boolean;
};

export default function PhoneNumberValidation({
  name = "phone",
  value,
  defaultValue = "",
  onChange,
  onBlur,
  required = false,
  hideLabel = false,
}: PhoneNumberValidationProps) {
  const [internalValue, setInternalValue] = useState(value || defaultValue);
  const [valid, setValid] = useState(true);

  const validatePhoneNumber = React.useCallback((phoneVal: string) => {
    if (!required && (!phoneVal || phoneVal.trim() === "")) return true;
    return /^[0-9]{6,15}$/.test(phoneVal);
  }, [required]);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
      setValid(validatePhoneNumber(value));
    }
  }, [value, validatePhoneNumber]);

  const handleChange = (val: string) => {
    setInternalValue(val);
    setValid(validatePhoneNumber(val));
    if (onChange) {
      onChange(val);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {!hideLabel && (
        <Label className="text-[10px] font-semibold uppercase text-muted-foreground ml-1">
          Téléphone
        </Label>
      )}
      <div className="w-full relative rounded-xl focus-within:ring-2 focus-within:ring-yessal-violet/50 transition-all">
        {name && <input type="hidden" name={name} value={internalValue ? `+${internalValue}` : ""} />}
        <PhoneInput
          value={internalValue}
          onChange={handleChange}
          onBlur={onBlur}
          inputClass="!h-11 !rounded-xl !bg-muted/20 !border-none !px-4 !w-full focus:!outline-none"
          buttonClass="!border-none !bg-transparent !rounded-l-xl pl-2"
          containerClass="w-full"
          placeholder="77 000 00 00"
          enableSearch={true}
          country={"sn"}
        />
      </div>
      {!valid && internalValue && (
        <p className="text-destructive text-xs font-bold mt-1 ml-1">
          Veuillez entrer un numéro de téléphone valide
        </p>
      )}
    </div>
  );
}
