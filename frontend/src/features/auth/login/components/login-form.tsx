"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import useFormFields from "../../hooks/use-form-fields.hook";
import { AUTH_APP_ROUTES, PROTECTED_ROUTES } from "@/constants/routes";
import useFormValidations from "../../hooks/use-form-validations";
import { LoginInput, loginSchema } from "@/validators/auth";
import { loginAction } from "../../actions/auth.actions";
import {
  Button,
  FieldGroup,
  FieldSet,
  FormInput,
  Spinner,
} from "@/components/ui";
import { toast } from "sonner";

export function LoginForm() {
  const [error, setError] = useState("");
  const { getFormFields } = useFormFields({ slug: AUTH_APP_ROUTES.LOGIN });
  const { getValidationSchema } = useFormValidations({
    slug: AUTH_APP_ROUTES.LOGIN,
  });
  const router = useRouter();

  const form = useForm<LoginInput>({
    resolver: zodResolver(getValidationSchema() as typeof loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      const result = await loginAction(data);

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
              name={field.name as keyof LoginInput}
              disabled={isSubmitting}
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
            {isSubmitting ? <Spinner /> : "Sign in"}
          </Button>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
