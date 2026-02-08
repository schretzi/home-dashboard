import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { MOCK_SERVICES } from './constants';

// Mock the DiagramViewer component since it is a child component
jest.mock('./components/DiagramViewer', () => {
  return function DummyDiagramViewer({ onClose, diagram }: any) {
    return (
      <div data-testid="diagram-viewer">
        <span>Viewing: {diagram.filename}</span>
        <button onClick={onClose}>Close Viewer</button>
      </div>
    );
  };
});

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default successful fetch response with empty data (triggers fallback to constants)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  test('renders loading state initially', () => {
    render(<App />);
    expect(screen.getByText(/Initializing Network Hub/i)).toBeInTheDocument();
  });

  test('renders dashboard with default services after loading', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Home-Dashboard')).toBeInTheDocument();
    });
    
    // Check for default view
    expect(screen.getByText('Services Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Exposed Services')).toBeInTheDocument();
    
    // Check if a mock service is present
    expect(screen.getByText(MOCK_SERVICES[0].name)).toBeInTheDocument();
  });

  test('navigates between Services and Diagrams views', async () => {
    render(<App />);
    await waitFor(() => screen.getByText('Home-Dashboard'));

    // Switch to Diagrams
    const diagramsButton = screen.getByText('Diagrams');
    fireEvent.click(diagramsButton);

    expect(screen.getByText('Diagrams Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Network Diagrams')).toBeInTheDocument();

    // Switch back to Services
    const servicesButton = screen.getByText('Services');
    fireEvent.click(servicesButton);

    expect(screen.getByText('Services Dashboard')).toBeInTheDocument();
  });

  test('filters content based on search query', async () => {
    render(<App />);
    await waitFor(() => screen.getByText('Home-Dashboard'));

    const searchInput = screen.getByPlaceholderText('Find a service or file...');
    
    // Search for a specific service (e.g., "Plex")
    fireEvent.change(searchInput, { target: { value: 'Plex' } });
    
    expect(screen.getByText('Plex')).toBeInTheDocument();
    // Ensure other services are filtered out
    expect(screen.queryByText('Pi-hole')).not.toBeInTheDocument();
  });

  test('loads external configuration from config.json', async () => {
    const customService = {
      id: '99',
      name: 'Custom App',
      description: 'Loaded from config',
      hostname: 'custom.local',
      port: 9000,
      icon: 'star',
      type: 'internal',
      url: 'http://custom.local'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ services: [customService] }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Custom App')).toBeInTheDocument();
    });
    expect(screen.getByText('Loaded from config')).toBeInTheDocument();
  });

  test('opens diagram viewer when a diagram is clicked', async () => {
    render(<App />);
    await waitFor(() => screen.getByText('Home-Dashboard'));

    // Navigate to diagrams
    fireEvent.click(screen.getByText('Diagrams'));

    // Click on a diagram name (assuming MOCK_DIAGRAMS has data)
    const diagramLink = screen.getByText(/network_topology/i);
    fireEvent.click(diagramLink);

    expect(screen.getByTestId('diagram-viewer')).toBeInTheDocument();
    
    // Close it
    fireEvent.click(screen.getByText('Close Viewer'));
    expect(screen.queryByTestId('diagram-viewer')).not.toBeInTheDocument();
  });
});