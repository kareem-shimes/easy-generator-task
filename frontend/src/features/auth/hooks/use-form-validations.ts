import { AUTH_APP_ROUTES } from "@/constants/routes";
import { IFormFieldsVariables } from "@/types";
import { loginSchema, registerSchema } from "@/validators/auth";
import z from "zod";

type ValidationSchema =
  | typeof loginSchema
  | typeof registerSchema
  | z.ZodObject<Record<string, never>>;

const useFormValidations = (
  props: IFormFieldsVariables
): {
  getValidationSchema: () => ValidationSchema;
} => {
  const { slug } = props;

  const getValidationSchema = () => {
    switch (slug) {
      case AUTH_APP_ROUTES.LOGIN:
        return loginSchema;
      case AUTH_APP_ROUTES.REGISTER:
        return registerSchema;
      default:
        return z.object({});
    }
  };

  return { getValidationSchema };
};

export default useFormValidations;
