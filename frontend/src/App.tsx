import React, { useState } from "react";

function App(): React.ReactElement {
  const [results, setResults] = useState<null>(null);

  return (
    <div>
      <h1>JobAlign</h1>
      <p>CV & Job Offer Analyzer</p>

      {!results ? (
        <div>
          <h2>Upload CV and Job Offer</h2>
          <input type="file" accept=".pdf" />
          <textarea placeholder="Paste job offer here..." />
          <button>Analyze</button>
        </div>
      ) : (
        <div>
          <h2>Results</h2>
          <button onClick={() => setResults(null)}>Back</button>
        </div>
      )}
    </div>
  );
}

export default App;
