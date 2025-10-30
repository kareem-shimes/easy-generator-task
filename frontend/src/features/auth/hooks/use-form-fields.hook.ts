import { AUTH_APP_ROUTES } from "@/constants/routes";
import { IFormField, IFormFieldsVariables } from "@/types";

type Props = IFormFieldsVariables;
const useFormFields = ({ slug }: Props) => {
  const loginFields = (): IFormField[] => [
    {
      label: "Email",
      name: "email",
      type: "email",
      placeholder: "Enter your email",
      autoFocus: true,
    },
    {
      label: "Password",
      name: "password",
      placeholder: "Enter your password",
      type: "password",
    },
  ];
  const signupFields = (): IFormField[] => [
    {
      label: "Name",
      name: "name",
      type: "text",
      placeholder: "Enter your name",
      autoFocus: true,
    },
    {
      label: "Email",
      name: "email",
      type: "email",
      placeholder: "Enter your email",
    },
    {
      label: "Password",
      name: "password",
      type: "password",
      placeholder: "Enter your password",
    },
  ];

  const getFormFields = (): IFormField[] => {
    switch (slug) {
      case AUTH_APP_ROUTES.LOGIN:
        return loginFields();
      case AUTH_APP_ROUTES.REGISTER:
        return signupFields();
      default:
        return [];
    }
  };
  return {
    getFormFields,
  };
};

export default useFormFields;
