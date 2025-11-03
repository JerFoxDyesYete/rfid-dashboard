import { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [rfidList, setRfidList] = useState([]);

  const fetchData = async () => {
    try {
      const res = await axios.get("http://10.141.68.150/esp32/get_logs.php");
      if (Array.isArray(res.data)) {
        setLogs(res.data);
        const uniquesFromBatch = [...new Set(res.data.map((l) => l.rfid))];

        setRfidList((prev) => {
          const seen = new Set(prev);
          const appended = [];
          for (const r of uniquesFromBatch) if (!seen.has(r)) appended.push(r);
          return appended.length ? [...prev, ...appended] : prev;
        });
      } else {
        console.error("Data is not an array:", res.data);
      }
    } catch (error) {
      console.error("Failed to fetch RFID logs:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="container my-4">
      <div className="row g-2">
        {/* Left: RFID list */}
        <div className="col-md-3">
          <div className="card bg-dark text-white h-auto">
            <div className="card-header text-center fw-bold">RFID</div>
            <ul className="list-group list-group-flush" style={{ borderRadius: "0" }}>
              {rfidList.map((rfid, index) => {
                const latest = logs.find((l) => l.rfid === rfid);
                const status = latest ? latest.status : null;
                const message = latest?.rfid_message;
                return (
                  <li
                    key={rfid}
                    className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-0"
                  >
                    <span>{index + 1}. {rfid}</span>
                    <div className="d-flex align-items-center gap-2">
                      {message === "RFID NOT FOUND" ? (
                        <span className="badge bg-danger">{message}</span>
                      ) : (
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            disabled
                            checked={status === 1 || status === "1"}
                          />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Right: Table */}
        <div className="col-md-9">
          <div className="card h-100">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-striped table-hover mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th className="text-center">RFID</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr key={index}>
                        <td className="text-center">{log.rfid}</td>
                        <td className="text-center">
                          {log.rfid_message === "RFID NOT FOUND" ? (
                            <span className="badge bg-danger">{log.rfid_message}</span>
                          ) : (
                            <span
                              className={`badge ${
                                log.status === "1" || log.status === 1 ? "bg-primary" : "bg-secondary"
                              }`}
                            >
                              {log.status === "1" || log.status === 1 ? "1" : "0"}
                            </span>
                          )}
                        </td>
                        <td className="text-center">{formatDate(log.date_time)}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center text-muted py-3">
                          No logs available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
