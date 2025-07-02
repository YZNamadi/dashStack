import React, { useEffect, useState } from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { useAppStore } from '../../store/appStore';
import { apiClient } from '../../lib/api';

interface Version {
  id: string;
  version: number;
  content: any;
  createdAt: string;
  createdById?: string;
}

export const VersionHistory: React.FC<{ pageId: string }> = ({ pageId }) => {
  const { currentProject } = useAppStore();
  const [versions, setVersions] = useState<Version[]>([]);
  const [selected, setSelected] = useState<Version | null>(null);
  const [loading, setLoading] = useState(false);
  const [diff, setDiff] = useState<string>('');

  useEffect(() => {
    if (!currentProject) return;
    setLoading(true);
    apiClient.request(`/projects/${currentProject.id}/pages/${pageId}/versions`)
      .then(setVersions)
      .finally(() => setLoading(false));
  }, [currentProject, pageId]);

  const handleSelect = (version: Version) => {
    setSelected(version);
    // Simple diff: show JSON diff between selected and latest
    if (versions.length > 0) {
      setDiff(JSON.stringify(versions[0].content, null, 2) + '\n---\n' + JSON.stringify(version.content, null, 2));
    }
  };

  const handleRevert = async (versionId: string) => {
    if (!currentProject) return;
    await apiClient.request(`/projects/${currentProject.id}/pages/${pageId}/versions/${versionId}/revert`, { method: 'POST' });
    window.location.reload();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Version History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <div>Loading...</div> : (
          <div className="flex gap-6">
            <div className="w-1/3">
              <ul className="space-y-2">
                {versions.map(v => (
                  <li key={v.id}>
                    <Button variant={selected?.id === v.id ? 'default' : 'outline'} onClick={() => handleSelect(v)} className="w-full justify-start">
                      Version {v.version} ({new Date(v.createdAt).toLocaleString()})
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1">
              {selected ? (
                <>
                  <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto mb-2">{diff}</pre>
                  <Button onClick={() => handleRevert(selected.id)} className="bg-red-600 text-white">Revert to this version</Button>
                </>
              ) : <div>Select a version to view diff and revert.</div>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 