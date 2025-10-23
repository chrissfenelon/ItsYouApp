'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Call {
  id: string;
  number: string;
  name: string;
  timestamp: number;
  duration: number;
  type: 'incoming' | 'outgoing' | 'missed' | 'rejected' | 'unknown';
  source: 'phone' | 'whatsapp' | 'instagram';
  userId: string;
  syncedAt: number;
}

const CallIcon = ({ type }: { type: Call['type'] }) => {
  const icons = {
    incoming: '📞',
    outgoing: '📱',
    missed: '❌',
    rejected: '🚫',
    unknown: '❓',
  };
  return <span>{icons[type]}</span>;
};

const SourceBadge = ({ source }: { source: Call['source'] }) => {
  const colors = {
    phone: 'bg-blue-100 text-blue-800',
    whatsapp: 'bg-green-100 text-green-800',
    instagram: 'bg-pink-100 text-pink-800',
  };

  const labels = {
    phone: 'Téléphone',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[source]}`}>
      {labels[source]}
    </span>
  );
};

const formatDuration = (seconds: number): string => {
  if (seconds === 0) return '-';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<'all' | 'phone' | 'whatsapp' | 'instagram'>('all');
  const [selectedType, setSelectedType] = useState<'all' | Call['type']>('all');
  const [displayLimit, setDisplayLimit] = useState(50); // Start with 50 calls
  const [stats, setStats] = useState({
    total: 0,
    bySource: { phone: 0, whatsapp: 0, instagram: 0 },
    byType: { incoming: 0, outgoing: 0, missed: 0 },
    totalDuration: 0,
  });

  useEffect(() => {
    fetchCalls();
  }, [selectedSource, selectedType]);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      setDisplayLimit(50); // Reset display limit when filters change

      // NO LIMIT - load ALL calls
      let q = query(
        collection(db, 'call_logs'),
        orderBy('timestamp', 'desc')
      );

      if (selectedSource !== 'all') {
        q = query(q, where('source', '==', selectedSource));
      }

      if (selectedType !== 'all') {
        q = query(q, where('type', '==', selectedType));
      }

      const snapshot = await getDocs(q);
      const callsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Call[];

      setCalls(callsData);

      // Calculate statistics
      const newStats = {
        total: callsData.length,
        bySource: {
          phone: callsData.filter(c => c.source === 'phone').length,
          whatsapp: callsData.filter(c => c.source === 'whatsapp').length,
          instagram: callsData.filter(c => c.source === 'instagram').length,
        },
        byType: {
          incoming: callsData.filter(c => c.type === 'incoming').length,
          outgoing: callsData.filter(c => c.type === 'outgoing').length,
          missed: callsData.filter(c => c.type === 'missed').length,
        },
        totalDuration: callsData.reduce((sum, call) => sum + (call.duration || 0), 0),
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching calls:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Historique des Appels</h1>
        <p className="text-gray-600 mt-1">
          Visualisez tous les appels téléphone, WhatsApp et Instagram
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Appels</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Entrants</div>
          <div className="text-2xl font-bold text-green-600">{stats.byType.incoming}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Sortants</div>
          <div className="text-2xl font-bold text-blue-600">{stats.byType.outgoing}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Durée Totale</div>
          <div className="text-2xl font-bold text-gray-900">{formatDuration(stats.totalDuration)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">Toutes</option>
              <option value="phone">Téléphone</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">Tous</option>
              <option value="incoming">Entrant</option>
              <option value="outgoing">Sortant</option>
              <option value="missed">Manqué</option>
              <option value="rejected">Rejeté</option>
            </select>
          </div>

          <button
            onClick={fetchCalls}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ml-auto self-end"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Calls Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : calls.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun appel trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durée
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calls.slice(0, displayLimit).map((call) => (
                  <tr key={call.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CallIcon type={call.type} />
                        <span className="text-sm text-gray-900 capitalize">{call.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{call.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{call.number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SourceBadge source={call.source} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDuration(call.duration)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDistanceToNow(call.timestamp, { addSuffix: true, locale: fr })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination footer */}
            {calls.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Affichage de {Math.min(displayLimit, calls.length)} sur {calls.length} appels
                  </p>
                  <div className="flex gap-2">
                    {displayLimit < calls.length && (
                      <>
                        <button
                          onClick={() => setDisplayLimit(prev => prev + 50)}
                          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white font-semibold text-sm"
                        >
                          ⬇ Charger 50 de plus
                        </button>
                        <button
                          onClick={() => setDisplayLimit(calls.length)}
                          className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white font-semibold text-sm"
                        >
                          📄 Tout afficher ({calls.length})
                        </button>
                      </>
                    )}
                    {displayLimit >= calls.length && calls.length > 50 && (
                      <button
                        onClick={() => setDisplayLimit(50)}
                        className="bg-gray-400 hover:bg-gray-500 px-4 py-2 rounded text-white font-semibold text-sm"
                      >
                        ⬆ Afficher moins
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
