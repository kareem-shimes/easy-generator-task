"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import useFormFields from "../../hooks/use-form-fields.hook";
import useFormValidations from "../../hooks/use-form-validations";
import { AUTH_APP_ROUTES, PROTECTED_ROUTES } from "@/constants/routes";
import { RegisterInput, registerSchema } from "@/validators/auth";
import { registerAction } from "../../actions/auth.actions";
import {
  Button,
  FieldGroup,
  FieldSet,
  FormInput,
  Spinner,
} from "@/components/ui";

export function RegisterForm() {
  const [error, setError] = useState("");
  const { getFormFields } = useFormFields({ slug: AUTH_APP_ROUTES.REGISTER });
  const { getValidationSchema } = useFormValidations({
    slug: AUTH_APP_ROUTES.REGISTER,
  });
  const router = useRouter();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(getValidationSchema() as typeof registerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      const result = await registerAction(data);

      if (result.success) {
        toast.success(result.message, {
          duration: 3000,
        });
        form.reset();
        router.push(PROTECTED_ROUTES.HOME);
      } else {
        setError(
          result.error || "Please check your credentials and try again."
        );
      }
    } catch {
      setError("Please try again later");
    }
  };

  const isSubmitting = form.formState.isSubmitting;
  const isValid = form.formState.isValid;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          {getFormFields().map((field, index) => (
            <FormInput
              key={index}
              {...field}
              control={form.control}
              name={field.name as keyof RegisterInput}
              disabled={isSubmitting}
              showPasswordRequirements={field.type === "password"}
            />
          ))}
          {error && (
            <p className="text-destructive text-sm flex items-center gap-2">
              <TriangleAlertIcon className="size-4" />
              {error}
            </p>
          )}
          <Button
            type="submit"
            size="xl"
            className="w-full rounded-xl"
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting ? <Spinner /> : "Create Account"}
          </Button>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
