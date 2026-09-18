import ProtectedApp from "./ProtectedApp";
import App from "./App";

export default function Page() {
  return (
    <ProtectedApp>
      <App />
    </ProtectedApp>
  );
}