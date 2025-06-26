import React, { useState, useEffect } from 'react';
import { getDatasources, runDatasourceQuery, createDatasource } from '../services/api';

// Hardcoded for now, would come from URL/state
const MOCK_PROJECT_ID = 'your-project-id'; 

interface Datasource {
    id: string;
    name: string;
}

const QueryPanel: React.FC = () => {
    const [datasources, setDatasources] = useState<Datasource[]>([]);
    const [selectedDs, setSelectedDs] = useState<string | null>(null);
    const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
    const [results, setResults] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDatasources = async () => {
            try {
                // You'll need to replace 'current-project-id' with the actual project ID
                const fetchedDatasources = await getDatasources(MOCK_PROJECT_ID);
                setDatasources(fetchedDatasources);
            } catch (err) {
                console.error("Failed to fetch datasources", err);
                setError("Could not load datasources.");
            }
        };
        fetchDatasources();
    }, []);

    const handleRunQuery = async () => {
        if (!selectedDs) {
            setError('Please select a data source.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResults(null);
        
        try {
            const queryResults = await runDatasourceQuery(MOCK_PROJECT_ID, selectedDs, query);
            setResults(queryResults);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to run query.');
        } finally {
            setIsLoading(false);
        }
    }

    // This is a simplified form for adding a new datasource
    const handleAddDatasource = async () => {
        const name = prompt("Enter new datasource name:");
        const connectionString = prompt("Enter MySQL connection string (mysql://user:pass@host:port/db):");
        if(name && connectionString) {
            try {
                const newDs = await createDatasource(MOCK_PROJECT_ID, {
                    name,
                    type: 'MySQL',
                    config: { connectionString }
                });
                setDatasources([...datasources, newDs]);
            } catch(err) {
                alert("Failed to create datasource.");
            }
        }
    }

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t-2 shadow-lg h-1/3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Query Panel</h3>
        <button onClick={handleAddDatasource} className="text-sm text-indigo-600 hover:underline">
            + Add New Datasource
        </button>
      </div>
      <div className="flex items-center mt-2 space-x-4">
        <select 
            className="p-2 border rounded"
            onChange={(e) => setSelectedDs(e.target.value)}
            value={selectedDs || ''}
        >
          <option value="" disabled>Select Data Source</option>
          {datasources.map(ds => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
          ))}
        </select>
        <button 
            className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600 disabled:bg-gray-400"
            onClick={handleRunQuery}
            disabled={isLoading || !selectedDs}
        >
          {isLoading ? 'Running...' : 'Run Query'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4 h-full">
        <div>
            <textarea
                className="w-full h-48 p-2 font-mono text-sm border rounded resize-none"
                placeholder="SELECT * FROM customers;"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
        </div>
        <div className="p-2 border rounded bg-gray-50 h-48 overflow-auto">
            <h4 className="font-semibold">Results</h4>
            {error && <pre className="text-sm text-red-500">{error}</pre>}
            {results && <pre className="text-sm">{JSON.stringify(results, null, 2)}</pre>}
            {!error && !results && <p className="text-sm text-gray-400">Query results will appear here.</p>}
        </div>
      </div>
    </div>
  );
};

export default QueryPanel; 