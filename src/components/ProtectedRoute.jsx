import { Navigate } from "react-router-dom";
import { getAnonymousID } from "../utils/identity";

export default function ProtectedRoute({ children }) {
  const id = getAnonymousID();
  
  // Si el usuario no tiene ID (raro, pero posible), lo mandamos al inicio
  if (!id) {
    return <Navigate to="/" />;
  }

  // Si tiene ID, le dejamos pasar
  return children;
}