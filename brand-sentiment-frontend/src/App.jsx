import { Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import TextAnalysis from "./pages/TextAnalysis";
import CsvUpload from "./pages/CsvUpload";
import Alerts from "./pages/Alerts";
import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analyze" element={<TextAnalysis />} />
        <Route path="/csv-upload" element={<CsvUpload />} />
        <Route path="/alerts" element={<Alerts />} />
      </Routes>
    </>
  );
}

export default App;