import React, { useState, useMemo, useEffect } from "react";
import { MOCK_SERVICES, MOCK_DIAGRAMS } from "./constants";
import { AppView, NetworkDiagram, NetworkService } from "./types";
import ServiceCard from "./components/ServiceCard";
import DiagramViewer from "./components/DiagramViewer";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>("services");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiagram, setSelectedDiagram] = useState<NetworkDiagram | null>(
    null,
  );

  // Dynamic state for data loaded from config.json
  const [services, setServices] = useState<NetworkService[]>(MOCK_SERVICES);
  const [diagrams, setDiagrams] = useState<NetworkDiagram[]>(MOCK_DIAGRAMS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Attempt to load the external config.json mounted in the container
    const loadConfig = async () => {
      try {
        const response = await fetch("/config.json");
        if (response.ok) {
          const data = await response.json();
          if (data.services) setServices(data.services);
          if (data.diagrams) setDiagrams(data.diagrams);
          console.log("External configuration loaded successfully");
        }
      } catch (error) {
        console.warn(
          "Could not load config.json, falling back to defaults",
          error,
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.hostname.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [services, searchQuery]);

  const filteredDiagrams = useMemo(() => {
    return diagrams.filter(
      (d) =>
        d.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [diagrams, searchQuery]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">
            Initializing Network Hub...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-surface flex flex-col">
        <div className="p-8 flex items-center gap-3">
          <div className="size-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-xl">hub</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Home-Dashboard
          </h1>
        </div>

        <nav className="flex-1 px-6 space-y-8 overflow-y-auto custom-scrollbar">
          <div>
            <p className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-4">
              Network Hub
            </p>
            <div className="space-y-1.5">
              <button
                onClick={() => setCurrentView("services")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  currentView === "services"
                    ? "bg-primary/5 text-primary font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${currentView === "services" ? "text-primary" : "text-slate-400 group-hover:text-primary"}`}
                >
                  dns
                </span>
                <span>Services</span>
              </button>
              <button
                onClick={() => setCurrentView("diagrams")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  currentView === "diagrams"
                    ? "bg-primary/5 text-primary font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${currentView === "diagrams" ? "text-primary" : "text-slate-400 group-hover:text-primary"}`}
                >
                  schema
                </span>
                <span>Diagrams</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium uppercase tracking-tight">
                  System
                </span>
                <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                  <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Operational
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                <span className="text-slate-400 font-medium uppercase tracking-tight">
                  IP Gateway
                </span>
                <span className="font-mono text-slate-700 font-semibold">
                  192.168.1.1
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-border bg-surface flex items-center justify-between px-10">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <h2 className="text-xl font-bold text-slate-900 capitalize">
              {currentView} Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Find a service or file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
              />
            </div>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3">
              <button className="size-9 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden hover:border-primary/20 transition-all">
                <img
                  alt="User"
                  className="size-full object-cover"
                  src="https://picsum.photos/seed/user1/100/100"
                />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {currentView === "services" && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Exposed Services
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Manage and access your active network applications.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
                {filteredServices.length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <span className="material-symbols-outlined text-4xl mb-2">
                      sentiment_dissatisfied
                    </span>
                    <p>No services found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {currentView === "diagrams" && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Network Diagrams
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Technical documentation and infrastructure visual maps.
                  </p>
                </div>
              </div>

              <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-subtle">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-border text-slate-400 uppercase text-[10px] font-bold tracking-[0.1em]">
                    <tr>
                      <th className="px-8 py-4">File Description</th>
                      <th className="px-8 py-4">Metadata</th>
                      <th className="px-8 py-4">Size</th>
                      <th className="px-8 py-4">Last Updated</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDiagrams.map((diagram) => (
                      <tr
                        key={diagram.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center text-primary">
                              <span className="material-symbols-outlined">
                                image
                              </span>
                            </div>
                            <div>
                              <span
                                className="block font-semibold text-slate-900 group-hover:text-primary transition-colors cursor-pointer"
                                onClick={() => setSelectedDiagram(diagram)}
                              >
                                {diagram.filename}
                              </span>
                              <span className="text-xs text-slate-400">
                                {diagram.description}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-slate-500 font-medium">
                          {diagram.metadata}
                        </td>
                        <td className="px-8 py-5 text-slate-500 font-medium">
                          {diagram.size}
                        </td>
                        <td className="px-8 py-5 text-slate-500 font-medium">
                          {diagram.lastUpdated}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="Download"
                            >
                              <span className="material-symbols-outlined text-lg">
                                download
                              </span>
                            </button>
                            <button
                              onClick={() => setSelectedDiagram(diagram)}
                              className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="View Fullscreen"
                            >
                              <span className="material-symbols-outlined text-lg">
                                visibility
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredDiagrams.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-8 py-20 text-center text-slate-400"
                        >
                          <span className="material-symbols-outlined text-4xl mb-2">
                            folder_open
                          </span>
                          <p>No diagrams found matching "{searchQuery}"</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Overlay Modal for Zooming */}
      {selectedDiagram && (
        <DiagramViewer
          diagram={selectedDiagram}
          onClose={() => setSelectedDiagram(null)}
        />
      )}
    </div>
  );
};

export default App;
