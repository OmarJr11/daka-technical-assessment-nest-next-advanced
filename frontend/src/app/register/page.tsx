import type { ReactElement } from "react";
import RegisterPageView from "@/features/auth/pages/register-page";

/**
 * Defines the `/register` route in the Next.js App Router.
 * @returns {ReactElement} Register route page
 */
export default function RegisterPage(): ReactElement {
  return <RegisterPageView />;
}
