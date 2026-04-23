import type { ReactElement } from "react";
import RegisterViewPage from "../../views/register";

/**
 * Defines the `/register` route in the Next.js App Router.
 * @returns {ReactElement} Register route page
 */
export default function RegisterPage(): ReactElement {
  return <RegisterViewPage />;
}
