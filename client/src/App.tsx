import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import "./App.css";

function App(): JSX.Element {
  return (
    <>
      <Navbar />
      <Outlet /> {/* Aquí se renderizan SearchBooks y SavedBooks según la ruta */}
    </>
  );
}

export default App;
