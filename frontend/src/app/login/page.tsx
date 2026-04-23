import type { ReactElement } from "react";
import LoginViewPage from "../../views/login";

/**
 * Defines the `/login` route in the Next.js App Router.
 * @returns {ReactElement} Login route page
 */
export default function LoginPage(): ReactElement {
  return <LoginViewPage />;
}
