import { Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import BrandDetails from "./pages/BrandDetails";
import TextAnalysis from "./pages/TextAnalysis";
import CsvUpload from "./pages/CsvUpload";
import Competitive from "./pages/Competitive";
import Alerts from "./pages/Alerts";
import LiveNews from "./pages/LiveNews";
import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/brand/:brand" element={<BrandDetails />} />
        <Route path="/analyze" element={<TextAnalysis />} />
        <Route path="/csv-upload" element={<CsvUpload />} />
        <Route path="/competitive" element={<Competitive />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/live-news" element={<LiveNews />} />
      </Routes>
    </>
  );
}

export default App;
