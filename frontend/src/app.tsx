import useLocalStorageState from "use-local-storage-state";
import Login from "./login";
import { Auth } from "./types";
import Websites from "./websites";

export function App() {
  const [auth, setAuth] = useLocalStorageState<Auth>("auth", {});

  return auth.hash ? <Websites auth={auth} setAuth={setAuth} /> : <Login setAuth={setAuth} />;
}
