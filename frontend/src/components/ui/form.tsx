"use client";

import { useState } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "./field";
import { Input } from "./input";
import { Checkbox } from "./checkbox";
import { PasswordRequirements } from "./password-requirements";
import { cn } from "@/lib/utils";

interface BaseFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  description?: string;
}

interface FormInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends BaseFormFieldProps<TFieldValues, TName> {
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  showPasswordRequirements?: boolean;
}

export function FormInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  description,
  type = "text",
  placeholder,
  disabled,
  autoFocus,
  showPasswordRequirements = false,
}: FormInputProps<TFieldValues, TName>) {
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const isPasswordField = type === "password";
  const inputType = isPasswordField && showPassword ? "text" : type;
  const shouldShowPasswordRequirements = isPasswordField && name === "password" && showPasswordRequirements;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldContent>
            {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
            <div className="relative peer">
              <Input
                {...field}
                id={name}
                type={inputType}
                placeholder={placeholder}
                aria-invalid={fieldState.invalid}
                disabled={disabled}
                autoFocus={autoFocus}
                className={cn(isPasswordField && "pr-10")}
                onFocus={() => {
                  if (shouldShowPasswordRequirements) {
                    setIsPasswordFocused(true);
                  }
                }}
                onBlur={() => {
                  field.onBlur();
                  if (shouldShowPasswordRequirements) {
                    setIsPasswordFocused(false);
                  }
                }}
              />
              {isPasswordField && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            {shouldShowPasswordRequirements ? (
              <PasswordRequirements
                password={field.value || ""}
                isFocused={isPasswordFocused}
              />
            ) : (
              description && <FieldDescription>{description}</FieldDescription>
            )}
            {fieldState.invalid && !shouldShowPasswordRequirements && (
              <FieldError errors={[fieldState.error]} />
            )}
          </FieldContent>
        </Field>
      )}
    />
  );
}

interface FormCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends BaseFormFieldProps<TFieldValues, TName> {
  disabled?: boolean;
}

export function FormCheckbox<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  description,
  disabled,
}: FormCheckboxProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field orientation="horizontal" data-invalid={fieldState.invalid}>
          <Checkbox
            {...field}
            id={name}
            checked={field.value}
            onCheckedChange={field.onChange}
            aria-invalid={fieldState.invalid}
            disabled={disabled}
            value={undefined}
          />
          <FieldContent>
            {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </FieldContent>
        </Field>
      )}
    />
  );
}
