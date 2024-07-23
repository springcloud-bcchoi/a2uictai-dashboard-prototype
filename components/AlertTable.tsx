import React from 'react';
import { AlertData } from '@/components/Wss';

interface AlertTableProps {
  alerts: AlertData[];
}

const AlertTable: React.FC<AlertTableProps> = ({ alerts }) => {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Alert Data</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 text-white text-sm">
          <thead>
          <tr>
            <th className="px-4 py-2">Summary</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Topic ID</th>
            <th className="px-4 py-2">Alert Name</th>
            <th className="px-4 py-2">Description</th>
            <th className="px-4 py-2">Job</th>
            <th className="px-4 py-2">Severity</th>
            <th className="px-4 py-2">Starts At</th>
            <th className="px-4 py-2">Ends At</th>
          </tr>
          </thead>
          <tbody>
          {alerts.map((alert, index) => (
            <tr
              key={index}
              className={`border-b border-gray-600 ${alert.status === 'firing' ? 'bg-red-600' : 'bg-gray-700'}`}
            >
              <td className="px-4 py-2">{alert.summary}</td>
              <td className="px-4 py-2">{alert.status}</td>
              <td className="px-4 py-2">{alert.topic_id}</td>
              <td className="px-4 py-2">{alert.alertname}</td>
              <td className="px-4 py-2">{alert.description}</td>
              <td className="px-4 py-2">{alert.job}</td>
              <td className="px-4 py-2">{alert.severity}</td>
              <td className="px-4 py-2">{alert.startsAt}</td>
              <td className="px-4 py-2">{alert.endsAt}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertTable;
